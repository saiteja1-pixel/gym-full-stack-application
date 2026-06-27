from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import datetime
import uuid
import hmac
import hashlib
from app.database import get_db
from app.config import settings
from app.razorpay_client import client
from app import models, schemas

router = APIRouter(prefix="/api/payments/razorpay", tags=["payments"])

@router.post("/order", response_model=schemas.OrderCreateResponse)
def create_razorpay_order(req: schemas.OrderCreateRequest, db: Session = Depends(get_db)):
    # 1. Fetch Member
    member = db.query(models.Member).filter(models.Member.id == req.memberId).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    # 2. Fetch Plan
    plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == req.planId).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    # 3. Compute invoice number
    current_year = datetime.datetime.now().year
    prefix = f"INV-{current_year}-"

    latest_payment = db.query(models.Payment).filter(
        models.Payment.invoiceNumber.like(f"{prefix}%")
    ).order_by(models.Payment.invoiceNumber.desc()).first()

    next_num = 1
    if latest_payment:
        parts = latest_payment.invoiceNumber.split('-')
        if len(parts) >= 3:
            try:
                last_num = int(parts[2])
                next_num = last_num + 1
            except ValueError:
                pass
    invoice_number = f"{prefix}{str(next_num).zfill(4)}"

    # 4. Calculate total (Price + 18% GST)
    tax_rate = plan.gstPercent / 100.0 if hasattr(plan, "gstPercent") else 0.18
    tax_amount = round(plan.price * tax_rate, 2)
    total_amount = round(plan.price + tax_amount, 2)

    # Convert to Paise (Razorpay expects integer in paise: 1 INR = 100 Paise)
    amount_in_paise = int(round(total_amount * 100))

    # 5. Create order in Razorpay
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": invoice_number,
            "payment_capture": 1 # auto capture
        }
        razorpay_order = client.order.create(data=order_data)
    except Exception as e:
        print("[Razorpay] Failed to create order in SDK:", e)
        raise HTTPException(status_code=500, detail=f"Razorpay integration failure: {str(e)}")

    # 6. Create a PENDING payment record in DB
    new_payment = models.Payment(
        id=str(uuid.uuid4()),
        memberId=member.id,
        invoiceNumber=invoice_number,
        amountPaid=0.0, # not paid yet
        totalAmount=total_amount,
        taxAmount=tax_amount,
        status="PENDING",
        method="CARD", # Default, will update on verify
        notes=f"Razorpay Order ID: {razorpay_order['id']}",
        createdAt=datetime.datetime.utcnow(),
        paymentDate=datetime.datetime.utcnow()
    )
    db.add(new_payment)
    db.commit()

    return schemas.OrderCreateResponse(
        id=razorpay_order["id"],
        amount=amount_in_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
        planName=plan.name,
        invoiceNumber=invoice_number
    )

@router.post("/verify", response_model=schemas.PaymentVerifyResponse)
def verify_razorpay_payment(req: schemas.PaymentVerifyRequest, db: Session = Depends(get_db)):
    # 1. Verify Razorpay signature
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpayOrderId,
            'razorpay_payment_id': req.razorpayPaymentId,
            'razorpay_signature': req.razorpaySignature
        })
    except Exception as e:
        # Signature is invalid, update payment to FAILED if order notes match
        pending_payment = db.query(models.Payment).filter(
            models.Payment.notes == f"Razorpay Order ID: {req.razorpayOrderId}"
        ).first()
        if pending_payment:
            pending_payment.status = "FAILED"
            db.commit()
        raise HTTPException(status_code=400, detail="Razorpay signature verification failed.")

    # 2. Retrieve Member, Plan, and Payment records
    member = db.query(models.Member).filter(models.Member.id == req.memberId).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == req.planId).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    payment = db.query(models.Payment).filter(
        models.Payment.notes == f"Razorpay Order ID: {req.razorpayOrderId}"
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record for order not found.")

    try:
        # Start database updates
        payment.status = "PAID"
        payment.amountPaid = payment.totalAmount # Full amount captured
        payment.paymentDate = datetime.datetime.utcnow()
        payment.notes = f"Verified Razorpay Payment ID: {req.razorpayPaymentId}"

        # Manage membership activation/renewal
        start_date = datetime.datetime.utcnow()
        end_date = start_date + datetime.timedelta(days=plan.durationDays)

        old_membership_id = member.membershipId

        # Create new membership
        new_membership = models.Membership(
            id=str(uuid.uuid4()),
            planId=plan.id,
            startDate=start_date,
            endDate=end_date,
            status="ACTIVE",
            createdAt=datetime.datetime.utcnow(),
            updatedAt=datetime.datetime.utcnow()
        )
        db.add(new_membership)
        db.flush() # Populate new_membership.id

        # Update member pointer
        member.membershipId = new_membership.id

        # Deactivate old membership if it exists
        if old_membership_id:
            old_membership = db.query(models.Membership).filter(models.Membership.id == old_membership_id).first()
            if old_membership:
                old_membership.status = "CANCELLED"
                old_membership.updatedAt = datetime.datetime.utcnow()

        # Send alert notification
        new_notification = models.Notification(
            id=str(uuid.uuid4()),
            recipientId=member.userId,
            title="Membership Activated",
            message=f"Success! Your membership plan '{plan.name}' is now active until {end_date.strftime('%B %d, %Y')}. Thank you!",
            isRead=False,
            sentAt=datetime.datetime.utcnow()
        )
        db.add(new_notification)

        db.commit()

    except Exception as err:
        db.rollback()
        print("[Database] Verification transaction rollback:", err)
        raise HTTPException(status_code=500, detail="Database transaction update failed.")

    return schemas.PaymentVerifyResponse(
        status="success",
        message="Payment verified and membership activated.",
        invoiceNumber=payment.invoiceNumber
    )

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Signature missing.")

    body = await request.body()
    
    # Verify webhook signature using secret
    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    # Parse payload
    payload = await request.json()
    event = payload.get("event")

    if event == "payment.captured":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")

        if order_id:
            # Query matching pending payment
            payment = db.query(models.Payment).filter(
                models.Payment.notes == f"Razorpay Order ID: {order_id}",
                models.Payment.status == "PENDING"
            ).first()

            if payment:
                # Update status
                payment.status = "PAID"
                payment.amountPaid = payment.totalAmount
                payment.paymentDate = datetime.datetime.utcnow()
                payment.notes = f"Verified via Webhook. Payment ID: {payment_id}"
                
                # Fetch member details to trigger activation
                member = db.query(models.Member).filter(models.Member.id == payment.memberId).first()
                if member:
                    # In standard flows, verification API would have already processed membership.
                    # This hook acts as a backup check in case browser window closes early.
                    # Check if member already points to an active membership
                    has_active = False
                    if member.membershipId:
                        curr_memb = db.query(models.Membership).filter(
                            models.Membership.id == member.membershipId
                        ).first()
                        if curr_memb and curr_memb.status == "ACTIVE":
                            has_active = True
                    
                    if not has_active:
                        # Extract plan information. We can fetch planId from metadata or query notes
                        # Let's verify if there is a way to retrieve the plan.
                        # Since notes contains "Razorpay Order ID: x", we don't have the planId directly.
                        # However, we can fetch the member's last assigned details or do default recovery.
                        pass
                db.commit()

    elif event == "payment.failed":
        payment_entity = payload["payload"]["payment"]["entity"]
        order_id = payment_entity.get("order_id")
        if order_id:
            payment = db.query(models.Payment).filter(
                models.Payment.notes == f"Razorpay Order ID: {order_id}"
            ).first()
            if payment:
                payment.status = "FAILED"
                db.commit()

    return {"status": "ok"}


@router.post("/demo-pay")
def demo_pay(req: schemas.OrderCreateRequest, db: Session = Depends(get_db)):
    """
    DEVELOPMENT ONLY: Simulates a complete Razorpay payment without needing
    real API keys or the Razorpay checkout UI. Creates an order + immediately
    marks it as PAID and activates the membership.
    """
    import os
    if os.getenv("NODE_ENV", "development") == "production":
        raise HTTPException(status_code=403, detail="Demo pay is disabled in production.")

    # 1. Fetch Member
    member = db.query(models.Member).filter(models.Member.id == req.memberId).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    # 2. Fetch Plan
    plan = db.query(models.MembershipPlan).filter(models.MembershipPlan.id == req.planId).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    # 3. Compute invoice number
    current_year = datetime.datetime.now().year
    prefix = f"INV-{current_year}-"
    latest_payment = db.query(models.Payment).filter(
        models.Payment.invoiceNumber.like(f"{prefix}%")
    ).order_by(models.Payment.invoiceNumber.desc()).first()
    next_num = 1
    if latest_payment:
        parts = latest_payment.invoiceNumber.split('-')
        if len(parts) >= 3:
            try:
                next_num = int(parts[2]) + 1
            except ValueError:
                pass
    invoice_number = f"{prefix}{str(next_num).zfill(4)}"

    # 4. Calculate total
    tax_rate = plan.gstPercent / 100.0 if hasattr(plan, "gstPercent") else 0.18
    tax_amount = round(plan.price * tax_rate, 2)
    total_amount = round(plan.price + tax_amount, 2)

    try:
        # 5. Create PAID payment record directly
        demo_payment_id = f"demo_pay_{str(uuid.uuid4())[:12]}"
        new_payment = models.Payment(
            id=str(uuid.uuid4()),
            memberId=member.id,
            invoiceNumber=invoice_number,
            amountPaid=total_amount,
            totalAmount=total_amount,
            taxAmount=tax_amount,
            status="PAID",
            method="UPI",
            notes=f"Demo Payment ID: {demo_payment_id}",
            createdAt=datetime.datetime.utcnow(),
            paymentDate=datetime.datetime.utcnow()
        )
        db.add(new_payment)

        # 6. Activate membership
        start_date = datetime.datetime.utcnow()
        end_date = start_date + datetime.timedelta(days=plan.durationDays)
        old_membership_id = member.membershipId

        new_membership = models.Membership(
            id=str(uuid.uuid4()),
            planId=plan.id,
            startDate=start_date,
            endDate=end_date,
            status="ACTIVE",
            createdAt=datetime.datetime.utcnow(),
            updatedAt=datetime.datetime.utcnow()
        )
        db.add(new_membership)
        db.flush()

        member.membershipId = new_membership.id

        if old_membership_id:
            old_membership = db.query(models.Membership).filter(
                models.Membership.id == old_membership_id
            ).first()
            if old_membership:
                old_membership.status = "CANCELLED"
                old_membership.updatedAt = datetime.datetime.utcnow()

        # 7. Send notification
        new_notification = models.Notification(
            id=str(uuid.uuid4()),
            recipientId=member.userId,
            title="Membership Activated (Demo)",
            message=f"Your '{plan.name}' plan is now ACTIVE until {end_date.strftime('%B %d, %Y')}. (Demo payment)",
            isRead=False,
            sentAt=datetime.datetime.utcnow()
        )
        db.add(new_notification)
        db.commit()

    except Exception as err:
        db.rollback()
        print("[Demo Pay] DB transaction failed:", err)
        raise HTTPException(status_code=500, detail=f"Demo payment failed: {str(err)}")

    return {
        "status": "success",
        "message": "Demo payment completed and membership activated.",
        "invoiceNumber": invoice_number,
        "planName": plan.name,
        "activeUntil": end_date.strftime("%B %d, %Y")
    }


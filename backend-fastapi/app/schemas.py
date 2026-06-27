from pydantic import BaseModel
from typing import Optional

class OrderCreateRequest(BaseModel):
    memberId: str
    planId: str

class OrderCreateResponse(BaseModel):
    id: str
    amount: int
    currency: str
    key_id: str
    planName: str
    invoiceNumber: str

class PaymentVerifyRequest(BaseModel):
    razorpayOrderId: str
    razorpayPaymentId: str
    razorpaySignature: str
    memberId: str
    planId: str

class PaymentVerifyResponse(BaseModel):
    status: str
    message: str
    invoiceNumber: str

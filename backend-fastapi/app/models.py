from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import datetime
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    member_profile = relationship("Member", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="recipient")

class Member(Base):
    __tablename__ = "Member"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    memberId = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    dob = Column(DateTime, nullable=False)
    gender = Column(String, nullable=False)
    emergencyContact = Column(String, nullable=False)
    avatarUrl = Column(String, nullable=True)
    idProofUrl = Column(String, nullable=True)
    qrCodeToken = Column(String, unique=True, index=True, nullable=False)
    initialHeight = Column(Float, nullable=False)
    initialWeight = Column(Float, nullable=False)
    trainerId = Column(String, nullable=True)
    membershipId = Column(String, ForeignKey("Membership.id"), unique=True, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="member_profile")
    membership = relationship("Membership", foreign_keys=[membershipId])
    payments = relationship("Payment", back_populates="member")

class MembershipPlan(Base):
    __tablename__ = "MembershipPlan"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    price = Column(Float, nullable=False)
    duration = Column(String, nullable=False)
    durationDays = Column(Integer, nullable=False)
    joiningFee = Column(Float, default=0.0)
    gstPercent = Column(Float, default=18.0)
    freezeDays = Column(Integer, default=0)
    description = Column(String, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Membership(Base):
    __tablename__ = "Membership"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    planId = Column(String, ForeignKey("MembershipPlan.id"), nullable=False)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    status = Column(String, default="ACTIVE")
    freezeStart = Column(DateTime, nullable=True)
    freezeEnd = Column(DateTime, nullable=True)
    remainingFreezeDays = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Payment(Base):
    __tablename__ = "Payment"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    memberId = Column(String, ForeignKey("Member.id", ondelete="CASCADE"), nullable=False)
    invoiceNumber = Column(String, unique=True, nullable=False)
    amountPaid = Column(Float, nullable=False)
    totalAmount = Column(Float, nullable=False)
    taxAmount = Column(Float, nullable=False)
    paymentDate = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="PAID")
    method = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    member = relationship("Member", back_populates="payments")

class Notification(Base):
    __tablename__ = "Notification"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recipientId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    isRead = Column(Boolean, default=False)
    sentAt = Column(DateTime, default=datetime.datetime.utcnow)

    recipient = relationship("User", back_populates="notifications")

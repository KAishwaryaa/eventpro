from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String(36), ForeignKey("bookings.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='INR')
    status = Column(Enum('pending', 'completed', 'failed', 'refunded', name='payment_status'), default='pending')
    payment_method = Column(String(50)) # card, upi, netbanking
    transaction_id = Column(String(255), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", backref="payment")

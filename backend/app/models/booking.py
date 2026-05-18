from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attendee_id = Column(String(36), ForeignKey("users.id"))
    event_id = Column(String(36), ForeignKey("events.id"))
    ticket_type_id = Column(String(36), ForeignKey("ticket_types.id"))
    quantity = Column(Integer, nullable=False)
    status = Column(Enum('pending', 'confirmed', 'cancelled', 'expired', 'checked_in', name='booking_status'), default='pending')
    price_paid = Column(Float, nullable=False)
    currency = Column(String(10), default='INR')
    payment_reference = Column(String(255))
    qr_code_data = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attendee = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    ticket_type = relationship("TicketType", back_populates="bookings")

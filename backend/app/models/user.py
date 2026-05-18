from sqlalchemy import Column, String, Enum, Boolean
from sqlalchemy.orm import relationship
import uuid
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum('attendee', 'organizer', 'admin', name='user_roles'), default='attendee')
    status = Column(Enum('active', 'inactive', 'deleted', name='user_status'), default='active')
    is_active = Column(Boolean, default=True)

    events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="attendee")

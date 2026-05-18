from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey, JSON, Float, Integer, Boolean
from sqlalchemy.orm import relationship
import uuid
from app.db.session import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    venue_name = Column(String(255))
    venue_address = Column(String(255))
    venue_city = Column(String(100))
    venue_coordinates = Column(JSON) # {lat, lng}
    image_url = Column(String(500))
    status = Column(Enum('draft', 'published', 'cancelled', name='event_status'), default='draft')
    organizer_id = Column(String(36), ForeignKey("users.id"))

    organizer = relationship("User", back_populates="events")
    ticket_types = relationship("TicketType", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event")

class TicketType(Base):
    __tablename__ = "ticket_types"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    base_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    sold_count = Column(Integer, default=0)
    seating_type = Column(Enum('assigned', 'general_admission', name='seating_type'), default='general_admission')
    dynamic_pricing_enabled = Column(Boolean, default=False)

    event = relationship("Event", back_populates="ticket_types")
    bookings = relationship("Booking", back_populates="ticket_type")
    seats = relationship("Seat", back_populates="ticket_type")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_type_id = Column(String(36), ForeignKey("ticket_types.id"))
    row = Column(String(10), nullable=False)
    number = Column(String(10), nullable=False)
    status = Column(Enum('available', 'locked', 'booked', name='seat_status'), default='available')
    lock_holder = Column(String(255))
    lock_expires_at = Column(DateTime)

    ticket_type = relationship("TicketType", back_populates="seats")

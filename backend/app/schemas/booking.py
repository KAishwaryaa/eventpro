from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class BookingBase(BaseModel):
    event_id: str
    ticket_type_id: str
    quantity: int
    payment_method: Optional[str] = "card"

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: str

from .event import Event, TicketType

class Booking(BookingBase):
    id: str
    attendee_id: str
    status: str
    price_paid: float
    currency: str
    payment_reference: Optional[str] = None
    qr_code_data: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    event: Optional[Event] = None
    ticket_type: Optional[TicketType] = None

    class Config:
        from_attributes = True

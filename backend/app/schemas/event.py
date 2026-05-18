from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime

# Ticket Type schemas
class TicketTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: float
    current_price: float
    quantity: int
    seating_type: str = "general_admission"
    dynamic_pricing_enabled: bool = False

class TicketTypeCreate(TicketTypeBase):
    pass

class TicketType(TicketTypeBase):
    id: str
    event_id: str
    sold_count: int

    class Config:
        from_attributes = True

# Event schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    venue_city: Optional[str] = None
    venue_coordinates: Optional[Dict[str, float]] = None
    image_url: Optional[str] = None
    status: str = "draft"

class EventCreate(EventBase):
    ticket_types: List[TicketTypeCreate]

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    venue_city: Optional[str] = None
    venue_coordinates: Optional[Dict[str, float]] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class Event(EventBase):
    id: str
    organizer_id: str
    ticket_types: List[TicketType]

    class Config:
        from_attributes = True

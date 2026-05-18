from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload

from app.api import deps
from app.models.booking import Booking
from app.models.event import TicketType
from app.models.user import User
from app.models.payment import Payment
from app.schemas.booking import Booking as BookingSchema, BookingCreate, BookingUpdate

router = APIRouter()

@router.post("", response_model=Any)
def create_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_in: BookingCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    ticket_type = db.query(TicketType).filter(TicketType.id == booking_in.ticket_type_id).first()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    
    if ticket_type.sold_count + booking_in.quantity > ticket_type.quantity:
        raise HTTPException(status_code=400, detail="Not enough tickets available")
    
    booking = Booking(
        attendee_id=current_user.id,
        event_id=booking_in.event_id,
        ticket_type_id=booking_in.ticket_type_id,
        quantity=booking_in.quantity,
        price_paid=ticket_type.current_price * booking_in.quantity,
        status="confirmed", # For now, auto-confirm
    )
    
    ticket_type.sold_count += booking_in.quantity
    
    db.add(booking)
    db.add(ticket_type)
    db.flush() # Get booking.id

    # Create Payment Detail
    payment = Payment(
        booking_id=booking.id,
        amount=booking.price_paid,
        currency=booking.currency,
        status="completed",
        payment_method=booking_in.payment_method,
        transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}"
    )
    db.add(payment)
    
    db.commit()
    db.refresh(booking)
    
    booking_data = BookingSchema.model_validate(booking)
    
    # Mock checkout URL
    checkout_url = f"http://localhost:5173/bookings/success?booking_id={booking.id}"
    
    return {
        "booking": jsonable_encoder(booking_data),
        "checkout_url": checkout_url
    }

@router.get("", response_model=Any)
def read_bookings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    page: int = 1,
    page_size: int = 10,
) -> Any:
    query = db.query(Booking).options(
        joinedload(Booking.event),
        joinedload(Booking.ticket_type)
    )
    if current_user.role != 'admin':
        query = query.filter(Booking.attendee_id == current_user.id)
    
    total = query.count()
    skip = (page - 1) * page_size
    bookings = query.offset(skip).limit(page_size).all()
    
    results = [BookingSchema.model_validate(b) for b in bookings]
    
    return {
        "results": jsonable_encoder(results),
        "total": total
    }

@router.get("/{id}", response_model=BookingSchema)
def read_booking(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    booking = db.query(Booking).options(
        joinedload(Booking.event),
        joinedload(Booking.ticket_type)
    ).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role != 'admin' and booking.attendee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return jsonable_encoder(BookingSchema.model_validate(booking))

@router.get("/{id}/calendar/google")
def google_calendar_redirect(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    from fastapi.responses import RedirectResponse
    import urllib.parse
    
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    event = booking.event
    start = event.start_datetime.strftime("%Y%m%dT%H%M%SZ")
    end = event.end_datetime.strftime("%Y%m%dT%H%M%SZ")
    
    params = {
        "action": "TEMPLATE",
        "text": event.title,
        "dates": f"{start}/{end}",
        "details": event.description,
        "location": f"{event.venue_name}, {event.venue_city}",
    }
    
    base_url = "https://www.google.com/calendar/render"
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)

@router.get("/{id}/calendar.ics")
def download_ics(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    from fastapi.responses import Response
    
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    event = booking.event
    start = event.start_datetime.strftime("%Y%m%dT%H%M%SZ")
    end = event.end_datetime.strftime("%Y%m%dT%H%M%SZ")
    
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventPro//EN
BEGIN:VEVENT
UID:{booking.id}
DTSTAMP:{start}
DTSTART:{start}
DTEND:{end}
SUMMARY:{event.title}
DESCRIPTION:{event.description}
LOCATION:{event.venue_name}, {event.venue_city}
END:VEVENT
END:VCALENDAR"""

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=event-{id}.ics"}
    )

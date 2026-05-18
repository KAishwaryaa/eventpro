from typing import Any, List
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api import deps
from app.models.event import Event, TicketType
from app.models.user import User
from app.schemas.event import Event as EventSchema, EventCreate, EventUpdate

from fastapi.encoders import jsonable_encoder

router = APIRouter()

@router.get("/recommendations", response_model=Any)
def get_recommendations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Simple recommendation: return 6 random events
    import random
    events = db.query(Event).options(joinedload(Event.ticket_types)).all()
    if len(events) > 6:
        events = random.sample(events, 6)
    
    results = [EventSchema.model_validate(e) for e in events]
    
    return {
        "recommendations": jsonable_encoder(results)
    }

@router.get("", response_model=Any)
def read_events(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 12,
    keyword: str = None,
    category: str = None,
    city: str = None,
    min_price: float = None,
    max_price: float = None,
    sort_by: str = "date_asc"
) -> Any:
    query = db.query(Event).options(joinedload(Event.ticket_types))
    
    if keyword:
        query = query.filter(Event.title.contains(keyword) | Event.description.contains(keyword))
    if category:
        query = query.filter(Event.category == category)
    if city:
        query = query.filter(Event.venue_city == city)
    
    # Simple sort mapping
    if sort_by == "date_asc":
        query = query.order_by(Event.start_datetime.asc())
    elif sort_by == "date_desc":
        query = query.order_by(Event.start_datetime.desc())
    
    total = query.count()
    skip = (page - 1) * page_size
    events = query.offset(skip).limit(page_size).all()
    
    results = [EventSchema.model_validate(e) for e in events]
    
    return {
        "results": jsonable_encoder(results),
        "total": total
    }

@router.post("", response_model=EventSchema)
def create_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: EventCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in ['organizer', 'admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    event = Event(
        title=event_in.title,
        description=event_in.description,
        category=event_in.category,
        start_datetime=event_in.start_datetime,
        end_datetime=event_in.end_datetime,
        venue_name=event_in.venue_name,
        venue_address=event_in.venue_address,
        venue_city=event_in.venue_city,
        venue_coordinates=event_in.venue_coordinates,
        image_url=event_in.image_url,
        status=event_in.status,
        organizer_id=current_user.id
    )
    db.add(event)
    db.flush() # Get event.id

    for tt_in in event_in.ticket_types:
        tt = TicketType(
            event_id=event.id,
            name=tt_in.name,
            description=tt_in.description,
            base_price=tt_in.base_price,
            current_price=tt_in.current_price,
            quantity=tt_in.quantity,
            seating_type=tt_in.seating_type,
            dynamic_pricing_enabled=tt_in.dynamic_pricing_enabled
        )
        db.add(tt)
    
    db.commit()
    db.refresh(event)
    return event

@router.get("/{id}", response_model=EventSchema)
def read_event(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
) -> Any:
    event = db.query(Event).options(joinedload(Event.ticket_types)).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return jsonable_encoder(EventSchema.model_validate(event))

@router.put("/{id}", response_model=EventSchema)
def update_event(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    event_in: EventUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != 'admin' and event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = event_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(event, field, update_data[field])
    
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.post("/{id}/waitlist")
def join_waitlist(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return {"message": "Successfully joined waitlist"}

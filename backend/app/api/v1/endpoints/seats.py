from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api import deps
from app.models.event import Seat, TicketType, Event
from app.models.user import User

router = APIRouter()

# Simple connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, event_id: str, websocket: WebSocket):
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)

    def disconnect(self, event_id: str, websocket: WebSocket):
        if event_id in self.active_connections:
            self.active_connections[event_id].remove(websocket)

    async def broadcast(self, event_id: str, message: dict):
        if event_id in self.active_connections:
            for connection in self.active_connections[event_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/events/{event_id}/seats")
async def websocket_endpoint(
    websocket: WebSocket,
    event_id: str,
    db: Session = Depends(deps.get_db),
    # token: str is passed in query param, handled in frontend
):
    await manager.connect(event_id, websocket)
    try:
        # Send initial seat state
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            await websocket.close(code=4004)
            return
        
        # Get all seats for all ticket types of this event
        seats = []
        for tt in event.ticket_types:
            for seat in tt.seats:
                seats.append({
                    "id": seat.id,
                    "row": seat.row,
                    "number": seat.number,
                    "status": seat.status,
                    "lock_holder": seat.lock_holder
                })
        
        await websocket.send_json({"type": "initial_state", "seats": seats})
        
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(event_id, websocket)

@router.post("/{seat_id}/lock")
async def lock_seat(
    *,
    db: Session = Depends(deps.get_db),
    seat_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    
    if seat.status != 'available':
        if seat.status == 'locked' and seat.lock_expires_at < datetime.utcnow():
            # Lock expired, can take it
            pass
        else:
            raise HTTPException(status_code=400, detail="Seat is not available")
    
    seat.status = 'locked'
    seat.lock_holder = f"{current_user.id}:{seat_id}"
    seat.lock_expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db.add(seat)
    db.commit()
    db.refresh(seat)
    
    # Broadcast update
    event_id = seat.ticket_type.event_id
    await manager.broadcast(event_id, {
        "type": "seat_update",
        "seat_id": seat_id,
        "status": "locked",
        "lock_holder": seat.lock_holder
    })
    
    return {"message": "Seat locked"}

@router.delete("/{seat_id}/lock")
async def unlock_seat(
    *,
    db: Session = Depends(deps.get_db),
    seat_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    
    if seat.lock_holder != f"{current_user.id}:{seat_id}":
        raise HTTPException(status_code=403, detail="You do not hold the lock for this seat")
    
    seat.status = 'available'
    seat.lock_holder = None
    seat.lock_expires_at = None
    
    db.add(seat)
    db.commit()
    db.refresh(seat)
    
    # Broadcast update
    event_id = seat.ticket_type.event_id
    await manager.broadcast(event_id, {
        "type": "seat_update",
        "seat_id": seat_id,
        "status": "available",
        "lock_holder": None
    })
    
    return {"message": "Seat unlocked"}

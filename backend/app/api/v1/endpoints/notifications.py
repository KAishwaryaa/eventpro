from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()

@router.get("", response_model=Any)
def read_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    page: int = 1,
    page_size: int = 10,
) -> Any:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = query.count()
    skip = (page - 1) * page_size
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(page_size).all()
    
    return {
        "results": jsonable_encoder(notifications),
        "total": total
    }

@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.add(notification)
    db.commit()
    return {"message": "Notification marked as read"}

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.booking import Booking
from app.models.event import Event
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/users", response_model=Any)
def read_users(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    query = db.query(User)
    total = query.count()
    skip = (page - 1) * page_size
    users = query.offset(skip).limit(page_size).all()
    
    return {
        "results": jsonable_encoder(users),
        "total": total
    }

@router.get("/fraud-alerts", response_model=Any)
def read_fraud_alerts(
    db: Session = Depends(deps.get_db),
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # We don't have a fraud model yet, so let's return empty results for now
    return {
        "results": [],
        "total": 0
    }

@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_data.get("role")
    db.add(user)
    db.commit()
    return {"message": "User role updated"}

@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    status_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    action = status_data.get("action")
    if action == "deactivate":
        user.status = "inactive"
    elif action == "activate":
        user.status = "active"
    
    db.add(user)
    db.commit()
    return {"message": f"User {action}d successfully"}

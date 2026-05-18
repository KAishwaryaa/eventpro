from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api import deps
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User

router = APIRouter()

@router.get("/revenue", response_model=Any)
def get_revenue_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: str = None,
    end_date: str = None,
) -> Any:
    # Basic mock data for now
    return {
        "total_revenue": 12500.50,
        "revenue_by_event": [
            {"event_id": "Event 1", "revenue": 5000},
            {"event_id": "Event 2", "revenue": 3500},
            {"event_id": "Event 3", "revenue": 4000.50},
        ]
    }

@router.get("/bookings", response_model=Any)
def get_booking_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: str = None,
    end_date: str = None,
) -> Any:
    return {
        "total": 150,
        "status_breakdown": {
            "confirmed": 120,
            "pending": 20,
            "cancelled": 10
        },
        "bookings_per_day": [
            {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 5 + i % 3}
            for i in range(7)
        ]
    }

@router.get("/events", response_model=Any)
def get_event_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: str = None,
    end_date: str = None,
) -> Any:
    return {
        "top_by_bookings": [
            {"event_id": "Music Fest", "booking_count": 50},
            {"event_id": "Tech Conf", "booking_count": 45},
        ],
        "top_by_revenue": [
            {"event_id": "VIP Gala", "revenue": 10000},
            {"event_id": "Music Fest", "revenue": 5000},
        ]
    }

@router.get("/users", response_model=Any)
def get_user_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    start_date: str = None,
    end_date: str = None,
) -> Any:
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return {
        "total_users": 1000,
        "active_users": 850,
        "new_users_per_day": [
            {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 10 + i % 5}
            for i in range(7)
        ]
    }

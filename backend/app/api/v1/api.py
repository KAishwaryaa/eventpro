from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, events, bookings, seats, admin, notifications, analytics

api_router = APIRouter(redirect_slashes=False)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(seats.router, prefix="/seats", tags=["seats"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

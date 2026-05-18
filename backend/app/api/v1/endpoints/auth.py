from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema, UserLogin
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/login", response_model=Any)
def login_access_token(
    login_data: UserLogin = Body(...),
    db: Session = Depends(deps.get_db)
) -> Any:
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        return JSONResponse(
            status_code=400,
            content={"error": {"message": "Incorrect email or password"}}
        )
    elif not user.is_active:
        return JSONResponse(
            status_code=400,
            content={"error": {"message": "Inactive user"}}
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
        "user": jsonable_encoder(user)
    }

@router.post("/register", response_model=Any)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        return JSONResponse(
            status_code=400,
            content={"error": {"message": "The user with this email already exists."}}
        )
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
        "user": jsonable_encoder(user)
    }

@router.post("/refresh", response_model=Token)
def refresh_token(
    *,
    db: Session = Depends(deps.get_db),
    refresh_token: str,
) -> Any:
    try:
        payload = security.jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return JSONResponse(
                status_code=403,
                content={"error": {"message": "Invalid refresh token"}}
            )
    except security.jwt.JWTError:
        return JSONResponse(
            status_code=403,
            content={"error": {"message": "Invalid refresh token"}}
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "User not found or inactive"}}
        )
    
    return {
        "access_token": security.create_access_token(user.id),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
    }

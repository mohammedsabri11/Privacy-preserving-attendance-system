"""
Authentication Router
======================
Handles user login and token issuance.

Endpoints:
  POST /api/auth/login — authenticate with email + password, receive JWT
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import verify_password, create_access_token, get_current_user, hash_password
from models.user import User
from models.schemas import LoginRequest, TokenResponse, UserResponse
from pydantic import BaseModel, EmailStr
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate a user by email and password.
    Returns a JWT access token on success.

    Example request:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword123"
    }
    ```

    Example response:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer"
    }
    ```
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    logger.info("User %s (%s) logged in successfully", user.email, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile (name, email)."""
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.email is not None and body.email != current_user.email:
        existing = await db.execute(select(User).where(User.email == body.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already in use")
        current_user.email = body.email
    await db.flush()
    await db.refresh(current_user)
    logger.info("User %d updated profile", current_user.id)
    return current_user


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.put("/change-password")
async def change_password(
    body: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password (requires current password)."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(body.new_password)
    await db.flush()
    logger.info("User %d changed password", current_user.id)
    return {"message": "Password changed successfully"}

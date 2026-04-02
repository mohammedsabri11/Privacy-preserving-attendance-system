"""
User Registration Router
=========================
Handles user account creation and face registration.

Endpoints:
  POST /api/register-user  — create account + register face image(s)
  GET  /api/users           — list all registered users
  GET  /api/users/{id}      — get single user
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import DuplicateUserError, AppException
from core.security import hash_password, get_current_user, get_admin_user
from models.user import User, ROLE_ADMIN, ROLE_STUDENT
from models.embedding import Embedding
from models.attendance import AttendanceImage
from models.course import CourseEnrollment
from models.schemas import UserCreate, UserResponse
from services.face_recognition import register_face

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Users"])


@router.post("/register-user", response_model=UserResponse, status_code=201)
async def register_user(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(..., min_length=6),
    role: str = Form("student"),
    face_images: List[UploadFile] = File(..., description="One or more face images for enrollment"),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user with one or more face images.
    The face embeddings are extracted and stored for future recognition.

    Example request (multipart/form-data):
      - full_name: "John Doe"
      - email: "john@example.com"
      - password: "securepassword123"
      - face_images: [file1.jpg, file2.jpg]

    Example response:
    ```json
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-04-02T10:30:00Z"
    }
    ```
    """
    # Check for duplicate email
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User with this email already exists")

    # Validate role
    valid_roles = [ROLE_ADMIN, ROLE_STUDENT]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    # Create user record
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    await db.flush()  # get user.id

    # Process each face image and store embeddings
    embeddings_count = 0
    try:
        for img_file in face_images:
            image_bytes = await img_file.read()
            if not image_bytes:
                continue
            await register_face(db, user.id, image_bytes)
            embeddings_count += 1
    except AppException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    if embeddings_count == 0:
        raise HTTPException(status_code=400, detail="No valid face detected in any uploaded image")

    await db.refresh(user)
    logger.info("Registered user: %s (id=%d) with %d embeddings", email, user.id, embeddings_count)
    return user


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Return all users with enriched stats (attendance count, embeddings, courses)."""
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()

    enriched = []
    for u in users:
        att_count = (await db.execute(
            select(func.count(AttendanceImage.id)).where(AttendanceImage.user_id == u.id)
        )).scalar() or 0
        emb_count = (await db.execute(
            select(func.count(Embedding.id)).where(Embedding.user_id == u.id)
        )).scalar() or 0
        course_count = (await db.execute(
            select(func.count(CourseEnrollment.id)).where(CourseEnrollment.user_id == u.id)
        )).scalar() or 0

        enriched.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "attendance_count": att_count,
            "embedding_count": emb_count,
            "course_count": course_count,
        })

    return enriched


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Return a single user by ID (requires authentication)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

"""
Attendance Router
==================
Full attendance pipeline and record retrieval.

Endpoints:
  POST /api/attendance         — capture + recognize + encrypt + steganography + save
  GET  /api/attendance-records — paginated list of attendance records
  GET  /api/dashboard          — aggregated dashboard statistics
"""

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import AppException
from core.security import get_current_user
from models.user import User
from models.schemas import AttendanceResponse, AttendanceListResponse, AttendanceRecord, DashboardStats
from services.attendance import process_attendance, get_attendance_records, get_dashboard_stats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Attendance"])


@router.post("/attendance", response_model=AttendanceResponse)
async def capture_attendance(
    image: UploadFile = File(..., description="Webcam capture for attendance"),
    db: AsyncSession = Depends(get_db),
):
    """
    Full attendance pipeline:
      1. Detect and recognize the face
      2. Encrypt the attendance payload (AES-256-GCM)
      3. Embed the ciphertext into the image (LSB steganography)
      4. Save the stego-image and database record

    Example request (multipart/form-data):
      - image: webcam_capture.jpg

    Example response:
    ```json
    {
      "message": "Attendance recorded successfully",
      "record": {
        "id": 42,
        "user_id": 1,
        "full_name": "John Doe",
        "timestamp": "2026-04-02T10:30:00Z",
        "stego_image_path": "static/stego_images/stego_20260402_103000_a1b2c3d4.png",
        "status": "present"
      }
    }
    ```
    """
    image_bytes = await image.read()
    try:
        result = await process_attendance(db, image_bytes)
    except AppException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    record = AttendanceRecord(
        id=result["id"],
        user_id=result["user_id"],
        full_name=result["full_name"],
        timestamp=result["timestamp"],
        stego_image_path=result["stego_image_path"],
        status=result["status"],
        key_id=result.get("key_id"),
    )

    return AttendanceResponse(
        message="Attendance recorded successfully",
        record=record,
    )


@router.get("/attendance-records", response_model=AttendanceListResponse)
async def list_attendance_records(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    date_filter: Optional[date] = Query(None, alias="date", description="Filter by date (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Retrieve paginated attendance records with optional filters.

    Query parameters:
      - user_id (int, optional): filter by specific user
      - date (str, optional): filter by date "YYYY-MM-DD"
      - skip (int): pagination offset (default 0)
      - limit (int): page size (default 50, max 200)

    Example response:
    ```json
    {
      "total": 150,
      "records": [
        {
          "id": 42,
          "user_id": 1,
          "full_name": "John Doe",
          "timestamp": "2026-04-02T10:30:00Z",
          "stego_image_path": "static/stego_images/stego_20260402_103000_a1b2c3d4.png",
          "status": "present"
        }
      ]
    }
    ```
    """
    data = await get_attendance_records(
        db, user_id=user_id, date_filter=date_filter, skip=skip, limit=limit
    )
    return AttendanceListResponse(**data)


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Aggregated dashboard statistics:
      - total registered users
      - today's attendance count
      - all-time attendance count
      - 10 most recent records
    """
    stats = await get_dashboard_stats(db)
    return DashboardStats(**stats)

"""
Data Extraction Router — POST /api/extract-data
"""

import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import AppException
from core.security import get_current_user
from models.user import User
from models.schemas import ExtractedData
from services.attendance import extract_attendance_data

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Extraction"])


@router.post("/extract-data", response_model=ExtractedData)
async def extract_data(
    image: UploadFile = File(..., description="Stego-image containing hidden attendance data"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Upload a stego-image to extract and decrypt the hidden attendance payload."""
    image_bytes = await image.read()
    try:
        payload = await extract_attendance_data(db, image_bytes)
    except AppException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    return ExtractedData(
        user_id=payload["user_id"],
        full_name=payload["full_name"],
        timestamp=payload["timestamp"],
        status=payload["status"],
    )

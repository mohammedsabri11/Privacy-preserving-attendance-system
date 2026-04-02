"""
Face Recognition Router — POST /api/recognize
"""

import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import AppException
from models.schemas import RecognitionResult
from services.face_recognition import recognize_face

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Recognition"])


@router.post("/recognize", response_model=RecognitionResult)
async def recognize(
    image: UploadFile = File(..., description="Face image to identify"),
    db: AsyncSession = Depends(get_db),
):
    """Identify a user from a face image. Does NOT record attendance."""
    image_bytes = await image.read()
    try:
        user, confidence = await recognize_face(db, image_bytes)
    except AppException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    return RecognitionResult(
        user_id=user.id,
        full_name=user.full_name,
        confidence=round(confidence, 4),
        message="User identified successfully",
    )

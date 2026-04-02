"""
Attendance Service
===================
Orchestrates the full attendance pipeline:
  1. Receive a webcam capture
  2. Recognize the user via face embeddings
  3. Build an attendance payload (user_id, name, timestamp)
  4. Encrypt the payload with AES-256-GCM
  5. Embed the ciphertext into the original image via LSB steganography
  6. Persist the stego-image and attendance record
"""

import logging
import os
from datetime import datetime, timezone, date, time, timedelta

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.attendance import AttendanceImage
from models.course import Course
from models.user import User
from services.encryption import encrypt_data, decrypt_data
from services.face_recognition import recognize_face
from services.steganography import (
    embed_data_in_image,
    extract_data_from_image,
    save_stego_image,
)

logger = logging.getLogger(__name__)


def _date_range_filter(col, target_date: date):
    """
    Build a portable date range filter that works on both PostgreSQL and SQLite.
    Instead of func.date() (which returns a string on SQLite), use a range query.
    """
    start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    end = datetime.combine(target_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    return and_(col >= start, col < end)


async def process_attendance(
    db: AsyncSession,
    image_bytes: bytes,
) -> dict:
    """End-to-end attendance processing."""

    # Step 1 — Recognize the face
    user, confidence = await recognize_face(db, image_bytes)

    # Step 2 — Build attendance payload
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "timestamp": now.isoformat(),
        "status": "present",
        "confidence": round(confidence, 4),
    }

    # Step 3 — Encrypt the payload with active DB key
    encrypted_b64, key_id = await encrypt_data(db, payload)

    # Step 4 — Embed encrypted data into the carrier image
    stego_bytes = embed_data_in_image(image_bytes, encrypted_b64)

    # Step 5 — Save stego-image to disk
    stego_path = save_stego_image(stego_bytes)

    # Step 6 — Persist attendance record in the database
    record = AttendanceImage(
        user_id=user.id,
        timestamp=now,
        stego_image_path=stego_path,
        encrypted_payload=encrypted_b64,
        key_id=key_id,
        status="present",
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    logger.info("Attendance recorded: user_id=%d, record_id=%d", user.id, record.id)

    return {
        "id": record.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "timestamp": now,
        "stego_image_path": stego_path,
        "status": "present",
        "confidence": round(confidence, 4),
        "key_id": key_id,
    }


async def get_attendance_records(
    db: AsyncSession,
    user_id: int | None = None,
    date_filter: date | None = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Retrieve attendance records with optional filtering."""
    query = (
        select(AttendanceImage, User.full_name)
        .join(User, AttendanceImage.user_id == User.id)
    )
    count_query = select(func.count(AttendanceImage.id))

    if user_id:
        query = query.where(AttendanceImage.user_id == user_id)
        count_query = count_query.where(AttendanceImage.user_id == user_id)

    if date_filter:
        date_cond = _date_range_filter(AttendanceImage.timestamp, date_filter)
        query = query.where(date_cond)
        count_query = count_query.where(date_cond)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(AttendanceImage.timestamp.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    records = [
        {
            "id": att.id,
            "user_id": att.user_id,
            "full_name": full_name,
            "timestamp": att.timestamp,
            "stego_image_path": att.stego_image_path,
            "status": att.status,
            "key_id": att.key_id,
        }
        for att, full_name in rows
    ]

    return {"total": total, "records": records}


async def extract_attendance_data(db: AsyncSession, stego_image_bytes: bytes) -> dict:
    """Extract and decrypt attendance data from a stego-image.
    ONLY uses the currently active key. If the record was encrypted with
    a different key, decryption will fail — proving key integrity."""
    from core.exceptions import EncryptionError

    encrypted_b64 = extract_data_from_image(stego_image_bytes)

    # Only use the active key — if it doesn't match, decryption fails
    try:
        payload = await decrypt_data(db, encrypted_b64)
    except Exception:
        raise EncryptionError(
            "Decryption failed — the active key does not match the key used to encrypt this record. "
            "Switch to the correct key in Security settings to verify this record."
        )

    logger.info("Extracted attendance data for user_id=%s", payload.get("user_id"))
    return payload


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """Aggregate statistics for the dashboard."""
    today = date.today()

    user_count_result = await db.execute(select(func.count(User.id)))
    total_users = user_count_result.scalar()

    course_count_result = await db.execute(select(func.count(Course.id)))
    total_courses = course_count_result.scalar()

    # Use portable date range filter instead of func.date()
    today_count_result = await db.execute(
        select(func.count(AttendanceImage.id)).where(
            _date_range_filter(AttendanceImage.timestamp, today)
        )
    )
    total_today = today_count_result.scalar()

    all_count_result = await db.execute(select(func.count(AttendanceImage.id)))
    total_all = all_count_result.scalar()

    recent_result = await db.execute(
        select(AttendanceImage, User.full_name)
        .join(User, AttendanceImage.user_id == User.id)
        .order_by(AttendanceImage.timestamp.desc())
        .limit(10)
    )
    recent_rows = recent_result.all()
    recent_records = [
        {
            "id": att.id,
            "user_id": att.user_id,
            "full_name": name,
            "timestamp": att.timestamp,
            "stego_image_path": att.stego_image_path,
            "status": att.status,
        }
        for att, name in recent_rows
    ]

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_records_today": total_today,
        "total_records_all": total_all,
        "recent_records": recent_records,
    }

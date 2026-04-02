"""
Security / Encryption Key Management Router
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List

from core.database import get_db
from core.security import get_admin_user
from models.user import User
from models.encryption_key import EncryptionKey
from models.attendance import AttendanceImage
from services.encryption import generate_aes_key_hex

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/security", tags=["Security"])


class KeyCreate(BaseModel):
    name: str


class KeyResponse(BaseModel):
    id: int
    name: str
    key_hex: str
    is_active: bool
    created_at: str
    records_encrypted: int = 0

    model_config = {"from_attributes": True}


@router.post("/keys", response_model=KeyResponse, status_code=201)
async def generate_key(
    body: KeyCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Generate a new AES-256 key and set it as active. Deactivates previous keys."""
    # Deactivate all existing keys
    existing = await db.execute(select(EncryptionKey).where(EncryptionKey.is_active == True))
    for k in existing.scalars().all():
        k.is_active = False

    # Generate and save new key
    key = EncryptionKey(
        name=body.name,
        key_hex=generate_aes_key_hex(),
        is_active=True,
    )
    db.add(key)
    await db.flush()
    await db.refresh(key)

    logger.info("Generated new AES key: %s (id=%d)", key.name, key.id)
    return KeyResponse(
        id=key.id, name=key.name, key_hex=key.key_hex,
        is_active=key.is_active, created_at=str(key.created_at),
        records_encrypted=0,
    )


@router.get("/keys", response_model=List[KeyResponse])
async def list_keys(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List all encryption keys with usage counts."""
    result = await db.execute(
        select(
            EncryptionKey,
            func.count(AttendanceImage.id).label("cnt")
        )
        .outerjoin(AttendanceImage, EncryptionKey.id == AttendanceImage.key_id)
        .group_by(EncryptionKey.id)
        .order_by(EncryptionKey.created_at.desc())
    )
    rows = result.all()

    return [
        KeyResponse(
            id=k.id, name=k.name, key_hex=k.key_hex,
            is_active=k.is_active, created_at=str(k.created_at),
            records_encrypted=cnt,
        )
        for k, cnt in rows
    ]


@router.put("/keys/{key_id}/activate")
async def activate_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Set a key as the active encryption key."""
    # Deactivate all
    existing = await db.execute(select(EncryptionKey).where(EncryptionKey.is_active == True))
    for k in existing.scalars().all():
        k.is_active = False

    # Activate target
    result = await db.execute(select(EncryptionKey).where(EncryptionKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")

    key.is_active = True
    await db.flush()
    return {"message": f"Key '{key.name}' is now active"}


@router.delete("/keys/{key_id}", status_code=204)
async def delete_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Delete a key (only if no records use it)."""
    cnt_result = await db.execute(
        select(func.count(AttendanceImage.id)).where(AttendanceImage.key_id == key_id)
    )
    if cnt_result.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete — records are encrypted with this key")

    result = await db.execute(select(EncryptionKey).where(EncryptionKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")

    await db.delete(key)
    await db.flush()

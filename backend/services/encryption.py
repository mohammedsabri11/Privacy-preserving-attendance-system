"""
AES-256 Encryption Service
===========================
Now uses keys stored in the database. The active key is used for encryption;
any stored key can be used for decryption (matched by key_id on the record).
"""

import base64
import json
import logging
import os
from typing import Any, Dict, Tuple

from Crypto.Cipher import AES
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import EncryptionError

logger = logging.getLogger(__name__)


def generate_aes_key_hex() -> str:
    """Generate a random 32-byte (256-bit) AES key as hex string."""
    return os.urandom(32).hex()


def _encrypt_with_key(key_bytes: bytes, payload: Dict[str, Any]) -> str:
    """Encrypt a dict with a specific AES key. Returns base64 string."""
    try:
        plaintext = json.dumps(payload, default=str).encode("utf-8")
        cipher = AES.new(key_bytes, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext)
        nonce = cipher.nonce
        packed = bytes([len(nonce)]) + nonce + ciphertext + tag
        return base64.b64encode(packed).decode("ascii")
    except Exception as exc:
        logger.exception("Encryption failed")
        raise EncryptionError(f"Encryption failed: {exc}") from exc


def _decrypt_with_key(key_bytes: bytes, encoded: str) -> Dict[str, Any]:
    """Decrypt a base64 string with a specific AES key. Returns dict."""
    try:
        packed = base64.b64decode(encoded)
        nonce_len = packed[0]
        nonce = packed[1:1 + nonce_len]
        tag = packed[-16:]
        ciphertext = packed[1 + nonce_len:-16]
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return json.loads(plaintext.decode("utf-8"))
    except Exception as exc:
        logger.exception("Decryption failed")
        raise EncryptionError(f"Decryption failed: {exc}") from exc


async def get_active_key(db: AsyncSession):
    """Get the currently active encryption key from DB. Returns (key_id, key_bytes)."""
    from models.encryption_key import EncryptionKey
    result = await db.execute(
        select(EncryptionKey).where(EncryptionKey.is_active == True).order_by(EncryptionKey.created_at.desc()).limit(1)
    )
    key = result.scalar_one_or_none()
    if key is None:
        raise EncryptionError("No active encryption key found. Please generate one in Security settings.")
    return key.id, bytes.fromhex(key.key_hex)


async def get_key_by_id(db: AsyncSession, key_id: int):
    """Get a specific key by ID. Returns key_bytes."""
    from models.encryption_key import EncryptionKey
    result = await db.execute(select(EncryptionKey).where(EncryptionKey.id == key_id))
    key = result.scalar_one_or_none()
    if key is None:
        raise EncryptionError(f"Encryption key #{key_id} not found")
    return bytes.fromhex(key.key_hex)


async def encrypt_data(db: AsyncSession, payload: Dict[str, Any]) -> Tuple[str, int]:
    """Encrypt payload with active DB key. Returns (ciphertext_b64, key_id)."""
    key_id, key_bytes = await get_active_key(db)
    encrypted = _encrypt_with_key(key_bytes, payload)
    return encrypted, key_id


async def decrypt_data(db: AsyncSession, encoded: str, key_id: int = None) -> Dict[str, Any]:
    """Decrypt ciphertext. If key_id provided, uses that key; otherwise tries active key."""
    if key_id:
        key_bytes = await get_key_by_id(db, key_id)
    else:
        _, key_bytes = await get_active_key(db)
    return _decrypt_with_key(key_bytes, encoded)


# Keep a simple non-async version for extraction from stego (no DB needed if key_id known)
def decrypt_data_with_key(key_hex: str, encoded: str) -> Dict[str, Any]:
    """Decrypt with an explicit key hex string (used in extraction)."""
    return _decrypt_with_key(bytes.fromhex(key_hex), encoded)

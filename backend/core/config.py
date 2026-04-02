"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe, validated configuration.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the entire application."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────────
    # Use PostgreSQL for production: postgresql+asyncpg://postgres:postgres@localhost:5432/attendance_db
    # Use SQLite for local development/testing:
    DATABASE_URL: str = "sqlite+aiosqlite:///./attendance.db"

    # ── JWT Authentication ────────────────────────────────────
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── AES Encryption (hex-encoded 32-byte key for AES-256) ─
    AES_SECRET_KEY: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

    # ── File Storage ──────────────────────────────────────────
    STEGO_IMAGE_DIR: str = "static/stego_images"

    # ── Face Recognition ──────────────────────────────────────
    FACE_SIMILARITY_THRESHOLD: float = 0.65

    # ── CORS ──────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def aes_key_bytes(self) -> bytes:
        """Return the AES key as raw bytes (decoded from hex)."""
        return bytes.fromhex(self.AES_SECRET_KEY)


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton so env is only read once per process."""
    return Settings()

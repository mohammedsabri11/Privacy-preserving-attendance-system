"""
EncryptionKey ORM model — stores AES-256 keys in the database.
One key is active at a time; old keys are kept for decrypting older records.
"""

from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class EncryptionKey(Base):
    __tablename__ = "encryption_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hex: Mapped[str] = mapped_column(String(64), nullable=False)  # 32 bytes = 64 hex chars
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<EncryptionKey id={self.id} name={self.name!r} active={self.is_active}>"

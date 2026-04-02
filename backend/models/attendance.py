"""
AttendanceImage ORM model — stores attendance records with stego-image metadata.
Each record links a recognized user to a timestamp and the path of the
stego-image that embeds the encrypted attendance payload.
"""

from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class AttendanceImage(Base):
    __tablename__ = "attendance_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    stego_image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    encrypted_payload: Mapped[str] = mapped_column(Text, nullable=False)
    key_id: Mapped[int] = mapped_column(Integer, ForeignKey("encryption_keys.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="present")

    # Relationships
    user = relationship("User", back_populates="attendance_images")

    def __repr__(self) -> str:
        return f"<AttendanceImage id={self.id} user_id={self.user_id} ts={self.timestamp}>"

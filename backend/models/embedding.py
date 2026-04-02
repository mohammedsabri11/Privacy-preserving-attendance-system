"""
Embedding ORM model — stores face embedding vectors as binary (pickled numpy arrays).
"""

from datetime import datetime, timezone
from sqlalchemy import Integer, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Embedding(Base):
    __tablename__ = "embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    embedding_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)  # pickled numpy array
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="embeddings")

    def __repr__(self) -> str:
        return f"<Embedding id={self.id} user_id={self.user_id}>"

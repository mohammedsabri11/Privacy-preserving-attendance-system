"""
Course and CourseEnrollment ORM models.
"""

from datetime import datetime, timezone, time
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, UniqueConstraint, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True, default="")
    instructor: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    start_time: Mapped[time] = mapped_column(Time, nullable=True)
    end_time: Mapped[time] = mapped_column(Time, nullable=True)
    days: Mapped[str] = mapped_column(String(100), nullable=True, default="")  # e.g. "Mon,Wed,Fri"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Course id={self.id} code={self.code!r}>"


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (UniqueConstraint("course_id", "user_id", name="uq_course_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    course = relationship("Course", back_populates="enrollments")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<CourseEnrollment course_id={self.course_id} user_id={self.user_id}>"

"""ORM models — import all models here so Alembic / create_tables sees them."""

from models.user import User  # noqa: F401
from models.embedding import Embedding  # noqa: F401
from models.attendance import AttendanceImage  # noqa: F401
from models.course import Course, CourseEnrollment  # noqa: F401
from models.encryption_key import EncryptionKey  # noqa: F401

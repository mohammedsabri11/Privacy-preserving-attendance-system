"""
Pydantic schemas (request / response DTOs) used across all routers.
Kept in one place for easy import; split into sub-modules if this grows.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── User ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Face Recognition ──────────────────────────────────────────────

class RecognitionResult(BaseModel):
    user_id: int
    full_name: str
    confidence: float
    message: str


# ── Attendance ────────────────────────────────────────────────────

class AttendanceRecord(BaseModel):
    id: int
    user_id: int
    full_name: str
    timestamp: datetime
    stego_image_path: str
    status: str
    key_id: Optional[int] = None

    model_config = {"from_attributes": True}


class AttendanceResponse(BaseModel):
    message: str
    record: AttendanceRecord


class AttendanceListResponse(BaseModel):
    total: int
    records: List[AttendanceRecord]


# ── Steganography / Extraction ────────────────────────────────────

class ExtractedData(BaseModel):
    user_id: int
    full_name: str
    timestamp: str
    status: str
    message: str = "Data successfully extracted and decrypted"


# ── Courses ───────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = ""
    instructor: Optional[str] = ""
    start_time: Optional[str] = None  # "HH:MM"
    end_time: Optional[str] = None    # "HH:MM"
    days: Optional[str] = ""          # "Mon,Wed,Fri"


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None


class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    instructor: Optional[str]
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    days: Optional[str] = None
    created_at: datetime
    enrolled_count: int = 0

    model_config = {"from_attributes": True}


class EnrollmentRequest(BaseModel):
    user_ids: List[int]


class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    user_id: int
    full_name: str
    enrolled_at: datetime

    model_config = {"from_attributes": True}


class CourseListResponse(BaseModel):
    total: int
    courses: List[CourseResponse]


# ── Dashboard ─────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    total_courses: int
    total_records_today: int
    total_records_all: int
    recent_records: List[AttendanceRecord]

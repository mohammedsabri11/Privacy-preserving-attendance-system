"""
Courses Router — CRUD for courses + enrollment management.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import time as time_type

from core.database import get_db
from core.security import get_current_user, get_admin_user
from models.user import User
from models.course import Course, CourseEnrollment


def _parse_time(t: str | None) -> time_type | None:
    """Parse 'HH:MM' string to time object."""
    if not t:
        return None
    parts = t.strip().split(":")
    return time_type(int(parts[0]), int(parts[1]))


def _format_time(t) -> str | None:
    """Format time object to 'HH:MM' string."""
    if t is None:
        return None
    return t.strftime("%H:%M")


def _course_response(c, cnt=0):
    return CourseResponse(
        id=c.id, name=c.name, code=c.code,
        description=c.description, instructor=c.instructor,
        start_time=_format_time(c.start_time),
        end_time=_format_time(c.end_time),
        days=c.days or "",
        created_at=c.created_at, enrolled_count=cnt,
    )
from models.schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    EnrollmentRequest, EnrollmentResponse, CourseListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Courses"])


@router.post("/courses", response_model=CourseResponse, status_code=201)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Create a new course."""
    existing = await db.execute(select(Course).where(Course.code == body.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Course with this code already exists")

    course = Course(
        name=body.name,
        code=body.code,
        description=body.description or "",
        instructor=body.instructor or "",
        start_time=_parse_time(body.start_time),
        end_time=_parse_time(body.end_time),
        days=body.days or "",
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)

    logger.info("Created course: %s (%s)", course.name, course.code)
    return _course_response(course, 0)


@router.get("/courses", response_model=CourseListResponse)
async def list_courses(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List all courses with enrollment counts."""
    result = await db.execute(
        select(
            Course,
            func.count(CourseEnrollment.id).label("enrolled_count")
        )
        .outerjoin(CourseEnrollment, Course.id == CourseEnrollment.course_id)
        .group_by(Course.id)
        .order_by(Course.created_at.desc())
    )
    rows = result.all()

    courses = [_course_response(c, cnt) for c, cnt in rows]

    return CourseListResponse(total=len(courses), courses=courses)


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get a single course by ID."""
    result = await db.execute(
        select(
            Course,
            func.count(CourseEnrollment.id).label("cnt")
        )
        .outerjoin(CourseEnrollment, Course.id == CourseEnrollment.course_id)
        .where(Course.id == course_id)
        .group_by(Course.id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")

    c, cnt = row
    return _course_response(c, cnt)


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    body: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Update a course."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if body.name is not None:
        course.name = body.name
    if body.code is not None:
        # Check uniqueness
        dup = await db.execute(select(Course).where(Course.code == body.code, Course.id != course_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Course code already in use")
        course.code = body.code
    if body.description is not None:
        course.description = body.description
    if body.instructor is not None:
        course.instructor = body.instructor
    if body.start_time is not None:
        course.start_time = _parse_time(body.start_time)
    if body.end_time is not None:
        course.end_time = _parse_time(body.end_time)
    if body.days is not None:
        course.days = body.days

    await db.flush()
    await db.refresh(course)

    cnt_result = await db.execute(
        select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)
    )
    cnt = cnt_result.scalar()

    return _course_response(course, cnt)


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Delete a course and all its enrollments."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await db.delete(course)
    await db.flush()
    logger.info("Deleted course id=%d", course_id)


# ── Enrollment ────────────────────────────────────────────────────

@router.post("/courses/{course_id}/enroll", response_model=List[EnrollmentResponse])
async def enroll_students(
    course_id: int,
    body: EnrollmentRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Enroll one or more students in a course."""
    # Verify course exists
    course = await db.execute(select(Course).where(Course.id == course_id))
    if not course.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Course not found")

    results = []
    for uid in body.user_ids:
        # Verify user exists
        user_result = await db.execute(select(User).where(User.id == uid))
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        # Check if already enrolled
        existing = await db.execute(
            select(CourseEnrollment).where(
                CourseEnrollment.course_id == course_id,
                CourseEnrollment.user_id == uid,
            )
        )
        if existing.scalar_one_or_none():
            continue

        enrollment = CourseEnrollment(course_id=course_id, user_id=uid)
        db.add(enrollment)
        await db.flush()
        await db.refresh(enrollment)

        results.append(EnrollmentResponse(
            id=enrollment.id, course_id=course_id, user_id=uid,
            full_name=user.full_name, enrolled_at=enrollment.enrolled_at,
        ))

    logger.info("Enrolled %d students in course_id=%d", len(results), course_id)
    return results


@router.get("/courses/{course_id}/students", response_model=List[EnrollmentResponse])
async def get_course_students(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Get all students enrolled in a course."""
    result = await db.execute(
        select(CourseEnrollment, User.full_name)
        .join(User, CourseEnrollment.user_id == User.id)
        .where(CourseEnrollment.course_id == course_id)
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    rows = result.all()

    return [
        EnrollmentResponse(
            id=e.id, course_id=e.course_id, user_id=e.user_id,
            full_name=name, enrolled_at=e.enrolled_at,
        )
        for e, name in rows
    ]


@router.delete("/courses/{course_id}/students/{user_id}", status_code=204)
async def unenroll_student(
    course_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_admin_user),
):
    """Remove a student from a course."""
    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == user_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    await db.delete(enrollment)
    await db.flush()

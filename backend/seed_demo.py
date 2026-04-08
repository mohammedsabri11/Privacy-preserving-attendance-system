"""
Demo Seed Script
=================
Populates the system with sample data for screenshots and demos.
Creates students, courses, enrollments, and attendance records with stego-images.

Usage:
  cd backend
  python seed_demo.py
"""

import asyncio
import os
import sys
import io
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timezone, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from core.database import engine, AsyncSessionLocal, Base
from core.security import hash_password
from models.user import User, ROLE_ADMIN, ROLE_STUDENT
from models.course import Course, CourseEnrollment
from models.encryption_key import EncryptionKey
from models.attendance import AttendanceImage
from models.embedding import Embedding
from services.encryption import generate_aes_key_hex, _encrypt_with_key
from services.steganography import embed_data_in_image, save_stego_image
import json
import pickle


def create_face_image(name: str, color: tuple) -> bytes:
    """Create a colored placeholder face image with initials."""
    img = Image.new("RGB", (400, 400), color=(30, 30, 40))
    draw = ImageDraw.Draw(img)

    # Face oval
    draw.ellipse([100, 50, 300, 350], fill=color)

    # Eyes
    draw.ellipse([155, 140, 185, 170], fill=(255, 255, 255))
    draw.ellipse([215, 140, 245, 170], fill=(255, 255, 255))
    draw.ellipse([163, 148, 177, 162], fill=(40, 40, 40))
    draw.ellipse([223, 148, 237, 162], fill=(40, 40, 40))

    # Nose
    draw.polygon([(195, 180), (185, 220), (205, 220)], fill=(color[0] - 20, color[1] - 20, color[2] - 20))

    # Mouth
    draw.arc([165, 230, 235, 270], 0, 180, fill=(180, 80, 80), width=3)

    # Initials text
    initials = "".join(n[0] for n in name.split()[:2]).upper()
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    draw.text((170, 300), initials, fill=(255, 255, 255), font=font)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_carrier_image(name: str, timestamp: str) -> bytes:
    """Create a carrier image that looks like a webcam capture."""
    img = Image.new("RGB", (640, 480), color=(35, 35, 45))
    draw = ImageDraw.Draw(img)

    # Background gradient-like effect
    for y in range(480):
        r = int(25 + (y / 480) * 20)
        g = int(25 + (y / 480) * 15)
        b = int(35 + (y / 480) * 25)
        draw.line([(0, y), (640, y)], fill=(r, g, b))

    # Face area
    cx, cy = 320, 200
    draw.ellipse([cx - 80, cy - 110, cx + 80, cy + 90], fill=(195, 160, 130))
    draw.ellipse([cx - 30, cy - 40, cx - 10, cy - 15], fill=(50, 50, 50))
    draw.ellipse([cx + 10, cy - 40, cx + 30, cy - 15], fill=(50, 50, 50))
    draw.arc([cx - 25, cy + 10, cx + 25, cy + 40], 0, 180, fill=(160, 80, 80), width=2)

    # Overlay text
    try:
        font = ImageFont.truetype("arial.ttf", 16)
        font_sm = ImageFont.truetype("arial.ttf", 12)
    except:
        font = ImageFont.load_default()
        font_sm = font

    draw.text((20, 20), f"ATTENDANCE CAPTURE", fill=(212, 168, 67), font=font)
    draw.text((20, 445), f"{name} | {timestamp}", fill=(150, 150, 150), font=font_sm)
    draw.text((520, 445), "LIVE", fill=(34, 197, 94), font=font_sm)

    # Border
    draw.rectangle([0, 0, 639, 479], outline=(212, 168, 67, 40), width=1)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


async def seed():
    print("=" * 50)
    print("  SEEDING DEMO DATA")
    print("=" * 50)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ── Check if already seeded ──
        from sqlalchemy import select, func
        count = (await db.execute(select(func.count(User.id)))).scalar()
        if count > 2:
            print("Database already has data. Skipping seed.")
            return

        # ── Encryption Key ──
        key_result = await db.execute(select(EncryptionKey).where(EncryptionKey.is_active == True).limit(1))
        key = key_result.scalar_one_or_none()
        if not key:
            key = EncryptionKey(name="Demo Key", key_hex=generate_aes_key_hex(), is_active=True)
            db.add(key)
            await db.flush()
            print(f"  Created encryption key: {key.name}")

        key_bytes = bytes.fromhex(key.key_hex)

        # ── Admin ──
        admin_result = await db.execute(select(User).where(User.role == ROLE_ADMIN).limit(1))
        admin = admin_result.scalar_one_or_none()
        if not admin:
            admin = User(full_name="System Admin", email="admin@attendance.com",
                         hashed_password=hash_password("admin123"), role=ROLE_ADMIN)
            db.add(admin)
            await db.flush()
            print(f"  Created admin: {admin.email}")

        # ── Students ──
        students_data = [
            {"name": "Ahmed Ali", "email": "ahmed@student.com", "color": (195, 160, 130)},
            {"name": "Sara Mohammed", "email": "sara@student.com", "color": (180, 145, 120)},
            {"name": "Omar Hassan", "email": "omar@student.com", "color": (170, 140, 115)},
            {"name": "Fatima Khalid", "email": "fatima@student.com", "color": (185, 150, 125)},
            {"name": "Yusuf Ibrahim", "email": "yusuf@student.com", "color": (175, 145, 118)},
        ]

        student_users = []
        for sd in students_data:
            existing = await db.execute(select(User).where(User.email == sd["email"]))
            if existing.scalar_one_or_none():
                u = (await db.execute(select(User).where(User.email == sd["email"]))).scalar_one()
                student_users.append(u)
                continue

            u = User(full_name=sd["name"], email=sd["email"],
                     hashed_password=hash_password("student123"), role=ROLE_STUDENT)
            db.add(u)
            await db.flush()

            # Create fake embedding (random 512-d vector)
            fake_emb = np.random.randn(512).astype(np.float32)
            emb = Embedding(user_id=u.id, embedding_data=pickle.dumps(fake_emb))
            db.add(emb)
            await db.flush()

            student_users.append(u)
            print(f"  Created student: {sd['name']} ({sd['email']})")

        # ── Courses ──
        courses_data = [
            {"name": "Data Structures & Algorithms", "code": "CS201", "instructor": "Dr. Ahmed",
             "start_time": "08:00", "end_time": "09:30", "days": "Sun,Tue,Thu",
             "description": "Advanced data structures including trees, graphs, and heaps"},
            {"name": "Machine Learning", "code": "CS401", "instructor": "Dr. Sara",
             "start_time": "10:00", "end_time": "11:30", "days": "Mon,Wed",
             "description": "Introduction to supervised and unsupervised learning"},
            {"name": "Database Systems", "code": "CS301", "instructor": "Dr. Ali",
             "start_time": "12:00", "end_time": "13:30", "days": "Sun,Tue,Thu",
             "description": "Relational databases, SQL, normalization, and indexing"},
            {"name": "Computer Networks", "code": "CS302", "instructor": "Dr. Omar",
             "start_time": "14:00", "end_time": "15:30", "days": "Mon,Wed",
             "description": "TCP/IP, routing protocols, and network security"},
        ]

        from datetime import time as time_type
        course_objs = []
        for cd in courses_data:
            existing = await db.execute(select(Course).where(Course.code == cd["code"]))
            if existing.scalar_one_or_none():
                c = (await db.execute(select(Course).where(Course.code == cd["code"]))).scalar_one()
                course_objs.append(c)
                continue

            st = cd["start_time"].split(":")
            et = cd["end_time"].split(":")
            c = Course(name=cd["name"], code=cd["code"], instructor=cd["instructor"],
                       start_time=time_type(int(st[0]), int(st[1])),
                       end_time=time_type(int(et[0]), int(et[1])),
                       days=cd["days"], description=cd["description"])
            db.add(c)
            await db.flush()
            course_objs.append(c)
            print(f"  Created course: {cd['code']} - {cd['name']}")

        # ── Enrollments ──
        enrollments = [
            (0, [0, 1, 2, 3, 4]),  # CS201: all students
            (1, [0, 1, 2]),        # CS401: 3 students
            (2, [0, 2, 3, 4]),     # CS301: 4 students
            (3, [1, 3, 4]),        # CS302: 3 students
        ]

        for ci, sis in enrollments:
            for si in sis:
                existing = await db.execute(
                    select(CourseEnrollment).where(
                        CourseEnrollment.course_id == course_objs[ci].id,
                        CourseEnrollment.user_id == student_users[si].id
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                ce = CourseEnrollment(course_id=course_objs[ci].id, user_id=student_users[si].id)
                db.add(ce)
        await db.flush()
        print("  Created course enrollments")

        # ── Attendance Records with Stego Images ──
        os.makedirs("static/stego_images", exist_ok=True)

        now = datetime.now(timezone.utc)
        records = []
        for day_offset in range(5):  # 5 days of records
            record_date = now - timedelta(days=day_offset)
            for i, student in enumerate(student_users):
                # Not every student every day (skip some for realism)
                if day_offset == 2 and i == 1:
                    continue
                if day_offset == 3 and i in [2, 4]:
                    continue

                ts = record_date.replace(hour=8 + (i % 3), minute=15 + (i * 7) % 45)

                # Create payload
                payload = {
                    "user_id": student.id,
                    "full_name": student.full_name,
                    "email": student.email,
                    "timestamp": ts.isoformat(),
                    "status": "present",
                    "confidence": round(0.85 + (i * 0.03), 4),
                }

                # Encrypt
                encrypted = _encrypt_with_key(key_bytes, payload)

                # Create carrier image and embed
                carrier = create_carrier_image(student.full_name, ts.strftime("%Y-%m-%d %H:%M"))
                stego = embed_data_in_image(carrier, encrypted)
                stego_path = save_stego_image(stego)

                # Save record
                rec = AttendanceImage(
                    user_id=student.id, timestamp=ts,
                    stego_image_path=stego_path,
                    encrypted_payload=encrypted,
                    key_id=key.id, status="present",
                )
                db.add(rec)
                records.append(rec)

        await db.flush()
        print(f"  Created {len(records)} attendance records with stego-images")

        await db.commit()

    print("")
    print("=" * 50)
    print("  DEMO DATA READY!")
    print("=" * 50)
    print("")
    print("  Admin:    admin@attendance.com / admin123")
    print("  Students: ahmed@student.com    / student123")
    print("            sara@student.com     / student123")
    print("            omar@student.com     / student123")
    print("            fatima@student.com   / student123")
    print("            yusuf@student.com    / student123")
    print("")
    print(f"  Courses:  {len(courses_data)}")
    print(f"  Records:  {len(records)} (with stego-images)")
    print("")


if __name__ == "__main__":
    asyncio.run(seed())

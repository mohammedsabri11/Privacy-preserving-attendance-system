"""
Application Entry Point
========================
Creates the FastAPI application, registers routers, middleware,
exception handlers, and startup events.

Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import get_settings
from core.database import create_tables
from core.exceptions import register_exception_handlers
from routers import auth, users, recognition, attendance, extraction, courses, security
from utils.logging_config import setup_logging

# ── Bootstrap logging before anything else ────────────────────────
setup_logging()
logger = logging.getLogger(__name__)
settings = get_settings()

# ── Warn if running with default insecure secrets ─────────────────
if settings.SECRET_KEY == "change-this-to-a-random-secret-key-in-production":
    logger.warning("WARNING: Running with DEFAULT SECRET_KEY -- change this in production!")


# ── Lifespan: runs on startup / shutdown ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create directories, database tables, and preload models on startup."""
    # Ensure static directories exist before StaticFiles checks
    os.makedirs(settings.STEGO_IMAGE_DIR, exist_ok=True)
    os.makedirs("static", exist_ok=True)

    logger.info("Starting up — creating database tables if needed")
    await create_tables()

    from core.database import AsyncSessionLocal
    from models.user import User, ROLE_ADMIN
    from models.encryption_key import EncryptionKey
    from core.security import hash_password
    from services.encryption import generate_aes_key_hex
    from sqlalchemy import select

    # Create default encryption key if none exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(EncryptionKey).limit(1))
        if result.scalar_one_or_none() is None:
            key = EncryptionKey(
                name="Default Key",
                key_hex=generate_aes_key_hex(),
                is_active=True,
            )
            session.add(key)
            await session.commit()
            logger.info("Created default AES-256 encryption key")

    # Create default admin account if none exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.role == ROLE_ADMIN))
        if result.scalar_one_or_none() is None:
            admin = User(
                full_name="System Admin",
                email="admin@attendance.com",
                hashed_password=hash_password("admin123"),
                role=ROLE_ADMIN,
            )
            session.add(admin)
            await session.commit()
            logger.info("Created default admin: admin@attendance.com / admin123")
        else:
            logger.info("Admin account already exists")

    # Preload face recognition models (downloads weights on first run)
    logger.info("Loading face recognition models...")
    try:
        from services.face_recognition import warmup
        warmup()
        logger.info("Face recognition models loaded successfully")
    except Exception as e:
        logger.error("Failed to load face recognition models: %s", e)
        logger.warning("Face recognition will be unavailable until models are loaded")

    logger.info("Application ready")
    yield
    logger.info("Shutting down")


# ── App factory ───────────────────────────────────────────────────
app = FastAPI(
    title="Privacy-Preserving Attendance System",
    description=(
        "Secure attendance management using face recognition, "
        "AES-256-GCM encryption, and LSB steganography."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (stego-images served directly) ──────────────────
# check_dir=False prevents crash if dir doesn't exist yet (created in lifespan)
app.mount("/static", StaticFiles(directory="static", check_dir=False), name="static")

# ── Exception handlers ───────────────────────────────────────────
register_exception_handlers(app)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(recognition.router)
app.include_router(attendance.router)
app.include_router(extraction.router)
app.include_router(courses.router)
app.include_router(security.router)


# ── Health check ─────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}

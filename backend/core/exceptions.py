"""
Custom exception classes and global exception handlers for FastAPI.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception with an HTTP status code."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class FaceNotDetectedError(AppException):
    def __init__(self, detail: str = "No face detected in the uploaded image"):
        super().__init__(status_code=400, detail=detail)


class UserNotRecognizedError(AppException):
    def __init__(self, detail: str = "Face does not match any registered user"):
        super().__init__(status_code=404, detail=detail)


class EncryptionError(AppException):
    def __init__(self, detail: str = "Encryption or decryption failed"):
        super().__init__(status_code=500, detail=detail)


class SteganographyError(AppException):
    def __init__(self, detail: str = "Steganography operation failed"):
        super().__init__(status_code=500, detail=detail)


class DuplicateUserError(AppException):
    def __init__(self, detail: str = "User with this email already exists"):
        super().__init__(status_code=409, detail=detail)


def register_exception_handlers(app: FastAPI):
    """Attach global exception handlers to the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exc: AppException):
        logger.warning("AppException: %s (status=%d)", exc.detail, exc.status_code)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

"""
Centralized logging configuration.
Call `setup_logging()` once at application startup.
"""

import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    """
    Configure the root logger with a consistent format.
    All module loggers inherit from this configuration.
    """
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()
    root.addHandler(handler)

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "PIL", "facenet_pytorch"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

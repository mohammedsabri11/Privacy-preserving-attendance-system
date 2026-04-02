"""
LSB Steganography Service
==========================
Embeds and extracts arbitrary text data inside PNG images by modifying the
Least Significant Bit (LSB) of each colour channel.

Protocol:
  1. First 32 bits encode the payload length (in bits).
  2. Remaining bits are the UTF-8 encoded payload.
  3. Each bit is stored in the LSB of successive R, G, B channel values,
     scanning pixels left-to-right, top-to-bottom.

The carrier image must have enough pixels:
  required_pixels >= (32 + len(data_bits)) / 3
"""

import io
import logging
import os
import uuid
from datetime import datetime, timezone

import numpy as np
from PIL import Image

from core.config import get_settings
from core.exceptions import SteganographyError

logger = logging.getLogger(__name__)
settings = get_settings()


def _text_to_bits(text: str) -> str:
    """Convert a UTF-8 string to a binary string of 0s and 1s."""
    return "".join(format(byte, "08b") for byte in text.encode("utf-8"))


def _bits_to_text(bits: str) -> str:
    """Convert a binary string back to a UTF-8 string."""
    byte_chunks = [bits[i : i + 8] for i in range(0, len(bits), 8)]
    return bytes(int(b, 2) for b in byte_chunks).decode("utf-8")


def embed_data_in_image(
    carrier_image_bytes: bytes,
    data: str,
) -> bytes:
    """
    Embed `data` into the carrier image using LSB steganography.
    Returns the stego-image as PNG bytes.
    """
    try:
        image = Image.open(io.BytesIO(carrier_image_bytes)).convert("RGB")
        pixels = np.array(image, dtype=np.uint8)

        data_bits = _text_to_bits(data)
        data_length = len(data_bits)

        # Encode the length as a 32-bit header
        length_bits = format(data_length, "032b")
        full_bits = length_bits + data_bits

        # Flatten pixel array to a 1-D stream of channel values (R, G, B, R, G, B, …)
        flat = pixels.flatten()

        if len(full_bits) > len(flat):
            raise SteganographyError(
                f"Carrier image too small: need {len(full_bits)} channels, "
                f"image has {len(flat)}"
            )

        # Embed each bit into the LSB of successive channel values
        for i, bit in enumerate(full_bits):
            # Clear LSB, then set it to the data bit
            flat[i] = (flat[i] & 0xFE) | int(bit)

        # Reshape and save
        stego_pixels = flat.reshape(pixels.shape)
        stego_image = Image.fromarray(stego_pixels, "RGB")

        buf = io.BytesIO()
        stego_image.save(buf, format="PNG")
        buf.seek(0)

        logger.info("Embedded %d bits into carrier image", len(full_bits))
        return buf.read()

    except SteganographyError:
        raise
    except Exception as exc:
        logger.exception("Steganography embedding failed")
        raise SteganographyError(f"Embedding failed: {exc}") from exc


def extract_data_from_image(stego_image_bytes: bytes) -> str:
    """
    Extract hidden data from a stego-image produced by `embed_data_in_image`.
    Returns the original plaintext string.
    """
    try:
        image = Image.open(io.BytesIO(stego_image_bytes)).convert("RGB")
        flat = np.array(image, dtype=np.uint8).flatten()

        # Read the 32-bit length header
        length_bits = "".join(str(flat[i] & 1) for i in range(32))
        data_length = int(length_bits, 2)

        if data_length <= 0 or data_length > (len(flat) - 32):
            raise SteganographyError("Invalid or corrupted stego-image header")

        # Read the payload bits
        data_bits = "".join(str(flat[32 + i] & 1) for i in range(data_length))
        text = _bits_to_text(data_bits)

        logger.info("Extracted %d bits from stego-image", data_length)
        return text

    except SteganographyError:
        raise
    except Exception as exc:
        logger.exception("Steganography extraction failed")
        raise SteganographyError(f"Extraction failed: {exc}") from exc


def save_stego_image(stego_bytes: bytes) -> str:
    """
    Persist stego-image to disk and return the relative file path.
    """
    os.makedirs(settings.STEGO_IMAGE_DIR, exist_ok=True)

    filename = f"stego_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.png"
    filepath = os.path.join(settings.STEGO_IMAGE_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(stego_bytes)

    logger.info("Saved stego-image to %s", filepath)
    return filepath

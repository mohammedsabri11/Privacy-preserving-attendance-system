"""
Face Recognition Service
========================
Uses FaceNet (InceptionResnetV1) from facenet-pytorch to:
  1. Detect faces in uploaded images via MTCNN
  2. Extract 512-d embedding vectors
  3. Compare embeddings using cosine similarity

Models are loaded lazily on first use or via warmup().
"""

import io
import logging
import pickle
from typing import Optional, Tuple

import numpy as np
import torch
from PIL import Image
from scipy.spatial.distance import cosine
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import get_settings
from core.exceptions import FaceNotDetectedError, UserNotRecognizedError
from models.embedding import Embedding
from models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Device selection ──────────────────────────────────────────────
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Lazy-loaded model singletons ─────────────────────────────────
_mtcnn = None
_facenet = None


def _load_models():
    """Load MTCNN and FaceNet models. Called once on first use or via warmup()."""
    global _mtcnn, _facenet
    if _mtcnn is not None and _facenet is not None:
        return

    from facenet_pytorch import MTCNN, InceptionResnetV1

    logger.info("Loading face recognition models on device: %s", _device)
    _mtcnn = MTCNN(
        image_size=160,
        margin=20,
        keep_all=False,
        device=_device,
        post_process=True,
    )
    _facenet = InceptionResnetV1(pretrained="vggface2").eval().to(_device)
    logger.info("Face recognition models loaded successfully")


def warmup():
    """Preload models — called during application lifespan startup."""
    _load_models()


# ── Public API ────────────────────────────────────────────────────

def extract_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Detect a face in the raw image bytes and return its 512-d embedding.
    Raises FaceNotDetectedError if no face is found.
    """
    _load_models()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    face_tensor = _mtcnn(image)
    if face_tensor is None:
        raise FaceNotDetectedError()

    face_batch = face_tensor.unsqueeze(0).to(_device)

    with torch.no_grad():
        embedding = _facenet(face_batch)

    return embedding.cpu().numpy().flatten()


def compute_similarity(emb_a: np.ndarray, emb_b: np.ndarray) -> float:
    """Cosine similarity between two embeddings. [0, 1] where 1 = identical."""
    return 1.0 - cosine(emb_a, emb_b)


async def register_face(
    db: AsyncSession,
    user_id: int,
    image_bytes: bytes,
) -> np.ndarray:
    """Extract embedding from image and persist it for the given user."""
    embedding_vec = extract_embedding(image_bytes)

    record = Embedding(
        user_id=user_id,
        embedding_data=pickle.dumps(embedding_vec),
    )
    db.add(record)
    await db.flush()

    logger.info("Registered face embedding for user_id=%d", user_id)
    return embedding_vec


async def recognize_face(
    db: AsyncSession,
    image_bytes: bytes,
) -> Tuple[User, float]:
    """
    Compare the uploaded face against all stored embeddings.
    Returns (matched_user, similarity_score) or raises UserNotRecognizedError.
    """
    query_embedding = extract_embedding(image_bytes)

    result = await db.execute(
        select(Embedding, User).join(User, Embedding.user_id == User.id)
    )
    rows = result.all()

    if not rows:
        raise UserNotRecognizedError("No registered users found in the system")

    best_user: Optional[User] = None
    best_score: float = -1.0

    for emb_record, user in rows:
        stored_vec = pickle.loads(emb_record.embedding_data)
        score = compute_similarity(query_embedding, stored_vec)
        if score > best_score:
            best_score = score
            best_user = user

    threshold = settings.FACE_SIMILARITY_THRESHOLD
    if best_score < threshold:
        raise UserNotRecognizedError(
            f"Best match score {best_score:.3f} is below threshold {threshold}"
        )

    logger.info("Recognized user_id=%d (%s) with score=%.3f", best_user.id, best_user.full_name, best_score)
    return best_user, best_score

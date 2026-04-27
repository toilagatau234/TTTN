"""
app/config.py — Centralized configuration for Rosee AI Service.
All environment-dependent values live here. Edit this file or set env vars.
"""
import os
from pathlib import Path

# ── Base directory (project root = rosee-ai-service/) ──────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ── Model Paths ─────────────────────────────────────────────────────────────
INTENT_MODEL_PATH: str = os.getenv(
    "INTENT_MODEL_PATH",
    str(BASE_DIR / "model_weights" / "phobert-intent-classifier")
)
NER_MODEL_PATH: str = os.getenv(
    "NER_MODEL_PATH",
    str(BASE_DIR / "model_weights" / "phobert-ner-flower")
)

# ── Inference Settings ───────────────────────────────────────────────────────
# Intent confidence below this threshold → forced "Out_Of_Domain"
INTENT_CONFIDENCE_THRESHOLD: float = float(
    os.getenv("INTENT_CONFIDENCE_THRESHOLD", "0.6")
)

# Weight split for unified confidence score:
#   unified = intent_conf * INTENT_WEIGHT + avg_ner_conf * NER_WEIGHT
INTENT_WEIGHT: float = 0.6
NER_WEIGHT: float = 0.4

# ── Server Settings ──────────────────────────────────────────────────────────
HOST: str = os.getenv("AI_HOST", "0.0.0.0")
PORT: int = int(os.getenv("AI_PORT", "8000"))
DEBUG_MODE: bool = os.getenv("DEBUG_MODE", "false").lower() == "true"

# ── CORS Origins (allow Node.js backend) ────────────────────────────────────
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5000"
).split(",")

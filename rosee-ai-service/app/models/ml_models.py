"""
app/models/ml_models.py — Singleton model registry.

Models are loaded ONCE at FastAPI startup via the lifespan context manager
and stored in `ml_models`. All services read from this dict — never reload.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    AutoModelForSequenceClassification,
    pipeline,
)
import logging
from app.config import INTENT_MODEL_PATH, NER_MODEL_PATH

logger = logging.getLogger("rosee.models")

# Global registry — services import this dict directly
ml_models: dict = {}


def _load_intent_model() -> None:
    """Load PhoBERT intent classifier into ml_models['intent']."""
    logger.info("⏳ Loading Iris Intent Classifier (PhoBERT)…")
    try:
        intent_tokenizer = AutoTokenizer.from_pretrained(INTENT_MODEL_PATH)
        intent_model = AutoModelForSequenceClassification.from_pretrained(
            INTENT_MODEL_PATH
        )
        ml_models["intent"] = pipeline(
            "text-classification",
            model=intent_model,
            tokenizer=intent_tokenizer,
        )
        logger.info("✅ Iris Intent Classifier ready.")
    except Exception as exc:
        logger.error(f"⚠️  Intent model failed to load: {exc}")
        ml_models["intent"] = None


def _load_ner_model() -> None:
    """Load PhoBERT NER extractor into ml_models['ner']."""
    logger.info("⏳ Loading Hydrangea NER (PhoBERT)…")
    try:
        ner_tokenizer = AutoTokenizer.from_pretrained(NER_MODEL_PATH)
        ner_model = AutoModelForTokenClassification.from_pretrained(NER_MODEL_PATH)
        ml_models["ner"] = pipeline(
            "token-classification",
            model=ner_model,
            tokenizer=ner_tokenizer,
            aggregation_strategy="simple",  # HuggingFace auto-merges B-/I- spans
        )
        ml_models["ner_available"] = True
        logger.info("✅ Hydrangea NER ready.")
    except Exception as exc:
        logger.error(f"⚠️  NER model failed to load (Iris still works): {exc}")
        ml_models["ner"] = None
        ml_models["ner_available"] = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: load on startup, free on shutdown."""
    _load_intent_model()
    _load_ner_model()
    yield
    ml_models.clear()
    logger.info("🔌 Model resources released.")

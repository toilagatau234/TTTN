"""
app/services/ner_service.py — NER extraction service.

Wraps the PhoBERT token-classification pipeline with:
  - Improved subword merging (▁ artifact cleanup)
  - Multi-value entity collection (e.g. two colors in one sentence)
  - Per-entity confidence scores
  - Structured debug output
"""
import logging
from typing import Optional
from app.models.ml_models import ml_models

logger = logging.getLogger("rosee.ner")

# PhoBERT SentencePiece BPE prefix character
_BPE_PREFIX = "\u2581"  # ▁


def _clean_word(word: str) -> str:
    """Remove BPE ▁ prefix and normalize whitespace."""
    return word.replace(_BPE_PREFIX, " ").replace("  ", " ").strip()


def extract_entities(text: str) -> dict:
    """
    Run NER on `text` and return a richly structured result.

    Returns:
        {
            "entities": dict[str, str],         # label → joined value (Node.js compat)
            "entities_multi": dict[str, list],  # label → list of all spans
            "scores": dict[str, float],         # label → avg confidence
            "avg_confidence": float,            # mean across all entities
            "raw_spans": list[dict],            # full pipeline output
        }

    Raises:
        RuntimeError: if NER model is not loaded
    """
    pipeline = ml_models.get("ner")
    if pipeline is None:
        raise RuntimeError("NER model is not loaded.")

    logger.debug(f"[NER] Input: {text!r}")

    raw_spans = pipeline(text)
    logger.debug(f"[NER] Raw spans: {raw_spans}")

    # Multi-value accumulator: { LABEL: [(word, score), ...] }
    accumulator: dict[str, list[tuple[str, float]]] = {}

    for span in raw_spans:
        label: str = span["entity_group"]
        word: str = _clean_word(span["word"])
        score: float = round(float(span["score"]), 4)

        if not word:  # skip empty artifacts
            continue

        if label not in accumulator:
            accumulator[label] = []
        accumulator[label].append((word, score))

    # Build final structures
    entities: dict[str, str] = {}
    entities_multi: dict[str, list[str]] = {}
    scores: dict[str, float] = {}

    for label, spans in accumulator.items():
        words = [w for w, _ in spans]
        avg_score = round(sum(s for _, s in spans) / len(spans), 4)

        # Join all spans of the same label into one phrase
        entities[label] = " ".join(words)
        entities_multi[label] = words
        scores[label] = avg_score

    # Unified average confidence across all labels
    avg_confidence = (
        round(sum(scores.values()) / len(scores), 4)
        if scores else 0.0
    )

    logger.debug(f"[NER] Entities: {entities}, avg_conf={avg_confidence}")

    return {
        "entities": entities,
        "entities_multi": entities_multi,
        "scores": scores,
        "avg_confidence": avg_confidence,
        "raw_spans": raw_spans,
    }

"""
app/services/intent_service.py — Intent classification service.

Wraps the PhoBERT pipeline call with:
  - confidence thresholding → Out_Of_Domain
  - structured logging
  - typed return value
"""
import logging
from app.models.ml_models import ml_models
from app.config import INTENT_CONFIDENCE_THRESHOLD

logger = logging.getLogger("rosee.intent")


def classify_intent(text: str) -> dict:
    """
    Run intent classification on `text`.

    Returns:
        {
            "intent": str,         # e.g. "CREATE_BOUQUET"
            "confidence": float,   # raw model confidence
            "forced_ood": bool,    # True if confidence was below threshold
        }

    Raises:
        RuntimeError: if intent model is not loaded
    """
    pipeline = ml_models.get("intent")
    if pipeline is None:
        raise RuntimeError("Intent model is not loaded.")

    logger.debug(f"[Intent] Input: {text!r}")

    result = pipeline(text)[0]
    intent = result["label"]
    confidence = round(float(result["score"]), 4)
    forced_ood = False

    if confidence < INTENT_CONFIDENCE_THRESHOLD:
        logger.debug(
            f"[Intent] Low confidence ({confidence:.2%}) → forced Out_Of_Domain"
        )
        intent = "Out_Of_Domain"
        forced_ood = True

    # ── Map raw labels to simplified intents ─────────────────────────────
    # Mapping: 
    #   CREATE_BOUQUET -> CREATE_FLOWER_BASKET
    #   ASK_PRICE_STOCK -> ASK_PRICE
    #   Others -> UNKNOWN
    
    label_map = {
        "CREATE_BOUQUET": "CREATE_FLOWER_BASKET",
        "ASK_PRICE_STOCK": "ASK_PRICE"
    }
    
    intent = label_map.get(intent, "UNKNOWN")
    
    logger.debug(f"[Intent] Final Result: intent={intent}, confidence={confidence}")

    return {
        "intent": intent,
        "confidence": confidence,
        "forced_ood": forced_ood,
    }

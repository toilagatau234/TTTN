"""
app/routes/hydrangea.py — NER extraction and entity processing endpoints.

POST /api/hydrangea/extract   → raw NER output (backward compatible)
POST /api/hydrangea/process   → structured, Node.js-ready ProcessedResponse
"""
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    TextRequest,
    NERResponse,
    ProcessedResponse,
    RawOutput,
)
from app.services.ner_service import extract_entities
from app.services.intent_service import classify_intent
from app.services.entity_processor import process_entities
from app.models.ml_models import ml_models

logger = logging.getLogger("rosee.routes.hydrangea")

router = APIRouter(prefix="/api/hydrangea", tags=["Hydrangea — NER"])


# ── 1. Raw NER (backward-compatible) ─────────────────────────────────────────
@router.post(
    "/extract",
    response_model=NERResponse,
    summary="Raw NER entity extraction",
)
async def extract_raw_entities(request: TextRequest):
    """
    Extract named entities from Vietnamese text using PhoBERT NER.

    Returns raw labels and Vietnamese values as-is.
    Use `/process` for normalized, structured output.
    """
    if not ml_models.get("ner_available", False):
        raise HTTPException(status_code=503, detail="Mô hình NER chưa sẵn sàng.")
    try:
        result = extract_entities(request.text)
        logger.info(
            f"[Hydrangea/extract] entities={result['entities']} "
            f"text={request.text!r:.60}"
        )
        return NERResponse(entities=result["entities"])
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"[Hydrangea/extract] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── 2. Full Processed Output (new — Node.js-ready) ───────────────────────────
@router.post(
    "/process",
    response_model=ProcessedResponse,
    summary="Structured entity extraction (Node.js-ready)",
)
async def process_full(request: TextRequest):
    """
    Full pipeline: NER + Intent + Entity Normalization.

    Returns a structured response with:
    - `data`: normalized fields (flower, qty, color, wrapper, occasion, style, confidence)
    - `raw`: original intent + NER labels for debugging
    - `debug`: verbose intermediate values when `debug=true`

    **This is the primary endpoint for Node.js integration.**
    """
    # ── Step A: Run NER (graceful fallback if model unavailable) ─────────
    ner_result = {
        "entities": {},
        "entities_multi": {},
        "scores": {},
        "avg_confidence": 0.0,
        "raw_spans": [],
    }
    ner_error: str | None = None

    if ml_models.get("ner_available", False):
        try:
            ner_result = extract_entities(request.text)
        except Exception as exc:
            ner_error = str(exc)
            logger.warning(f"[Hydrangea/process] NER failed, using fallback: {exc}")
    else:
        ner_error = "NER model not loaded — keyword fallback active"
        logger.warning("[Hydrangea/process] NER unavailable, keyword fallback active")

    # ── Step B: Run Intent (required) ─────────────────────────────────────
    if not ml_models.get("intent"):
        raise HTTPException(status_code=503, detail="Intent model is not loaded.")

    try:
        intent_result = classify_intent(request.text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # ── Step C: Entity Processing Layer ───────────────────────────────────
    processed = process_entities(
        raw_ner=ner_result["entities"],
        ner_avg_confidence=ner_result["avg_confidence"],
        ner_scores=ner_result["scores"],
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        original_text=request.text,
    )

    logger.info(
        f"[Hydrangea/process] flower={processed.flower}, qty={processed.qty}, "
        f"color={processed.color}, conf={processed.confidence} "
        f"text={request.text!r:.60}"
    )

    # ── Step D: Build Response ────────────────────────────────────────────
    raw = RawOutput(
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        ner=ner_result["entities"],
    )

    debug_info = None
    if request.debug:
        debug_info = {
            "forced_ood": intent_result.get("forced_ood", False),
            "ner_error": ner_error,
            "ner_scores": ner_result["scores"],
            "ner_raw_spans": [
                {
                    "entity_group": s["entity_group"],
                    "word": s["word"],
                    "score": round(float(s["score"]), 4),
                    "start": s.get("start"),
                    "end": s.get("end"),
                }
                for s in ner_result["raw_spans"]
            ],
            "entities_multi": ner_result["entities_multi"],
            "ner_avg_confidence": ner_result["avg_confidence"],
        }

    return ProcessedResponse(
        success=True,
        data=processed,
        raw=raw,
        debug=debug_info,
    )

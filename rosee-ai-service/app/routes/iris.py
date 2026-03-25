"""
app/routes/iris.py — Intent classification endpoint.

POST /api/iris/intent
  → classify_intent service
  → IntentResponse
"""
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import TextRequest, IntentResponse
from app.services.intent_service import classify_intent

logger = logging.getLogger("rosee.routes.iris")

router = APIRouter(prefix="/api/iris", tags=["Iris — Intent"])


@router.post("/intent", response_model=IntentResponse, summary="Classify user intent")
async def analyze_intent(request: TextRequest):
    """
    Analyze Vietnamese text and classify the user's intent.

    - **text**: Vietnamese customer message (required)
    - **debug**: return extra debug info (optional, default false)

    Returns `Out_Of_Domain` automatically if confidence < 60%.
    """
    try:
        result = classify_intent(request.text)
        logger.info(
            f"[Iris] intent={result['intent']} conf={result['confidence']} "
            f"text={request.text!r:.60}"
        )
        return IntentResponse(
            intent=result["intent"],
            confidence=result["confidence"],
            original_text=request.text,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"[Iris] Unexpected error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

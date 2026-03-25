"""
app/models/schemas.py — All Pydantic request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any


# ── Request ──────────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Vietnamese input text")
    debug: bool = Field(False, description="Return extra debug info in response")


# ── Intent ───────────────────────────────────────────────────────────────────
class IntentResponse(BaseModel):
    intent: str
    confidence: float
    original_text: str


# ── Raw NER ──────────────────────────────────────────────────────────────────
class NERResponse(BaseModel):
    entities: Dict[str, str]


# ── Structured / Processed Output ────────────────────────────────────────────
class ProcessedData(BaseModel):
    flower: Optional[str] = None          # e.g. "rose"
    qty: Optional[int] = None             # e.g. 10
    color: Optional[str] = None           # e.g. "red"
    wrapper: Optional[str] = None         # e.g. "kraft"
    occasion: Optional[str] = None        # e.g. "birthday"
    style: Optional[str] = None           # e.g. "royal"
    price_hint: Optional[str] = None      # e.g. "500k" (raw price mention)
    confidence: float = 0.0              # unified confidence score


class RawOutput(BaseModel):
    intent: str
    intent_confidence: float
    ner: Dict[str, str]                  # raw label → raw Vietnamese value


class ProcessedResponse(BaseModel):
    success: bool = True
    data: ProcessedData
    raw: RawOutput
    debug: Optional[Dict[str, Any]] = None   # populated when request.debug=True

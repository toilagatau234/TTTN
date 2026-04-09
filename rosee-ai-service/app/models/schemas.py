"""
app/models/schemas.py — All Pydantic request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List


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
    flower_type: Optional[str] = None    # e.g. "rose" (renamed from flower)
    qty: Optional[int] = None            # e.g. 10
    color: Optional[str] = None          # e.g. "red"
    wrapper: Optional[str] = None        # e.g. "basket"
    occasion: Optional[str] = None       # e.g. "birthday"
    style: Optional[str] = None          # e.g. "luxury"
    layout: Optional[str] = None         # e.g. "round", "heart", "tower"
    price_hint: Optional[str] = None     # e.g. "500k" (raw price mention)
    confidence: float = 0.0             # unified confidence score


class RawOutput(BaseModel):
    intent: str
    intent_confidence: float
    ner: Dict[str, str]                  # raw label → raw Vietnamese value


class ProcessedResponse(BaseModel):
    success: bool = True
    data: ProcessedData
    raw: RawOutput
    debug: Optional[Dict[str, Any]] = None   # populated when request.debug=True


class AnalyzeEntities(BaseModel):
    """Entities được chuẩn hóa, sẵn sàng cho Node.js dùng."""
    category: Optional[str] = None       # e.g. "basket", "bouquet", "box", "stand"
    flower_types: List[str] = []         # e.g. ["rose", "tulip"]
    color: Optional[str] = None          # e.g. "red"
    occasion: Optional[str] = None       # e.g. "birthday"
    style: Optional[str] = None          # e.g. "luxury"
    confidence: Dict[str, float] = {}    # e.g. {"color": 0.9, "flower_types": 0.8}


class AnalyzeResponse(BaseModel):
    """
    Output chuẩn của endpoint /api/hydrangea/analyze.

    Format:
        {
            "intent": "CREATE_BOUQUET",
            "entities": {
                "flower_type": "rose",
                "color": "red",
                "occasion": "birthday",
                "style": "luxury",
                "layout": "round"
            }
        }
    """
    intent: str
    entities: AnalyzeEntities


# ── Image Generation (Bước 8 — Template Composition) ──────────────────────────
class ImageGenerationRequest(BaseModel):
    layout: str = Field("round", description="Layout of the flower basket (round, tall)")
    main_color: str = Field("red", description="Main color of the flowers")
    sub_color: str = Field("white", description="Secondary color of the flowers")
    add_randomness: bool = Field(True, description="Add slight randomization to flower positions")


class ImageGenerationResponse(BaseModel):
    success: bool
    image_base64: str
    layout: str
    main_color: str
    sub_color: str

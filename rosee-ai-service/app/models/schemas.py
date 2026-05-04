"""
app/models/schemas.py — All Pydantic request/response schemas v3.
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
    flower_type: Optional[str] = None
    qty: Optional[int] = None
    color: Optional[str] = None
    wrapper: Optional[str] = None
    occasion: Optional[str] = None
    style: Optional[str] = None
    layout: Optional[str] = None
    price_hint: Optional[str] = None
    confidence: float = 0.0


class RawOutput(BaseModel):
    intent: str
    intent_confidence: float
    ner: Dict[str, str]


class ProcessedResponse(BaseModel):
    success: bool = True
    data: ProcessedData
    raw: RawOutput
    debug: Optional[Dict[str, Any]] = None


# ── Modify Operation ──────────────────────────────────────────────────────────
class ModifyOp(BaseModel):
    """Một lệnh chỉnh sửa trong multi-turn: replace, remove, add."""
    op: str                  # 'replace' | 'remove' | 'add'
    from_: Optional[str] = Field(None, alias="from")
    to: Optional[str] = None

    class Config:
        populate_by_name = True

# ── Structured Flower ────────────────────────────────────────────────────────
class StructuredFlower(BaseModel):
    type: str
    color: Optional[str] = None
    quantity: int = 1

# ── Structured Accessory ─────────────────────────────────────────────────────
class StructuredAccessory(BaseModel):
    type: str
    color: Optional[str] = None

# ── Analyze Entities (Chuẩn v4) ───────────────────────────────────────────────
class AnalyzeEntities(BaseModel):
    """
    Chuẩn output format v4:
    {
      flowers: [ {type, color, quantity} ],
      accessories: [ {type, color} ],
      category: "",
      occasion: "",
      target: "",
      style: "",
      budget: number
    }
    """
    # New v4 fields
    flowers: List[StructuredFlower] = []
    accessories: List[StructuredAccessory] = []
    category: Optional[str] = None
    
    # Common fields
    occasion: Optional[str] = None
    style: Optional[str] = None
    layout: Optional[str] = None
    wrapper: Optional[str] = None
    price_hint: Optional[str] = None
    budget: Optional[int] = None
    target: Optional[str] = None
    
    # Backward compatibility (optional, keeping some for safety)
    flower_types: List[str] = []
    colors: List[str] = []
    structured_flowers: List[StructuredFlower] = []
    role_hint: Dict[str, str] = {}
    modify_ops: List[Dict] = []


class AnalyzeResponse(BaseModel):
    """Output chuẩn của endpoint /api/hydrangea/analyze."""
    intent: str
    entities: AnalyzeEntities
    missing_fields: List[str] = []
    clarification_question: Optional[str] = None


# ── Image Generation ──────────────────────────────────────────────────────────
class ImageGenerationRequest(BaseModel):
    layout: str = Field("round", description="Layout of the flower basket")
    main_color: str = Field("red", description="Main color of the flowers")
    sub_color: str = Field("white", description="Secondary color")
    add_randomness: bool = Field(True, description="Add slight randomization")


class ImageGenerationResponse(BaseModel):
    success: bool
    image_base64: str
    layout: str
    main_color: str
    sub_color: str


# ── Bouquet Output (Final composed result) ────────────────────────────────────
class BouquetItem(BaseModel):
    product_id: str
    name: str
    role: str                 # 'main' | 'secondary' | 'decoration'
    price: float
    image_url: Optional[str] = None
    score: float = 0.0


class BouquetOutput(BaseModel):
    """
    Output cuối của toàn bộ pipeline.
    """
    items: List[BouquetItem]
    roles: Dict[str, List[str]]    # { "main": [id1], "secondary": [id2, id3] }
    total_price: float
    image_url: Optional[str] = None
    explanation: str               # Giải thích tại sao chọn các hoa này
    entities: Optional[Dict] = None

"""
app/services/entity_processor.py — Core business logic layer.

Converts raw NER output + intent into a fully structured, Node.js-ready
response. This is the CRITICAL processing layer that bridges AI output
with your e-commerce backend.

Pipeline:
  raw NER dict
    → normalize entities (Vietnamese → English)
    → extract quantity (NER + regex)
    → apply keyword fallback if NER is sparse
    → compute unified confidence score
    → return ProcessedData
"""
import logging
from typing import Optional
from app.models.schemas import ProcessedData, AnalyzeEntities, AnalyzeResponse
    normalize_flower,
    normalize_color,
    normalize_category,
    normalize_wrapper,
    normalize_occasion,
    normalize_style,
    keyword_scan,
from app.utils.quantity_extractor import extract_quantity
from app.config import INTENT_WEIGHT, NER_WEIGHT

logger = logging.getLogger("rosee.processor")


def _extract_price_hint(text: str, raw_ner: dict) -> Optional[str]:
    """
    Extract raw price mention as a string hint (not normalized to int).
    Node.js can interpret this further (e.g. "500k", "1 triệu").
    """
    import re
    # Match patterns like: 500k, 1 triệu, 2tr, 300.000
    price_patterns = [
        r"\d+(?:[.,]\d+)*\s*(?:triệu|tr|k|nghìn|ngàn|đồng|vnđ|vnd)",
    ]
    for pat in price_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(0).strip()

    # Use NER PRICE label if present
    if "PRICE" in raw_ner:
        return raw_ner["PRICE"]

    return None


def process_entities(
    raw_ner: dict,
    ner_avg_confidence: float,
    ner_scores: dict,
    intent: str,
    intent_confidence: float,
    original_text: str,
) -> ProcessedData:
    """
    Convert raw NER entities → fully structured ProcessedData.

    Args:
        raw_ner:            label→string from ner_service.extract_entities()["entities"]
        ner_avg_confidence: avg NER confidence from ner_service
        ner_scores:         per-label confidence from ner_service
        intent:             classified intent string
        intent_confidence:  intent model confidence score
        original_text:      the raw user input (for fallback + qty extraction)

    Returns:
        ProcessedData schema instance
    """
    logger.debug(f"[Processor] raw_ner={raw_ner}, intent={intent}")

    # ── Step 1: Normalize Each Entity ──────────────────────────────────────
    scanned = keyword_scan(original_text)
    
    # 1a. Category
    category = normalize_category(raw_ner.get("CATEGORY", "")) or scanned.get("category")

    # 1b. Flower Types (Support multiple)
    # Use raw_ner as fallback if keyword_scan is missing
    flower_input = raw_ner.get("FLOWER", "")
    flower_types = []
    if flower_input:
        flower_norm = normalize_flower(flower_input)
        if flower_norm: flower_types = [flower_norm]
    if not flower_types and scanned.get("flower"):
        flower_types = [scanned.get("flower")]

    # 1c. Color & Defaults
    color = normalize_color(raw_ner.get("COLOR", "")) or scanned.get("color")
    
    # Safe Default Color: sunflower -> yellow (only if color is missing)
    if not color and "sunflower" in flower_types:
        color = "yellow"

    # 1d. Others
    occasion = normalize_occasion(raw_ner.get("OCCASION", "")) or scanned.get("occasion")
    style  = normalize_style(raw_ner.get("STYLE", "")) or scanned.get("style")
    wrapper = normalize_wrapper(raw_ner.get("WRAPPER", "")) or scanned.get("wrapper")

    # ── Step 2: Confidence per entity ──
    # Map entity types to NER labels for confidence extraction
    confidence: dict[str, float] = {}
    label_map = {
        "flower_types": "FLOWER",
        "color": "COLOR",
        "occasion": "OCCASION",
        "style": "STYLE",
        "category": "CATEGORY"
    }
    for field, label in label_map.items():
        if ner_scores.get(label):
            confidence[field] = ner_scores[label]
        elif scanned.get(field): # Keyword scan defaults to 0.8 if found but NER missed
            confidence[field] = 0.8

    # ── Step 3: Quantity extraction ──────────────────────────────────────
    qty_raw = raw_ner.get("QTY", "")
    qty: Optional[int] = None
    if qty_raw:
        try:
            qty = int(qty_raw)
        except ValueError:
            qty = extract_quantity(qty_raw)
    if qty is None:
        qty = extract_quantity(original_text)

    # ── Step 4: Price hint ────────────────────────────────────────────────
    price_hint = _extract_price_hint(original_text, raw_ner)

    # ── Step 5: Unified confidence score ─────────────────────────────────
    ner_contribution = ner_avg_confidence if any([flower_types, color, occasion]) else 0.0
    unified_confidence = round(
        intent_confidence * INTENT_WEIGHT + ner_contribution * NER_WEIGHT,
        4
    )

    return ProcessedData(
        flower_type=flower_types[0] if flower_types else None, # Back-compat
        qty=qty,
        color=color,
        wrapper=wrapper,
        occasion=occasion,
        style=style,
        price_hint=price_hint,
        confidence=unified_confidence,
    )


def analyze_entities(
    raw_ner: dict,
    ner_avg_confidence: float,
    intent: str,
    intent_confidence: float,
    original_text: str,
    ner_scores: dict = {}
) -> AnalyzeResponse:
    """
    Trả về định dạng chuẩn yêu cầu của Giai đoạn 2 (Bản tinh chỉnh cuối).
    """
    # Step 1: Keyword scan hỗ trợ bổ sung
    scanned = keyword_scan(original_text)

    # Step 2: Hỗ trợ nhiều loài hoa (Flower Types)
    flower_types = []
    # Mix multiple flowers if found in NER
    flower_raw = raw_ner.get("FLOWER", "")
    if flower_raw:
        # Check if multiple flowers are present (simplified for now)
        flower_norm = normalize_flower(flower_raw)
        if flower_norm: flower_types = [flower_norm]
    
    # Fallback/Append from keyword scan
    if not flower_types and scanned.get("flower"):
        flower_types = [scanned.get("flower")]

    # Step 3: Category
    category = normalize_category(raw_ner.get("CATEGORY", "")) or scanned.get("category")

    # Step 4: Color & Defaults
    color = normalize_color(raw_ner.get("COLOR", "")) or scanned.get("color")
    if not color and "sunflower" in flower_types:
        color = "yellow"

    # Step 5: Others
    occasion = normalize_occasion(raw_ner.get("OCCASION", "")) or scanned.get("occasion")
    style    = normalize_style(raw_ner.get("STYLE", "")) or scanned.get("style")

    # Step 6: Map to Standardized Output (lowercase normalization)
    return AnalyzeResponse(
        intent=intent,
        entities=AnalyzeEntities(
            occasion=occasion.lower() if occasion else None,
            style=style.lower() if style else None,
            color=color.lower() if color else None,
            flowers=[f.lower() for f in flower_types],
            layout=category.lower() if category else None
        ),
    )

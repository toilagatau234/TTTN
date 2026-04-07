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
from app.utils.normalizer import (
    normalize_flower,
    normalize_color,
    normalize_wrapper,
    normalize_occasion,
    normalize_style,
    normalize_layout,
    keyword_scan,
)
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

    # ── Step 1: Normalize each NER entity ───────────────────────────────────
    flower_type = normalize_flower(raw_ner.get("FLOWER", ""))
    color  = normalize_color(raw_ner.get("COLOR", ""))
    occasion = normalize_occasion(raw_ner.get("OCCASION", ""))
    style  = normalize_style(raw_ner.get("STYLE", ""))

    # Wrapper: try STYLE label first (sometimes NER conflates style+wrapper),
    # then do a keyword scan on raw text for packaging words
    wrapper = normalize_wrapper(raw_ner.get("WRAPPER", ""))
    if wrapper is None:
        # Try to detect wrapper from raw text keywords
        wrapper_scan = keyword_scan(original_text).get("wrapper")
        wrapper = wrapper_scan

    # ── Step 2: Quantity extraction ──────────────────────────────────────
    # Prefer explicit NER QTY label (if model later supports it), else regex
    qty_raw = raw_ner.get("QTY", "")
    qty: Optional[int] = None
    if qty_raw:
        try:
            qty = int(qty_raw)
        except ValueError:
            qty = extract_quantity(qty_raw)
    if qty is None:
        qty = extract_quantity(original_text)

    # ── Step 3: Keyword fallback (when NER returns nothing useful) ────────────
    ner_is_sparse = not any([flower_type, color, occasion])
    if ner_is_sparse:
        logger.debug("[Processor] NER sparse → applying keyword fallback")
        scanned = keyword_scan(original_text)
        flower_type = flower_type or scanned.get("flower")
        color       = color       or scanned.get("color")
        occasion    = occasion    or scanned.get("occasion")
        wrapper     = wrapper     or scanned.get("wrapper")
        style       = style       or scanned.get("style")

    # ── Step 3b: Layout extraction (luôn dùng keyword scan vì PhoBERT chưa có nhãn LAYOUT)
    scanned_all = keyword_scan(original_text)
    layout = normalize_layout(raw_ner.get("LAYOUT", "")) or scanned_all.get("layout")

    # ── Step 4: Price hint ────────────────────────────────────────────────
    price_hint = _extract_price_hint(original_text, raw_ner)

    # ── Step 5: Unified confidence score ─────────────────────────────────
    # Formula: confidence = intent_conf * 0.6 + avg_ner_conf * 0.4
    # If NER had nothing, ner contribution = 0 (intent-only confidence)
    ner_contribution = ner_avg_confidence if not ner_is_sparse else 0.0
    unified_confidence = round(
        intent_confidence * INTENT_WEIGHT + ner_contribution * NER_WEIGHT,
        4
    )

    logger.debug(
        f"[Processor] flower_type={flower_type}, color={color}, qty={qty}, "
        f"occasion={occasion}, wrapper={wrapper}, style={style}, layout={layout}, "
        f"confidence={unified_confidence}"
    )

    return ProcessedData(
        flower_type=flower_type,
        qty=qty,
        color=color,
        wrapper=wrapper,
        occasion=occasion,
        style=style,
        layout=layout,
        price_hint=price_hint,
        confidence=unified_confidence,
    )


def analyze_entities(
    raw_ner: dict,
    ner_avg_confidence: float,
    intent: str,
    intent_confidence: float,
    original_text: str,
) -> AnalyzeResponse:
    """
    Trả về format chuẩn của Bước 3, dùng cho /api/hydrangea/analyze.

    Output:
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
    logger.debug(f"[Analyze] raw_ner={raw_ner}, intent={intent}")

    # Normalize từng entity từ NER
    flower_type = normalize_flower(raw_ner.get("FLOWER", ""))
    color       = normalize_color(raw_ner.get("COLOR", ""))
    occasion    = normalize_occasion(raw_ner.get("OCCASION", ""))
    style       = normalize_style(raw_ner.get("STYLE", ""))

    # Layout: luôn tìm qua keyword scan (PhoBERT chưa được train nhãn LAYOUT)
    scanned = keyword_scan(original_text)
    layout = normalize_layout(raw_ner.get("LAYOUT", "")) or scanned.get("layout")

    # Fallback keyword scan nếu NER rỗng
    if not any([flower_type, color, occasion]):
        logger.debug("[Analyze] NER sparse → keyword fallback")
        flower_type = flower_type or scanned.get("flower")
        color       = color       or scanned.get("color")
        occasion    = occasion    or scanned.get("occasion")
        style       = style       or scanned.get("style")

    logger.debug(
        f"[Analyze] flower_type={flower_type}, color={color}, "
        f"occasion={occasion}, style={style}, layout={layout}"
    )

    return AnalyzeResponse(
        intent=intent,
        entities=AnalyzeEntities(
            flower_type=flower_type,
            color=color,
            occasion=occasion,
            style=style,
            layout=layout,
        ),
    )

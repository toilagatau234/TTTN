"""
ai/entity/entity_processor.py — Core business logic layer v3.

Output JSON chuẩn:
{
  flower_types: [],      # tất cả loài hoa detect được
  colors: [],            # tất cả màu sắc
  occasion: "",
  target: "",
  budget: number,
  style: "",
  role_hint: {}          # { "rose": "main", "orchid": "secondary" }
}
"""
import logging
import re
from typing import Optional, List, Dict

from app.models.schemas import ProcessedData, AnalyzeEntities, AnalyzeResponse
from app.utils.normalizer import (
    normalize_flower, normalize_color, normalize_category,
    normalize_wrapper, normalize_occasion, normalize_style,
    keyword_scan, scan_all_flowers, scan_all_colors,
    extract_role_hints, extract_target,
)
from app.utils.quantity_extractor import extract_quantity
from app.config import INTENT_WEIGHT, NER_WEIGHT

logger = logging.getLogger("rosee.processor")


# ── Price helpers ────────────────────────────────────────────────────────────
def _extract_price_hint(text: str, raw_ner: dict) -> Optional[str]:
    """Extract raw price string từ text hoặc NER."""
    price_patterns = [
        r"\d+(?:[.,]\d+)*\s*(?:triệu|tr|k|nghìn|ngàn|đồng|vnđ|vnd)",
    ]
    for pat in price_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    if "PRICE" in raw_ner:
        return raw_ner["PRICE"]
    return None


def _normalize_budget(price_hint: Optional[str]) -> Optional[int]:
    """
    "500k" → 500000, "1 triệu" → 1000000, "300.000" → 300000
    """
    if not price_hint:
        return None
    text = price_hint.lower().strip()
    m = re.search(r"([\d.,]+)\s*(triệu|trieu|tr|nghìn|nghin|k)?", text)
    if not m:
        return None
    num_str = m.group(1).replace(',', '').replace('.', '')
    try:
        num = int(num_str)
    except ValueError:
        return None
    unit = (m.group(2) or '').lower()
    if unit in ('triệu', 'trieu', 'tr'):
        num *= 1_000_000
    elif unit in ('nghìn', 'nghin', 'k'):
        num *= 1_000
    return num


# ── Modify-intent detection helpers ─────────────────────────────────────────
MODIFY_PATTERNS = [
    r"đổi\s+(.+?)\s+(?:thành|sang)\s+(.+?)(?:\s|$)",
    r"thay\s+(.+?)\s+(?:bằng|thành)\s+(.+?)(?:\s|$)",
    r"bỏ\s+(.+?)(?:\s|$)",
    r"thêm\s+(.+?)(?:\s|$)",
]

def detect_modify_ops(text: str) -> List[Dict]:
    """
    Detect modify operations từ text.
    Returns list of { op: 'replace'|'remove'|'add', from: str|None, to: str }
    """
    ops = []
    text_lower = text.lower()
    # Replace explicit: "đổi hoa hồng thành hoa lan"
    for pat in [r"(?:đổi|thay)\s+(.+?)\s+(?:thành|sang|bằng)\s+(.+?)(?:[,.]|$)"]:
        for m in re.finditer(pat, text_lower):
            fr = normalize_flower(m.group(1).strip()) or m.group(1).strip()
            to = normalize_flower(m.group(2).strip()) or m.group(2).strip()
            ops.append({ "op": "replace", "from": fr, "to": to })
    # Replace implicit: "đổi thành hoa lan"
    for pat in [r"(?:đổi|thay)\s+(?:thành|sang|bằng)\s+(.+?)(?:[,.]|$)"]:
        for m in re.finditer(pat, text_lower):
            to = normalize_flower(m.group(1).strip()) or m.group(1).strip()
            ops.append({ "op": "replace_all", "from": None, "to": to })
    # Remove: "bỏ hoa hồng", "xoá gấu bông"
    for m in re.finditer(r"(?:bỏ|xoá|xóa)\s+(.+?)(?:[,.]|$)", text_lower):
        fr = normalize_flower(m.group(1).strip()) or m.group(1).strip()
        ops.append({ "op": "remove", "from": fr, "to": None })
    # Add: "thêm hoa cúc"
    for m in re.finditer(r"thêm\s+(.+?)(?:[,.]|$)", text_lower):
        to = normalize_flower(m.group(1).strip()) or m.group(1).strip()
        ops.append({ "op": "add", "from": None, "to": to })
    return ops


# ── Core analyze function ─────────────────────────────────────────────────────
def analyze_entities(
    raw_ner: dict,
    ner_avg_confidence: float,
    intent: str,
    intent_confidence: float,
    original_text: str,
    ner_scores: dict = {}
) -> AnalyzeResponse:
    """
    Trả về AnalyzeResponse với format chuẩn v3.
    
    Key improvements:
    - scan_all_flowers() — detect nhiều loài hoa
    - scan_all_colors() — detect nhiều màu
    - extract_role_hints() — ROLE_MAIN / ROLE_SECONDARY
    - extract_target() — người nhận
    - detect_modify_ops() — phân tích lệnh chỉnh sửa
    """
    # ── Keyword scan fallback ─────────────────────────────────────────────────
    scanned = keyword_scan(original_text)

    # ── Flower types: TẤT CẢ matches (NER + keyword scan) ───────────────────
    flower_types: List[str] = []

    # Từ NER (có thể có nhiều FLOWER spans — entities_multi đã gộp)
    flower_raw = raw_ner.get("FLOWER", "")
    if flower_raw:
        # NER có thể trả "rose orchid" nếu nhiều span — split và normalize
        for word in flower_raw.split():
            norm = normalize_flower(word)
            if norm and norm not in flower_types:
                flower_types.append(norm)

    # Keyword scan — collect ALL flowers từ text thô
    scanned_flowers = scan_all_flowers(original_text)
    for sf in scanned_flowers:
        if sf not in flower_types:
            flower_types.append(sf)

    # ── Colors: TẤT CẢ matches ───────────────────────────────────────────────
    colors: List[str] = []
    color_raw = raw_ner.get("COLOR", "")
    if color_raw:
        norm_color = normalize_color(color_raw)
        if norm_color:
            colors.append(norm_color)
    scanned_colors = scan_all_colors(original_text)
    for sc_color in scanned_colors:
        if sc_color not in colors:
            colors.append(sc_color)
    # Sunflower color default
    if not colors and "sunflower" in flower_types:
        colors = ["yellow"]

    # ── Others ───────────────────────────────────────────────────────────────
    category = normalize_category(raw_ner.get("CATEGORY", "")) or scanned.get("category")
    wrapper = normalize_wrapper(raw_ner.get("WRAPPER", "")) or scanned.get("wrapper")
    occasion = normalize_occasion(raw_ner.get("OCCASION", "")) or scanned.get("occasion")
    style    = normalize_style(raw_ner.get("STYLE", "")) or scanned.get("style")
    target   = extract_target(original_text, raw_ner)

    # ── Price + Budget ────────────────────────────────────────────────────────
    price_hint = _extract_price_hint(original_text, raw_ner)
    budget = _normalize_budget(price_hint)

    # ── Role hints ────────────────────────────────────────────────────────────
    role_hint = extract_role_hints(original_text, flower_types)

    # ── Modify ops ────────────────────────────────────────────────────────────
    modify_ops = detect_modify_ops(original_text)
    if modify_ops:
        intent = "MODIFY"

    # ── Missing fields & Clarification ────────────────────────────────────────
    missing_fields = []
    if not flower_types:
        missing_fields.append("flower_type")
    if not occasion:
        missing_fields.append("occasion")
    if not category:
        missing_fields.append("category")

    clarification_question = None
    if intent in ("CREATE_BOUQUET", "RECOMMEND") and missing_fields:
        if "flower_type" in missing_fields and "occasion" in missing_fields:
            clarification_question = "Bạn muốn tặng hoa vào dịp gì và bạn có thích loại hoa nào đặc biệt không?"
        elif "flower_type" in missing_fields:
            clarification_question = "Bạn có yêu cầu cụ thể về loại hoa nào (như hoa hồng, hướng dương, tú cầu...) không?"
        elif "occasion" in missing_fields:
            clarification_question = "Bạn tặng hoa này vào dịp gì (sinh nhật, kỷ niệm, 8/3...) để mình tư vấn mẫu phù hợp nhất nhé?"
        elif "category" in missing_fields:
            clarification_question = "Bạn muốn làm dạng bó hoa, giỏ hoa hay hộp hoa nhỉ?"

    return AnalyzeResponse(
        intent=intent,
        entities=AnalyzeEntities(
            occasion=occasion.lower() if occasion else None,
            style=style.lower() if style else None,
            color=colors[0].lower() if colors else None,   # compat field
            colors=[c.lower() for c in colors],
            flowers=flower_types,                          # compat field
            flower_types=flower_types,
            layout=category.lower() if category else None,
            category=category.lower() if category else None,
            wrapper=wrapper.lower() if wrapper else None,
            price_hint=price_hint,
            budget=budget,
            target=target,
            role_hint=role_hint,
            modify_ops=modify_ops,
        ),
        missing_fields=missing_fields,
        clarification_question=clarification_question,
    )


# ── Backward-compat process_entities ─────────────────────────────────────────
def process_entities(
    raw_ner: dict,
    ner_avg_confidence: float,
    ner_scores: dict,
    intent: str,
    intent_confidence: float,
    original_text: str,
) -> ProcessedData:
    scanned = keyword_scan(original_text)
    category = normalize_category(raw_ner.get("CATEGORY", "")) or scanned.get("category")
    flower_input = raw_ner.get("FLOWER", "")
    flower_types = []
    if flower_input:
        norm = normalize_flower(flower_input)
        if norm:
            flower_types = [norm]
    if not flower_types:
        flower_types = scan_all_flowers(original_text)[:1]

    color = normalize_color(raw_ner.get("COLOR", "")) or scanned.get("color")
    if not color and "sunflower" in flower_types:
        color = "yellow"

    occasion = normalize_occasion(raw_ner.get("OCCASION", "")) or scanned.get("occasion")
    style    = normalize_style(raw_ner.get("STYLE", "")) or scanned.get("style")
    wrapper  = normalize_wrapper(raw_ner.get("WRAPPER", "")) or scanned.get("wrapper")

    qty_raw = raw_ner.get("QTY", "")
    qty: Optional[int] = None
    if qty_raw:
        try:
            qty = int(qty_raw)
        except ValueError:
            qty = extract_quantity(qty_raw)
    if qty is None:
        qty = extract_quantity(original_text)

    price_hint = _extract_price_hint(original_text, raw_ner)
    ner_contribution = ner_avg_confidence if any([flower_types, color, occasion]) else 0.0
    unified_confidence = round(intent_confidence * INTENT_WEIGHT + ner_contribution * NER_WEIGHT, 4)

    return ProcessedData(
        flower_type=flower_types[0] if flower_types else None,
        qty=qty,
        color=color,
        wrapper=wrapper,
        occasion=occasion,
        style=style,
        price_hint=price_hint,
        confidence=unified_confidence,
    )

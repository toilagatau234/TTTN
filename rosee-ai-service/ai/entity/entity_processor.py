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

from app.models.schemas import ProcessedData, AnalyzeEntities, AnalyzeResponse, StructuredFlower, StructuredAccessory
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


def extract_accessories(text: str) -> List[Dict]:
    """
    Deprecated. Use group_entities_with_proximity instead.
    """
    pass

def group_entities_with_proximity(text: str, raw_ner: dict):
    from app.utils.normalizer import FLOWER_MAP, COLOR_MAP
    
    text_lower = text.lower()
    intervals = []
    
    def is_overlap(start, end):
        return any(s <= start < e or s < end <= e or (start <= s and end >= e) for s, e in intervals)
        
    nouns = []
    
    # 1. Extract Flowers
    flower_keys = list(FLOWER_MAP.keys())
    if "FLOWER" in raw_ner:
        ner_flowers = [f.strip() for f in raw_ner["FLOWER"].split(",")]
        for f in ner_flowers:
            if f and f.lower() not in flower_keys:
                flower_keys.append(f.lower())
                
    flower_keys.sort(key=len, reverse=True)
    for viet_key in flower_keys:
        eng_val = FLOWER_MAP.get(viet_key, viet_key)
        for m in re.finditer(re.escape(viet_key), text_lower):
            if not is_overlap(m.start(), m.end()):
                intervals.append((m.start(), m.end()))
                nouns.append({
                    "id": len(nouns), "type": "flower", "val": eng_val, "viet": viet_key,
                    "start": m.start(), "end": m.end(), "color": None
                })

    # 2. Extract Accessories
    acc_mapping = {
        "ruy băng": "ribbon", "nơ": "ribbon", "giấy gói": "wrapping",
        "lá trang trí": "decoration_leaf", "lá phụ": "decoration_leaf",
        "thiệp": "card", "gấu bông": "teddy_bear"
    }
    for viet_key, eng_val in sorted(acc_mapping.items(), key=lambda x: -len(x[0])):
        for m in re.finditer(re.escape(viet_key), text_lower):
            if not is_overlap(m.start(), m.end()):
                intervals.append((m.start(), m.end()))
                nouns.append({
                    "id": len(nouns), "type": "accessory", "val": eng_val, "viet": viet_key,
                    "start": m.start(), "end": m.end(), "color": None
                })

    # 3. Extract Colors
    colors_found = []
    for viet_key, eng_val in sorted(COLOR_MAP.items(), key=lambda x: -len(x[0])):
        for m in re.finditer(re.escape(viet_key), text_lower):
            if not is_overlap(m.start(), m.end()):
                intervals.append((m.start(), m.end()))
                colors_found.append({
                    "val": eng_val, "viet": viet_key,
                    "start": m.start(), "end": m.end()
                })

    # 4. Compute Distances and Assign
    def count_words_between(s1, e1, s2, e2):
        if e1 <= s2: return len(text_lower[e1:s2].split())
        elif e2 <= s1: return len(text_lower[e2:s1].split())
        return 0

    pairs = []
    for c_idx, c in enumerate(colors_found):
        for n_idx, n in enumerate(nouns):
            word_dist = count_words_between(n["start"], n["end"], c["start"], c["end"])
            if word_dist <= 3:
                is_after = c["start"] >= n["end"]
                # Score: word_dist ASC, is_after DESC (0 is better), char_dist ASC
                score = (word_dist, 0 if is_after else 1, abs(c["start"] - n["start"]))
                pairs.append({
                    "c_idx": c_idx, "n_idx": n_idx, "score": score,
                    "is_after": is_after, "word_dist": word_dist
                })

    pairs.sort(key=lambda x: x["score"])
    
    assigned_colors = set()
    assigned_nouns = set()
    
    for p in pairs:
        if p["c_idx"] in assigned_colors or p["n_idx"] in assigned_nouns:
            continue
        c = colors_found[p["c_idx"]]
        n = nouns[p["n_idx"]]
        n["color"] = c["val"]
        assigned_colors.add(p["c_idx"])
        assigned_nouns.add(p["n_idx"])
        logger.info(f"[PROXIMITY] {{\n  noun: \"{n['viet']}\",\n  color: \"{c['viet']}\",\n  distance: {p['word_dist']},\n  direction: \"{'after' if p['is_after'] else 'before'}\"\n}}")

    for c_idx, c in enumerate(colors_found):
        if c_idx not in assigned_colors:
            logger.info(f"[PROXIMITY] {{\n  noun: null,\n  color: \"{c['viet']}\",\n  distance: null,\n  direction: null\n}}")

    return nouns


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
    Trả về AnalyzeResponse với format chuẩn v4.
    """
    # ── Keyword scan fallback ─────────────────────────────────────────────────
    scanned = keyword_scan(original_text)

    # ── Flower types ──────────────────────────────────────────────────────────
    flower_types: List[str] = []
    flower_raw = raw_ner.get("FLOWER", "")
    if flower_raw:
        for word in flower_raw.split():
            norm = normalize_flower(word)
            if norm and norm not in flower_types:
                flower_types.append(norm)

    scanned_flowers = scan_all_flowers(original_text)
    for sf in scanned_flowers:
        if sf not in flower_types:
            flower_types.append(sf)

    # ── Colors ────────────────────────────────────────────────────────────────
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
    
    if not colors and "sunflower" in flower_types:
        colors = ["yellow"]

    # ── Structured Grouping (v4) ──────────────────────────────────────────────
    grouped_nouns = group_entities_with_proximity(original_text, raw_ner)
    
    qty = extract_quantity(original_text) or 1
    flowers_list = []
    accessories = []
    unique_flower_types = []
    colors = []
    
    for n in grouped_nouns:
        if n["type"] == "flower":
            # first flower gets the total qty, others 1
            q = qty if len(flowers_list) == 0 else 1
            flowers_list.append(StructuredFlower(type=n["val"], color=n["color"], quantity=q))
            if n["val"] not in unique_flower_types:
                unique_flower_types.append(n["val"])
        elif n["type"] == "accessory":
            accessories.append(StructuredAccessory(type=n["val"], color=n["color"]))
            
        if n["color"] and n["color"] not in colors:
            colors.append(n["color"])
            
    # Fallback to general colors if nothing got mapped via proximity
    if not colors:
        scanned_colors = scan_all_colors(original_text)
        for sc_color in scanned_colors:
            if sc_color not in colors:
                colors.append(sc_color)
        if not colors and "sunflower" in unique_flower_types:
            colors = ["yellow"]

    # ── Others ────────────────────────────────────────────────────────────────
    category = normalize_category(raw_ner.get("CATEGORY", "")) or scanned.get("category")
    wrapper = normalize_wrapper(raw_ner.get("WRAPPER", "")) or scanned.get("wrapper")
    occasion = normalize_occasion(raw_ner.get("OCCASION", "")) or scanned.get("occasion")
    style    = normalize_style(raw_ner.get("STYLE", "")) or scanned.get("style")
    target   = extract_target(original_text, raw_ner)

    # ── Price + Budget ────────────────────────────────────────────────────────
    price_hint = _extract_price_hint(original_text, raw_ner)
    budget = _normalize_budget(price_hint)

    # ── Role hints ────────────────────────────────────────────────────────────
    role_hint = extract_role_hints(original_text, unique_flower_types)

    # ── Modify ops ────────────────────────────────────────────────────────────
    modify_ops = detect_modify_ops(original_text)
    if modify_ops:
        intent = "MODIFY"

    # ── Missing fields & Clarification ────────────────────────────────────────
    missing_fields = []
    if not flowers_list:
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
            clarification_question = "Bạn có yêu cầu cụ thể về loại hoa nào không?"
        elif "occasion" in missing_fields:
            clarification_question = "Bạn tặng hoa này vào dịp gì để mình tư vấn mẫu phù hợp nhất nhé?"
        elif "category" in missing_fields:
            clarification_question = "Bạn muốn làm dạng bó hoa, giỏ hoa hay lẵng hoa?"

    logger.info(f"[analyze_entities] flowers: {flowers_list}, accessories: {accessories}")

    return AnalyzeResponse(
        intent=intent,
        entities=AnalyzeEntities(
            flowers=flowers_list,
            accessories=accessories,
            category=category.lower() if category else None,
            occasion=occasion.lower() if occasion else None,
            style=style.lower() if style else None,
            layout=category.lower() if category else None,
            wrapper=wrapper.lower() if wrapper else None,
            price_hint=price_hint,
            budget=budget,
            target=target,
            role_hint=role_hint,
            modify_ops=modify_ops,
            # Backward compatibility
            flower_types=unique_flower_types,
            colors=colors,
            structured_flowers=flowers_list
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

"""
app/utils/normalizer.py — Vietnamese → English normalization dictionaries + role extraction.

Changes v2:
- keyword_scan() trả về TẤT CẢ matches (không dừng ở first), dùng để detect nhiều loài hoa
- Thêm TARGET_MAP
- Thêm extract_role_hints() — detect ROLE_MAIN / ROLE_SECONDARY từ context
"""
import re
from difflib import get_close_matches
from typing import Optional, List, Dict
import unicodedata


# ── Normalizer helpers ───────────────────────────────────────────────────────
def _normalize_key(text: str) -> str:
    return text.lower().strip()


def _fuzzy_lookup(value: str, mapping: dict, cutoff: float = 0.85) -> Optional[str]:
    key = _normalize_key(value)
    if key in mapping:
        return mapping[key]
        
    # Check substring match but only if the key is reasonably long 
    # and strictly bounded to avoid matching "hoa" to "hoa hồng"
    if len(key) >= 4:
        for map_key, map_val in mapping.items():
            if (map_key in key and len(map_key) >= 4) or (key in map_key and len(key) >= 4):
                # Ensure it's a significant match, not just 'hoa' in 'hoa hồng'
                return map_val
                
    candidates = get_close_matches(key, mapping.keys(), n=1, cutoff=cutoff)
    if candidates:
        return mapping[candidates[0]]
    return None


# ── Flower Map ───────────────────────────────────────────────────────────────
FLOWER_MAP: dict = {
    "hoa hồng": "hoa hồng", "hồng": "hoa hồng", "hoa hong": "hoa hồng", "hong": "hoa hồng",
    "hoa tulip": "tulip", "tulip": "tulip", "tu líp": "tulip",
    "lan hồ điệp": "lan hồ điệp", "hồ điệp": "lan hồ điệp", "lan ho diep": "lan hồ điệp", "lẵng lan": "lan hồ điệp", "hoa lan": "lan hồ điệp", "lan": "lan hồ điệp",
    "hoa cúc": "hoa cúc", "cúc": "hoa cúc", "cúc vạn thọ": "cúc vạn thọ",
    "tú cầu": "cẩm tú cầu", "cẩm tú cầu": "cẩm tú cầu", "hoa cẩm tú cầu": "cẩm tú cầu", "hortensie": "cẩm tú cầu",
    "cát tường": "cát tường", "lisianthus": "cát tường",
    "baby": "hoa baby", "hoa baby": "hoa baby", "hoa phấn": "hoa baby", "baby breath": "hoa baby", "baby's breath": "hoa baby",
    "hướng dương": "hướng dương", "hoa hướng dương": "hướng dương", "hướng": "hướng dương",
    "cẩm chướng": "cẩm chướng", "hoa cẩm chướng": "cẩm chướng",
    "hoa ly": "hoa ly", "ly": "hoa ly", "lily": "hoa ly",
    "đồng tiền": "đồng tiền", "hoa đồng tiền": "đồng tiền",
    "hoa mix": "hoa mix", "mix": "hoa mix",
    "sen": "hoa sen", "hoa sen": "hoa sen",
    "huệ": "hoa huệ", "hoa huệ": "hoa huệ",
    "thủy tiên": "thủy tiên", "hoa thủy tiên": "thủy tiên",
}

# ── Color Map ────────────────────────────────────────────────────────────────
COLOR_MAP: dict = {
    "đỏ": "đỏ", "do": "đỏ", "đỏ tươi": "đỏ tươi", "đỏ trầm": "đỏ trầm",
    "hồng": "hồng", "hồng phấn": "hồng phấn", "hồng đậm": "hồng đậm", "hồng pastel": "hồng",
    "trắng": "trắng", "trang": "trắng",
    "vàng": "vàng", "vàng kem": "vàng kem", "vàng chanh": "vàng chanh",
    "cam": "cam",
    "tím": "tím", "tím lavender": "tím lavender", "tím hoa cà": "tím hoa cà",
    "xanh": "xanh", "xanh dương": "xanh dương", "xanh lá": "xanh lá",
    "xanh mint": "xanh mint", "xanh bơ": "xanh bơ",
    "be": "be", "be/kem": "be", "kem": "kem",
    "nâu": "nâu", "đen": "đen",
    "trầm": "tone trầm", "pastel": "pastel", "nhạt": "nhạt", "đậm": "đậm",
    "nude": "nude",
}

# ── Category Map ─────────────────────────────────────────────────────────────
CATEGORY_MAP: dict = {
    "giỏ": "giỏ", "lẵng": "giỏ", "giỏ hoa": "giỏ", "lẵng hoa": "giỏ",
    "bó": "bó", "bó hoa": "bó",
    "hộp": "hộp", "hộp hoa": "hộp",
    "kệ": "kệ", "kệ hoa": "kệ",
}

# ── Wrapper Map ──────────────────────────────────────────────────────────────
WRAPPER_MAP: dict = {
    "giấy kraft": "giấy kraft", "kraft": "giấy kraft", "giấy": "giấy",
    "túi": "túi", "túi vải": "túi vải", "nơ": "nơ", "có nơ": "nơ", "ruy băng": "ruy băng",
    "vải": "vải", "vải tuyn": "vải tuyn", "đơn giản": "gói đơn giản", "sang trọng": "gói sang trọng",
}

# ── Occasion Map ─────────────────────────────────────────────────────────────
OCCASION_MAP: dict = {
    "sinh nhật": "sinh nhật", "sn": "sinh nhật", "sinh nhat": "sinh nhật", "tặng sinh nhật": "sinh nhật",
    "kỷ niệm": "kỷ niệm", "ky niem": "kỷ niệm", "ngày kỷ niệm": "kỷ niệm",
    "khai trương": "khai trương", "khai truong": "khai trương",
    "tốt nghiệp": "tốt nghiệp", "tot nghiep": "tốt nghiệp",
    "valentine": "valentine",
    "8/3": "quốc tế phụ nữ", "8 3": "quốc tế phụ nữ", "mùng 8": "quốc tế phụ nữ",
    "20/10": "phụ nữ việt nam", "20/11": "ngày nhà giáo",
    "ngày của mẹ": "ngày của mẹ", "tặng mẹ": "sinh nhật", "cho mẹ": "sinh nhật",
    "tang le": "chia buồn", "tang lễ": "chia buồn", "chia buồn": "chia buồn",
    "chúc mừng": "chúc mừng", "chuc mung": "chúc mừng",
    "ốm": "thăm bệnh", "thăm bệnh": "thăm bệnh", "ra viện": "thăm bệnh",
    "cưới": "đám cưới", "dam cuoi": "đám cưới", "hôn lễ": "đám cưới",
}

# ── Target Map (người nhận) ──────────────────────────────────────────────────
TARGET_MAP: dict = {
    "mẹ": "mẹ", "má": "mẹ", "ba": "ba", "bố": "ba",
    "bạn gái": "bạn gái", "bạn trai": "bạn trai",
    "vợ": "vợ", "chồng": "chồng",
    "người yêu": "người yêu", "bạn bè": "bạn bè", "ban be": "bạn bè",
    "sếp": "sếp", "đồng nghiệp": "đồng nghiệp",
    "thầy": "thầy giáo", "cô giáo": "cô giáo", "thầy giáo": "thầy giáo",
    "bé": "bé", "con": "con", "anh": "anh", "chị": "chị",
    "ông": "ông", "bà": "bà",
}

# ── Style Map ────────────────────────────────────────────────────────────────
STYLE_MAP: dict = {
    "hoàng gia": "sang trọng", "sang trọng": "sang trọng", "tối giản": "tối giản",
    "đơn giản": "đơn giản", "vintage": "vintage", "cổ điển": "cổ điển",
    "hiện đại": "hiện đại", "bohemian": "bohemian", "rustic": "rustic",
    "tinh tế": "tinh tế", "thanh lịch": "thanh lịch", "elegant": "thanh lịch",
    "kawaii": "dễ thương", "dễ thương": "dễ thương", "mộng mơ": "mộng mơ", "cá tính": "cá tính",
    "vui tươi": "dễ thương", "nhiều màu": "nhiều màu", "colorful": "nhiều màu",
}

# ── Layout Map ───────────────────────────────────────────────────────────────
LAYOUT_MAP: dict = {
    "tròn": "tròn", "hình tròn": "tròn", "oval": "oval",
    "vuông": "vuông", "chữ nhật": "chữ nhật",
    "trái tim": "trái tim", "hình trái tim": "trái tim", "tim": "trái tim",
    "ngôi sao": "ngôi sao", "tháp": "tháp", "thác": "thác",
    "thẳng đứng": "thẳng đứng", "nằm ngang": "nằm ngang",
    "dày": "dày", "thưa": "thưa",
}

# ── Role hint keywords (ROLE_MAIN / ROLE_SECONDARY) ──────────────────────────
ROLE_MAIN_KEYWORDS = [
    "chủ đạo", "chính", "main", "nổi bật", "highlight", "featured",
    "trung tâm", "chủ yếu", "chú trọng",
]
ROLE_SECONDARY_KEYWORDS = [
    "phụ", "mix", "kết hợp", "bổ sung", "thêm", "điểm xuyến",
    "tô điểm", "xen kẽ", "secondary", "hỗ trợ",
]


# ── Public API ────────────────────────────────────────────────────────────────
def normalize_category(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, CATEGORY_MAP)

def normalize_flower(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, FLOWER_MAP)

def normalize_color(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, COLOR_MAP)

def normalize_wrapper(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, WRAPPER_MAP)

def normalize_occasion(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, OCCASION_MAP)

def normalize_style(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, STYLE_MAP)

def normalize_layout(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, LAYOUT_MAP)

def normalize_target(value: str) -> Optional[str]:
    return _fuzzy_lookup(value, TARGET_MAP)


def scan_all_flowers(text: str) -> List[str]:
    """
    Scan text và collect TẤT CẢ loài hoa tìm thấy (không dừng ở first).
    Returns list of normalized English flower names.
    """
    text_lower = text.lower()
    found = []
    seen = set()
    # Sort by key length desc để match "hoa hướng dương" trước "hướng"
    for viet_key, eng_val in sorted(FLOWER_MAP.items(), key=lambda x: -len(x[0])):
        if viet_key in text_lower and eng_val not in seen:
            found.append(eng_val)
            seen.add(eng_val)
            text_lower = text_lower.replace(viet_key, " ")
    return found


def scan_all_colors(text: str) -> List[str]:
    """Collect tất cả màu sắc được đề cập."""
    text_lower = text.lower()
    found = []
    seen = set()
    for viet_key, eng_val in sorted(COLOR_MAP.items(), key=lambda x: -len(x[0])):
        if viet_key in text_lower and eng_val not in seen:
            found.append(eng_val)
            seen.add(eng_val)
            text_lower = text_lower.replace(viet_key, " ")
    return found


def extract_role_hints(text: str, flower_types: List[str]) -> Dict[str, str]:
    """
    Extract ROLE_MAIN / ROLE_SECONDARY từ context.
    
    Ví dụ:
      "hoa hồng chủ đạo, mix thêm hoa cúc"
      → { "rose": "main", "chrysanthemum": "secondary" }
    
    Algorithm:
      1. Tìm keyword ROLE_MAIN/ROLE_SECONDARY
      2. Tìm loài hoa gần nhất trước/sau keyword đó (window ±20 tokens)
      3. Map loài hoa → role
    """
    if not flower_types:
        return {}

    text_lower = text.lower()
    role_hints: Dict[str, str] = {}

    # Detect main role keywords
    for kw in ROLE_MAIN_KEYWORDS:
        idx = text_lower.find(kw)
        if idx == -1:
            continue
        # Tìm loài hoa gần nhất (±50 chars window)
        window = text_lower[max(0, idx - 50): idx + 50]
        for viet_key, eng_val in sorted(FLOWER_MAP.items(), key=lambda x: -len(x[0])):
            if viet_key in window:
                role_hints[eng_val] = "main"
                break

    # Detect secondary role keywords
    for kw in ROLE_SECONDARY_KEYWORDS:
        idx = text_lower.find(kw)
        if idx == -1:
            continue
        window = text_lower[max(0, idx - 50): idx + 50]
        for viet_key, eng_val in sorted(FLOWER_MAP.items(), key=lambda x: -len(x[0])):
            if viet_key in window and role_hints.get(eng_val) != "main":
                role_hints[eng_val] = "secondary"
                break

    # Nếu không detect được gì nhưng có > 1 flower → flower[0] = main, rest = secondary
    if not role_hints and len(flower_types) > 1:
        role_hints[flower_types[0]] = "main"
        for f in flower_types[1:]:
            role_hints[f] = "secondary"

    return role_hints


def extract_target(text: str, raw_ner: dict) -> Optional[str]:
    """Extract người nhận từ text."""
    # Từ NER
    if raw_ner.get("TARGET"):
        return normalize_target(raw_ner["TARGET"])
    # Keyword scan
    text_lower = text.lower()
    for viet_key, eng_val in sorted(TARGET_MAP.items(), key=lambda x: -len(x[0])):
        if viet_key in text_lower:
            return eng_val
    return None


def keyword_scan(text: str) -> dict:
    """
    Backward-compat fallback (single-value per category).
    Trả về first-match per category.
    """
    text_lower = text.lower()
    result: dict = {}
    for mapping, key_name in [
        (CATEGORY_MAP, "category"),
        (COLOR_MAP, "color"),
        (OCCASION_MAP, "occasion"),
        (WRAPPER_MAP, "wrapper"),
        (STYLE_MAP, "style"),
        (LAYOUT_MAP, "layout"),
        (TARGET_MAP, "target"),
    ]:
        for viet_key, eng_val in sorted(mapping.items(), key=lambda x: -len(x[0])):
            if viet_key in text_lower:
                result[key_name] = eng_val
                break
    # Flower: take first match for backward compat
    flowers = scan_all_flowers(text)
    if flowers:
        result["flower"] = flowers[0]
    return result

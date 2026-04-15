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


def _fuzzy_lookup(value: str, mapping: dict, cutoff: float = 0.6) -> Optional[str]:
    key = _normalize_key(value)
    if key in mapping:
        return mapping[key]
    for map_key, map_val in mapping.items():
        if map_key in key or key in map_key:
            return map_val
    candidates = get_close_matches(key, mapping.keys(), n=1, cutoff=cutoff)
    if candidates:
        return mapping[candidates[0]]
    return None


# ── Flower Map ───────────────────────────────────────────────────────────────
FLOWER_MAP: dict = {
    "hoa hồng": "rose", "hồng": "rose", "hoa hong": "rose", "hong": "rose",
    "hoa tulip": "tulip", "tulip": "tulip", "tu líp": "tulip",
    "lan hồ điệp": "orchid", "hồ điệp": "orchid", "lan ho diep": "orchid", "lẵng lan": "orchid", "hoa lan": "orchid", "lan": "orchid",
    "hoa cúc": "chrysanthemum", "cúc": "chrysanthemum", "cúc vạn thọ": "marigold",
    "tú cầu": "hydrangea", "hortensie": "hydrangea",
    "cát tường": "eustoma", "lisianthus": "eustoma",
    "baby": "baby's breath", "hoa baby": "baby's breath", "hoa phấn": "baby's breath",
    "hướng dương": "sunflower", "hoa hướng dương": "sunflower",
    "cẩm chướng": "carnation", "hoa cẩm chướng": "carnation",
    "hoa ly": "lily", "ly": "lily", "lily": "lily",
    "đồng tiền": "gerbera", "hoa đồng tiền": "gerbera",
    "hoa mix": "mixed flowers", "mix": "mixed flowers",
    "sen": "lotus", "hoa sen": "lotus",
    "huệ": "tuberose", "hoa huệ": "tuberose",
    "thủy tiên": "narcissus", "hoa thủy tiên": "narcissus",
    "hướng": "sunflower",  # viết tắt
}

# ── Color Map ────────────────────────────────────────────────────────────────
COLOR_MAP: dict = {
    "đỏ": "red", "do": "red", "đỏ tươi": "bright red", "đỏ trầm": "deep red",
    "hồng": "pink", "hồng phấn": "light pink", "hồng đậm": "hot pink", "hồng pastel": "pink",
    "trắng": "white", "trang": "white",
    "vàng": "yellow", "vàng kem": "cream", "vàng chanh": "lemon yellow",
    "cam": "orange",
    "tím": "purple", "tím lavender": "lavender", "tím hoa cà": "violet",
    "xanh": "blue", "xanh dương": "blue", "xanh lá": "green",
    "xanh mint": "mint", "xanh bơ": "avocado green",
    "be": "beige", "be/kem": "beige", "kem": "cream",
    "nâu": "brown", "đen": "black",
    "trầm": "deep tone", "pastel": "pastel", "nhạt": "light", "đậm": "dark",
    "nude": "nude",
}

# ── Category Map ─────────────────────────────────────────────────────────────
CATEGORY_MAP: dict = {
    "giỏ": "basket", "lẵng": "basket", "giỏ hoa": "basket", "lẵng hoa": "basket",
    "bó": "bouquet", "bó hoa": "bouquet",
    "hộp": "box", "hộp hoa": "box",
    "kệ": "stand", "kệ hoa": "stand",
}

# ── Wrapper Map ──────────────────────────────────────────────────────────────
WRAPPER_MAP: dict = {
    "giấy kraft": "kraft paper", "kraft": "kraft paper", "giấy": "paper",
    "túi": "bag", "túi vải": "fabric bag", "nơ": "ribbon", "có nơ": "ribbon",
    "vải": "fabric", "vải tuyn": "tulle", "đơn giản": "simple wrap", "sang trọng": "luxury wrap",
}

# ── Occasion Map ─────────────────────────────────────────────────────────────
OCCASION_MAP: dict = {
    "sinh nhật": "birthday", "sn": "birthday", "sinh nhat": "birthday", "tặng sinh nhật": "birthday",
    "kỷ niệm": "anniversary", "ky niem": "anniversary", "ngày kỷ niệm": "anniversary",
    "khai trương": "opening", "khai truong": "opening",
    "tốt nghiệp": "graduation", "tot nghiep": "graduation",
    "valentine": "valentine",
    "8/3": "women's day", "8 3": "women's day", "mùng 8": "women's day",
    "20/10": "vietnamese women's day", "20/11": "teachers' day",
    "ngày của mẹ": "mother's day", "tặng mẹ": "birthday", "cho mẹ": "birthday",
    "tang le": "condolence", "tang lễ": "condolence", "chia buồn": "condolence",
    "chúc mừng": "congratulations", "chuc mung": "congratulations",
    "ốm": "get well", "thăm bệnh": "get well", "ra viện": "get well",
    "cưới": "wedding", "dam cuoi": "wedding", "hôn lễ": "wedding",
}

# ── Target Map (người nhận) ──────────────────────────────────────────────────
TARGET_MAP: dict = {
    "mẹ": "mother", "má": "mother", "ba": "father", "bố": "father",
    "bạn gái": "girlfriend", "bạn trai": "boyfriend",
    "vợ": "wife", "chồng": "husband",
    "người yêu": "partner", "bạn bè": "friend", "ban be": "friend",
    "sếp": "boss", "đồng nghiệp": "colleague",
    "thầy": "teacher", "cô giáo": "teacher", "thầy giáo": "teacher",
    "bé": "child", "con": "child", "anh": "sibling", "chị": "sibling",
    "ông": "grandparent", "bà": "grandparent",
}

# ── Style Map ────────────────────────────────────────────────────────────────
STYLE_MAP: dict = {
    "hoàng gia": "luxury", "sang trọng": "luxury", "tối giản": "luxury",
    "đơn giản": "simple", "vintage": "vintage", "cổ điển": "classic",
    "hiện đại": "modern", "bohemian": "bohemian", "rustic": "rustic",
    "tinh tế": "elegant", "thanh lịch": "elegant", "elegant": "elegant",
    "kawaii": "cute", "dễ thương": "cute", "mộng mơ": "dreamy", "cá tính": "bold",
    "vui tươi": "cute", "nhiều màu": "cute", "colorful": "cute",
}

# ── Layout Map ───────────────────────────────────────────────────────────────
LAYOUT_MAP: dict = {
    "tròn": "round", "hình tròn": "round", "oval": "oval",
    "vuông": "square", "chữ nhật": "rectangular",
    "trái tim": "heart", "hình trái tim": "heart", "tim": "heart",
    "ngôi sao": "star", "tháp": "tower", "thác": "cascade",
    "thẳng đứng": "vertical", "nằm ngang": "horizontal",
    "dày": "dense", "thưa": "sparse",
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

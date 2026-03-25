"""
app/utils/normalizer.py — Vietnamese → English normalization dictionaries.

All keys are lowercase, accent-normalized Vietnamese strings.
Fuzzy matching via difflib for robustness against typos/slang.
"""
from difflib import get_close_matches
from typing import Optional
import unicodedata


# ── Normalizer helpers ───────────────────────────────────────────────────────
def _normalize_key(text: str) -> str:
    """Lowercase + strip. Keys in maps are already in this form."""
    return text.lower().strip()


def _fuzzy_lookup(value: str, mapping: dict[str, str], cutoff: float = 0.6) -> Optional[str]:
    """
    Try exact match first, then fuzzy match against mapping keys.
    Returns None if no match found above cutoff.
    """
    key = _normalize_key(value)
    if key in mapping:
        return mapping[key]
    # Try loose substring match first (faster than difflib for short texts)
    for map_key, map_val in mapping.items():
        if map_key in key or key in map_key:
            return map_val
    # Fall back to difflib fuzzy match
    candidates = get_close_matches(key, mapping.keys(), n=1, cutoff=cutoff)
    if candidates:
        return mapping[candidates[0]]
    return None


# ── Flower Map ───────────────────────────────────────────────────────────────
# Vietnamese name (incl. common variants/slang) → English product name
FLOWER_MAP: dict[str, str] = {
    # Hoa hồng
    "hoa hồng": "rose",
    "hồng": "rose",
    "hoa hong": "rose",
    "hong": "rose",
    "bó hoa hồng": "rose",
    # Tulip
    "hoa tulip": "tulip",
    "tulip": "tulip",
    "tu líp": "tulip",
    # Lan hồ điệp
    "lan hồ điệp": "phalaenopsis orchid",
    "hồ điệp": "phalaenopsis orchid",
    "lan ho diep": "phalaenopsis orchid",
    "lẵng lan": "phalaenopsis orchid",
    # Cúc
    "hoa cúc": "chrysanthemum",
    "cúc": "chrysanthemum",
    "cúc vạn thọ": "marigold",
    # Tú cầu
    "tú cầu": "hydrangea",
    "hortensie": "hydrangea",
    # Cát tường
    "cát tường": "eustoma",
    "lisianthus": "eustoma",
    # Baby
    "baby": "baby's breath",
    "hoa baby": "baby's breath",
    "hoa phấn": "baby's breath",
    # Hướng dương
    "hướng dương": "sunflower",
    "hoa hướng dương": "sunflower",
    # Cẩm chướng
    "cẩm chướng": "carnation",
    "hoa cẩm chướng": "carnation",
    # Ly
    "hoa ly": "lily",
    "ly": "lily",
    "lily": "lily",
    # Đồng tiền
    "đồng tiền": "gerbera",
    "hoa đồng tiền": "gerbera",
    # Mix / tổng hợp
    "hoa mix": "mixed flowers",
    "mix": "mixed flowers",
    "bó hoa mix": "mixed flowers",
}

# ── Color Map ────────────────────────────────────────────────────────────────
COLOR_MAP: dict[str, str] = {
    "đỏ": "red",
    "do": "red",
    "đỏ tươi": "bright red",
    "đỏ trầm": "deep red",
    "hồng": "pink",
    "hồng phấn": "light pink",
    "hồng đậm": "hot pink",
    "trắng": "white",
    "trang": "white",
    "vàng": "yellow",
    "vàng kem": "cream",
    "vàng chanh": "lemon yellow",
    "cam": "orange",
    "tím": "purple",
    "tím lavender": "lavender",
    "tím hoa cà": "violet",
    "xanh": "blue",
    "xanh dương": "blue",
    "xanh lá": "green",
    "xanh mint": "mint",
    "xanh bơ": "avocado green",
    "be": "beige",
    "be/kem": "beige",
    "nâu": "brown",
    "đen": "black",
    "trầm": "deep tone",
    "pastel": "pastel",
    "nhạt": "light",
    "đậm": "dark",
}

# ── Wrapper / Packaging Map ──────────────────────────────────────────────────
WRAPPER_MAP: dict[str, str] = {
    "giấy kraft": "kraft paper",
    "kraft": "kraft paper",
    "giấy": "paper",
    "hộp": "box",
    "hộp carton": "cardboard box",
    "giỏ": "basket",
    "lẵng": "basket",
    "túi": "bag",
    "túi vải": "fabric bag",
    "nơ": "ribbon",
    "có nơ": "ribbon",
    "vải": "fabric",
    "vải tuyn": "tulle",
    "đơn giản": "simple wrap",
    "sang trọng": "luxury wrap",
    "bó": "bouquet",
    "bó hoa": "bouquet",
}

# ── Occasion Map ─────────────────────────────────────────────────────────────
OCCASION_MAP: dict[str, str] = {
    "sinh nhật": "birthday",
    "sn": "birthday",
    "sinh nhat": "birthday",
    "tặng sinh nhật": "birthday",
    "kỷ niệm": "anniversary",
    "ky niem": "anniversary",
    "ngày kỷ niệm": "anniversary",
    "khai trương": "opening",
    "khai truong": "opening",
    "tốt nghiệp": "graduation",
    "tot nghiep": "graduation",
    "valentine": "valentine",
    "8/3": "women's day",
    "20/10": "vietnamese women's day",
    "20/11": "teachers' day",
    "ngày của mẹ": "mother's day",
    "tặng mẹ": "for mother",
    "cho mẹ": "for mother",
    "mẹ": "for mother",
    "tặng bạn gái": "for girlfriend",
    "bạn gái": "for girlfriend",
    "tặng vợ": "for wife",
    "vợ": "for wife",
    "tang le": "condolence",
    "tang lễ": "condolence",
    "chia buồn": "condolence",
    "chúc mừng": "congratulations",
    "chuc mung": "congratulations",
    "ốm": "get well",
    "thăm bệnh": "get well",
    "ra viện": "get well",
}

# ── Style Map ────────────────────────────────────────────────────────────────
STYLE_MAP: dict[str, str] = {
    "hoàng gia": "royal",
    "sang trọng": "luxury",
    "tối giản": "minimalist",
    "đơn giản": "simple",
    "vintage": "vintage",
    "cổ điển": "classic",
    "hiện đại": "modern",
    "bohemian": "bohemian",
    "rustic": "rustic",
    "tinh tế": "elegant",
    "thanh lịch": "elegant",
    "kawaii": "cute",
    "dễ thương": "cute",
    "mộng mơ": "dreamy",
    "cá tính": "bold",
}


# ── Public API ────────────────────────────────────────────────────────────────
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


def keyword_scan(text: str) -> dict:
    """
    Fallback: scan raw text directly against all map keys.
    Returns a partial dict with whatever was found.
    Used when NER fails or returns empty.
    """
    text_lower = text.lower()
    result: dict = {}

    # Try each map in priority order
    for map_name, mapping, key_name in [
        ("flower", FLOWER_MAP, "flower"),
        ("color", COLOR_MAP, "color"),
        ("occasion", OCCASION_MAP, "occasion"),
        ("wrapper", WRAPPER_MAP, "wrapper"),
        ("style", STYLE_MAP, "style"),
    ]:
        for viet_key, eng_val in mapping.items():
            if viet_key in text_lower:
                result[key_name] = eng_val
                break  # Take first match per category

    return result

"""
app/utils/quantity_extractor.py — Vietnamese quantity extraction.

Combines regex (digit patterns) and word-to-number mapping to extract
flower/item quantities from raw Vietnamese text.

Examples:
  "10 bông hoa hồng"     → 10
  "một bó tulip"         → 1
  "hai chục cành"        → 20
  "một tá"               → 12
  "năm mươi bông"        → 50
"""
import re
from typing import Optional

# ── Word-to-number table ─────────────────────────────────────────────────────
# Keys: Vietnamese number words (lowercase). Values: integer.
ONES: dict[str, int] = {
    "không": 0, "một": 1, "hai": 2, "ba": 3, "bốn": 4,
    "năm": 5, "sáu": 6, "bảy": 7, "tám": 8, "chín": 9,
    "mười": 10, "mươi": 10,
    # colloquial
    "một nửa": 1,  # treat as 1 unit
}

TENS: dict[str, int] = {
    "mười": 10,
    "hai mươi": 20,
    "ba mươi": 30,
    "bốn mươi": 40,
    "năm mươi": 50,
    "sáu mươi": 60,
    "bảy mươi": 70,
    "tám mươi": 80,
    "chín mươi": 90,
}

SPECIAL: dict[str, int] = {
    "một chục": 10,
    "hai chục": 20,
    "ba chục": 30,
    "một tá": 12,
    "hai tá": 24,
    "nửa tá": 6,
    "một trăm": 100,
    "hai trăm": 200,
}

# Flower-related unit words that follow a number
UNIT_WORDS = r"(?:bông|bó|cành|giỏ|lẵng|hộp|cái|đóa|chùm|phần|set|bộ)"


# ── Regex patterns (ordered by priority) ────────────────────────────────────
# Pattern 1: Arabic digits followed by unit word
_DIGIT_UNIT = re.compile(
    rf"(\d+)\s*{UNIT_WORDS}",
    re.IGNORECASE | re.UNICODE,
)

# Pattern 2: Arabic digits alone near the beginning of quantity context
_DIGIT_BARE = re.compile(r"\b(\d{1,4})\b")

# Pattern 3: Vietnamese word numbers + unit
_WORD_NUM_PATTERNS: list[tuple[re.Pattern, int]] = []
for phrase, val in {**SPECIAL, **TENS, **ONES}.items():
    pat = re.compile(
        rf"\b{re.escape(phrase)}\b\s*{UNIT_WORDS}?",
        re.IGNORECASE | re.UNICODE,
    )
    _WORD_NUM_PATTERNS.append((pat, val))


def _word_to_number(text: str) -> Optional[int]:
    """
    Try to convert Vietnamese number words inside `text` to an integer.
    Checks special phrases (e.g. 'một tá') first, then tens, then ones.
    """
    text_lower = text.lower()

    # Check compound / special phrases first (longest match wins)
    for phrase in sorted(SPECIAL.keys(), key=len, reverse=True):
        if phrase in text_lower:
            return SPECIAL[phrase]

    # Try tens phrases  ("hai mươi", etc.)
    for phrase in sorted(TENS.keys(), key=len, reverse=True):
        if phrase in text_lower:
            base = TENS[phrase]
            # Check for "hai mươi mốt", "hai mươi lăm" etc.
            remainder_match = re.search(
                rf"{re.escape(phrase)}\s+(mốt|lăm|{"|".join(ONES.keys())})",
                text_lower,
            )
            if remainder_match:
                rem_word = remainder_match.group(1)
                rem_word = "một" if rem_word == "mốt" else ("năm" if rem_word == "lăm" else rem_word)
                return base + ONES.get(rem_word, 0)
            return base

    # Try single-digit ones
    for phrase, val in ONES.items():
        if re.search(rf"\b{re.escape(phrase)}\b", text_lower):
            return val

    return None


def extract_quantity(text: str) -> Optional[int]:
    """
    Main API: extract a quantity integer from Vietnamese text.

    Priority:
      1. Arabic digit + unit word  (e.g. "10 bông")
      2. Vietnamese word + unit    (e.g. "hai chục cành")
      3. Arduino digit bare        (e.g. "chọn 5") — only if plausible range
      4. Returns None if nothing found
    """
    # Priority 1: digit + unit
    match = _DIGIT_UNIT.search(text)
    if match:
        qty = int(match.group(1))
        if 1 <= qty <= 9999:
            return qty

    # Priority 2: Vietnamese word number
    qty = _word_to_number(text)
    if qty is not None and qty > 0:
        return qty

    # Priority 3: bare digit (only if small and plausible for flowers)
    match = _DIGIT_BARE.search(text)
    if match:
        qty = int(match.group(1))
        if 1 <= qty <= 500:  # sanity guard
            return qty

    return None

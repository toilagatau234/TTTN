"""
rosee-ai-service/app/services/image_pipeline.py
Background-removal + resize pipeline dùng rembg.

Pipeline:
    URL hoặc bytes → rembg.remove() → PIL resize → PNG bytes
    Không dùng Cloudinary background_removal (free plan không hỗ trợ).
"""
import io
import logging
import hashlib
import os
from pathlib import Path
from typing import Optional, Tuple

import requests
from PIL import Image

logger = logging.getLogger("rosee.image_pipeline")

# ── Cache directory (local file cache) ─────────────────────────────────────
CACHE_DIR = Path(__file__).parent.parent.parent / "data" / "img_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ── Size map theo loại sản phẩm ─────────────────────────────────────────────
SIZE_MAP = {
    "flower": (200, 200),
    "basket": (300, 200),
    "decoration": (150, 150),
    "ribbon": (150, 150),
    "default": (200, 200),
}

# ── Lazy import rembg (optional dependency) ─────────────────────────────────
_REMBG_AVAILABLE = False
try:
    from rembg import remove as rembg_remove
    _REMBG_AVAILABLE = True
    logger.info("[ImagePipeline] rembg available ✓")
except ImportError:
    logger.warning("[ImagePipeline] rembg not installed — bg removal disabled. Install: pip install rembg")


def _cache_key(url: str, product_type: str) -> str:
    """Generate stable cache key from URL + type."""
    digest = hashlib.md5(f"{url}:{product_type}".encode()).hexdigest()
    return digest


def _load_cached(cache_key: str) -> Optional[bytes]:
    """Return cached PNG bytes or None."""
    cache_file = CACHE_DIR / f"{cache_key}.png"
    if cache_file.exists():
        logger.debug(f"[ImagePipeline] Cache hit: {cache_key}")
        return cache_file.read_bytes()
    return None


def _save_cache(cache_key: str, data: bytes) -> None:
    cache_file = CACHE_DIR / f"{cache_key}.png"
    cache_file.write_bytes(data)
    logger.debug(f"[ImagePipeline] Cached: {cache_key}")


def download_image(url: str, timeout: int = 15) -> bytes:
    """Download image from URL, return raw bytes."""
    resp = requests.get(url, timeout=timeout, headers={"User-Agent": "RoseeBot/1.0"})
    resp.raise_for_status()
    return resp.content


def remove_background(img_bytes: bytes) -> bytes:
    """
    Remove background from image bytes using rembg.
    Falls back to original if rembg unavailable.
    Returns PNG bytes with transparency.
    """
    if not _REMBG_AVAILABLE:
        logger.warning("[ImagePipeline] rembg not available, returning original image")
        # Convert to PNG with alpha channel if possible
        img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    result = rembg_remove(img_bytes)
    return result


def resize_image(img_bytes: bytes, size: Tuple[int, int], crop_mode: str = "fit") -> bytes:
    """
    Resize image to target size, maintaining transparency.
    crop_mode: 'fit' (preserve aspect) or 'fill' (crop to fill)
    """
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    w, h = size

    if crop_mode == "fit":
        img.thumbnail((w, h), Image.LANCZOS)
        # Pad to exact size with transparent background
        padded = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        paste_x = (w - img.width) // 2
        paste_y = (h - img.height) // 2
        padded.paste(img, (paste_x, paste_y), img)
        img = padded
    else:
        img = img.resize((w, h), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def process_product_image(
    image_url: str,
    product_type: str = "flower",
    use_cache: bool = True
) -> bytes:
    """
    Full pipeline: download → remove bg → resize → return PNG bytes.

    Args:
        image_url:    Cloudinary or any public URL
        product_type: 'flower' | 'basket' | 'decoration' | 'ribbon'
        use_cache:    Check/write local disk cache

    Returns:
        PNG bytes (transparent background, resized)
    """
    key = _cache_key(image_url, product_type)

    # 1. Cache check
    if use_cache:
        cached = _load_cached(key)
        if cached:
            return cached

    # 2. Download
    logger.info(f"[ImagePipeline] Downloading: {image_url}")
    raw_bytes = download_image(image_url)

    # 3. Remove background
    logger.info(f"[ImagePipeline] Removing background ({product_type})")
    no_bg = remove_background(raw_bytes)

    # 4. Resize
    target_size = SIZE_MAP.get(product_type, SIZE_MAP["default"])
    logger.info(f"[ImagePipeline] Resizing to {target_size}")
    final_bytes = resize_image(no_bg, target_size)

    # 5. Cache write
    if use_cache:
        _save_cache(key, final_bytes)

    return final_bytes


def process_product_image_to_base64(
    image_url: str,
    product_type: str = "flower",
    use_cache: bool = True
) -> str:
    """Same as process_product_image but returns base64 string."""
    import base64
    img_bytes = process_product_image(image_url, product_type, use_cache)
    return base64.b64encode(img_bytes).decode("utf-8")

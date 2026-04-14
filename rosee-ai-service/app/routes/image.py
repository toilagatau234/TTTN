"""
app/routes/image.py — Image processing endpoints.

POST /api/image/remove-bg     → Remove bg + resize 1 ảnh từ URL
POST /api/image/batch         → Batch process nhiều ảnh
GET  /api/image/cache-stats   → Thống kê cache
"""
import logging
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

logger = logging.getLogger("rosee.routes.image")
router = APIRouter(prefix="/api/image", tags=["Image Processing"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class RemoveBgRequest(BaseModel):
    image_url: str = Field(..., description="Public URL of the product image")
    product_type: str = Field("flower", description="flower | basket | decoration | ribbon")
    use_cache: bool = Field(True, description="Use local disk cache")


class RemoveBgResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    product_type: str
    image_url: str
    cached: bool = False
    error: Optional[str] = None


class BatchRequest(BaseModel):
    items: List[RemoveBgRequest]


class BatchResponse(BaseModel):
    success: bool
    results: List[RemoveBgResponse]
    processed: int
    failed: int


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/remove-bg", response_model=RemoveBgResponse)
async def remove_background(request: RemoveBgRequest):
    """
    Remove background từ ảnh URL, resize theo product_type, trả về base64 PNG.
    
    - flower: 200x200
    - basket: 300x200
    - decoration: 150x150
    """
    try:
        from app.services.image_pipeline import process_product_image, CACHE_DIR, _cache_key

        # Check cache first (fast path)
        key = _cache_key(request.image_url, request.product_type)
        from pathlib import Path
        cache_file = CACHE_DIR / f"{key}.png"
        was_cached = cache_file.exists()

        img_bytes = process_product_image(
            image_url=request.image_url,
            product_type=request.product_type,
            use_cache=request.use_cache
        )

        b64 = base64.b64encode(img_bytes).decode("utf-8")

        logger.info(f"[RemoveBg] OK — type={request.product_type}, cached={was_cached}")
        return RemoveBgResponse(
            success=True,
            image_base64=b64,
            product_type=request.product_type,
            image_url=request.image_url,
            cached=was_cached
        )

    except Exception as exc:
        logger.error(f"[RemoveBg] Error: {exc}", exc_info=True)
        return RemoveBgResponse(
            success=False,
            product_type=request.product_type,
            image_url=request.image_url,
            error=str(exc)
        )


@router.post("/batch", response_model=BatchResponse)
async def batch_remove_bg(request: BatchRequest):
    """Batch process multiple images. Runs sequentially."""
    results = []
    processed = 0
    failed = 0

    for item in request.items:
        try:
            from app.services.image_pipeline import process_product_image, CACHE_DIR, _cache_key
            key = _cache_key(item.image_url, item.product_type)
            from pathlib import Path
            was_cached = (CACHE_DIR / f"{key}.png").exists()

            img_bytes = process_product_image(
                image_url=item.image_url,
                product_type=item.product_type,
                use_cache=item.use_cache
            )
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            results.append(RemoveBgResponse(
                success=True,
                image_base64=b64,
                product_type=item.product_type,
                image_url=item.image_url,
                cached=was_cached
            ))
            processed += 1
        except Exception as exc:
            logger.error(f"[Batch] Failed: {item.image_url} — {exc}")
            results.append(RemoveBgResponse(
                success=False,
                product_type=item.product_type,
                image_url=item.image_url,
                error=str(exc)
            ))
            failed += 1

    return BatchResponse(success=True, results=results, processed=processed, failed=failed)


@router.get("/cache-stats")
async def cache_stats():
    """Trả về thống kê cache directory."""
    try:
        from app.services.image_pipeline import CACHE_DIR
        files = list(CACHE_DIR.glob("*.png"))
        total_size = sum(f.stat().st_size for f in files)
        return {
            "cache_dir": str(CACHE_DIR),
            "file_count": len(files),
            "total_size_mb": round(total_size / 1024 / 1024, 2)
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/cache")
async def clear_cache():
    """Xóa toàn bộ local cache."""
    try:
        from app.services.image_pipeline import CACHE_DIR
        files = list(CACHE_DIR.glob("*.png"))
        for f in files:
            f.unlink()
        return {"success": True, "deleted": len(files)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

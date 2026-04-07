"""
app/routes/hydrangea.py — NER extraction and entity processing endpoints.

POST /api/hydrangea/extract   → raw NER output (backward compatible)
POST /api/hydrangea/process   → structured, Node.js-ready ProcessedResponse
"""
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    TextRequest,
    NERResponse,
    ProcessedResponse,
    RawOutput,
    AnalyzeResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
)
from ai.pipeline import run_ai_pipeline, run_processed_pipeline
from ai.entity.ner_service import extract_entities
from app.services.image_composer import compose_flower_basket, image_to_base64
from app.models.ml_models import ml_models

logger = logging.getLogger("rosee.routes.hydrangea")

router = APIRouter(prefix="/api/hydrangea", tags=["Hydrangea — NER"])


# ── 1. Raw NER (backward-compatible) ─────────────────────────────────────────
@router.post(
    "/extract",
    response_model=NERResponse,
    summary="Raw NER entity extraction",
)
async def extract_raw_entities(request: TextRequest):
    """
    Extract named entities from Vietnamese text using PhoBERT NER.

    Returns raw labels and Vietnamese values as-is.
    Use `/process` for normalized, structured output.
    """
    if not ml_models.get("ner_available", False):
        raise HTTPException(status_code=503, detail="Mô hình NER chưa sẵn sàng.")
    try:
        result = extract_entities(request.text)
        logger.info(
            f"[Hydrangea/extract] entities={result['entities']} "
            f"text={request.text!r:.60}"
        )
        return NERResponse(entities=result["entities"])
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"[Hydrangea/extract] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── 2. Full Processed Output (new — Node.js-ready) ───────────────────────────
@router.post(
    "/process",
    response_model=ProcessedResponse,
    summary="Structured entity extraction (Node.js-ready)",
)
async def process_full(request: TextRequest):
    """
    Full pipeline: NER + Intent + Entity Normalization.

    Returns a structured response with:
    - `data`: normalized fields (flower, qty, color, wrapper, occasion, style, confidence)
    - `raw`: original intent + NER labels for debugging
    - `debug`: verbose intermediate values when `debug=true`

    **This is the primary endpoint for Node.js integration.**
    """
    try:
        return run_processed_pipeline(request.text, debug=request.debug)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"[Hydrangea/process] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── 3. Analyze — Format chuẩn Bước 3 ────────────────────────────────────────────
@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="[Bước 3] Phân tích intent + entities theo format chuẩn",
)
async def analyze_text(request: TextRequest):
    """
    Pipeline đầy đủ: Intent + NER + Chuẩn hóa.

    Trả về format chuẩn được dùng cho Node.js matching + image generation:
    ```json
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
    ```

    **Đây là endpoint chính cho Node.js từ Bước 3 trở đi.**
    """
    try:
        return run_ai_pipeline(request.text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.error(f"[Analyze] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── 4. Image Generation (Bước 8) ──────────────────────────────────────────────
@router.post(
    "/generate-image",
    response_model=ImageGenerationResponse,
    summary="[Bước 8] Tạo ảnh giỏ hoa từ template",
)
async def generate_image_composition(request: ImageGenerationRequest):
    """
    Tạo ảnh giỏ hoa từ template (Pillow) dựa trên layout và màu sắc.
    """
    try:
        # Gọi composer service
        img = compose_flower_basket(
            layout_type=request.layout,
            main_color=request.main_color,
            sub_color=request.sub_color,
            add_randomness=request.add_randomness
        )
        
        # Chuyển sang base64
        base64_str = image_to_base64(img)
        
        logger.info(
            f"[GenerateImage] success=True, layout={request.layout}, "
            f"main={request.main_color}, sub={request.sub_color}"
        )
        
        return ImageGenerationResponse(
            success=True,
            image_base64=base64_str,
            layout=request.layout,
            main_color=request.main_color,
            sub_color=request.sub_color
        )
    except Exception as exc:
        logger.error(f"[GenerateImage] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

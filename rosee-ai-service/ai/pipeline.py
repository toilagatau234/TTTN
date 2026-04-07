"""
ai/pipeline.py — Bộ điều phối trung tâm (Nhạc trưởng) của AI Service.

Nhiệm vụ:
- Tiếp nhận text đầu và chạy qua toàn bộ pipeline (Intent -> NER -> Processor).
- Trả về dữ liệu đã được chuẩn hóa, sẵn sàng cho Node.js backend.
"""
import logging
from app.models.ml_models import ml_models
from ai.intent.intent_service import classify_intent
from ai.entity.ner_service import extract_entities
from ai.entity.entity_processor import analyze_entities, process_entities
from app.models.schemas import AnalyzeResponse, ProcessedResponse, RawOutput

logger = logging.getLogger("rosee.ai.pipeline")

def run_ai_pipeline(text: str):
    """
    Chạy toàn bộ quy trình phân tích AI cho một chuỗi văn bản.
    
    1. Phân loại Ý định (Intent)
    2. Trích xuất Thực thể (NER)
    3. Chuẩn hóa & Phân tích (Processing)
    
    Returns:
        AnalyzeResponse: Đối tượng chứa intent và entities đã chuẩn hóa.
    """
    # ── Bước A: Nhận diện Thực thể (NER) ──
    ner_result = {"entities": {}, "avg_confidence": 0.0}
    if ml_models.get("ner_available", False):
        try:
            ner_result = extract_entities(text)
        except Exception as exc:
            logger.warning(f"[Pipeline] NER failed, sử dụng fallback: {exc}")

    # ── Bước B: Phân loại Ý định (Intent) ──
    if not ml_models.get("intent"):
        raise RuntimeError("Mô hình Intent chưa được tải.")
    
    intent_result = classify_intent(text)

    # ── Bước C: Chuẩn hóa dữ liệu ──
    result = analyze_entities(
        raw_ner=ner_result["entities"],
        ner_avg_confidence=ner_result["avg_confidence"],
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        original_text=text,
    )

    logger.info(
        f"[Pipeline] Hoàn tất: intent={result.intent}, "
        f"entities={result.entities.model_dump()}"
    )
    
    return result

def run_processed_pipeline(text: str, debug: bool = False):
    """
    Phiên bản đầy đủ (ProcessedResponse) phục vụ cho logic cũ hoặc cần debug sâu.
    """
    # NER
    ner_result = {
        "entities": {},
        "entities_multi": {},
        "scores": {},
        "avg_confidence": 0.0,
        "raw_spans": [],
    }
    ner_error = None
    if ml_models.get("ner_available", False):
        try:
            ner_result = extract_entities(text)
        except Exception as exc:
            ner_error = str(exc)
            
    # Intent
    intent_result = classify_intent(text)
    
    # Process
    processed_data = process_entities(
        raw_ner=ner_result["entities"],
        ner_avg_confidence=ner_result["avg_confidence"],
        ner_scores=ner_result["scores"],
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        original_text=text,
    )
    
    raw = RawOutput(
        intent=intent_result["intent"],
        intent_confidence=intent_result["confidence"],
        ner=ner_result["entities"],
    )
    
    debug_info = None
    if debug:
        debug_info = {
            "ner_error": ner_error,
            "entities_multi": ner_result["entities_multi"],
            "ner_avg_confidence": ner_result["avg_confidence"],
        }
        
    return ProcessedResponse(
        success=True,
        data=processed_data,
        raw=raw,
        debug=debug_info
    )

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from transformers import AutoTokenizer, AutoModelForTokenClassification, AutoModelForSequenceClassification, pipeline
import uvicorn
import torch

# Pipeline objects được lưu tại đây sau khi khởi động
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Tải model khi server khởi động, giải phóng khi tắt."""
    # --- STARTUP ---
    print("⏳ Đang tải Mô hình 1: Iris Intent Classifier (PhoBERT)...")
    try:
        # Đường dẫn tới thư mục model Intent vừa train
        INTENT_MODEL_PATH = "./model_intent_output" 
        intent_tokenizer = AutoTokenizer.from_pretrained(INTENT_MODEL_PATH)
        intent_model = AutoModelForSequenceClassification.from_pretrained(INTENT_MODEL_PATH)
        ml_models["intent"] = pipeline("text-classification", model=intent_model, tokenizer=intent_tokenizer)
        print("✅ Mô hình Iris Intent Classifier đã sẵn sàng.")
    except Exception as e:
        print(f"⚠️ Lỗi khi tải mô hình Intent: {e}")
        ml_models["intent"] = None

    print("⏳ Đang tải Mô hình 2: Hydrangea NER (PhoBERT)...")
    try:
        # Đường dẫn tới model NER cũ của bạn
        NER_MODEL_PATH = "./model_weights/phobert-ner-flower"
        ner_tokenizer = AutoTokenizer.from_pretrained(NER_MODEL_PATH)
        ner_model = AutoModelForTokenClassification.from_pretrained(NER_MODEL_PATH)
        ml_models["ner"] = pipeline(
            "token-classification",
            model=ner_model,
            tokenizer=ner_tokenizer,
            aggregation_strategy="simple"
        )
        print("✅ Mô hình Hydrangea NER đã sẵn sàng.")
    except Exception as e:
        print(f"⚠️ Lỗi khi tải mô hình NER (Bỏ qua để tiếp tục chạy Iris): {e}")
        ml_models["ner"] = None

    yield  # Server đang chạy

    # --- SHUTDOWN ---
    ml_models.clear()
    print("🔌 Đã giải phóng tài nguyên model.")


app = FastAPI(title="Rosee AI Engine", version="4.0.0", lifespan=lifespan)

# --- Define Schemas ---
class TextRequest(BaseModel):
    text: str

class IntentResponse(BaseModel):
    intent: str
    confidence: float
    original_text: str

class NERResponse(BaseModel):
    entities: Dict[str, str]

# ==========================================
# 1. API CHO TRỢ LÝ IRIS (Phân loại Ý định)
# ==========================================
@app.post("/api/iris/intent", response_model=IntentResponse)
async def analyze_intent(request: TextRequest):
    """Nhận text từ khách hàng, phân tích Intent để điều hướng kịch bản CSKH"""
    if not ml_models.get("intent"):
        raise HTTPException(status_code=503, detail="Mô hình Intent chưa sẵn sàng.")
    
    try:
        # Pipeline trả về list, ví dụ: [{'label': 'Ask_Price', 'score': 0.98}]
        result = ml_models["intent"](request.text)[0]
        top_intent = result['label']
        confidence = result['score']

        # ĐỈNH CAO BẢO VỆ ĐỒ ÁN: Lọc nhiễu tự động
        # Nếu AI không chắc chắn (độ tự tin < 60%), ép nó vào Out_Of_Domain để tránh nói bậy
        if confidence < 0.6:
            top_intent = 'Out_Of_Domain'

        return IntentResponse(
            intent=top_intent,
            confidence=round(confidence, 4),
            original_text=request.text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 2. API CHO TRỢ LÝ HYDRANGEA (Bóc tách NER)
# ==========================================
@app.post("/api/hydrangea/extract", response_model=NERResponse)
async def extract_entities(request: TextRequest):
    """Nhận text, rút trích các thực thể (Hoa, Màu sắc, Dịp...)"""
    if not ml_models.get("ner"):
        raise HTTPException(status_code=503, detail="Mô hình NER chưa sẵn sàng.")
    
    try:
        ner_results = ml_models["ner"](request.text)
        entities: Dict[str, str] = {}
        
        for item in ner_results:
            label = item["entity_group"]
            # Xử lý ký tự subword của PhoBERT (SentencePiece '▁')
            word = item["word"].replace("\u2581", " ").strip()
            
            # Gom các từ bị cắt vỡ lại thành cụm (Ví dụ: "hoa" + "hồng" -> "hoa hồng")
            if label in entities:
                entities[label] += f" {word}"
            else:
                entities[label] = word

        return NERResponse(entities=entities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

#
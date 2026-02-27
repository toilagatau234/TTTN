from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from transformers import AutoTokenizer, AutoModelForTokenClassification, AutoModelForSequenceClassification, pipeline
import uvicorn

app = FastAPI(title="Rosee NLP Engine", version="4.0.0")

# 1. TẢI 2 MÔ HÌNH PHO-BERT
print("⏳ Đang tải Mô hình 1: Intent Classifier...")
INTENT_MODEL_PATH = "./model_weights/phobert-intent-classifier"
intent_tokenizer = AutoTokenizer.from_pretrained(INTENT_MODEL_PATH)
intent_model = AutoModelForSequenceClassification.from_pretrained(INTENT_MODEL_PATH)
nlp_intent = pipeline("text-classification", model=intent_model, tokenizer=intent_tokenizer)

print("⏳ Đang tải Mô hình 2: Named Entity Recognition (NER)...")
NER_MODEL_PATH = "./model_weights/phobert-ner-flower"
ner_tokenizer = AutoTokenizer.from_pretrained(NER_MODEL_PATH)
ner_model = AutoModelForTokenClassification.from_pretrained(NER_MODEL_PATH)
nlp_ner = pipeline("token-classification", model=ner_model, tokenizer=ner_tokenizer, aggregation_strategy="simple")

class TextRequest(BaseModel):
    text: str

class NLPResponse(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, List[str]]

@app.post("/api/nlp/analyze", response_model=NLPResponse)
async def analyze_text(request: TextRequest):
    """API nội bộ: Nhận text, trả về Ý định và Thực thể bóc tách được"""
    try:
        # Bóc Intent
        intent_prediction = nlp_intent(request.text)[0]
        
        # Bóc Entities
        ner_results = nlp_ner(request.text)
        entities = {}
        for item in ner_results:
            label = item['entity_group']
            word = item['word'].replace(" ", " ").strip()
            if label not in entities:
                entities[label] = []
            entities[label].append(word)

        return NLPResponse(
            intent=intent_prediction['label'],
            confidence=intent_prediction['score'],
            entities=entities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
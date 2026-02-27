from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline

def main():
    print("⏳ Đang tải mô hình PhoBERT đã Fine-tune từ thư mục local...")
    # Trỏ đường dẫn vào thư mục chứa weights vừa train xong
    MODEL_PATH = "./model_weights/phobert-ner-flower"
    
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)

    # Sử dụng pipeline của HuggingFace, bật aggregation_strategy="simple"
    # để nó tự động nối các nhãn B- và I- lại với nhau thành 1 từ hoàn chỉnh.
    nlp_ner = pipeline(
        "token-classification", 
        model=model, 
        tokenizer=tokenizer, 
        aggregation_strategy="simple"
    )

    # Danh sách các câu test (Mô phỏng Input từ khách hàng)
    test_cases = [
        "Mình cần bó hoa hồng đỏ tông màu trầm tặng mẹ giá khoảng 500k",
        "Có bó tulip nào chừng 3 xị rưỡi tặg sn đồ khum shóp",
        "Lẵng lan hồ điệp phong cách hoàng gia 5 triệu đổ lại",
        "Trừ hoa hồng ra mix cho mình tú cầu xanh bơ với cát tường mộng mơ nhé"
    ]

    print("\n" + "="*50)
    print("🚀 BẮT ĐẦU TEST NER MICROSERVICE")
    print("="*50)

    for i, text in enumerate(test_cases, 1):
        print(f"\n[Test Case {i}] Khách hàng nhập: '{text}'")
        results = nlp_ner(text)
        
        # In kết quả dạng JSON thô (phục vụ cho RAG)
        extracted_entities = {}
        for entity in results:
            label = entity['entity_group']
            word = entity['word'].replace(" ", " ") # Ký tự của PhoBERT BPE
            
            # Gộp các thực thể cùng loại vào mảng nếu có nhiều hơn 1
            if label not in extracted_entities:
                extracted_entities[label] = []
            extracted_entities[label].append(word.strip())
            
        print(f"👉 AI Trích xuất (JSON): {extracted_entities}")

if __name__ == "__main__":
    main()
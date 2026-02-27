import pandas as pd
import json
import os

# Bộ từ điển ánh xạ Ý định (Intent) sang Số nguyên (Label ID)
INTENT_MAP = {
    "GREETING": 0,
    "CREATE_BOUQUET": 1,
    "ASK_PRICE_STOCK": 2,
    "CHECK_POLICY": 3,
    "OUT_OF_DOMAIN": 4
}

def convert_intent_excel_to_jsonl(excel_path: str, output_path: str):
    if not os.path.exists(excel_path):
        print(f"Lỗi: Không tìm thấy file {excel_path}")
        return

    # Đọc file Excel
    df = pd.read_excel(excel_path)
    
    # Đảm bảo format chuẩn
    df['Text'] = df['Text'].astype(str).str.strip()
    df['Intent'] = df['Intent'].astype(str).str.strip()

    records = []
    for _, row in df.iterrows():
        text = row['Text']
        intent = row['Intent']
        
        # Bỏ qua dòng trống
        if not text or text == 'nan':
            continue
            
        # Ánh xạ Text Intent sang Label ID
        label_id = INTENT_MAP.get(intent, 4) # Mặc định là 4 (OUT_OF_DOMAIN) nếu gõ sai nhãn
        
        records.append({
            "text": text,
            "label": label_id
        })
        
    # Ghi ra file JSONL
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in records:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
            
    print(f"✅ Đã xử lý thành công {len(records)} câu Intent.")
    print(f"📁 File output lưu tại: {output_path}")

if __name__ == "__main__":
    convert_intent_excel_to_jsonl("data/intent_dataset.xlsx", "data/train_intent.jsonl")
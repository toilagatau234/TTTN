import pandas as pd
import json
import os

def convert_excel_to_hf_format(excel_path: str, output_jsonl_path: str):
    """
    Chuyển đổi dữ liệu NER từ Excel (CoNLL like format) sang định dạng JSON Lines.
    Phục vụ cho việc load dataset vào Hugging Face.
    """
    if not os.path.exists(excel_path):
        print(f"Lỗi: Không tìm thấy file {excel_path}")
        return

    # Đọc file Excel
    df = pd.read_excel(excel_path)
    
    # Đảm bảo các cột không có giá trị NaN
    df['Word'] = df['Word'].fillna('').astype(str)
    df['Tag'] = df['Tag'].fillna('O').astype(str)

    sentences = []
    # Nhóm các dòng theo ID của câu
    for sentence_id, group in df.groupby('Sentence_ID'):
        tokens = group['Word'].tolist()
        tags = group['Tag'].tolist()
        
        # Lọc bỏ các câu rỗng
        if not tokens or all(t.strip() == '' for t in tokens):
            continue
            
        sentences.append({
            "id": str(sentence_id),
            "tokens": tokens,
            "ner_tags": tags
        })
        
    # Ghi ra file JSONL
    with open(output_jsonl_path, 'w', encoding='utf-8') as f:
        for item in sentences:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
            
    print(f"✅ Đã xử lý thành công {len(sentences)} câu.")
    print(f"📁 File output được lưu tại: {output_jsonl_path}")

if __name__ == "__main__":
    # Đường dẫn tương đối từ thư mục chạy script
    INPUT_FILE = "data/ner_dataset.xlsx"
    OUTPUT_FILE = "data/train_dataset.jsonl"
    
    convert_excel_to_hf_format(INPUT_FILE, OUTPUT_FILE)
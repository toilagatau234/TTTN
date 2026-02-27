import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)

# 1. KHỞI TẠO BỘ NHÃN (LABEL VOCABULARY)
# Tập hợp toàn bộ các nhãn xuất hiện trong 200 câu data của chúng ta
LABEL_LIST = [
    "O", 
    "B-FLOWER", "I-FLOWER", 
    "B-COLOR", "I-COLOR", 
    "B-OCCASION", "I-OCCASION", 
    "B-PRICE", "I-PRICE", 
    "B-STYLE", "I-STYLE"
]
# Tạo từ điển mapping giữa Chuỗi (String) và Số (ID) để AI hiểu
label2id = {label: i for i, label in enumerate(LABEL_LIST)}
id2label = {i: label for i, label in enumerate(LABEL_LIST)}

# 2. CẤU HÌNH KIẾN TRÚC MÔ HÌNH
MODEL_CHECKPOINT = "vinai/phobert-base"
OUTPUT_DIR = "./model_weights/phobert-ner-flower"

def tokenize_and_align_labels(examples, tokenizer):
    """
    Hàm xử lý Subword Tokenization (BPE) thủ công cho PhoBERT.
    Do PhoBERT không hỗ trợ Fast Tokenizer, chúng ta phải tự căn chỉnh nhãn.
    """
    tokenized_inputs = {
        "input_ids": [],
        "attention_mask": [],
        "labels": []
    }
    
    max_length = 64
    
    for i, (tokens, tags) in enumerate(zip(examples["tokens"], examples["ner_tags"])):
        input_ids = [tokenizer.cls_token_id] # <s>
        label_ids = [-100]
        
        for word, tag in zip(tokens, tags):
            # Tokenize từng từ
            word_tokens = tokenizer.encode(word, add_special_tokens=False)
            
            if len(word_tokens) > 0:
                # Token đầu tiên của từ nhận nhãn gốc
                input_ids.append(word_tokens[0])
                label_ids.append(label2id[tag])
                
                # Các token sau của cùng một từ nhận nhãn -100
                for sub_token in word_tokens[1:]:
                    input_ids.append(sub_token)
                    label_ids.append(-100)
        
        # Thêm token kết thúc </s>
        input_ids.append(tokenizer.sep_token_id)
        label_ids.append(-100)
        
        # Truncation
        if len(input_ids) > max_length:
            input_ids = input_ids[:max_length]
            label_ids = label_ids[:max_length]
            
        # Attention mask
        attention_mask = [1] * len(input_ids)
        
        # Padding
        padding_length = max_length - len(input_ids)
        if padding_length > 0:
            input_ids += [tokenizer.pad_token_id] * padding_length
            label_ids += [-100] * padding_length
            attention_mask += [0] * padding_length
            
        tokenized_inputs["input_ids"].append(input_ids)
        tokenized_inputs["attention_mask"].append(attention_mask)
        tokenized_inputs["labels"].append(label_ids)

    return tokenized_inputs

def main():
    print("🚀 Đang khởi động tiến trình Fine-Tuning PhoBERT...")

    # Load Tokenizer của PhoBERT
    tokenizer = AutoTokenizer.from_pretrained(MODEL_CHECKPOINT)

    # Load Dataset từ file JSONL vừa tạo
    dataset = load_dataset("json", data_files={"train": "data/train_dataset.jsonl"})

    # Map dataset qua hàm tokenize
    tokenized_datasets = dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer),
        batched=True
    )

    # Load Pre-trained Model và gắn lớp Classification lên đỉnh
    model = AutoModelForTokenClassification.from_pretrained(
        MODEL_CHECKPOINT,
        num_labels=len(LABEL_LIST),
        id2label=id2label,
        label2id=label2id
    )

    # Cấu hình siêu tham số (Hyperparameters)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        learning_rate=2e-5,          # Tốc độ học tối ưu cho Fine-tuning BERT
        per_device_train_batch_size=8, # Batch size nhỏ cho máy cá nhân (RAM/VRAM)
        num_train_epochs=15,         # Số vòng lặp huấn luyện (200 câu thì 15 vòng là vừa đủ)
        weight_decay=0.01,           # Tránh Overfitting
        save_strategy="epoch",       # Lưu trọng số sau mỗi Epoch
        logging_steps=10,            # In log ra terminal
        overwrite_output_dir=True,
    )

    # Bộ collator giúp padding các câu trong cùng 1 batch có độ dài bằng nhau
    data_collator = DataCollatorForTokenClassification(tokenizer)

    # Khởi tạo Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    # BẮT ĐẦU TRAINING
    print("🔥 Bắt đầu Training. Quá trình này có thể mất vài phút đến vài chục phút tùy cấu hình máy...")
    trainer.train()

    # Lưu mô hình hoàn chỉnh sau khi train xong
    trainer.save_model(OUTPUT_DIR)
    print(f"✅ Quá trình huấn luyện hoàn tất! Trọng số đã được lưu tại: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
import os
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding
)

# 1. CẤU HÌNH MÔ HÌNH VÀ NHÃN
MODEL_CHECKPOINT = "vinai/phobert-base"
OUTPUT_DIR = "./model_weights/phobert-intent-classifier"

INTENT_LABELS = ["GREETING", "CREATE_BOUQUET", "ASK_PRICE_STOCK", "CHECK_POLICY", "OUT_OF_DOMAIN"]
label2id = {label: i for i, label in enumerate(INTENT_LABELS)}
id2label = {i: label for i, label in enumerate(INTENT_LABELS)}

def tokenize_function(examples, tokenizer):
    # Padding và Truncation cho độ dài tối đa 64 token
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=64)

def main():
    print("🚀 Đang khởi động tiến trình Fine-Tuning Chatbot Intent Classifier...")

    # Load Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_CHECKPOINT)

    # Load Dataset
    dataset = load_dataset("json", data_files={"train": "data/train_intent.jsonl"})

    # Map qua hàm tokenize
    tokenized_datasets = dataset.map(
        lambda x: tokenize_function(x, tokenizer),
        batched=True
    )

    # Load Pre-trained Model chuyên cho Sequence Classification
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_CHECKPOINT,
        num_labels=len(INTENT_LABELS),
        id2label=id2label,
        label2id=label2id
    )

    # Cấu hình siêu tham số (Hyperparameters)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        learning_rate=3e-5,
        per_device_train_batch_size=8, # Phân loại câu nhẹ hơn NER, có thể đẩy batch size lên 16
        num_train_epochs=20,            # 12 Epochs là đủ hội tụ cho classification
        weight_decay=0.01,
        save_strategy="epoch",
        logging_steps=5,
        overwrite_output_dir=True,
    )

    # Data collator tự động padding động
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # Khởi tạo Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    print("🔥 Bắt đầu Training...")
    trainer.train()

    # Lưu mô hình
    trainer.save_model(OUTPUT_DIR)
    print(f"✅ Quá trình huấn luyện hoàn tất! Trọng số lưu tại: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
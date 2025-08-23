---
sidebar_position: 2
title: HuggingFace
description: HuggingFace provides pre-trained models and tools for natural language processing and machine learning. Learn how to use HuggingFace Transformers.
slug: /BuildML/HuggingFace
keywords:
  - HuggingFace
  - Transformers
  - NLP
  - pre-trained models
  - BERT
  - GPT
  - machine learning
---

# 🤗 HuggingFace Transformers

**HuggingFace** provides **pre-trained models** and **tools** for **natural language processing** and **machine learning** with easy-to-use APIs.

---

## 🔧 Installation

`Install HuggingFace libraries:`
```bash
pip install transformers torch datasets accelerate
pip install transformers[torch]  # PyTorch support
pip install transformers[tf-cpu]  # TensorFlow CPU
pip install transformers[tf]      # TensorFlow GPU
```

## 📊 Text Classification

`Create classify.py:`
```python
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load pre-trained model
classifier = pipeline("sentiment-analysis", 
                     model="distilbert-base-uncased-finetuned-sst-2-english")

# Classify text
texts = [
    "I love this product!",
    "This is terrible.",
    "It's okay, nothing special."
]

results = classifier(texts)
for text, result in zip(texts, results):
    print(f"Text: {text}")
    print(f"Sentiment: {result['label']}, Score: {result['score']:.4f}\n")
```

## ▶️ Sample Output

```bash
$ python classify.py
Text: I love this product!
Sentiment: POSITIVE, Score: 0.9998

Text: This is terrible.
Sentiment: NEGATIVE, Score: 0.9991

Text: It's okay, nothing special.
Sentiment: NEGATIVE, Score: 0.6574

Processing complete!
```

## 🤖 Custom Model Training

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import TrainingArguments, Trainer
from datasets import Dataset

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

# Prepare dataset
def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, padding=True)

train_dataset = Dataset.from_dict({
    "text": ["Great product!", "Bad quality", "Love it!"],
    "labels": [1, 0, 1]
})

train_dataset = train_dataset.map(tokenize_function, batched=True)

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
)

# Initialize trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    tokenizer=tokenizer,
)

# Train model
trainer.train()
```

## 🐳 Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "app.py"]
```

`Create app.py:`
```python
from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)
classifier = pipeline("sentiment-analysis")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data['text']
    result = classifier(text)[0]
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

**Reference:** [HuggingFace Documentation](https://huggingface.co/docs)
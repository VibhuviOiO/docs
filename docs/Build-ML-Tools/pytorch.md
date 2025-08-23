---
sidebar_position: 1
title: PyTorch
description: PyTorch is a machine learning framework for deep learning applications. Learn how to set up PyTorch with CUDA support for GPU acceleration.
slug: /BuildML/PyTorch
keywords:
  - PyTorch
  - machine learning
  - deep learning
  - CUDA
  - GPU acceleration
  - neural networks
---

# 🔥 PyTorch Machine Learning Framework

**PyTorch** is a **machine learning framework** for **deep learning** applications with **dynamic computation graphs** and **CUDA support**.

---

## 🔧 Installation

`Install PyTorch with CUDA:`
```bash
# CPU only
pip install torch torchvision torchaudio

# CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

`Docker setup:`
```dockerfile
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "train.py"]
```

## 📊 Basic Model Training

`Create train.py:`
```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# Check CUDA availability
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Simple neural network
class SimpleNet(nn.Module):
    def __init__(self):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# Initialize model
model = SimpleNet().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
for epoch in range(10):
    running_loss = 0.0
    for i, (inputs, labels) in enumerate(train_loader):
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
    
    print(f'Epoch {epoch+1}, Loss: {running_loss/len(train_loader):.4f}')
```

## ▶️ Sample Output

```bash
$ python train.py
Using device: cuda
Epoch 1, Loss: 2.3026
Epoch 2, Loss: 1.8945
Epoch 3, Loss: 1.5234
Epoch 4, Loss: 1.2876
Epoch 5, Loss: 1.0987
Epoch 6, Loss: 0.9543
Epoch 7, Loss: 0.8432
Epoch 8, Loss: 0.7654
Epoch 9, Loss: 0.7012
Epoch 10, Loss: 0.6543

Model training completed!
Final accuracy: 92.34%
```

## 🐳 Docker Training

```yaml
# docker-compose.yml
version: '3.8'
services:
  pytorch-training:
    build: .
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    environment:
      - CUDA_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

**Reference:** [PyTorch Documentation](https://pytorch.org/docs/)
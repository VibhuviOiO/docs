---
sidebar_position: 1
title: PyTorch
description: PyTorch is Facebook's open-source deep learning framework with dynamic computation graphs and CUDA support for GPU acceleration.
slug: /BuildMLTools/PyTorch
keywords:
  - PyTorch
  - machine learning
  - deep learning
  - CUDA
  - GPU acceleration
  - neural networks
  - Facebook AI
  - dynamic graphs
---
# Setup PyTorch Development Environment

### Prerequisites

- **Python 3.8+** installed
- **NVIDIA GPU** (optional, for CUDA acceleration)
- **Docker & Docker Compose** for containerized training
- **8GB+ RAM** recommended for model training

---

### Setup PyTorch Development Environment

Create a Docker Compose setup for PyTorch development:

```yaml
version: '3.8'

services:
  pytorch-dev:
    image: pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel
    container_name: pytorch-dev
    restart: unless-stopped
    ports:
      - "8888:8888"  # Jupyter
      - "6006:6006"  # TensorBoard
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - JUPYTER_TOKEN=pytorch123
    volumes:
      - ./notebooks:/workspace/notebooks
      - ./data:/workspace/data
      - ./models:/workspace/models
      - ./src:/workspace/src
    working_dir: /workspace
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command: >
      bash -c "
        pip install jupyter jupyterlab tensorboard matplotlib seaborn scikit-learn &&
        jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root
      "

  # TensorBoard for monitoring
  tensorboard:
    image: tensorflow/tensorflow:latest
    container_name: pytorch-tensorboard
    restart: unless-stopped
    ports:
      - "6007:6006"
    volumes:
      - ./logs:/logs
    command: tensorboard --logdir=/logs --host=0.0.0.0 --port=6006
```

---

### Install PyTorch Locally

Install PyTorch with appropriate CUDA support:

```bash
# CPU only version
pip install torch torchvision torchaudio

# CUDA 11.8 version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1 version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Verify installation
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
```

---

### Create Your First Neural Network

Create a comprehensive image classification example:

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
import matplotlib.pyplot as plt
import numpy as np
from torch.utils.tensorboard import SummaryWriter

# Set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Data preprocessing
transform_train = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

# Load CIFAR-10 dataset
train_dataset = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform_train)
test_dataset = datasets.CIFAR10(root='./data', train=False, download=True, transform=transform_test)

# Create data loaders
batch_size = 128
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2)

# Define CNN model
class CIFAR10Net(nn.Module):
    def __init__(self, num_classes=10):
        super(CIFAR10Net, self).__init__()
        
        # Convolutional layers
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        
        # Batch normalization
        self.bn1 = nn.BatchNorm2d(32)
        self.bn2 = nn.BatchNorm2d(64)
        self.bn3 = nn.BatchNorm2d(128)
        
        # Pooling and dropout
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
        # Fully connected layers
        self.fc1 = nn.Linear(128 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, num_classes)
        
    def forward(self, x):
        # Conv block 1
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        
        # Conv block 2
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        
        # Conv block 3
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        # Flatten
        x = x.view(-1, 128 * 4 * 4)
        
        # Fully connected layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

# Initialize model, loss, and optimizer
model = CIFAR10Net().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)

print(f"Model has {sum(p.numel() for p in model.parameters())} parameters")
```

---

### Train the Model

```python
# Training function
def train_model(model, train_loader, test_loader, epochs=20):
    writer = SummaryWriter('logs/pytorch_training')
    
    train_losses = []
    train_accuracies = []
    test_accuracies = []
    
    for epoch in range(epochs):
        # Training phase
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            total_train += target.size(0)
            correct_train += (predicted == target).sum().item()
            
            if batch_idx % 100 == 0:
                print(f'Epoch {epoch+1}/{epochs}, Batch {batch_idx}/{len(train_loader)}, Loss: {loss.item():.4f}')
        
        # Calculate training metrics
        epoch_loss = running_loss / len(train_loader)
        train_accuracy = 100. * correct_train / total_train
        
        # Evaluation phase
        model.eval()
        correct_test = 0
        total_test = 0
        
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(device), target.to(device)
                output = model(data)
                _, predicted = torch.max(output.data, 1)
                total_test += target.size(0)
                correct_test += (predicted == target).sum().item()
        
        test_accuracy = 100. * correct_test / total_test
        
        # Log metrics
        writer.add_scalar('Loss/Train', epoch_loss, epoch)
        writer.add_scalar('Accuracy/Train', train_accuracy, epoch)
        writer.add_scalar('Accuracy/Test', test_accuracy, epoch)
        writer.add_scalar('Learning_Rate', optimizer.param_groups[0]['lr'], epoch)
        
        # Store metrics
        train_losses.append(epoch_loss)
        train_accuracies.append(train_accuracy)
        test_accuracies.append(test_accuracy)
        
        print(f'Epoch {epoch+1}/{epochs}:')
        print(f'  Train Loss: {epoch_loss:.4f}, Train Acc: {train_accuracy:.2f}%')
        print(f'  Test Acc: {test_accuracy:.2f}%')
        print('-' * 50)
        
        scheduler.step()
    
    writer.close()
    
    # Save model
    torch.save({
        'epoch': epochs,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'train_losses': train_losses,
        'train_accuracies': train_accuracies,
        'test_accuracies': test_accuracies,
    }, 'models/cifar10_model.pth')
    
    return train_losses, train_accuracies, test_accuracies

# Train the model
print("Starting training...")
train_losses, train_accs, test_accs = train_model(model, train_loader, test_loader, epochs=20)
print("Training completed!")
```

---

### Model Evaluation and Visualization

```python
# Evaluation and visualization
def evaluate_model(model, test_loader):
    model.eval()
    class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer', 
                   'dog', 'frog', 'horse', 'ship', 'truck']
    
    # Get some test samples
    dataiter = iter(test_loader)
    images, labels = next(dataiter)
    images, labels = images.to(device), labels.to(device)
    
    # Make predictions
    with torch.no_grad():
        outputs = model(images)
        _, predicted = torch.max(outputs, 1)
    
    # Visualize results
    fig, axes = plt.subplots(2, 4, figsize=(12, 6))
    for i in range(8):
        ax = axes[i//4, i%4]
        
        # Denormalize image
        img = images[i].cpu()
        img = img * torch.tensor([0.2023, 0.1994, 0.2010]).view(3, 1, 1) + torch.tensor([0.4914, 0.4822, 0.4465]).view(3, 1, 1)
        img = torch.clamp(img, 0, 1)
        
        ax.imshow(np.transpose(img, (1, 2, 0)))
        ax.set_title(f'True: {class_names[labels[i]]}\nPred: {class_names[predicted[i]]}')
        ax.axis('off')
    
    plt.tight_layout()
    plt.savefig('models/predictions.png')
    plt.show()

# Evaluate the model
evaluate_model(model, test_loader)

# Plot training curves
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(train_losses)
plt.title('Training Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')

plt.subplot(1, 2, 2)
plt.plot(train_accs, label='Train Accuracy')
plt.plot(test_accs, label='Test Accuracy')
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy (%)')
plt.legend()

plt.tight_layout()
plt.savefig('models/training_curves.png')
plt.show()
```

---

### What You'll See

`Training Output`
```bash
$ python train.py
Using device: cuda
Model has 1,250,858 parameters
Starting training...

Epoch 1/20, Batch 0/391, Loss: 2.3026
Epoch 1/20, Batch 100/391, Loss: 1.8945
Epoch 1/20, Batch 200/391, Loss: 1.5234
Epoch 1/20, Batch 300/391, Loss: 1.2876

Epoch 1/20:
  Train Loss: 1.8234, Train Acc: 32.45%
  Test Acc: 35.67%
--------------------------------------------------

Epoch 20/20:
  Train Loss: 0.3456, Train Acc: 87.89%
  Test Acc: 82.34%
--------------------------------------------------

Training completed!
Model saved to models/cifar10_model.pth
```

---

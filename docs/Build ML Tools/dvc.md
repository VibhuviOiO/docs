---
sidebar_position: 4
title: DVC (Data Version Control)
description: DVC is an open-source data versioning and ML pipeline tool for managing datasets, experiments, and reproducible ML workflows.
slug: /BuildMLTools/DVC
keywords:
  - DVC
  - data version control
  - ML pipelines
  - data versioning
  - experiment tracking
  - reproducible ML
  - MLOps
  - data management
---

# 🚀 Data Versioning and ML Pipelines with DVC

**DVC (Data Version Control)** is an **open-source** tool for **data versioning**, **ML pipeline management**, and **experiment tracking**. Perfect for **reproducible ML workflows** with **Git-like** versioning for datasets and **automated pipeline** execution.

## Key Features

- **Data Versioning**: Git-like versioning for large datasets and models
- **Pipeline Management**: Define and run reproducible ML pipelines
- **Experiment Tracking**: Compare experiments and track metrics
- **Remote Storage**: Support for S3, GCS, Azure, SSH, and more
- **Git Integration**: Works seamlessly with Git workflows

## Use Cases

- **Dataset Management**: Version control for large datasets
- **ML Pipelines**: Reproducible training and evaluation workflows
- **Experiment Tracking**: Compare model performance across experiments
- **Team Collaboration**: Share data and models across team members

---

## 🧰 Prerequisites

- **Git** repository initialized
- **Python 3.8+** installed
- **Cloud storage** (AWS S3, Google Cloud, Azure) or local storage
- **ML project** with datasets and models

---

## 🔧 Step 1: Install and Initialize DVC

Install DVC with cloud storage support:

```bash
# Install DVC with cloud storage support
pip install dvc[all]

# Or install with specific cloud provider
pip install dvc[s3]      # AWS S3
pip install dvc[gs]      # Google Cloud Storage
pip install dvc[azure]   # Azure Blob Storage

# Verify installation
dvc version
```

Initialize DVC in your Git repository:

```bash
# Initialize Git repository (if not already done)
git init

# Initialize DVC
dvc init

# Commit DVC initialization
git add .dvc/
git commit -m "Initialize DVC"
```

---

## 🏗️ Step 2: Configure Remote Storage

Set up remote storage for your data:

```bash
# Add S3 remote storage
dvc remote add -d myremote s3://my-dvc-bucket/dvc-storage

# Configure AWS credentials (optional if using AWS CLI)
dvc remote modify myremote access_key_id YOUR_ACCESS_KEY
dvc remote modify myremote secret_access_key YOUR_SECRET_KEY

# Commit remote configuration
git add .dvc/config
git commit -m "Configure DVC remote storage"
```

For local testing, you can use a local directory:

```bash
# Add local remote storage
dvc remote add -d myremote /tmp/dvc-storage
mkdir -p /tmp/dvc-storage
```

---

## 📁 Step 3: Add Data to DVC Tracking

Create a sample project structure and add data:

```bash
# Create project structure
mkdir -p data/raw data/processed models

# Add dataset to DVC tracking
dvc add data/raw/dataset.csv

# Add DVC file to Git (not the actual data)
git add data/raw/dataset.csv.dvc data/raw/.gitignore
git commit -m "Add raw dataset to DVC"

# Push data to remote storage
dvc push
```

Create a parameters file for your ML pipeline:

```yaml
# params.yaml
prepare:
  target_col: "target"
  test_size: 0.2
  random_state: 42

train:
  model_type: "random_forest"
  n_estimators: 100
  max_depth: 10
  random_state: 42

evaluate:
  metrics_file: "metrics.json"
```

---

## ▶️ Step 4: Create DVC Pipeline

Define your ML pipeline stages in `dvc.yaml`:

```yaml
stages:
  prepare_data:
    cmd: python src/prepare_data.py
    deps:
      - src/prepare_data.py
      - data/raw/dataset.csv
      - params.yaml
    outs:
      - data/processed/train.csv
      - data/processed/test.csv

  train_model:
    cmd: python src/train_model.py
    deps:
      - src/train_model.py
      - data/processed/train.csv
      - params.yaml
    outs:
      - models/model.pkl
    metrics:
      - metrics/train_metrics.json

  evaluate_model:
    cmd: python src/evaluate_model.py
    deps:
      - src/evaluate_model.py
      - models/model.pkl
      - data/processed/test.csv
      - params.yaml
    metrics:
      - metrics/eval_metrics.json
    plots:
      - plots/confusion_matrix.png
```

Create the training script `src/train_model.py`:

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import yaml
import json
import joblib
import os

def load_params():
    with open('params.yaml', 'r') as f:
        params = yaml.safe_load(f)
    return params

def train_model():
    params = load_params()
    
    # Load training data
    train_data = pd.read_csv('data/processed/train.csv')
    
    target_col = params['prepare']['target_col']
    feature_cols = [col for col in train_data.columns if col != target_col]
    
    X_train = train_data[feature_cols]
    y_train = train_data[target_col]
    
    # Initialize model
    model = RandomForestClassifier(
        n_estimators=params['train']['n_estimators'],
        max_depth=params['train']['max_depth'],
        random_state=params['train']['random_state']
    )
    
    # Train model
    model.fit(X_train, y_train)
    
    # Calculate training metrics
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    
    # Save model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/model.pkl')
    
    # Save training metrics
    os.makedirs('metrics', exist_ok=True)
    train_metrics = {
        'train_accuracy': train_accuracy,
        'model_type': params['train']['model_type'],
        'n_features': len(feature_cols),
        'n_samples': len(X_train)
    }
    
    with open('metrics/train_metrics.json', 'w') as f:
        json.dump(train_metrics, f, indent=2)
    
    print(f"Model trained successfully! Training accuracy: {train_accuracy:.4f}")

if __name__ == "__main__":
    train_model()
```

---

## 📊 Step 5: Run and Manage Pipelines

Execute the DVC pipeline:

```bash
# Run the entire pipeline
dvc repro

# Run specific stage
dvc repro train_model

# Check pipeline status
dvc status

# Show pipeline DAG
dvc dag
```

View metrics and compare experiments:

```bash
# Show metrics
dvc metrics show

# Compare metrics across experiments
dvc metrics diff

# Show plots
dvc plots show

# Compare plots
dvc plots diff
```

---

## 🔍 What You'll See

### DVC Pipeline Execution
```bash
$ dvc repro
Running stage 'prepare_data':
> python src/prepare_data.py
Data preparation completed!

Running stage 'train_model':
> python src/train_model.py
Model trained successfully! Training accuracy: 0.8542

Running stage 'evaluate_model':
> python src/evaluate_model.py
Model evaluation completed!
```

### Metrics Comparison
```bash
$ dvc metrics show
Path                    Value
metrics/eval_metrics.json:
  accuracy              0.8234
  precision             0.8156
  recall                0.8234
  f1_score              0.8187
```

### Experiment Tracking
- **Pipeline DAG**: Visual representation of your ML pipeline
- **Metrics History**: Track performance across experiments
- **Data Lineage**: See how data flows through your pipeline
- **Reproducibility**: Recreate any experiment exactly

---

## Pros & Cons

### ✅ Pros
- **Git Integration**: Works seamlessly with existing Git workflows
- **Reproducibility**: Ensures experiments can be reproduced exactly
- **Storage Agnostic**: Supports multiple cloud and local storage options
- **Pipeline Management**: Automates complex ML workflows
- **Lightweight**: Minimal overhead compared to full MLOps platforms

### ❌ Cons
- **Learning Curve**: Requires understanding of both Git and DVC concepts
- **Command Line**: Primarily CLI-based, limited GUI options
- **Storage Costs**: Large datasets require cloud storage
- **Complexity**: Can be overkill for simple projects

---

## Conclusion

DVC is perfect for teams that want **Git-like versioning** for data and **reproducible ML pipelines**. Choose DVC when you need:

- **Data versioning** for large datasets
- **Reproducible ML workflows** across team members
- **Experiment tracking** without vendor lock-in
- **Integration** with existing Git workflows

DVC bridges the gap between traditional software development practices and machine learning workflows, making it easier to collaborate on ML projects.

**What You've Achieved:**
✅ Set up data versioning with DVC  
✅ Created reproducible ML pipelines  
✅ Configured remote storage for datasets  
✅ Implemented experiment tracking  
✅ Established collaborative ML workflows
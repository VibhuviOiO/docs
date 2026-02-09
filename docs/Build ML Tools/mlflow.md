---
sidebar_position: 5
title: MLflow
description: MLflow is an open-source platform for managing the complete machine learning lifecycle, including experiment tracking, model packaging, and deployment.
slug: /BuildMLTools/MLflow
keywords:
  - MLflow
  - ML lifecycle
  - experiment tracking
  - model management
  - ML deployment
  - model registry
  - MLOps
  - machine learning
---

# 🚀 ML Lifecycle Management with MLflow

**MLflow** is an **open-source** platform for managing the **complete machine learning lifecycle**. Perfect for **experiment tracking**, **model packaging**, **deployment**, and **collaboration** with support for **multiple ML frameworks** and **cloud platforms**.

## Key Features

- **Experiment Tracking**: Log parameters, metrics, and artifacts
- **Model Registry**: Centralized model store with versioning
- **Model Deployment**: Deploy models to various platforms
- **Project Packaging**: Reproducible ML projects
- **Multi-framework**: Works with any ML library

## Use Cases

- **Experiment Management**: Track and compare ML experiments
- **Model Versioning**: Manage model lifecycle and versions
- **Team Collaboration**: Share experiments and models across teams
- **Production Deployment**: Deploy models to production environments

---

## 🧰 Prerequisites

- **Python 3.8+** installed
- **Docker & Docker Compose** for containerized deployment
- **Cloud storage** (AWS S3, Azure Blob, GCS) for artifact storage
- **Database** (PostgreSQL, MySQL) for metadata storage

---

## 🔧 Step 1: Setup MLflow Development Environment

Create a Docker Compose setup for MLflow:

```yaml
version: '3.8'

services:
  # PostgreSQL for MLflow metadata
  postgres:
    image: postgres:15
    container_name: mlflow-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=mlflow
      - POSTGRES_USER=mlflow
      - POSTGRES_PASSWORD=mlflow123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # MinIO for artifact storage
  minio:
    image: minio/minio:latest
    container_name: mlflow-minio
    restart: unless-stopped
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"

  # MLflow Tracking Server
  mlflow-server:
    image: python:3.10-slim
    container_name: mlflow-server
    restart: unless-stopped
    depends_on:
      - postgres
      - minio
    environment:
      - MLFLOW_S3_ENDPOINT_URL=http://minio:9000
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin123
    ports:
      - "5000:5000"
    volumes:
      - ./mlflow:/mlflow
    working_dir: /mlflow
    command: >
      bash -c "
        pip install mlflow[extras] psycopg2-binary boto3 &&
        mlflow server 
        --backend-store-uri postgresql://mlflow:mlflow123@postgres:5432/mlflow
        --default-artifact-root s3://mlflow-artifacts/
        --host 0.0.0.0
        --port 5000
      "

  # MLflow Development Environment
  mlflow-dev:
    image: python:3.10-slim
    container_name: mlflow-dev
    restart: unless-stopped
    depends_on:
      - mlflow-server
    environment:
      - MLFLOW_TRACKING_URI=http://mlflow-server:5000
      - MLFLOW_S3_ENDPOINT_URL=http://minio:9000
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin123
    ports:
      - "8888:8888"  # Jupyter
    volumes:
      - ./notebooks:/workspace/notebooks
      - ./models:/workspace/models
      - ./data:/workspace/data
      - ./experiments:/workspace/experiments
    working_dir: /workspace
    command: >
      bash -c "
        pip install mlflow[extras] jupyter jupyterlab &&
        pip install scikit-learn pandas numpy matplotlib seaborn &&
        pip install xgboost lightgbm tensorflow torch &&
        jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --allow-root
      "

volumes:
  postgres_data:
  minio_data:
```

---

## 🏗️ Step 2: Install MLflow Locally

Install MLflow with all dependencies:

```bash
# Install MLflow with extras
pip install mlflow[extras]

# Install additional ML libraries
pip install scikit-learn pandas numpy matplotlib seaborn
pip install xgboost lightgbm tensorflow torch

# Install cloud storage dependencies
pip install boto3  # AWS S3
pip install azure-storage-blob  # Azure Blob
pip install google-cloud-storage  # Google Cloud Storage

# Verify installation
mlflow --version
```

---

## 📁 Step 3: Create Your First MLflow Experiment

Create a comprehensive ML experiment with tracking:

```python
import mlflow
import mlflow.sklearn
import mlflow.xgboost
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.datasets import load_wine
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set MLflow tracking URI
mlflow.set_tracking_uri("http://localhost:5000")

# Create or set experiment
experiment_name = "wine-classification-comparison"
mlflow.set_experiment(experiment_name)

# Load and prepare data
def load_and_prepare_data():
    """Load and prepare the wine dataset"""
    wine = load_wine()
    X, y = wine.data, wine.target
    feature_names = wine.feature_names
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    return X_train, X_test, y_train, y_test, feature_names

# Model evaluation function
def evaluate_model(model, X_test, y_test):
    """Evaluate model and return metrics"""
    y_pred = model.predict(X_test)
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, average='weighted'),
        'recall': recall_score(y_test, y_pred, average='weighted'),
        'f1_score': f1_score(y_test, y_pred, average='weighted')
    }
    
    return metrics, y_pred

# Train Random Forest with MLflow tracking
def train_random_forest(X_train, X_test, y_train, y_test):
    """Train Random Forest with hyperparameter tuning"""
    
    with mlflow.start_run(run_name="random_forest_tuned"):
        # Log dataset info
        mlflow.log_param("dataset", "wine")
        mlflow.log_param("train_samples", len(X_train))
        mlflow.log_param("test_samples", len(X_test))
        mlflow.log_param("features", X_train.shape[1])
        
        # Hyperparameter tuning
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [5, 10, 15],
            'min_samples_split': [2, 5, 10]
        }
        
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
        grid_search.fit(X_train, y_train)
        
        # Get best model
        best_rf = grid_search.best_estimator_
        
        # Log hyperparameters
        for param, value in grid_search.best_params_.items():
            mlflow.log_param(param, value)
        
        # Evaluate model
        metrics, y_pred = evaluate_model(best_rf, X_test, y_test)
        
        # Log metrics
        for metric_name, metric_value in metrics.items():
            mlflow.log_metric(metric_name, metric_value)
        
        # Log model
        mlflow.sklearn.log_model(
            best_rf, 
            "random_forest_model",
            registered_model_name="wine_classifier_rf"
        )
        
        # Create and log feature importance plot
        feature_importance = pd.DataFrame({
            'feature': range(len(best_rf.feature_importances_)),
            'importance': best_rf.feature_importances_
        }).sort_values('importance', ascending=False)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
        plt.title('Top 10 Feature Importances - Random Forest')
        plt.tight_layout()
        plt.savefig('rf_feature_importance.png')
        mlflow.log_artifact('rf_feature_importance.png')
        plt.close()
        
        return best_rf, metrics

# Train XGBoost with MLflow tracking
def train_xgboost(X_train, X_test, y_train, y_test):
    """Train XGBoost with hyperparameter tuning"""
    
    with mlflow.start_run(run_name="xgboost_tuned"):
        # Log dataset info
        mlflow.log_param("dataset", "wine")
        mlflow.log_param("train_samples", len(X_train))
        mlflow.log_param("test_samples", len(X_test))
        mlflow.log_param("features", X_train.shape[1])
        
        # Hyperparameter tuning
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [3, 6, 9],
            'learning_rate': [0.01, 0.1, 0.2],
            'subsample': [0.8, 0.9, 1.0]
        }
        
        xgb_model = xgb.XGBClassifier(random_state=42, eval_metric='mlogloss')
        grid_search = GridSearchCV(xgb_model, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
        grid_search.fit(X_train, y_train)
        
        # Get best model
        best_xgb = grid_search.best_estimator_
        
        # Log hyperparameters
        for param, value in grid_search.best_params_.items():
            mlflow.log_param(param, value)
        
        # Evaluate model
        metrics, y_pred = evaluate_model(best_xgb, X_test, y_test)
        
        # Log metrics
        for metric_name, metric_value in metrics.items():
            mlflow.log_metric(metric_name, metric_value)
        
        # Log model
        mlflow.xgboost.log_model(
            best_xgb, 
            "xgboost_model",
            registered_model_name="wine_classifier_xgb"
        )
        
        # Create and log feature importance plot
        feature_importance = pd.DataFrame({
            'feature': range(len(best_xgb.feature_importances_)),
            'importance': best_xgb.feature_importances_
        }).sort_values('importance', ascending=False)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
        plt.title('Top 10 Feature Importances - XGBoost')
        plt.tight_layout()
        plt.savefig('xgb_feature_importance.png')
        mlflow.log_artifact('xgb_feature_importance.png')
        plt.close()
        
        return best_xgb, metrics

# Main execution
if __name__ == "__main__":
    print("🚀 Starting MLflow experiment...")
    
    # Load data
    X_train, X_test, y_train, y_test, feature_names = load_and_prepare_data()
    print(f"📊 Dataset loaded: {X_train.shape[0]} training samples, {X_test.shape[0]} test samples")
    
    # Train models
    print("🌲 Training Random Forest...")
    rf_model, rf_metrics = train_random_forest(X_train, X_test, y_train, y_test)
    
    print("🚀 Training XGBoost...")
    xgb_model, xgb_metrics = train_xgboost(X_train, X_test, y_train, y_test)
    
    # Compare results
    print("\n📈 Model Comparison:")
    print("Random Forest:")
    for metric, value in rf_metrics.items():
        print(f"  {metric}: {value:.4f}")
    
    print("XGBoost:")
    for metric, value in xgb_metrics.items():
        print(f"  {metric}: {value:.4f}")
    
    print("\n✅ Experiments completed! Check MLflow UI at http://localhost:5000")
```

---

## ▶️ Step 4: Model Registry and Deployment

```python
import mlflow
from mlflow.tracking import MlflowClient
import pandas as pd
import numpy as np

# Initialize MLflow client
client = MlflowClient()

# Model registry operations
def manage_model_registry():
    """Demonstrate model registry operations"""
    
    # List registered models
    registered_models = client.search_registered_models()
    print("📋 Registered Models:")
    for model in registered_models:
        print(f"  - {model.name}")
    
    # Get model versions
    model_name = "wine_classifier_rf"
    model_versions = client.search_model_versions(f"name='{model_name}'")
    
    print(f"\n📦 Versions for {model_name}:")
    for version in model_versions:
        print(f"  Version {version.version}: {version.current_stage}")
    
    # Transition model to staging
    if model_versions:
        latest_version = model_versions[0]
        client.transition_model_version_stage(
            name=model_name,
            version=latest_version.version,
            stage="Staging"
        )
        print(f"✅ Model version {latest_version.version} transitioned to Staging")

# Model serving function
def serve_model_predictions():
    """Load and serve model predictions"""
    
    # Load model from registry
    model_name = "wine_classifier_rf"
    stage = "Staging"
    
    model_uri = f"models:/{model_name}/{stage}"
    loaded_model = mlflow.sklearn.load_model(model_uri)
    
    # Sample prediction data
    sample_data = np.array([[
        13.20, 1.78, 2.14, 11.2, 100, 2.65, 2.76, 0.26, 1.28, 4.38, 1.05, 3.40, 1050
    ]])
    
    # Make prediction
    prediction = loaded_model.predict(sample_data)
    prediction_proba = loaded_model.predict_proba(sample_data)
    
    print(f"🔮 Prediction: {prediction[0]}")
    print(f"📊 Prediction Probabilities: {prediction_proba[0]}")
    
    return prediction, prediction_proba

# Model deployment with MLflow
def deploy_model_locally():
    """Deploy model as REST API locally"""
    
    model_name = "wine_classifier_rf"
    stage = "Staging"
    
    # This would typically be run from command line
    deployment_command = f"""
    mlflow models serve \\
        --model-uri models:/{model_name}/{stage} \\
        --host 0.0.0.0 \\
        --port 8080 \\
        --no-conda
    """
    
    print("🚀 To deploy model as REST API, run:")
    print(deployment_command)
    
    # Example curl command for testing
    curl_command = """
    curl -X POST http://localhost:8080/invocations \\
        -H 'Content-Type: application/json' \\
        -d '{
            "dataframe_split": {
                "columns": ["feature_0", "feature_1", "feature_2", "feature_3", "feature_4", "feature_5", "feature_6", "feature_7", "feature_8", "feature_9", "feature_10", "feature_11", "feature_12"],
                "data": [[13.20, 1.78, 2.14, 11.2, 100, 2.65, 2.76, 0.26, 1.28, 4.38, 1.05, 3.40, 1050]]
            }
        }'
    """
    
    print("\n🧪 Test deployment with:")
    print(curl_command)

if __name__ == "__main__":
    print("🔧 Managing model registry...")
    manage_model_registry()
    
    print("\n🎯 Serving model predictions...")
    serve_model_predictions()
    
    print("\n🚀 Model deployment instructions...")
    deploy_model_locally()
```

---

## 📊 Step 5: MLflow Projects and Reproducibility

Create an MLproject file for reproducible experiments:

```yaml
# MLproject
name: wine-classification

conda_env: conda.yaml

entry_points:
  main:
    parameters:
      max_depth: {type: int, default: 10}
      n_estimators: {type: int, default: 100}
      test_size: {type: float, default: 0.2}
    command: "python train.py --max-depth {max_depth} --n-estimators {n_estimators} --test-size {test_size}"
  
  evaluate:
    parameters:
      model_uri: {type: str}
    command: "python evaluate.py --model-uri {model_uri}"
```

Create a conda environment file:

```yaml
# conda.yaml
name: wine-classification
channels:
  - conda-forge
dependencies:
  - python=3.10
  - pip
  - pip:
    - mlflow[extras]
    - scikit-learn
    - pandas
    - numpy
    - matplotlib
    - seaborn
    - xgboost
```

---

## 🔍 What You'll See

### MLflow UI Dashboard
- **Experiments**: List of all experiments with run comparisons
- **Models**: Registered models with version history
- **Artifacts**: Stored model files, plots, and data
- **Metrics**: Interactive charts showing model performance

### Experiment Tracking Output
```bash
🚀 Starting MLflow experiment...
📊 Dataset loaded: 142 training samples, 36 test samples

🌲 Training Random Forest...
Best parameters: {'max_depth': 10, 'min_samples_split': 2, 'n_estimators': 200}

🚀 Training XGBoost...
Best parameters: {'learning_rate': 0.1, 'max_depth': 6, 'n_estimators': 200, 'subsample': 0.9}

📈 Model Comparison:
Random Forest:
  accuracy: 0.9722
  precision: 0.9733
  recall: 0.9722
  f1_score: 0.9722

XGBoost:
  accuracy: 0.9444
  precision: 0.9500
  recall: 0.9444
  f1_score: 0.9433

✅ Experiments completed! Check MLflow UI at http://localhost:5000
```

### Model Registry Operations
```bash
🔧 Managing model registry...
📋 Registered Models:
  - wine_classifier_rf
  - wine_classifier_xgb

📦 Versions for wine_classifier_rf:
  Version 1: None
  Version 2: Staging

✅ Model version 2 transitioned to Staging
```

---

## Pros & Cons

### ✅ Pros
- **Complete ML Lifecycle**: Covers experiment tracking to deployment
- **Framework Agnostic**: Works with any ML library
- **Open Source**: No vendor lock-in, self-hosted option
- **Model Registry**: Centralized model management and versioning
- **Reproducibility**: Ensures experiments can be reproduced

### ❌ Cons
- **Setup Complexity**: Requires infrastructure setup for production
- **Storage Costs**: Artifacts and models require storage space
- **Learning Curve**: Requires understanding of MLOps concepts
- **UI Limitations**: Web UI has limited customization options

---

## Conclusion

MLflow is the **comprehensive solution** for **ML lifecycle management**. Choose MLflow when you need:

- **End-to-end ML workflow** management
- **Experiment tracking** and comparison
- **Model versioning** and registry
- **Reproducible ML projects** across teams

MLflow bridges the gap between experimentation and production, making it easier to manage the complete machine learning lifecycle.

**What You've Achieved:**
✅ Set up a complete MLflow environment with tracking server  
✅ Implemented comprehensive experiment tracking  
✅ Created model registry with version management  
✅ Built reproducible ML projects with MLproject files  
✅ Established model deployment and serving capabilities
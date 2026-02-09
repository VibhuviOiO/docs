# 🚀 Google Vertex AI - Unified ML Platform

Google Vertex AI is a comprehensive machine learning platform that brings together Google Cloud's ML offerings into a unified API, client library, and user interface. It provides tools for every step of the ML workflow, from data preparation to model deployment and monitoring.

## 📋 Prerequisites

- Google Cloud Platform account with billing enabled
- `gcloud` CLI installed and configured
- Python 3.7+ with `google-cloud-aiplatform` library
- Basic understanding of machine learning concepts
- Docker (for custom training containers)

## 🛠️ Installation & Setup

### Install Google Cloud SDK
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize and authenticate
gcloud init
gcloud auth application-default login
```

### Install Vertex AI SDK
```bash
# Install Python SDK
pip install google-cloud-aiplatform

# Install additional ML libraries
pip install pandas scikit-learn tensorflow torch transformers
```

### Enable Required APIs
```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
```

## 🏗️ Basic Configuration

### Set Environment Variables
```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export BUCKET_NAME="your-ml-bucket"

# Create storage bucket
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME
```

### Initialize Vertex AI
```python
from google.cloud import aiplatform

# Initialize Vertex AI
aiplatform.init(
    project="your-project-id",
    location="us-central1",
    staging_bucket="gs://your-ml-bucket"
)
```

## 🚀 Core Features

### 1. AutoML Training

#### Image Classification
```python
from google.cloud import aiplatform

# Create AutoML image dataset
dataset = aiplatform.ImageDataset.create(
    display_name="image-classification-dataset",
    gcs_source="gs://your-bucket/image-data.csv",
    import_schema_uri=aiplatform.schema.dataset.ioformat.image.single_label_classification,
)

# Create and run AutoML training job
job = aiplatform.AutoMLImageTrainingJob(
    display_name="automl-image-training",
    prediction_type="classification",
    multi_label=False,
)

model = job.run(
    dataset=dataset,
    model_display_name="automl-image-model",
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=8000,
)
```

#### Tabular Data
```python
# Create tabular dataset
dataset = aiplatform.TabularDataset.create(
    display_name="tabular-dataset",
    gcs_source="gs://your-bucket/tabular-data.csv",
)

# AutoML tabular training
job = aiplatform.AutoMLTabularTrainingJob(
    display_name="automl-tabular-training",
    optimization_prediction_type="classification",
    optimization_objective="minimize-log-loss",
)

model = job.run(
    dataset=dataset,
    target_column="target",
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=1000,
)
```

### 2. Custom Training

#### Custom Training Script
```python
# training_script.py
import argparse
import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
from google.cloud import storage

def train_model():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-path', type=str, required=True)
    parser.add_argument('--model-dir', type=str, required=True)
    args = parser.parse_args()
    
    # Load data
    data = pd.read_csv(args.data_path)
    X = data.drop('target', axis=1)
    y = data['target']
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save model
    os.makedirs(args.model_dir, exist_ok=True)
    joblib.dump(model, os.path.join(args.model_dir, 'model.joblib'))
    
    print(f"Model saved to {args.model_dir}")

if __name__ == "__main__":
    train_model()
```

#### Submit Custom Training Job
```python
from google.cloud import aiplatform

# Create custom training job
job = aiplatform.CustomTrainingJob(
    display_name="custom-training-job",
    script_path="training_script.py",
    container_uri="gcr.io/cloud-aiplatform/training/scikit-learn-cpu.0-23:latest",
    requirements=["pandas", "scikit-learn", "joblib"],
    model_serving_container_image_uri="gcr.io/cloud-aiplatform/prediction/sklearn-cpu.0-23:latest",
)

# Run training job
model = job.run(
    dataset=dataset,
    model_display_name="custom-sklearn-model",
    args=[
        "--data-path", "/gcs/your-bucket/training-data.csv",
        "--model-dir", "/gcs/your-bucket/model-output"
    ],
    replica_count=1,
    machine_type="n1-standard-4",
    accelerator_type="NVIDIA_TESLA_K80",
    accelerator_count=1,
)
```

### 3. Model Deployment

#### Deploy to Endpoint
```python
# Create endpoint
endpoint = aiplatform.Endpoint.create(
    display_name="prediction-endpoint",
    project=PROJECT_ID,
    location=REGION,
)

# Deploy model to endpoint
model.deploy(
    endpoint=endpoint,
    deployed_model_display_name="deployed-model",
    machine_type="n1-standard-2",
    min_replica_count=1,
    max_replica_count=3,
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
)
```

#### Batch Prediction
```python
# Create batch prediction job
batch_prediction_job = aiplatform.BatchPredictionJob.create(
    job_display_name="batch-prediction-job",
    model_name=model.resource_name,
    instances_format="csv",
    gcs_source="gs://your-bucket/prediction-input.csv",
    gcs_destination_prefix="gs://your-bucket/predictions/",
    machine_type="n1-standard-4",
)

# Wait for completion
batch_prediction_job.wait()
```

### 4. Online Predictions

```python
# Make online predictions
instances = [
    {"feature1": 1.0, "feature2": 2.0, "feature3": 3.0},
    {"feature1": 4.0, "feature2": 5.0, "feature3": 6.0},
]

predictions = endpoint.predict(instances=instances)
print(predictions)
```

## 🔧 Advanced Features

### 1. Hyperparameter Tuning

```python
from google.cloud.aiplatform import hyperparameter_tuning as hpt

# Define hyperparameter tuning job
hp_job = aiplatform.HyperparameterTuningJob(
    display_name="hp-tuning-job",
    custom_job=job,
    metric_spec={
        "accuracy": "maximize",
    },
    parameter_spec={
        "learning_rate": hpt.DoubleParameterSpec(
            min=0.001, max=0.1, scale="log"
        ),
        "batch_size": hpt.DiscreteParameterSpec(
            values=[16, 32, 64, 128]
        ),
    },
    max_trial_count=20,
    parallel_trial_count=5,
)

# Run hyperparameter tuning
hp_job.run()
```

### 2. Model Monitoring

```python
# Create model monitoring job
monitoring_job = aiplatform.ModelDeploymentMonitoringJob.create(
    display_name="model-monitoring",
    endpoint=endpoint,
    deployed_model_ids=[deployed_model.id],
    alert_config=aiplatform.model_monitoring.AlertConfig(
        email_alert_config=aiplatform.model_monitoring.EmailAlertConfig(
            user_emails=["admin@company.com"]
        )
    ),
    schedule_config=aiplatform.model_monitoring.ScheduleConfig(cron="0 */6 * * *"),
    logging_sampling_strategy=aiplatform.model_monitoring.RandomSampleConfig(
        sample_rate=0.1
    ),
)
```

### 3. Feature Store

```python
# Create feature store
feature_store = aiplatform.Featurestore.create(
    featurestore_id="my-feature-store",
    online_store_fixed_node_count=1,
)

# Create entity type
entity_type = feature_store.create_entity_type(
    entity_type_id="user",
    description="User entity for recommendation system",
)

# Create features
features = [
    aiplatform.Feature(
        feature_id="age",
        value_type="INT64",
        description="User age",
    ),
    aiplatform.Feature(
        feature_id="location",
        value_type="STRING",
        description="User location",
    ),
]

entity_type.create_features(features)
```

### 4. Pipelines with Kubeflow

```python
from kfp.v2 import dsl
from kfp.v2.dsl import component, pipeline

@component(
    packages_to_install=["pandas", "scikit-learn"],
    base_image="python:3.8"
)
def train_model_component(
    dataset_path: str,
    model_path: str,
) -> str:
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    import joblib
    
    # Load and train
    data = pd.read_csv(dataset_path)
    X = data.drop('target', axis=1)
    y = data['target']
    
    model = RandomForestClassifier()
    model.fit(X, y)
    
    # Save model
    joblib.dump(model, model_path)
    return model_path

@pipeline(name="ml-training-pipeline")
def ml_pipeline(
    dataset_path: str = "gs://your-bucket/data.csv",
    model_path: str = "gs://your-bucket/model.joblib"
):
    train_task = train_model_component(
        dataset_path=dataset_path,
        model_path=model_path
    )

# Compile and run pipeline
from kfp.v2 import compiler

compiler.Compiler().compile(
    pipeline_func=ml_pipeline,
    package_path="ml_pipeline.json"
)

# Submit pipeline
job = aiplatform.PipelineJob(
    display_name="ml-training-pipeline",
    template_path="ml_pipeline.json",
    pipeline_root="gs://your-bucket/pipeline-root",
)

job.run()
```

## 🐳 Docker Configuration

### Custom Training Container
```dockerfile
# Dockerfile
FROM gcr.io/deeplearning-platform-release/base-cpu

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY training_script.py .
COPY model_utils.py .

ENTRYPOINT ["python", "training_script.py"]
```

### Build and Push Container
```bash
# Build container
docker build -t gcr.io/$PROJECT_ID/custom-trainer:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/custom-trainer:latest
```

## 📊 Monitoring & Logging

### Model Performance Monitoring
```python
# Set up model monitoring
from google.cloud import aiplatform_v1

client = aiplatform_v1.ModelServiceClient()

# Get model evaluation metrics
evaluations = client.list_model_evaluations(
    parent=model.resource_name
)

for evaluation in evaluations:
    print(f"Evaluation: {evaluation.display_name}")
    print(f"Metrics: {evaluation.metrics}")
```

### Logging Configuration
```python
import logging
from google.cloud import logging as cloud_logging

# Set up Cloud Logging
cloud_logging_client = cloud_logging.Client()
cloud_logging_client.setup_logging()

# Use standard logging
logging.info("Training started")
logging.error("Training failed with error: %s", error_message)
```

## 🔒 Security Best Practices

### IAM Configuration
```bash
# Create service account
gcloud iam service-accounts create vertex-ai-sa \
    --display-name="Vertex AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vertex-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vertex-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### Encryption Configuration
```python
# Use customer-managed encryption keys
from google.cloud.aiplatform import encryption_spec

encryption_spec = encryption_spec.EncryptionSpec(
    kms_key_name="projects/your-project/locations/us-central1/keyRings/your-ring/cryptoKeys/your-key"
)

# Apply to training job
job = aiplatform.CustomTrainingJob(
    display_name="encrypted-training",
    script_path="training_script.py",
    container_uri="gcr.io/your-project/trainer:latest",
    encryption_spec=encryption_spec,
)
```

## 🚀 Production Deployment

### Multi-Region Deployment
```python
# Deploy to multiple regions
regions = ["us-central1", "europe-west1", "asia-southeast1"]

for region in regions:
    aiplatform.init(project=PROJECT_ID, location=region)
    
    endpoint = aiplatform.Endpoint.create(
        display_name=f"production-endpoint-{region}",
    )
    
    model.deploy(
        endpoint=endpoint,
        deployed_model_display_name=f"model-{region}",
        machine_type="n1-standard-4",
        min_replica_count=2,
        max_replica_count=10,
    )
```

### A/B Testing Setup
```python
# Deploy multiple model versions
model_v1.deploy(
    endpoint=endpoint,
    deployed_model_display_name="model-v1",
    traffic_percentage=80,
    machine_type="n1-standard-2",
)

model_v2.deploy(
    endpoint=endpoint,
    deployed_model_display_name="model-v2",
    traffic_percentage=20,
    machine_type="n1-standard-2",
)
```

## 📈 Performance Optimization

### Batch Size Optimization
```python
# Optimize batch predictions
batch_prediction_job = aiplatform.BatchPredictionJob.create(
    job_display_name="optimized-batch-prediction",
    model_name=model.resource_name,
    instances_format="jsonl",
    gcs_source="gs://your-bucket/large-dataset.jsonl",
    gcs_destination_prefix="gs://your-bucket/predictions/",
    machine_type="n1-highmem-8",
    starting_replica_count=5,
    max_replica_count=20,
)
```

### GPU Acceleration
```python
# Use GPU for training
job = aiplatform.CustomTrainingJob(
    display_name="gpu-training",
    script_path="training_script.py",
    container_uri="gcr.io/deeplearning-platform-release/pytorch-gpu.1-9",
)

model = job.run(
    replica_count=1,
    machine_type="n1-standard-8",
    accelerator_type="NVIDIA_TESLA_V100",
    accelerator_count=2,
)
```

## 🔍 Troubleshooting

### Common Issues

1. **Training Job Failures**
```bash
# Check job logs
gcloud ai custom-jobs describe JOB_ID --region=REGION

# View detailed logs
gcloud logging read "resource.type=ml_job AND resource.labels.job_id=JOB_ID"
```

2. **Prediction Errors**
```python
# Test endpoint health
try:
    predictions = endpoint.predict(instances=test_instances)
    print("Endpoint is healthy")
except Exception as e:
    print(f"Endpoint error: {e}")
```

3. **Resource Quotas**
```bash
# Check quotas
gcloud compute project-info describe --project=$PROJECT_ID

# Request quota increase
gcloud alpha compute quotas list --filter="service:compute.googleapis.com"
```

## 📚 Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vertex AI Python SDK](https://googleapis.dev/python/aiplatform/latest/)
- [Vertex AI Samples](https://github.com/GoogleCloudPlatform/vertex-ai-samples)
- [MLOps with Vertex AI](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

Google Vertex AI provides a comprehensive platform for the entire ML lifecycle, from experimentation to production deployment, with enterprise-grade security and scalability features.
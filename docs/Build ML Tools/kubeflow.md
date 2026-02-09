---
sidebar_position: 7
title: Kubeflow
description: Kubeflow is a machine learning toolkit for Kubernetes that enables scalable ML workflows, model training, and deployment on Kubernetes clusters.
slug: /BuildMLTools/Kubeflow
keywords:
  - Kubeflow
  - Kubernetes ML
  - ML pipelines
  - model training
  - ML workflows
  - Kubernetes
  - distributed training
  - MLOps
---

# 🚀 Scalable ML Workflows with Kubeflow

**Kubeflow** is a **machine learning toolkit** for **Kubernetes** that enables **scalable ML workflows**, **distributed training**, and **model deployment** on Kubernetes clusters. Perfect for **enterprise ML** with **pipeline orchestration**, **experiment tracking**, and **multi-user** environments.

## Key Features

- **ML Pipelines**: Build and orchestrate complex ML workflows
- **Distributed Training**: Scale training across multiple nodes and GPUs
- **Model Serving**: Deploy models with KServe for production inference
- **Multi-User**: Secure multi-tenant ML platform
- **Notebook Servers**: Managed Jupyter environments

## Use Cases

- **Enterprise ML**: Large-scale machine learning operations
- **Distributed Training**: Multi-GPU and multi-node model training
- **ML Pipeline Orchestration**: Complex workflow management
- **Model Deployment**: Production-ready model serving

---

## 🧰 Prerequisites

- **Kubernetes cluster** (1.21+) with sufficient resources
- **kubectl** configured for cluster access
- **Helm 3** for package management
- **Docker** for container builds
- **16GB+ RAM** and **4+ CPUs** recommended per node

---

## 🔧 Step 1: Install Kubeflow

### Install Kubeflow using Kustomize

```bash
# Install kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
sudo mv kustomize /usr/local/bin/

# Clone Kubeflow manifests
git clone https://github.com/kubeflow/manifests.git
cd manifests

# Install Kubeflow components
while ! kustomize build example | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l 'app in (ml-pipeline,metadata-grpc-server)' --timeout=1800s -n kubeflow
```

### Alternative: Install with Kubeflow Operator

```yaml
# kubeflow-operator.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kubeflow
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubeflow-operator
  namespace: kubeflow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kubeflow-operator
  template:
    metadata:
      labels:
        app: kubeflow-operator
    spec:
      containers:
      - name: operator
        image: kubeflownotebookswg/kubeflow-operator:latest
        env:
        - name: WATCH_NAMESPACE
          value: ""
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: OPERATOR_NAME
          value: "kubeflow-operator"
```

---

## 🏗️ Step 2: Setup Kubeflow Development Environment

Create a comprehensive development setup:

```yaml
# kubeflow-dev-setup.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kubeflow-dev
---
# Jupyter Notebook Server
apiVersion: kubeflow.org/v1
kind: Notebook
metadata:
  name: ml-notebook
  namespace: kubeflow-dev
spec:
  template:
    spec:
      containers:
      - name: notebook
        image: jupyter/tensorflow-notebook:latest
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
            nvidia.com/gpu: "1"
          limits:
            cpu: "4"
            memory: "8Gi"
            nvidia.com/gpu: "1"
        volumeMounts:
        - name: workspace
          mountPath: /home/jovyan/work
        - name: data
          mountPath: /home/jovyan/data
        env:
        - name: JUPYTER_ENABLE_LAB
          value: "yes"
      volumes:
      - name: workspace
        persistentVolumeClaim:
          claimName: workspace-pvc
      - name: data
        persistentVolumeClaim:
          claimName: data-pvc
---
# Persistent Volume Claims
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: workspace-pvc
  namespace: kubeflow-dev
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: kubeflow-dev
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
```

Apply the configuration:

```bash
kubectl apply -f kubeflow-dev-setup.yaml

# Check notebook status
kubectl get notebooks -n kubeflow-dev

# Port forward to access notebook
kubectl port-forward -n kubeflow-dev service/ml-notebook 8888:80
```

---

## 📁 Step 3: Create Your First ML Pipeline

Create a comprehensive ML pipeline using Kubeflow Pipelines:

```python
# ml_pipeline.py
import kfp
from kfp import dsl
from kfp.components import create_component_from_func
from typing import NamedTuple

# Component 1: Data Preprocessing
@create_component_from_func
def preprocess_data(
    input_data_path: str,
    output_data_path: str,
    test_size: float = 0.2
) -> NamedTuple('Outputs', [('train_data_path', str), ('test_data_path', str), ('num_features', int)]):
    """Preprocess data for ML training"""
    import pandas as pd
    import numpy as np
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import joblib
    import os
    
    # Load data
    print(f"Loading data from {input_data_path}")
    df = pd.read_csv(input_data_path)
    
    # Basic preprocessing
    df = df.dropna()
    
    # Separate features and target
    X = df.drop('target', axis=1)
    y = df['target']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Create output directory
    os.makedirs(output_data_path, exist_ok=True)
    
    # Save processed data
    train_data_path = os.path.join(output_data_path, 'train_data.npz')
    test_data_path = os.path.join(output_data_path, 'test_data.npz')
    
    np.savez(train_data_path, X=X_train_scaled, y=y_train.values)
    np.savez(test_data_path, X=X_test_scaled, y=y_test.values)
    
    # Save scaler
    scaler_path = os.path.join(output_data_path, 'scaler.pkl')
    joblib.dump(scaler, scaler_path)
    
    print(f"Preprocessed data saved to {output_data_path}")
    print(f"Number of features: {X_train_scaled.shape[1]}")
    print(f"Training samples: {X_train_scaled.shape[0]}")
    print(f"Test samples: {X_test_scaled.shape[0]}")
    
    return (train_data_path, test_data_path, X_train_scaled.shape[1])

# Component 2: Model Training
@create_component_from_func
def train_model(
    train_data_path: str,
    model_output_path: str,
    model_type: str = 'random_forest',
    n_estimators: int = 100,
    max_depth: int = 10
) -> NamedTuple('Outputs', [('model_path', str), ('train_accuracy', float)]):
    """Train ML model"""
    import numpy as np
    import joblib
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.metrics import accuracy_score
    import os
    
    # Load training data
    print(f"Loading training data from {train_data_path}")
    data = np.load(train_data_path)
    X_train, y_train = data['X'], data['y']
    
    # Initialize model based on type
    if model_type == 'random_forest':
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42
        )
    elif model_type == 'logistic_regression':
        model = LogisticRegression(random_state=42, max_iter=1000)
    elif model_type == 'svm':
        model = SVC(random_state=42, probability=True)
    else:
        raise ValueError(f"Unsupported model type: {model_type}")
    
    # Train model
    print(f"Training {model_type} model...")
    model.fit(X_train, y_train)
    
    # Calculate training accuracy
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    
    # Save model
    os.makedirs(model_output_path, exist_ok=True)
    model_path = os.path.join(model_output_path, f'{model_type}_model.pkl')
    joblib.dump(model, model_path)
    
    print(f"Model saved to {model_path}")
    print(f"Training accuracy: {train_accuracy:.4f}")
    
    return (model_path, train_accuracy)

# Component 3: Model Evaluation
@create_component_from_func
def evaluate_model(
    model_path: str,
    test_data_path: str,
    metrics_output_path: str
) -> NamedTuple('Outputs', [('test_accuracy', float), ('precision', float), ('recall', float)]):
    """Evaluate trained model"""
    import numpy as np
    import joblib
    from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report
    import json
    import os
    
    # Load model and test data
    print(f"Loading model from {model_path}")
    model = joblib.load(model_path)
    
    print(f"Loading test data from {test_data_path}")
    data = np.load(test_data_path)
    X_test, y_test = data['X'], data['y']
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    test_accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    
    # Generate detailed report
    report = classification_report(y_test, y_pred, output_dict=True)
    
    # Save metrics
    os.makedirs(metrics_output_path, exist_ok=True)
    metrics_file = os.path.join(metrics_output_path, 'evaluation_metrics.json')
    
    metrics = {
        'test_accuracy': test_accuracy,
        'precision': precision,
        'recall': recall,
        'detailed_report': report
    }
    
    with open(metrics_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"Evaluation completed!")
    print(f"Test accuracy: {test_accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    return (test_accuracy, precision, recall)

# Component 4: Model Deployment
@create_component_from_func
def deploy_model(
    model_path: str,
    model_name: str,
    namespace: str = 'kubeflow-user-example-com'
) -> str:
    """Deploy model using KServe"""
    import yaml
    import subprocess
    import os
    
    # Create InferenceService manifest
    inference_service = {
        'apiVersion': 'serving.kserve.io/v1beta1',
        'kind': 'InferenceService',
        'metadata': {
            'name': model_name,
            'namespace': namespace
        },
        'spec': {
            'predictor': {
                'sklearn': {
                    'storageUri': model_path,
                    'resources': {
                        'requests': {
                            'cpu': '100m',
                            'memory': '256Mi'
                        },
                        'limits': {
                            'cpu': '1',
                            'memory': '1Gi'
                        }
                    }
                }
            }
        }
    }
    
    # Save manifest to file
    manifest_file = f'{model_name}-inference-service.yaml'
    with open(manifest_file, 'w') as f:
        yaml.dump(inference_service, f)
    
    # Apply manifest
    try:
        result = subprocess.run(['kubectl', 'apply', '-f', manifest_file], 
                              capture_output=True, text=True, check=True)
        print(f"InferenceService created successfully: {result.stdout}")
        
        # Get service URL
        get_url_cmd = ['kubectl', 'get', 'inferenceservice', model_name, 
                      '-n', namespace, '-o', 'jsonpath={.status.url}']
        url_result = subprocess.run(get_url_cmd, capture_output=True, text=True)
        service_url = url_result.stdout.strip()
        
        print(f"Model deployed at: {service_url}")
        return service_url
        
    except subprocess.CalledProcessError as e:
        print(f"Error deploying model: {e.stderr}")
        raise

# Define the pipeline
@dsl.pipeline(
    name='ML Training Pipeline',
    description='Complete ML pipeline with preprocessing, training, evaluation, and deployment'
)
def ml_training_pipeline(
    input_data_path: str = '/data/dataset.csv',
    model_type: str = 'random_forest',
    n_estimators: int = 100,
    max_depth: int = 10,
    test_size: float = 0.2,
    model_name: str = 'ml-model'
):
    """Complete ML training pipeline"""
    
    # Step 1: Preprocess data
    preprocess_task = preprocess_data(
        input_data_path=input_data_path,
        output_data_path='/tmp/processed_data',
        test_size=test_size
    )
    
    # Step 2: Train model
    train_task = train_model(
        train_data_path=preprocess_task.outputs['train_data_path'],
        model_output_path='/tmp/model',
        model_type=model_type,
        n_estimators=n_estimators,
        max_depth=max_depth
    )
    
    # Step 3: Evaluate model
    evaluate_task = evaluate_model(
        model_path=train_task.outputs['model_path'],
        test_data_path=preprocess_task.outputs['test_data_path'],
        metrics_output_path='/tmp/metrics'
    )
    
    # Step 4: Deploy model (conditional on good performance)
    with dsl.Condition(evaluate_task.outputs['test_accuracy'] > 0.8):
        deploy_task = deploy_model(
            model_path=train_task.outputs['model_path'],
            model_name=model_name
        )

if __name__ == '__main__':
    # Compile pipeline
    kfp.compiler.Compiler().compile(ml_training_pipeline, 'ml_training_pipeline.yaml')
    print("Pipeline compiled successfully!")
```

---

## ▶️ Step 4: Execute and Monitor Pipelines

```python
# pipeline_runner.py
import kfp
from kfp import Client

# Connect to Kubeflow Pipelines
client = Client(host='http://localhost:8080')  # Adjust host as needed

# Upload and run pipeline
def run_ml_pipeline():
    """Upload and execute the ML pipeline"""
    
    # Create experiment
    experiment_name = 'ml-training-experiment'
    try:
        experiment = client.create_experiment(name=experiment_name)
    except:
        experiment = client.get_experiment(experiment_name=experiment_name)
    
    # Upload pipeline
    pipeline_name = 'ML Training Pipeline'
    pipeline_package_path = 'ml_training_pipeline.yaml'
    
    try:
        pipeline = client.upload_pipeline(
            pipeline_package_path=pipeline_package_path,
            pipeline_name=pipeline_name
        )
    except:
        # Pipeline might already exist
        pipelines = client.list_pipelines()
        pipeline = next((p for p in pipelines.pipelines if p.name == pipeline_name), None)
    
    # Run pipeline
    run_name = 'ml-training-run-001'
    arguments = {
        'input_data_path': '/data/wine_dataset.csv',
        'model_type': 'random_forest',
        'n_estimators': 200,
        'max_depth': 15,
        'test_size': 0.2,
        'model_name': 'wine-classifier'
    }
    
    run_result = client.run_pipeline(
        experiment_id=experiment.id,
        job_name=run_name,
        pipeline_id=pipeline.id,
        params=arguments
    )
    
    print(f"Pipeline run started: {run_result.id}")
    print(f"Monitor at: http://localhost:8080/#/runs/details/{run_result.id}")
    
    # Wait for completion
    run_detail = client.wait_for_run_completion(run_result.id, timeout=3600)
    print(f"Pipeline completed with status: {run_detail.run.status}")
    
    return run_result

# Monitor pipeline execution
def monitor_pipeline_run(run_id: str):
    """Monitor pipeline execution"""
    
    run_detail = client.get_run(run_id)
    print(f"Run Status: {run_detail.run.status}")
    print(f"Created: {run_detail.run.created_at}")
    print(f"Finished: {run_detail.run.finished_at}")
    
    # Get run metrics
    if run_detail.run.status == 'Succeeded':
        metrics = client.get_run_metrics(run_id)
        for metric in metrics:
            print(f"Metric: {metric.name} = {metric.number_value}")

if __name__ == '__main__':
    # Run the pipeline
    run_result = run_ml_pipeline()
    
    # Monitor execution
    monitor_pipeline_run(run_result.id)
```

---

## 📊 Step 5: Model Serving with KServe

Create a model serving configuration:

```yaml
# model-serving.yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: wine-classifier
  namespace: kubeflow-user-example-com
spec:
  predictor:
    sklearn:
      storageUri: "gs://my-bucket/models/wine-classifier"
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          cpu: 1
          memory: 1Gi
  transformer:
    containers:
    - name: transformer
      image: my-registry/wine-transformer:latest
      env:
      - name: STORAGE_URI
        value: "gs://my-bucket/models/wine-classifier"
---
# Autoscaling configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wine-classifier-predictor-default
  namespace: kubeflow-user-example-com
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wine-classifier-predictor-default
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Test the deployed model:

```python
# test_model_serving.py
import requests
import json
import numpy as np

def test_model_inference():
    """Test the deployed model"""
    
    # Model endpoint (adjust URL as needed)
    model_url = "http://wine-classifier.kubeflow-user-example-com.example.com/v1/models/wine-classifier:predict"
    
    # Sample data for prediction
    sample_data = {
        "instances": [
            [13.20, 1.78, 2.14, 11.2, 100, 2.65, 2.76, 0.26, 1.28, 4.38, 1.05, 3.40, 1050],
            [12.37, 0.94, 1.36, 10.6, 88, 1.98, 0.57, 0.28, 0.42, 1.95, 1.05, 1.82, 520]
        ]
    }
    
    # Make prediction request
    headers = {'Content-Type': 'application/json'}
    response = requests.post(model_url, data=json.dumps(sample_data), headers=headers)
    
    if response.status_code == 200:
        predictions = response.json()
        print("Predictions:", predictions)
        return predictions
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def load_test_model():
    """Perform load testing on the model"""
    import concurrent.futures
    import time
    
    def make_request():
        return test_model_inference()
    
    # Concurrent requests
    num_requests = 100
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(num_requests)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    end_time = time.time()
    successful_requests = sum(1 for r in results if r is not None)
    
    print(f"Load test completed:")
    print(f"Total requests: {num_requests}")
    print(f"Successful requests: {successful_requests}")
    print(f"Success rate: {successful_requests/num_requests*100:.2f}%")
    print(f"Total time: {end_time - start_time:.2f} seconds")
    print(f"Requests per second: {num_requests/(end_time - start_time):.2f}")

if __name__ == '__main__':
    # Test single prediction
    test_model_inference()
    
    # Perform load test
    load_test_model()
```

---

## 🔍 What You'll See

### Kubeflow Dashboard
- **Pipelines**: Visual pipeline editor and execution history
- **Experiments**: Experiment tracking and comparison
- **Notebooks**: Managed Jupyter notebook servers
- **Models**: Model registry and serving management
- **Artifacts**: Pipeline artifacts and metadata

### Pipeline Execution Output
```bash
Pipeline run started: 12345678-abcd-efgh-ijkl-123456789012
Monitor at: http://localhost:8080/#/runs/details/12345678-abcd-efgh-ijkl-123456789012

Step 1: Data Preprocessing
✅ Preprocessed data saved to /tmp/processed_data
✅ Number of features: 13
✅ Training samples: 142, Test samples: 36

Step 2: Model Training
✅ Training random_forest model...
✅ Model saved to /tmp/model/random_forest_model.pkl
✅ Training accuracy: 0.9648

Step 3: Model Evaluation
✅ Evaluation completed!
✅ Test accuracy: 0.9722
✅ Precision: 0.9733
✅ Recall: 0.9722

Step 4: Model Deployment
✅ InferenceService created successfully
✅ Model deployed at: http://wine-classifier.kubeflow-user-example-com.example.com

Pipeline completed with status: Succeeded
```

### Model Serving Results
```json
{
  "predictions": [
    [0.1, 0.2, 0.7],  // Class probabilities for sample 1
    [0.8, 0.1, 0.1]   // Class probabilities for sample 2
  ]
}
```

---

## Pros & Cons

### ✅ Pros
- **Kubernetes Native**: Leverages Kubernetes for scalability and reliability
- **Complete ML Platform**: End-to-end ML workflow management
- **Distributed Training**: Multi-GPU and multi-node training support
- **Model Serving**: Production-ready model deployment with KServe
- **Multi-User**: Secure multi-tenant environment

### ❌ Cons
- **Complexity**: Requires Kubernetes expertise and significant setup
- **Resource Intensive**: High resource requirements for cluster
- **Learning Curve**: Complex platform with many components
- **Maintenance**: Requires ongoing cluster and component maintenance

---

## Conclusion

Kubeflow is the **enterprise-grade solution** for **scalable ML operations** on Kubernetes. Choose Kubeflow when you need:

- **Large-scale ML workflows** with distributed training
- **Enterprise ML platform** with multi-user support
- **Kubernetes-native** ML operations
- **Production-ready** model serving and monitoring

The combination of pipeline orchestration, distributed training, and model serving makes Kubeflow ideal for organizations running ML at scale on Kubernetes.

**What You've Achieved:**
✅ Set up a complete Kubeflow ML platform  
✅ Created comprehensive ML pipelines with multiple components  
✅ Implemented distributed model training and evaluation  
✅ Deployed models for production inference with KServe  
✅ Established monitoring and load testing capabilities  
✅ Built scalable and reproducible ML workflows
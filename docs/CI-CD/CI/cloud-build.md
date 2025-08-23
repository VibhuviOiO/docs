---
sidebar_position: 8
title: Google Cloud Build
description: Google Cloud Build is a service that executes your builds on Google Cloud Platform infrastructure. Learn how to set up Cloud Build for CI/CD pipelines.
slug: /CI-CD/CloudBuild
keywords:
  - Google Cloud Build
  - GCP CI/CD
  - cloud native CI/CD
  - container builds
  - serverless CI/CD
  - Google Cloud Platform
  - build automation
  - deployment pipeline
  - cloud builds
  - GCP DevOps
---

# ☁️ Google Cloud Build - Serverless CI/CD Platform

**Google Cloud Build** is a **serverless CI/CD platform** that lets you build, test, and deploy applications quickly at scale. It executes builds on **Google Cloud Platform infrastructure** with support for **Docker**, **multiple languages**, and **custom build steps**.

---

## Set Up Cloud Build

### Enable Cloud Build API

```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com

# Set default project
gcloud config set project YOUR_PROJECT_ID
```

### Basic Build Configuration

`Create cloudbuild.yaml:`
```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'myapp'
      - '--image'
      - 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

# Store images in Container Registry
images:
  - 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA'

# Build options
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'
```

---

## Advanced Build Configurations

### Multi-Stage Build Pipeline

`Create cloudbuild-advanced.yaml:`
```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['ci']
    dir: 'frontend'

  # Run tests
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['test']
    dir: 'frontend'
    env:
      - 'CI=true'

  # Build frontend
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'build']
    dir: 'frontend'

  # Security scan
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        docker run --rm -v /workspace:/workspace \
          aquasec/trivy fs --exit-code 1 --severity HIGH,CRITICAL /workspace

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA',
      '-t', 'gcr.io/$PROJECT_ID/myapp:latest',
      '--cache-from', 'gcr.io/$PROJECT_ID/myapp:latest',
      '.'
    ]

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'gcr.io/$PROJECT_ID/myapp']

  # Deploy to staging
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '--filename=k8s/staging/'
      - '--image=gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA'
      - '--cluster=staging-cluster'
      - '--location=us-central1-a'

  # Run integration tests
  - name: 'gcr.io/cloud-builders/curl'
    args: ['--fail', 'https://myapp-staging.example.com/health']

  # Deploy to production (only on main branch)
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '--filename=k8s/production/'
      - '--image=gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA'
      - '--cluster=production-cluster'
      - '--location=us-central1-a'

# Conditional execution
substitutions:
  _DEPLOY_TO_PROD: 'false'

# Build triggers
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/database-password/versions/latest
      env: 'DATABASE_PASSWORD'

options:
  machineType: 'E2_HIGHCPU_8'
  substitution_option: 'ALLOW_LOOSE'
  logging: CLOUD_LOGGING_ONLY
```

---

## Custom Build Steps

### Custom Builder for Node.js

`Create builders/node/Dockerfile:`
```dockerfile
FROM node:18-alpine

# Install additional tools
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl

# Install global packages
RUN npm install -g \
    @angular/cli \
    @vue/cli \
    create-react-app \
    typescript

# Set working directory
WORKDIR /workspace

ENTRYPOINT ["node"]
```

`Create builders/node/cloudbuild.yaml:`
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/node-builder:latest',
      '.'
    ]
    dir: 'builders/node'

images:
  - 'gcr.io/$PROJECT_ID/node-builder:latest'
```

### Custom Security Scanner

`Create builders/security/Dockerfile:`
```dockerfile
FROM alpine:latest

RUN apk add --no-cache \
    curl \
    bash \
    jq \
    git

# Install security tools
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
RUN curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

COPY security-scan.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/security-scan.sh

ENTRYPOINT ["/usr/local/bin/security-scan.sh"]
```

`Create builders/security/security-scan.sh:`
```bash
#!/bin/bash
set -e

echo "Running security scans..."

# Scan filesystem
echo "Scanning filesystem with Trivy..."
trivy fs --exit-code 1 --severity HIGH,CRITICAL /workspace

# Scan dependencies
echo "Scanning dependencies with Grype..."
grype dir:/workspace --fail-on high

echo "Security scans completed successfully!"
```

---

## Integration Examples

### GitHub Integration

`Create .github/workflows/cloud-build.yml:`
```yaml
name: Cloud Build Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  cloud-build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Submit build to Cloud Build'
      run: |
        gcloud builds submit \
          --config=cloudbuild.yaml \
          --substitutions=_BRANCH_NAME=${{ github.ref_name }}
```

### Terraform Integration

`Create terraform/cloud-build.tf:`
```hcl
resource "google_cloudbuild_trigger" "main" {
  name        = "myapp-trigger"
  description = "Build and deploy myapp"
  
  github {
    owner = "myorg"
    name  = "myapp"
    push {
      branch = "^main$"
    }
  }
  
  filename = "cloudbuild.yaml"
  
  substitutions = {
    _DEPLOY_ENV = "production"
    _CLUSTER_NAME = "production-cluster"
  }
  
  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"
}

resource "google_cloudbuild_trigger" "pr" {
  name        = "myapp-pr-trigger"
  description = "Build and test PRs"
  
  github {
    owner = "myorg"
    name  = "myapp"
    pull_request {
      branch = "^main$"
    }
  }
  
  filename = "cloudbuild-pr.yaml"
  
  substitutions = {
    _DEPLOY_ENV = "staging"
  }
}
```

---

## Monitoring and Notifications

### Slack Notifications

`Create cloudbuild-with-notifications.yaml:`
```yaml
steps:
  # Build steps here...
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/myapp:$COMMIT_SHA', '.']

  # Notify on success
  - name: 'gcr.io/cloud-builders/curl'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"✅ Build successful for commit $COMMIT_SHA"}' \
        $$SLACK_WEBHOOK_URL
    secretEnv: ['SLACK_WEBHOOK_URL']

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/slack-webhook/versions/latest
      env: 'SLACK_WEBHOOK_URL'
```

### Build Metrics

`Create build-metrics.py:`
```python
#!/usr/bin/env python3
from google.cloud import monitoring_v3
from google.cloud import cloudbuild_v1
import time

def get_build_metrics(project_id):
    """Get Cloud Build metrics"""
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"
    
    # Query build success rate
    interval = monitoring_v3.TimeInterval({
        "end_time": {"seconds": int(time.time())},
        "start_time": {"seconds": int(time.time()) - 3600},  # Last hour
    })
    
    results = client.list_time_series(
        request={
            "name": project_name,
            "filter": 'metric.type="cloudbuild.googleapis.com/build/count"',
            "interval": interval,
            "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
        }
    )
    
    for result in results:
        print(f"Build metric: {result}")

def list_recent_builds(project_id):
    """List recent builds"""
    client = cloudbuild_v1.CloudBuildClient()
    
    builds = client.list_builds(
        request={
            "project_id": project_id,
            "page_size": 10
        }
    )
    
    for build in builds:
        print(f"Build {build.id}: {build.status} - {build.create_time}")

if __name__ == "__main__":
    project_id = "your-project-id"
    get_build_metrics(project_id)
    list_recent_builds(project_id)
```

---

## Common Use Cases

- **Container Applications**: Build and deploy containerized applications to GKE or Cloud Run
- **Serverless Functions**: Build and deploy Cloud Functions
- **Multi-Environment Deployments**: Automated deployments to staging and production
- **Security Integration**: Automated security scanning in CI/CD pipeline
- **Microservices**: Build and deploy multiple services with dependencies

✅ Google Cloud Build is now configured for serverless CI/CD workflows!
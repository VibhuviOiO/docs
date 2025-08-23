---
sidebar_position: 7
title: GoCD
description: GoCD is an open-source continuous delivery server that helps you automate and streamline your build-test-release cycle. Learn how to set up GoCD with Docker.
slug: /CI-CD/GoCD
keywords:
  - GoCD
  - continuous delivery
  - pipeline automation
  - build automation
  - deployment pipeline
  - value stream mapping
  - pipeline as code
  - continuous deployment
  - DevOps automation
  - open source CI/CD
---

# 🚀 GoCD - Continuous Delivery Server

**GoCD** is an open-source **continuous delivery server** that helps you automate and streamline your **build-test-release cycle**. It provides powerful **pipeline modeling**, **value stream mapping**, and **advanced deployment strategies** for complex delivery workflows.

---

## Set Up GoCD with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  gocd-server:
    image: gocd/gocd-server:v23.4.0
    container_name: gocd-server
    restart: unless-stopped
    ports:
      - "8153:8153"
      - "8154:8154"
    volumes:
      - gocd-server-data:/godata
      - gocd-server-home:/home/go
      - gocd-server-logs:/go-working-dir/logs
      - ./gocd-configs:/godata/config
    environment:
      - GOCD_SERVER_JVM_OPTIONS=-Xmx2g -Xms1g
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8153/go/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  gocd-agent-1:
    image: gocd/gocd-agent-alpine-3.18:v23.4.0
    container_name: gocd-agent-1
    restart: unless-stopped
    environment:
      - GO_SERVER_URL=https://gocd-server:8154/go
      - AGENT_AUTO_REGISTER_KEY=your-auto-register-key
      - AGENT_AUTO_REGISTER_RESOURCES=docker,linux,alpine
      - AGENT_AUTO_REGISTER_ENVIRONMENTS=development,staging
      - AGENT_AUTO_REGISTER_HOSTNAME=docker-agent-1
    volumes:
      - gocd-agent-1-data:/godata
      - gocd-agent-1-home:/home/go
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
    depends_on:
      - gocd-server

  gocd-agent-2:
    image: gocd/gocd-agent-alpine-3.18:v23.4.0
    container_name: gocd-agent-2
    restart: unless-stopped
    environment:
      - GO_SERVER_URL=https://gocd-server:8154/go
      - AGENT_AUTO_REGISTER_KEY=your-auto-register-key
      - AGENT_AUTO_REGISTER_RESOURCES=docker,linux,alpine,kubernetes
      - AGENT_AUTO_REGISTER_ENVIRONMENTS=production
      - AGENT_AUTO_REGISTER_HOSTNAME=docker-agent-2
    volumes:
      - gocd-agent-2-data:/godata
      - gocd-agent-2-home:/home/go
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
      - ~/.kube:/home/go/.kube:ro
    depends_on:
      - gocd-server

  # PostgreSQL for GoCD (optional, for production use)
  gocd-postgres:
    image: postgres:15
    container_name: gocd-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=gocd
      - POSTGRES_USER=gocd
      - POSTGRES_PASSWORD=gocd_password
    volumes:
      - gocd-postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  gocd-server-data:
  gocd-server-home:
  gocd-server-logs:
  gocd-agent-1-data:
  gocd-agent-1-home:
  gocd-agent-2-data:
  gocd-agent-2-home:
  gocd-postgres-data:
```

`Start GoCD:`
```bash
docker compose up -d
```

`Access GoCD:`
```bash
echo "GoCD Server: http://localhost:8153"
```

---

## Pipeline Configuration (YAML)

### Basic Pipeline Configuration

`Create gocd-configs/pipeline.gocd.yaml:`
```yaml
format_version: 10
pipelines:
  build-pipeline:
    group: myapp
    label_template: "${COUNT}"
    lock_behavior: none
    display_order: -1
    materials:
      git-repo:
        git: https://github.com/myorg/myapp.git
        branch: main
        shallow_clone: false
        auto_update: true
        blacklist:
          - "docs/**/*"
          - "*.md"
    stages:
      - build:
          fetch_materials: true
          keep_artifacts: false
          clean_workspace: false
          approval:
            type: success
            allow_only_on_success: false
          jobs:
            build-job:
              timeout: 0
              resources:
                - docker
                - linux
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Building Application ==="
                        docker build -t myapp:${GO_PIPELINE_LABEL} .
                        echo "Build completed successfully"
              artifacts:
                - build:
                    source: dist/**/*
                    destination: build-artifacts
                - test:
                    source: test-results/**/*
                    destination: test-results

  test-pipeline:
    group: myapp
    label_template: "${COUNT}"
    materials:
      upstream:
        pipeline: build-pipeline
        stage: build
    stages:
      - unit-tests:
          jobs:
            unit-test-job:
              resources:
                - docker
              tasks:
                - fetch:
                    pipeline: build-pipeline
                    stage: build
                    job: build-job
                    source: build-artifacts
                    destination: .
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Running Unit Tests ==="
                        docker run --rm -v $(pwd):/app myapp:${GO_DEPENDENCY_LABEL_BUILD_PIPELINE} npm test
              artifacts:
                - test:
                    source: coverage/**/*
                    destination: coverage-reports
      
      - integration-tests:
          jobs:
            integration-test-job:
              resources:
                - docker
              tasks:
                - fetch:
                    pipeline: build-pipeline
                    stage: build
                    job: build-job
                    source: build-artifacts
                    destination: .
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Running Integration Tests ==="
                        docker-compose -f docker-compose.test.yml up --abort-on-container-exit
                        docker-compose -f docker-compose.test.yml down

  deploy-staging-pipeline:
    group: myapp
    label_template: "${COUNT}"
    materials:
      upstream:
        pipeline: test-pipeline
        stage: integration-tests
    environment_variables:
      ENVIRONMENT: staging
      NAMESPACE: staging
    stages:
      - deploy-staging:
          approval:
            type: success
          jobs:
            deploy-job:
              resources:
                - docker
                - kubernetes
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Deploying to Staging ==="
                        kubectl set image deployment/myapp myapp=myregistry.com/myapp:${GO_DEPENDENCY_LABEL_BUILD_PIPELINE} -n ${NAMESPACE}
                        kubectl rollout status deployment/myapp -n ${NAMESPACE} --timeout=300s
                        
                        echo "=== Health Check ==="
                        sleep 30
                        curl -f http://staging.myapp.com/health || exit 1
                        echo "Staging deployment successful"

  deploy-production-pipeline:
    group: myapp
    label_template: "${COUNT}"
    materials:
      upstream:
        pipeline: deploy-staging-pipeline
        stage: deploy-staging
    environment_variables:
      ENVIRONMENT: production
      NAMESPACE: production
    stages:
      - deploy-production:
          approval:
            type: manual
            allow_only_on_success: true
          jobs:
            deploy-job:
              resources:
                - docker
                - kubernetes
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Deploying to Production ==="
                        helm upgrade --install myapp ./helm/myapp \
                          --namespace ${NAMESPACE} \
                          --set image.tag=${GO_DEPENDENCY_LABEL_BUILD_PIPELINE} \
                          --set environment=${ENVIRONMENT} \
                          --set replicas=3 \
                          --wait --timeout=600s
                        
                        echo "=== Production Health Check ==="
                        for i in {1..10}; do
                          if curl -f https://api.myapp.com/health; then
                            echo "Production deployment successful!"
                            break
                          fi
                          echo "Waiting for production to be ready... ($i/10)"
                          sleep 30
                        done
```

### Advanced Pipeline with Fan-in/Fan-out

`Create gocd-configs/advanced-pipeline.gocd.yaml:`
```yaml
format_version: 10
pipelines:
  # Frontend Pipeline
  frontend-pipeline:
    group: microservices
    materials:
      frontend-repo:
        git: https://github.com/myorg/frontend.git
        branch: main
        destination: frontend
    stages:
      - build-frontend:
          jobs:
            build:
              resources: [docker, node]
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        cd frontend
                        npm ci
                        npm run build
                        npm run test
                        docker build -t frontend:${GO_PIPELINE_LABEL} .
              artifacts:
                - build:
                    source: frontend/dist/**/*
                    destination: frontend-dist

  # Backend API Pipeline
  backend-api-pipeline:
    group: microservices
    materials:
      backend-repo:
        git: https://github.com/myorg/backend-api.git
        branch: main
        destination: backend
    stages:
      - build-backend:
          jobs:
            build:
              resources: [docker, java]
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        cd backend
                        ./gradlew clean build test
                        docker build -t backend-api:${GO_PIPELINE_LABEL} .
              artifacts:
                - build:
                    source: backend/build/libs/**/*
                    destination: backend-artifacts

  # Database Migration Pipeline
  database-pipeline:
    group: microservices
    materials:
      db-repo:
        git: https://github.com/myorg/database.git
        branch: main
        destination: database
    stages:
      - migrate-database:
          jobs:
            migrate:
              resources: [docker]
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        cd database
                        docker run --rm -v $(pwd)/migrations:/migrations \
                          migrate/migrate -path=/migrations \
                          -database="postgres://user:pass@db:5432/myapp?sslmode=disable" up

  # Integration Pipeline (Fan-in)
  integration-pipeline:
    group: microservices
    materials:
      frontend-upstream:
        pipeline: frontend-pipeline
        stage: build-frontend
      backend-upstream:
        pipeline: backend-api-pipeline
        stage: build-backend
      database-upstream:
        pipeline: database-pipeline
        stage: migrate-database
    stages:
      - integration-tests:
          jobs:
            test:
              resources: [docker]
              tasks:
                - fetch:
                    pipeline: frontend-pipeline
                    stage: build-frontend
                    job: build
                    source: frontend-dist
                    destination: .
                - fetch:
                    pipeline: backend-api-pipeline
                    stage: build-backend
                    job: build
                    source: backend-artifacts
                    destination: .
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Running Integration Tests ==="
                        docker-compose -f docker-compose.integration.yml up --abort-on-container-exit
                        docker-compose -f docker-compose.integration.yml down

  # Deployment Pipeline
  deploy-pipeline:
    group: microservices
    materials:
      integration-upstream:
        pipeline: integration-pipeline
        stage: integration-tests
    stages:
      - deploy-all:
          jobs:
            deploy:
              resources: [kubernetes]
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Deploying All Services ==="
                        
                        # Deploy frontend
                        kubectl set image deployment/frontend \
                          frontend=frontend:${GO_DEPENDENCY_LABEL_FRONTEND_PIPELINE} -n staging
                        
                        # Deploy backend
                        kubectl set image deployment/backend-api \
                          backend-api=backend-api:${GO_DEPENDENCY_LABEL_BACKEND_API_PIPELINE} -n staging
                        
                        # Wait for deployments
                        kubectl rollout status deployment/frontend -n staging --timeout=300s
                        kubectl rollout status deployment/backend-api -n staging --timeout=300s
                        
                        echo "All services deployed successfully"
```

---

## Environment Configuration

### Environment Setup

`Create gocd-configs/environments.gocd.yaml:`
```yaml
format_version: 10
environments:
  development:
    environment_variables:
      ENVIRONMENT: development
      LOG_LEVEL: debug
      DATABASE_URL: postgres://dev:dev@dev-db:5432/myapp_dev
    secure_variables:
      API_KEY: AES:encrypted_api_key_here
    pipelines:
      - build-pipeline
      - test-pipeline
    agents:
      - docker-agent-1

  staging:
    environment_variables:
      ENVIRONMENT: staging
      LOG_LEVEL: info
      DATABASE_URL: postgres://staging:staging@staging-db:5432/myapp_staging
    secure_variables:
      API_KEY: AES:encrypted_staging_api_key_here
    pipelines:
      - deploy-staging-pipeline
    agents:
      - docker-agent-1
      - docker-agent-2

  production:
    environment_variables:
      ENVIRONMENT: production
      LOG_LEVEL: warn
      DATABASE_URL: postgres://prod:prod@prod-db:5432/myapp_prod
    secure_variables:
      API_KEY: AES:encrypted_prod_api_key_here
    pipelines:
      - deploy-production-pipeline
    agents:
      - docker-agent-2
```

---

## Custom GoCD Agent

### Enhanced Agent Dockerfile

`Create custom-agent/Dockerfile:`
```dockerfile
FROM gocd/gocd-agent-alpine-3.18:v23.4.0

USER root

# Install additional tools
RUN apk add --no-cache \
    curl \
    wget \
    git \
    jq \
    python3 \
    py3-pip \
    nodejs \
    npm \
    openjdk11 \
    gradle \
    maven

# Install Docker CLI
RUN curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh && \
    rm get-docker.sh

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Terraform
RUN wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip && \
    unzip terraform_1.6.0_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_1.6.0_linux_amd64.zip

# Install AWS CLI
RUN pip3 install awscli

# Install Newman for API testing
RUN npm install -g newman

# Install SonarQube Scanner
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip && \
    unzip sonar-scanner-cli-4.8.0.2856-linux.zip && \
    mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    rm sonar-scanner-cli-4.8.0.2856-linux.zip

USER go

# Set environment variables
ENV PATH="/usr/local/bin:${PATH}"
ENV JAVA_HOME="/usr/lib/jvm/java-11-openjdk"
```

`Build and use custom agent:`
```bash
docker build -t custom-gocd-agent custom-agent/

# Update docker-compose.yml to use custom image
# Replace: image: gocd/gocd-agent-alpine-3.18:v23.4.0
# With: image: custom-gocd-agent
```

---

## Pipeline Templates

### Reusable Pipeline Template

`Create gocd-configs/templates.gocd.yaml:`
```yaml
format_version: 10
pipeline_templates:
  microservice-template:
    stages:
      - build:
          jobs:
            build-job:
              resources:
                - docker
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Building ${SERVICE_NAME} ==="
                        docker build -t ${SERVICE_NAME}:${GO_PIPELINE_LABEL} .
                        echo "Build completed for ${SERVICE_NAME}"
              artifacts:
                - build:
                    source: dist/**/*
                    destination: build-artifacts
      
      - test:
          jobs:
            test-job:
              resources:
                - docker
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Testing ${SERVICE_NAME} ==="
                        docker run --rm ${SERVICE_NAME}:${GO_PIPELINE_LABEL} npm test
                        echo "Tests completed for ${SERVICE_NAME}"
              artifacts:
                - test:
                    source: test-results/**/*
                    destination: test-results
      
      - security-scan:
          jobs:
            security-job:
              resources:
                - docker
              tasks:
                - exec:
                    command: /bin/bash
                    arguments:
                      - -c
                      - |
                        echo "=== Security Scan for ${SERVICE_NAME} ==="
                        docker run --rm -v $(pwd):/app clair-scanner ${SERVICE_NAME}:${GO_PIPELINE_LABEL}
                        echo "Security scan completed for ${SERVICE_NAME}"

pipelines:
  user-service:
    group: microservices
    template: microservice-template
    label_template: "${COUNT}"
    materials:
      git-repo:
        git: https://github.com/myorg/user-service.git
        branch: main
    environment_variables:
      SERVICE_NAME: user-service

  order-service:
    group: microservices
    template: microservice-template
    label_template: "${COUNT}"
    materials:
      git-repo:
        git: https://github.com/myorg/order-service.git
        branch: main
    environment_variables:
      SERVICE_NAME: order-service

  payment-service:
    group: microservices
    template: microservice-template
    label_template: "${COUNT}"
    materials:
      git-repo:
        git: https://github.com/myorg/payment-service.git
        branch: main
    environment_variables:
      SERVICE_NAME: payment-service
```

---

## Value Stream Map and Analytics

### Pipeline Analytics Script

`Create analytics/pipeline-analytics.py:`
```python
#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import pandas as pd

class GoCDAnalytics:
    def __init__(self, server_url, username, password):
        self.server_url = server_url
        self.auth = (username, password)
        self.headers = {'Accept': 'application/vnd.go.cd.v1+json'}
    
    def get_pipeline_history(self, pipeline_name, offset=0, page_size=100):
        """Get pipeline history"""
        url = f"{self.server_url}/go/api/pipelines/{pipeline_name}/history/{offset}"
        response = requests.get(url, auth=self.auth, headers=self.headers)
        return response.json()
    
    def get_value_stream_map(self, pipeline_name, pipeline_counter):
        """Get value stream map for a specific pipeline run"""
        url = f"{self.server_url}/go/api/pipelines/{pipeline_name}/{pipeline_counter}/value_stream_map"
        response = requests.get(url, auth=self.auth, headers=self.headers)
        return response.json()
    
    def calculate_lead_time(self, pipeline_name, days=30):
        """Calculate lead time for pipeline"""
        history = self.get_pipeline_history(pipeline_name)
        pipelines = history.get('pipelines', [])
        
        lead_times = []
        for pipeline in pipelines[:days]:
            if pipeline['stages']:
                first_stage = pipeline['stages'][0]
                last_stage = pipeline['stages'][-1]
                
                if first_stage.get('scheduled_date') and last_stage.get('completed_date'):
                    start_time = datetime.fromisoformat(first_stage['scheduled_date'].replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(last_stage['completed_date'].replace('Z', '+00:00'))
                    lead_time = (end_time - start_time).total_seconds() / 60  # in minutes
                    lead_times.append(lead_time)
        
        return {
            'average_lead_time': sum(lead_times) / len(lead_times) if lead_times else 0,
            'median_lead_time': sorted(lead_times)[len(lead_times)//2] if lead_times else 0,
            'lead_times': lead_times
        }
    
    def calculate_deployment_frequency(self, pipeline_name, days=30):
        """Calculate deployment frequency"""
        history = self.get_pipeline_history(pipeline_name)
        pipelines = history.get('pipelines', [])
        
        successful_deployments = [p for p in pipelines if p['build_cause']['trigger_message'] != 'Forced']
        
        return {
            'total_deployments': len(successful_deployments),
            'deployments_per_day': len(successful_deployments) / days,
            'success_rate': len([p for p in successful_deployments if p['stages'][-1]['result'] == 'Passed']) / len(successful_deployments) * 100 if successful_deployments else 0
        }
    
    def generate_dashboard(self, pipeline_names):
        """Generate analytics dashboard"""
        dashboard_data = {}
        
        for pipeline_name in pipeline_names:
            lead_time_data = self.calculate_lead_time(pipeline_name)
            deployment_data = self.calculate_deployment_frequency(pipeline_name)
            
            dashboard_data[pipeline_name] = {
                'lead_time': lead_time_data,
                'deployment_frequency': deployment_data
            }
        
        return dashboard_data
    
    def create_visualizations(self, dashboard_data):
        """Create visualizations for the dashboard"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Lead time trends
        for pipeline_name, data in dashboard_data.items():
            lead_times = data['lead_time']['lead_times']
            axes[0, 0].plot(lead_times, label=pipeline_name)
        axes[0, 0].set_title('Lead Time Trends')
        axes[0, 0].set_xlabel('Pipeline Run')
        axes[0, 0].set_ylabel('Lead Time (minutes)')
        axes[0, 0].legend()
        
        # Average lead times comparison
        pipeline_names = list(dashboard_data.keys())
        avg_lead_times = [data['lead_time']['average_lead_time'] for data in dashboard_data.values()]
        axes[0, 1].bar(pipeline_names, avg_lead_times)
        axes[0, 1].set_title('Average Lead Times')
        axes[0, 1].set_ylabel('Minutes')
        
        # Deployment frequency
        deployment_frequencies = [data['deployment_frequency']['deployments_per_day'] for data in dashboard_data.values()]
        axes[1, 0].bar(pipeline_names, deployment_frequencies)
        axes[1, 0].set_title('Deployment Frequency')
        axes[1, 0].set_ylabel('Deployments per Day')
        
        # Success rates
        success_rates = [data['deployment_frequency']['success_rate'] for data in dashboard_data.values()]
        axes[1, 1].bar(pipeline_names, success_rates)
        axes[1, 1].set_title('Success Rates')
        axes[1, 1].set_ylabel('Success Rate (%)')
        
        plt.tight_layout()
        plt.savefig('gocd-analytics-dashboard.png')
        plt.show()

# Usage
if __name__ == "__main__":
    analytics = GoCDAnalytics(
        server_url="http://localhost:8153",
        username="admin",
        password="admin"
    )
    
    pipeline_names = ["build-pipeline", "test-pipeline", "deploy-staging-pipeline"]
    dashboard_data = analytics.generate_dashboard(pipeline_names)
    
    print(json.dumps(dashboard_data, indent=2))
    analytics.create_visualizations(dashboard_data)
```

---

## Integration with External Tools

### Slack Notifications Plugin

`Create plugins/slack-notification.py:`
```python
#!/usr/bin/env python3
import requests
import json
import sys
import os

def send_slack_notification(webhook_url, pipeline_name, stage_name, result, build_label):
    """Send Slack notification for pipeline events"""
    
    color = "good" if result == "Passed" else "danger"
    emoji = "✅" if result == "Passed" else "❌"
    
    message = {
        "attachments": [
            {
                "color": color,
                "fields": [
                    {
                        "title": f"{emoji} Pipeline {result}",
                        "value": f"Pipeline: {pipeline_name}\nStage: {stage_name}\nBuild: {build_label}",
                        "short": False
                    }
                ],
                "footer": "GoCD",
                "ts": int(time.time())
            }
        ]
    }
    
    response = requests.post(webhook_url, json=message)
    return response.status_code == 200

if __name__ == "__main__":
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
    pipeline_name = os.environ.get('GO_PIPELINE_NAME')
    stage_name = os.environ.get('GO_STAGE_NAME')
    result = os.environ.get('GO_STAGE_RESULT')
    build_label = os.environ.get('GO_PIPELINE_LABEL')
    
    if webhook_url:
        send_slack_notification(webhook_url, pipeline_name, stage_name, result, build_label)
    else:
        print("SLACK_WEBHOOK_URL not configured")
```

---

## Common Use Cases

- **Complex Deployment Pipelines**: Multi-stage, multi-environment deployments
- **Microservices Orchestration**: Coordinated builds and deployments across services
- **Value Stream Optimization**: Visual pipeline analysis and bottleneck identification
- **Compliance and Governance**: Audit trails and approval workflows
- **Enterprise CI/CD**: Large-scale continuous delivery with advanced pipeline modeling

✅ GoCD is now configured for advanced continuous delivery workflows!
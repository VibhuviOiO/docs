---
sidebar_position: 2
title: Spinnaker
description: Spinnaker is an open-source, multi-cloud continuous delivery platform for releasing software changes with high velocity and confidence, featuring advanced deployment strategies.
slug: /CI-CD/Spinnaker
keywords:
  - Spinnaker
  - continuous delivery
  - multi-cloud deployment
  - canary deployments
  - blue-green deployment
  - deployment strategies
  - cloud deployment
  - Netflix Spinnaker
  - Kubernetes deployment
  - AWS deployment
---

# 🌊 Advanced Multi-Cloud Deployments with Spinnaker

**Spinnaker** is an **open-source**, **multi-cloud continuous delivery platform** originally developed by **Netflix** for releasing software changes with **high velocity** and **confidence**. Perfect for **advanced deployment strategies**, **canary analysis**, **multi-cloud orchestration**, and **enterprise-grade** release management.

## Key Features

- **Multi-Cloud Support**: Deploy to AWS, GCP, Azure, Kubernetes, and more
- **Advanced Deployment Strategies**: Canary, blue-green, rolling, and red-black deployments
- **Automated Canary Analysis**: Metrics-driven deployment decisions
- **Pipeline as Code**: Version-controlled deployment pipelines
- **Enterprise Security**: RBAC, audit trails, and compliance features

## Use Cases

- **Enterprise Deployments**: Large-scale, multi-environment release management
- **Canary Deployments**: Risk-free deployments with automated rollback
- **Multi-Cloud Strategy**: Consistent deployments across cloud providers
- **Compliance Requirements**: Audit trails and approval workflows

---

## 🧰 Prerequisites

- **Docker & Docker Compose** installed
- **Kubernetes cluster** access (for K8s deployments)
- **Cloud provider** credentials (AWS, GCP, Azure)
- **8GB+ RAM** recommended for Spinnaker services
- **Persistent storage** for configuration and data

---

## 🔧 Step 1: Complete Spinnaker Setup

Create a comprehensive Docker Compose setup:

```yaml
version: '3.8'

services:
  # Redis for caching and session storage
  redis:
    image: redis:7-alpine
    container_name: spinnaker-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MinIO for artifact storage
  minio:
    image: minio/minio:latest
    container_name: spinnaker-minio
    restart: unless-stopped
    ports:
      - "9001:9000"
      - "9002:9001"
    environment:
      - MINIO_ROOT_USER=spinnaker
      - MINIO_ROOT_PASSWORD=spinnaker123
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Clouddriver - Cloud provider integration
  clouddriver:
    image: spinnaker/clouddriver:8.4.0
    container_name: spinnaker-clouddriver
    restart: unless-stopped
    ports:
      - "7002:7002"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JAVA_OPTS=-Xmx2g -Xms1g
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
      - ~/.kube:/home/spinnaker/.kube:ro
      - ~/.aws:/home/spinnaker/.aws:ro
      - ~/.config/gcloud:/home/spinnaker/.config/gcloud:ro
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7002/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Orca - Orchestration engine
  orca:
    image: spinnaker/orca:8.4.0
    container_name: spinnaker-orca
    restart: unless-stopped
    ports:
      - "8083:8083"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JAVA_OPTS=-Xmx2g -Xms1g
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
    depends_on:
      redis:
        condition: service_healthy
      clouddriver:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8083/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Gate - API gateway
  gate:
    image: spinnaker/gate:6.58.0
    container_name: spinnaker-gate
    restart: unless-stopped
    ports:
      - "8084:8084"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JAVA_OPTS=-Xmx1g -Xms512m
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
    depends_on:
      redis:
        condition: service_healthy
      orca:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8084/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Deck - UI
  deck:
    image: spinnaker/deck:3.12.0
    container_name: spinnaker-deck
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      - API_HOST=http://gate:8084
      - DECK_HOST=0.0.0.0
      - DECK_PORT=9000
    depends_on:
      gate:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Echo - Event and notification service
  echo:
    image: spinnaker/echo:2.37.0
    container_name: spinnaker-echo
    restart: unless-stopped
    ports:
      - "8089:8089"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JAVA_OPTS=-Xmx1g -Xms512m
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8089/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Front50 - Metadata service
  front50:
    image: spinnaker/front50:2.28.0
    container_name: spinnaker-front50
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=local
      - JAVA_OPTS=-Xmx1g -Xms512m
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
      - front50-data:/opt/spinnaker/data
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  redis-data:
  minio-data:
  front50-data:
```

---

## 🏗️ Step 2: Configuration Setup

Create comprehensive Spinnaker configuration:

```bash
# Create configuration directory
mkdir -p spinnaker-config
```

Create `spinnaker-config/spinnaker.yml`:

```yaml
spinnaker:
  extensibility:
    plugins: {}
    repositories: {}
  
providers:
  kubernetes:
    enabled: true
    accounts:
      - name: local-kubernetes
        requiredGroupMembership: []
        providerVersion: V2
        permissions: {}
        dockerRegistries: []
        configureImagePullSecrets: true
        cacheThreads: 1
        namespaces: []
        omitNamespaces: []
        kinds: []
        omitKinds: []
        customResources: []
        cachingPolicies: []
        oAuthScopes: []
        onlySpinnakerManaged: false
        kubeconfigFile: /home/spinnaker/.kube/config
        context: default
        
  aws:
    enabled: true
    accounts:
      - name: aws-account
        accountId: "123456789012"
        regions:
          - name: us-east-1
          - name: us-west-2
        assumeRole: role/SpinnakerRole
        
  google:
    enabled: true
    accounts:
      - name: gcp-account
        project: my-gcp-project
        jsonPath: /home/spinnaker/.config/gcloud/service-account.json
        
  azure:
    enabled: true
    accounts:
      - name: azure-account
        clientId: azure-client-id
        appKey: azure-app-key
        tenantId: azure-tenant-id
        subscriptionId: azure-subscription-id

deploymentEnvironment:
  size: SMALL
  type: Distributed
  accountName: local-kubernetes
  updateVersions: true
  consul:
    enabled: false
  vault:
    enabled: false
  customSizing: {}
  sidecars: {}
  initContainers: {}
  hostAliases: {}
  affinity: {}
  tolerations: []
  nodeSelectors: {}
  gitConfig:
    upstreamUser: spinnaker
  livenessProbeConfig:
    enabled: false
  haServices:
    clouddriver:
      enabled: false
    echo:
      enabled: false

persistentStorage:
  persistentStoreType: s3
  azs: {}
  gcs: {}
  redis: {}
  s3:
    bucket: spinnaker-artifacts
    rootFolder: front50
    region: us-east-1
    endpoint: http://minio:9000
    accessKeyId: spinnaker
    secretAccessKey: spinnaker123
    pathStyleAccess: true
  oracle: {}

features:
  auth: false
  fiat: false
  chaos: false
  entityTags: false
  jobs: false
  pipelineTemplates: true
  artifacts: true
  managedPipelineTemplatesV2UI: true

metricStores:
  datadog:
    enabled: false
  prometheus:
    enabled: true
    add_source_metalabels: true
  stackdriver:
    enabled: false
  newrelic:
    enabled: false
  period: 30
  enabled: false

notifications:
  slack:
    enabled: true
    botName: spinnaker
    token: xoxb-your-slack-token
  email:
    enabled: false
  githubStatus:
    enabled: false

timezone: America/Los_Angeles
```

---

## 📁 Step 3: Create Advanced Deployment Pipelines

Create a comprehensive canary deployment pipeline:

```json
{
  "application": "myapp",
  "name": "Canary Deployment Pipeline",
  "description": "Advanced canary deployment with automated analysis",
  "parameterConfig": [
    {
      "name": "image",
      "description": "Docker image to deploy",
      "default": "myorg/myapp:latest",
      "hasOptions": false,
      "options": []
    },
    {
      "name": "canaryPercentage",
      "description": "Percentage of traffic for canary",
      "default": "10",
      "hasOptions": true,
      "options": [
        {"value": "5"},
        {"value": "10"},
        {"value": "25"},
        {"value": "50"}
      ]
    }
  ],
  "stages": [
    {
      "name": "Deploy Baseline",
      "type": "deployManifest",
      "refId": "1",
      "requisiteStageRefIds": [],
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifestArtifactId": "baseline-manifest",
      "manifests": [
        {
          "apiVersion": "apps/v1",
          "kind": "Deployment",
          "metadata": {
            "name": "myapp-baseline",
            "namespace": "production",
            "labels": {
              "app": "myapp",
              "version": "baseline"
            }
          },
          "spec": {
            "replicas": 3,
            "selector": {
              "matchLabels": {
                "app": "myapp",
                "version": "baseline"
              }
            },
            "template": {
              "metadata": {
                "labels": {
                  "app": "myapp",
                  "version": "baseline"
                }
              },
              "spec": {
                "containers": [
                  {
                    "name": "myapp",
                    "image": "myorg/myapp:stable",
                    "ports": [{"containerPort": 8080}],
                    "resources": {
                      "requests": {
                        "cpu": "100m",
                        "memory": "128Mi"
                      },
                      "limits": {
                        "cpu": "500m",
                        "memory": "512Mi"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ],
      "moniker": {
        "app": "myapp",
        "cluster": "baseline"
      },
      "skipExpressionEvaluation": false
    },
    {
      "name": "Deploy Canary",
      "type": "deployManifest",
      "refId": "2",
      "requisiteStageRefIds": ["1"],
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifests": [
        {
          "apiVersion": "apps/v1",
          "kind": "Deployment",
          "metadata": {
            "name": "myapp-canary",
            "namespace": "production",
            "labels": {
              "app": "myapp",
              "version": "canary"
            }
          },
          "spec": {
            "replicas": 1,
            "selector": {
              "matchLabels": {
                "app": "myapp",
                "version": "canary"
              }
            },
            "template": {
              "metadata": {
                "labels": {
                  "app": "myapp",
                  "version": "canary"
                }
              },
              "spec": {
                "containers": [
                  {
                    "name": "myapp",
                    "image": "${parameters.image}",
                    "ports": [{"containerPort": 8080}],
                    "resources": {
                      "requests": {
                        "cpu": "100m",
                        "memory": "128Mi"
                      },
                      "limits": {
                        "cpu": "500m",
                        "memory": "512Mi"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      ],
      "moniker": {
        "app": "myapp",
        "cluster": "canary"
      }
    },
    {
      "name": "Configure Traffic Split",
      "type": "deployManifest",
      "refId": "3",
      "requisiteStageRefIds": ["2"],
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifests": [
        {
          "apiVersion": "networking.istio.io/v1beta1",
          "kind": "VirtualService",
          "metadata": {
            "name": "myapp-traffic-split",
            "namespace": "production"
          },
          "spec": {
            "hosts": ["myapp.production.svc.cluster.local"],
            "http": [
              {
                "match": [{"headers": {"canary": {"exact": "true"}}}],
                "route": [{"destination": {"host": "myapp-canary", "subset": "canary"}}]
              },
              {
                "route": [
                  {
                    "destination": {"host": "myapp-baseline", "subset": "baseline"},
                    "weight": "${100 - parameters.canaryPercentage}"
                  },
                  {
                    "destination": {"host": "myapp-canary", "subset": "canary"},
                    "weight": "${parameters.canaryPercentage}"
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Canary Analysis",
      "type": "kayentaCanary",
      "refId": "4",
      "requisiteStageRefIds": ["3"],
      "analysisType": "RealTime",
      "canaryConfig": {
        "canaryAnalysisIntervalMins": "5",
        "canaryConfigId": "myapp-canary-config",
        "lifetimeDurationMins": "30",
        "metricsAccountName": "prometheus-account",
        "scopes": [
          {
            "scopeName": "production",
            "controlScope": "myapp-baseline",
            "experimentScope": "myapp-canary"
          }
        ],
        "scoreThresholds": {
          "marginal": "75",
          "pass": "90"
        },
        "storageAccountName": "minio-account"
      }
    },
    {
      "name": "Promote or Rollback",
      "type": "checkPreconditions",
      "refId": "5",
      "requisiteStageRefIds": ["4"],
      "preconditions": [
        {
          "context": {
            "expression": "${#stage('Canary Analysis')['context']['canaryScore'] > 90}"
          },
          "failPipeline": false,
          "type": "expression"
        }
      ]
    },
    {
      "name": "Promote Canary",
      "type": "deployManifest",
      "refId": "6",
      "requisiteStageRefIds": ["5"],
      "stageEnabled": {
        "expression": "${#stage('Canary Analysis')['context']['canaryScore'] > 90}",
        "type": "expression"
      },
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifests": [
        {
          "apiVersion": "apps/v1",
          "kind": "Deployment",
          "metadata": {
            "name": "myapp-baseline",
            "namespace": "production"
          },
          "spec": {
            "template": {
              "spec": {
                "containers": [
                  {
                    "name": "myapp",
                    "image": "${parameters.image}"
                  }
                ]
              }
            }
          }
        }
      ]
    },
    {
      "name": "Cleanup Canary",
      "type": "deleteManifest",
      "refId": "7",
      "requisiteStageRefIds": ["6"],
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifestName": "deployment myapp-canary",
      "options": {
        "cascading": true
      }
    },
    {
      "name": "Rollback on Failure",
      "type": "deployManifest",
      "refId": "8",
      "requisiteStageRefIds": ["5"],
      "stageEnabled": {
        "expression": "${#stage('Canary Analysis')['context']['canaryScore'] <= 90}",
        "type": "expression"
      },
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "production",
      "manifests": [
        {
          "apiVersion": "networking.istio.io/v1beta1",
          "kind": "VirtualService",
          "metadata": {
            "name": "myapp-traffic-split",
            "namespace": "production"
          },
          "spec": {
            "hosts": ["myapp.production.svc.cluster.local"],
            "http": [
              {
                "route": [
                  {
                    "destination": {"host": "myapp-baseline", "subset": "baseline"},
                    "weight": 100
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ],
  "triggers": [
    {
      "enabled": true,
      "type": "webhook",
      "source": "ci-system",
      "payloadConstraints": {
        "image": "myorg/myapp:.*"
      }
    }
  ],
  "notifications": [
    {
      "address": "#deployments",
      "level": "pipeline",
      "type": "slack",
      "when": ["pipeline.starting", "pipeline.complete", "pipeline.failed"]
    }
  ]
}
```

---

## ▶️ Step 4: Advanced Deployment Strategies

Create a blue-green deployment pipeline:

```python
# blue-green-pipeline.py
import json
import requests

def create_blue_green_pipeline():
    """Create a blue-green deployment pipeline"""
    
    pipeline = {
        "application": "myapp",
        "name": "Blue-Green Deployment",
        "description": "Zero-downtime blue-green deployment strategy",
        "stages": [
            {
                "name": "Deploy Green Environment",
                "type": "deployManifest",
                "refId": "1",
                "account": "local-kubernetes",
                "cloudProvider": "kubernetes",
                "location": "production",
                "manifests": [
                    {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "metadata": {
                            "name": "myapp-green",
                            "namespace": "production",
                            "labels": {"app": "myapp", "slot": "green"}
                        },
                        "spec": {
                            "replicas": 3,
                            "selector": {"matchLabels": {"app": "myapp", "slot": "green"}},
                            "template": {
                                "metadata": {"labels": {"app": "myapp", "slot": "green"}},
                                "spec": {
                                    "containers": [{
                                        "name": "myapp",
                                        "image": "${parameters.image}",
                                        "ports": [{"containerPort": 8080}]
                                    }]
                                }
                            }
                        }
                    }
                ]
            },
            {
                "name": "Health Check Green",
                "type": "webhook",
                "refId": "2",
                "requisiteStageRefIds": ["1"],
                "url": "http://myapp-green.production.svc.cluster.local:8080/health",
                "method": "GET",
                "statusUrlResolution": "getMethod",
                "retryStatusCodes": [500, 502, 503, 504],
                "waitForCompletion": True
            },
            {
                "name": "Switch Traffic to Green",
                "type": "deployManifest",
                "refId": "3",
                "requisiteStageRefIds": ["2"],
                "account": "local-kubernetes",
                "cloudProvider": "kubernetes",
                "location": "production",
                "manifests": [
                    {
                        "apiVersion": "v1",
                        "kind": "Service",
                        "metadata": {
                            "name": "myapp-service",
                            "namespace": "production"
                        },
                        "spec": {
                            "selector": {"app": "myapp", "slot": "green"},
                            "ports": [{"port": 80, "targetPort": 8080}]
                        }
                    }
                ]
            },
            {
                "name": "Cleanup Blue Environment",
                "type": "deleteManifest",
                "refId": "4",
                "requisiteStageRefIds": ["3"],
                "account": "local-kubernetes",
                "cloudProvider": "kubernetes",
                "location": "production",
                "manifestName": "deployment myapp-blue",
                "options": {"cascading": True}
            }
        ]
    }
    
    return pipeline

def submit_pipeline_to_spinnaker(pipeline):
    """Submit pipeline to Spinnaker"""
    spinnaker_url = "http://localhost:8084"
    
    # Create application if it doesn't exist
    app_data = {
        "name": pipeline["application"],
        "email": "admin@example.com",
        "description": "Application managed by Spinnaker"
    }
    
    requests.post(f"{spinnaker_url}/applications", json=app_data)
    
    # Submit pipeline
    response = requests.post(
        f"{spinnaker_url}/pipelines",
        json=pipeline,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        print("Pipeline created successfully!")
        return response.json()
    else:
        print(f"Failed to create pipeline: {response.text}")
        return None

if __name__ == "__main__":
    pipeline = create_blue_green_pipeline()
    submit_pipeline_to_spinnaker(pipeline)
```

---

## 📊 Step 5: Monitoring and Analytics

Create a comprehensive monitoring setup:

```python
# spinnaker-analytics.py
import requests
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import pandas as pd

class SpinnakerAnalytics:
    def __init__(self, spinnaker_url="http://localhost:8084"):
        self.spinnaker_url = spinnaker_url
        
    def get_pipeline_executions(self, application, pipeline_name, limit=50):
        """Get pipeline execution history"""
        url = f"{self.spinnaker_url}/applications/{application}/pipelines/{pipeline_name}/executions"
        params = {"limit": limit}
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return []
    
    def calculate_deployment_metrics(self, application, pipeline_name):
        """Calculate deployment frequency and success rate"""
        executions = self.get_pipeline_executions(application, pipeline_name)
        
        if not executions:
            return {}
        
        total_executions = len(executions)
        successful_executions = len([e for e in executions if e.get('status') == 'SUCCEEDED'])
        failed_executions = len([e for e in executions if e.get('status') == 'TERMINAL'])
        
        # Calculate deployment frequency (per day)
        if executions:
            start_time = min(e.get('startTime', 0) for e in executions)
            end_time = max(e.get('endTime', 0) for e in executions)
            days = (end_time - start_time) / (1000 * 60 * 60 * 24)  # Convert ms to days
            deployment_frequency = total_executions / max(days, 1)
        else:
            deployment_frequency = 0
        
        # Calculate lead time (average duration)
        durations = []
        for execution in executions:
            if execution.get('startTime') and execution.get('endTime'):
                duration = (execution['endTime'] - execution['startTime']) / (1000 * 60)  # Convert to minutes
                durations.append(duration)
        
        avg_lead_time = sum(durations) / len(durations) if durations else 0
        
        return {
            'total_executions': total_executions,
            'successful_executions': successful_executions,
            'failed_executions': failed_executions,
            'success_rate': (successful_executions / total_executions * 100) if total_executions > 0 else 0,
            'deployment_frequency_per_day': deployment_frequency,
            'average_lead_time_minutes': avg_lead_time,
            'durations': durations
        }
    
    def generate_dashboard(self, applications):
        """Generate analytics dashboard"""
        dashboard_data = {}
        
        for app_config in applications:
            app_name = app_config['name']
            pipeline_name = app_config['pipeline']
            
            metrics = self.calculate_deployment_metrics(app_name, pipeline_name)
            dashboard_data[f"{app_name}/{pipeline_name}"] = metrics
        
        return dashboard_data
    
    def create_visualizations(self, dashboard_data):
        """Create visualizations for deployment metrics"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Success rates
        pipeline_names = list(dashboard_data.keys())
        success_rates = [data.get('success_rate', 0) for data in dashboard_data.values()]
        
        axes[0, 0].bar(pipeline_names, success_rates, color='green', alpha=0.7)
        axes[0, 0].set_title('Pipeline Success Rates')
        axes[0, 0].set_ylabel('Success Rate (%)')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Deployment frequency
        deployment_frequencies = [data.get('deployment_frequency_per_day', 0) for data in dashboard_data.values()]
        axes[0, 1].bar(pipeline_names, deployment_frequencies, color='blue', alpha=0.7)
        axes[0, 1].set_title('Deployment Frequency')
        axes[0, 1].set_ylabel('Deployments per Day')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Lead times
        lead_times = [data.get('average_lead_time_minutes', 0) for data in dashboard_data.values()]
        axes[1, 0].bar(pipeline_names, lead_times, color='orange', alpha=0.7)
        axes[1, 0].set_title('Average Lead Time')
        axes[1, 0].set_ylabel('Minutes')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Execution trends (for first pipeline)
        if dashboard_data and list(dashboard_data.values())[0].get('durations'):
            durations = list(dashboard_data.values())[0]['durations']
            axes[1, 1].plot(durations, marker='o')
            axes[1, 1].set_title('Lead Time Trend (First Pipeline)')
            axes[1, 1].set_xlabel('Execution Number')
            axes[1, 1].set_ylabel('Duration (minutes)')
        
        plt.tight_layout()
        plt.savefig('spinnaker-analytics.png', dpi=300, bbox_inches='tight')
        plt.show()

# Usage example
if __name__ == "__main__":
    analytics = SpinnakerAnalytics()
    
    applications = [
        {"name": "myapp", "pipeline": "Canary Deployment Pipeline"},
        {"name": "myapp", "pipeline": "Blue-Green Deployment"}
    ]
    
    dashboard_data = analytics.generate_dashboard(applications)
    
    print("Deployment Analytics:")
    print(json.dumps(dashboard_data, indent=2))
    
    analytics.create_visualizations(dashboard_data)
```

---

## 🔍 What You'll See

### Spinnaker UI Dashboard
- **Applications**: Overview of all applications and their pipelines
- **Pipeline Executions**: Real-time pipeline execution status
- **Infrastructure**: Multi-cloud resource visualization
- **Canary Analysis**: Automated canary deployment results

### Pipeline Execution Output
```bash
Pipeline: Canary Deployment Pipeline
Status: RUNNING

Stage 1: Deploy Baseline - SUCCEEDED (2m 34s)
Stage 2: Deploy Canary - SUCCEEDED (1m 45s)
Stage 3: Configure Traffic Split - SUCCEEDED (0m 23s)
Stage 4: Canary Analysis - RUNNING (5m 12s / 30m)
  - Success Rate: 99.2%
  - Error Rate: 0.8%
  - Response Time P95: 245ms
  - Canary Score: 92/100

Stage 5: Promote or Rollback - WAITING
```

### Deployment Analytics
```json
{
  "myapp/Canary Deployment Pipeline": {
    "total_executions": 45,
    "successful_executions": 42,
    "failed_executions": 3,
    "success_rate": 93.33,
    "deployment_frequency_per_day": 2.1,
    "average_lead_time_minutes": 18.5
  }
}
```

---

## Pros & Cons

### ✅ Pros
- **Advanced Deployment Strategies**: Sophisticated canary, blue-green, and rolling deployments
- **Multi-Cloud Support**: Consistent deployments across cloud providers
- **Enterprise Features**: RBAC, audit trails, and compliance capabilities
- **Automated Analysis**: Metrics-driven deployment decisions
- **Extensible**: Plugin architecture for custom integrations

### ❌ Cons
- **Complexity**: Steep learning curve and complex setup
- **Resource Intensive**: Requires significant infrastructure resources
- **Maintenance Overhead**: Multiple microservices to manage
- **Limited Community**: Smaller community compared to other CD tools

---

## Conclusion

Spinnaker is the **enterprise-grade solution** for **advanced continuous delivery** with sophisticated deployment strategies. Choose Spinnaker when you need:

- **Advanced deployment patterns** like canary and blue-green deployments
- **Multi-cloud deployment** capabilities
- **Enterprise governance** and compliance features
- **Automated deployment decisions** based on metrics

The combination of advanced deployment strategies, multi-cloud support, and enterprise features makes Spinnaker ideal for large organizations with complex deployment requirements.

**What You've Achieved:**
✅ Set up a complete Spinnaker multi-cloud CD platform  
✅ Created advanced canary and blue-green deployment pipelines  
✅ Implemented automated deployment analysis and rollback  
✅ Built comprehensive monitoring and analytics capabilities  
✅ Established enterprise-grade deployment governance
---
sidebar_position: 2
title: Spinnaker
description: Spinnaker is an open-source, multi-cloud continuous delivery platform for releasing software changes with high velocity and confidence. Learn how to set up Spinnaker with Docker.
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

# 🌊 Spinnaker - Multi-Cloud Continuous Delivery Platform

**Spinnaker** is an open-source, **multi-cloud continuous delivery platform** for releasing software changes with **high velocity** and **confidence**. Originally developed by Netflix, it provides advanced **deployment strategies**, **canary analysis**, and **multi-cloud support**.

---

## Set Up Spinnaker with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: spinnaker-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Spinnaker services
  clouddriver:
    image: spinnaker/clouddriver:1.32.0
    container_name: spinnaker-clouddriver
    restart: unless-stopped
    ports:
      - "7002:7002"
    environment:
      - SPRING_PROFILES_ACTIVE=local
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
      - ~/.kube:/home/spinnaker/.kube:ro
    depends_on:
      - redis

  deck:
    image: spinnaker/deck:3.12.0
    container_name: spinnaker-deck
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      - API_HOST=http://gate:8084
    depends_on:
      - gate

  gate:
    image: spinnaker/gate:6.58.0
    container_name: spinnaker-gate
    restart: unless-stopped
    ports:
      - "8084:8084"
    environment:
      - SPRING_PROFILES_ACTIVE=local
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
    depends_on:
      - redis

  orca:
    image: spinnaker/orca:8.31.0
    container_name: spinnaker-orca
    restart: unless-stopped
    ports:
      - "8083:8083"
    environment:
      - SPRING_PROFILES_ACTIVE=local
    volumes:
      - ./spinnaker-config:/opt/spinnaker/config
    depends_on:
      - redis

volumes:
  redis-data:
```

`Start Spinnaker:`
```bash
docker compose up -d
```

`Access Spinnaker UI:`
```bash
echo "Spinnaker UI: http://localhost:9000"
```

---

## Basic Pipeline Configuration

### Kubernetes Deployment Pipeline

`Create pipeline-config.json:`
```json
{
  "application": "myapp",
  "name": "Deploy to Kubernetes",
  "description": "Deploy application to Kubernetes cluster",
  "stages": [
    {
      "name": "Deploy to Staging",
      "type": "deployManifest",
      "account": "local-kubernetes",
      "cloudProvider": "kubernetes",
      "location": "staging",
      "manifests": [
        {
          "apiVersion": "apps/v1",
          "kind": "Deployment",
          "metadata": {
            "name": "myapp",
            "namespace": "staging"
          },
          "spec": {
            "replicas": 2,
            "selector": {
              "matchLabels": {
                "app": "myapp"
              }
            },
            "template": {
              "metadata": {
                "labels": {
                  "app": "myapp"
                }
              },
              "spec": {
                "containers": [
                  {
                    "name": "myapp",
                    "image": "myorg/myapp:latest",
                    "ports": [{"containerPort": 8080}]
                  }
                ]
              }
            }
          }
        }
      ],
      "refId": "1"
    }
  ]
}
```

---

## Common Use Cases

- **Multi-Cloud Deployments**: Deploy to AWS, GCP, Azure, and Kubernetes
- **Advanced Deployment Strategies**: Canary, blue-green, rolling deployments
- **Automated Canary Analysis**: Metrics-based deployment decisions
- **Complex Pipeline Orchestration**: Multi-stage, multi-environment workflows
- **Enterprise Governance**: Approval workflows, RBAC, audit trails

✅ Spinnaker is now configured for advanced multi-cloud continuous delivery!
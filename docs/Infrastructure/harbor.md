---
sidebar_position: 4
title: Harbor Registry
description: Harbor is a cloud-native container registry that stores, signs, and scans container images. Learn how to deploy Harbor for secure container image management.
slug: /Infrastructure/Harbor
keywords:
  - Harbor
  - container registry
  - Docker registry
  - image scanning
  - vulnerability scanning
  - container security
---

# 🚢 Harbor Container Registry

**Harbor** is a **cloud-native container registry** that stores, signs, and scans **container images** with **vulnerability scanning** and **access control**.

---

## 🔧 Installation with Helm

`Add Harbor Helm repository:`
```bash
helm repo add harbor https://helm.goharbor.io
helm repo update
```

`Create values.yaml:`
```yaml
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor-tls
  ingress:
    hosts:
      core: harbor.yourdomain.com
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "0"

externalURL: https://harbor.yourdomain.com

harborAdminPassword: "HarborAdmin123"

database:
  type: internal

redis:
  type: internal

trivy:
  enabled: true

notary:
  enabled: false

persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      size: 100Gi
    database:
      size: 10Gi
    redis:
      size: 1Gi
    trivy:
      size: 5Gi
```

`Install Harbor:`
```bash
kubectl create namespace harbor
helm install harbor harbor/harbor -n harbor -f values.yaml
```

## ▶️ Sample Output

```bash
$ kubectl get pods -n harbor
NAME                                    READY   STATUS    RESTARTS   AGE
harbor-core-7d9c8f8b9c-xyz12           1/1     Running   0          5m
harbor-database-0                       1/1     Running   0          5m
harbor-jobservice-6b8c9d7f8d-abc34     1/1     Running   0          5m
harbor-portal-5f7b8c9d6e-def56         1/1     Running   0          5m
harbor-redis-0                          1/1     Running   0          5m
harbor-registry-7c8d9e0f1a-ghi78       2/2     Running   0          5m
harbor-trivy-0                          1/1     Running   0          5m

$ kubectl get ingress -n harbor
NAME           CLASS   HOSTS                   ADDRESS         PORTS     AGE
harbor-ingress nginx   harbor.yourdomain.com   192.168.1.100   80, 443   5m
```

## 🐳 Docker Configuration

`Configure Docker to use Harbor:`
```bash
# Login to Harbor
docker login harbor.yourdomain.com
Username: admin
Password: HarborAdmin123

# Tag and push image
docker tag myapp:latest harbor.yourdomain.com/library/myapp:latest
docker push harbor.yourdomain.com/library/myapp:latest
```

## 🔍 Vulnerability Scanning

`Enable automatic scanning:`
```bash
# Harbor automatically scans images with Trivy
# View scan results in Harbor UI:
# https://harbor.yourdomain.com
```

## 🔒 Project Configuration

`Create project via API:`
```bash
curl -X POST "https://harbor.yourdomain.com/api/v2.0/projects" \
  -H "Authorization: Basic $(echo -n admin:HarborAdmin123 | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "myproject",
    "public": false,
    "storage_limit": -1,
    "registry_id": null
  }'
```

## ☸️ Kubernetes Integration

`Create image pull secret:`
```bash
kubectl create secret docker-registry harbor-secret \
  --docker-server=harbor.yourdomain.com \
  --docker-username=admin \
  --docker-password=HarborAdmin123 \
  --docker-email=admin@yourdomain.com
```

`Use in deployment:`
```yaml
apiVersion: apps/v1
kind: 
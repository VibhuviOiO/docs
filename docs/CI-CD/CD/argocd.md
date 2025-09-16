---
sidebar_position: 1
title: ArgoCD
description: ArgoCD is a declarative GitOps continuous delivery tool for Kubernetes. Learn how to set up ArgoCD for automated application deployment.
slug: /CICD/ArgoCD
keywords:
  - ArgoCD
  - GitOps
  - Kubernetes deployment
  - continuous delivery
  - declarative deployment
---

# 🚀 ArgoCD GitOps Continuous Delivery

**ArgoCD** is a **declarative GitOps** continuous delivery tool for **Kubernetes** that automatically syncs applications from **Git repositories**.

---

## 🔧 Installation

`Install ArgoCD in Kubernetes:`
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## 📁 Application Configuration

`Create application.yaml:`
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp-config
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

`Apply application:`
```bash
kubectl apply -f application.yaml
```

## ▶️ Sample Output

```bash
$ argocd app list
NAME   CLUSTER                         NAMESPACE  PROJECT  STATUS  HEALTH   SYNCPOLICY  CONDITIONS  REPO                              PATH  TARGET
myapp  https://kubernetes.default.svc  default    default  Synced  Healthy  Auto-Prune  <none>      https://github.com/myorg/myapp   k8s   HEAD

$ argocd app get myapp
Name:               myapp
Project:            default
Server:             https://kubernetes.default.svc
Namespace:          default
URL:                https://argocd.example.com/applications/myapp
Repo:               https://github.com/myorg/myapp-config
Target:             HEAD
Path:               k8s
SyncWindow:         Sync Allowed
Sync Policy:        Automated (Prune)
Sync Status:        Synced to HEAD (abc123)
Health Status:      Healthy

GROUP  KIND        NAMESPACE  NAME    STATUS  HEALTH   HOOK  MESSAGE
       Service     default    myapp   Synced  Healthy        service/myapp created
apps   Deployment  default    myapp   Synced  Healthy        deployment.apps/myapp created
```

## 🔄 Multi-Environment Setup

```yaml
# staging-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-staging
spec:
  source:
    repoURL: https://github.com/myorg/myapp-config
    path: environments/staging
  destination:
    namespace: staging

# production-app.yaml  
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
spec:
  source:
    repoURL: https://github.com/myorg/myapp-config
    path: environments/production
  destination:
    namespace: production
  syncPolicy:
    automated: {}
```

**Reference:** [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
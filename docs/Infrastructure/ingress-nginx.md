---
sidebar_position: 1
title: Ingress NGINX Controller
description: Learn how to install and configure NGINX Ingress Controller for Kubernetes to manage external access to services with load balancing, SSL termination, and routing.
slug: /Infrastructure/IngressNginx
keywords:
  - ingress nginx
  - kubernetes ingress
  - nginx controller
  - load balancer
  - SSL termination
  - kubernetes networking
  - helm installation
---

# 🌐 NGINX Ingress Controller for Kubernetes

**NGINX Ingress Controller** manages external access to **Kubernetes services** with **load balancing**, **SSL termination**, and **name-based virtual hosting**.

---

## 🔍 Version Compatibility Check

### Check Kubernetes Version

`Check your Kubernetes version:`
```bash
kubectl version

# Example Output:
# Client Version: v1.30.3
# Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3
# Server Version: v1.30.3+k3s1
```

### Find Compatible Ingress-NGINX Version

Check the version compatibility matrix from the [official repository](https://github.com/kubernetes/ingress-nginx)

**For Kubernetes v1.30.x:**
- ingress-nginx: v1.10.1 - v1.11.2
- NGINX version: 1.25.3 - 1.25.5
- Helm chart version: 4.10.0 - 4.11.2

`Search for available helm versions:`
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm search repo ingress-nginx --versions
```

---

## 🔧 Installation Methods

### Option 1: Direct Helm Installation

`Install with specific versions:`
```bash
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --version 4.11.2 \
  --set controller.image.tag=v1.11.2 \
  --set controller.nginx.image.tag=1.25.5
```

**Installation Output:**
```bash
NAME: ingress-nginx
LAST DEPLOYED: Tue Sep 24 03:34:59 2024
NAMESPACE: ingress-nginx
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
The ingress-nginx controller has been installed.
It may take a few minutes for the load balancer IP to be available.
You can watch the status by running 'kubectl get service --namespace ingress-nginx ingress-nginx-controller --output wide --watch'
```

### Option 2: Production Template Method (Recommended)

`Generate template for production deployment:`
```bash
helm template ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --version 4.11.2 \
  --set controller.image.tag=v1.11.2 \
  --set controller.nginx.image.tag=1.25.5 \
  > ./ingress-nginx-1.25.5.yml

kubectl create namespace ingress-nginx 
kubectl apply -f ingress-nginx-1.25.5.yml -n ingress-nginx
```

---

## 🔍 Verification and Monitoring

### Check Installation Status

`Verify ingress controller is running:`
```bash
kubectl get pods -n ingress-nginx
kubectl get services -n ingress-nginx
```

`Watch the load balancer service:`
```bash
kubectl get service --namespace ingress-nginx ingress-nginx-controller --output wide --watch
```

### View Logs

`Check ingress controller logs:`
```bash
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

---

## 🌐 Basic Ingress Configuration

### Simple HTTP Ingress

`Create basic ingress resource:`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: www.example.com
    http:
      paths:
      - pathType: Prefix
        path: /
        backend:
          service:
            name: example-service
            port:
              number: 80
```

### HTTPS Ingress with TLS

`Create HTTPS ingress with TLS certificate:`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secure-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - secure.example.com
    secretName: example-tls
  rules:
  - host: secure.example.com
    http:
      paths:
      - pathType: Prefix
        path: /
        backend:
          service:
            name: secure-service
            port:
              number: 80
```

---

## ⚙️ Advanced Configuration

### Custom Annotations

`Common NGINX ingress annotations:`
```yaml
metadata:
  annotations:
    # SSL and Security
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # Rate Limiting
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    
    # CORS Configuration
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, OPTIONS"
    
    # Authentication
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
    
    # Custom Headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
    
    # Proxy Settings
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
```

### Path-Based Routing

`Multiple services on same domain:`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path-based-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: api-v1-service
            port:
              number: 8080
      - path: /api/v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

---

## 🔧 Troubleshooting

### Common Issues

`Check ingress resources:`
```bash
kubectl get ingress -A
kubectl describe ingress <ingress-name> -n <namespace>
```

`Validate ingress controller:`
```bash
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=100
```

`Test connectivity:`
```bash
# Test from within cluster
kubectl run test-pod --image=curlimages/curl -it --rm -- /bin/sh
curl -H "Host: example.com" http://ingress-nginx-controller.ingress-nginx.svc.cluster.local
```

### Debug Mode

`Enable debug logging:`
```bash
kubectl patch deployment ingress-nginx-controller -n ingress-nginx -p '{"spec":{"template":{"spec":{"containers":[{"name":"controller","args":["--v=2"]}]}}}}'
```

---

## 📊 Monitoring and Metrics

### Built-in Metrics

`Access NGINX metrics:`
```bash
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller-metrics 10254:10254
curl http://localhost:10254/metrics
```

### Health Checks

`Check controller health:`
```bash
kubectl get pods -n ingress-nginx
kubectl describe pod <controller-pod-name> -n ingress-nginx
```

---

## 🔒 Security Best Practices

- Always use TLS/SSL for production traffic
- Implement rate limiting to prevent abuse
- Use authentication for sensitive endpoints
- Configure proper CORS policies
- Set security headers via configuration snippets
- Regularly update ingress controller versions
- Monitor access logs for suspicious activity

---

## 📚 Example Ingress Templates

The ingress controller supports various configuration patterns:

- Basic HTTP routing
- HTTPS with automatic certificate management
- Path-based routing for microservices
- Host-based routing for multi-tenant applications
- WebSocket support
- gRPC load balancing
- Custom error pages

**Reference:** [NGINX Ingress Documentation](https://kubernetes.github.io/ingress-nginx/)

✅ NGINX Ingress Controller is now configured for managing external access to your Kubernetes services!
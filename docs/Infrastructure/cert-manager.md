---
sidebar_position: 2
title: Cert-Manager
description: Learn how to deploy cert-manager for automatic SSL/TLS certificate management in Kubernetes with Let's Encrypt and wildcard certificates.
slug: /Infrastructure/CertManager
keywords:
  - cert-manager
  - SSL certificates
  - TLS
  - Let's Encrypt
  - wildcard certificates
  - Kubernetes certificates
---

# 🔒 Cert-Manager SSL Certificate Management

**Cert-Manager** automatically provisions and manages **SSL/TLS certificates** in **Kubernetes** with support for **Let's Encrypt** and **wildcard certificates**.

---

## 🔧 Installation

`Install cert-manager with Helm:`
```bash
helm repo add jetstack https://charts.jetstack.io --force-update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.15.3 \
  --set crds.enabled=true
```

## 🌐 GoDaddy DNS Integration

`Install GoDaddy webhook:`
```bash
git clone https://github.com/snowdrop/godaddy-webhook.git
cd godaddy-webhook

export DOMAIN=yourdomain.com
helm install -n cert-manager godaddy-webhook ./deploy/charts/godaddy-webhook --set groupName=$DOMAIN
```

## 🔑 Create API Secret

`Create GoDaddy API secret:`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: yourdomain-godaddy-api-key
  namespace: cert-manager
type: Opaque
stringData:
  token: "GODADDY_API_KEY:GODADDY_SECRET_KEY"
```

## 📜 ClusterIssuer Configuration

`Create clusterissuer.yml:`
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-production
    solvers:
    - selector:
        dnsZones:
        - 'yourdomain.com'
      dns01:
        webhook:
          config:
            apiKeySecretRef:
              name: yourdomain-godaddy-api-key
              key: token
            production: true
            ttl: 600
          groupName: yourdomain.com
          solverName: godaddy
```

## 🌟 Wildcard Certificate

`Create certificate.yml:`
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-yourdomain-com
  namespace: cert-manager
spec:
  secretName: wildcard-yourdomain-com-tls
  renewBefore: 240h
  dnsNames:
  - '*.yourdomain.com'
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
```

## ▶️ Sample Output

```bash
$ kubectl get certificates -n cert-manager
NAME                     READY   SECRET                         AGE
wildcard-yourdomain-com  True    wildcard-yourdomain-com-tls    5m

$ kubectl describe certificate wildcard-yourdomain-com -n cert-manager
Status:
  Conditions:
    Type:    Ready
    Status:  True
    Message: Certificate is up to date and has not expired
```

## 🔄 Certificate Replication

`Replicate certificates across namespaces:`
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: cert-replication
  namespace: cert-manager
spec:
  template:
    spec:
      containers:
      - name: cert-replication
        image: bitnami/kubectl:latest
        command:
        - /bin/sh
        - -c
        - |
          SECRET_NAME="wildcard-yourdomain-com-tls"
          SOURCE_NAMESPACE="cert-manager"
          TARGET_NAMESPACES="default production staging"
          
          kubectl get secret $SECRET_NAME -n $SOURCE_NAMESPACE -o yaml > /tmp/secret.yaml
          for NAMESPACE in $TARGET_NAMESPACES; do
            kubectl delete secret $SECRET_NAME -n $NAMESPACE --ignore-not-found
            sed "s/namespace: $SOURCE_NAMESPACE/namespace: $NAMESPACE/" /tmp/secret.yaml | kubectl apply -f -
          done
      restartPolicy: OnFailure
```

## 🌐 Ingress with SSL

`Create ingress with wildcard certificate:`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.yourdomain.com
    secretName: wildcard-yourdomain-com-tls
  rules:
  - host: app.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
```

**Reference:** [Cert-Manager Documentation](https://cert-manager.io/docs/)
---
sidebar_position: 1
title: Helm
description: Helm is the package manager for Kubernetes that helps you manage Kubernetes applications. Learn how to use Helm for deploying and managing applications on Kubernetes.
slug: /Container-Orchestration/Helm
keywords:
  - Helm
  - Kubernetes package manager
  - Helm charts
  - Kubernetes deployment
  - application packaging
  - container orchestration
  - DevOps automation
  - microservices deployment
  - Kubernetes applications
  - chart repository
---

# ⚓ Helm - The Package Manager for Kubernetes

**Helm** is the **package manager for Kubernetes** that helps you **define**, **install**, and **upgrade** even the most complex Kubernetes applications. Helm uses **charts** to package Kubernetes resources and manage application lifecycles.

---

## Set Up Helm with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # Kubernetes cluster (using kind)
  kind-cluster:
    image: kindest/node:v1.28.0
    container_name: kind-control-plane
    restart: unless-stopped
    privileged: true
    ports:
      - "6443:6443"
      - "80:80"
      - "443:443"
    volumes:
      - /var/lib/docker
    environment:
      - KUBECONFIG=/etc/kubernetes/admin.conf

  # Helm client container
  helm-client:
    image: alpine/helm:3.13.0
    container_name: helm-client
    restart: unless-stopped
    volumes:
      - ./charts:/charts
      - ./kubeconfig:/root/.kube
      - ./helm-values:/values
    working_dir: /charts
    command: ["sleep", "infinity"]

  # Chart Museum (Helm repository)
  chartmuseum:
    image: chartmuseum/chartmuseum:v0.16.0
    container_name: chartmuseum
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - DEBUG=1
      - STORAGE=local
      - STORAGE_LOCAL_ROOTDIR=/charts
      - PORT=8080
      - BASIC_AUTH_USER=admin
      - BASIC_AUTH_PASS=password
    volumes:
      - chartmuseum-data:/charts

volumes:
  chartmuseum-data:
```

`Create necessary directories:`
```bash
mkdir -p charts kubeconfig helm-values
```

`Start Helm environment:`
```bash
docker compose up -d
```

`Install Helm locally (alternative):`
```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Windows
choco install kubernetes-helm
```

---

## Basic Helm Operations

### Repository Management

`Add and manage Helm repositories:`
```bash
# Add popular repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

# Update repositories
helm repo update

# List repositories
helm repo list

# Search for charts
helm search repo nginx
helm search repo prometheus
```

### Installing Applications

`Install applications using Helm:`
```bash
# Install NGINX Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Install Prometheus monitoring stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123

# Install PostgreSQL database
helm install postgres bitnami/postgresql \
  --namespace database \
  --create-namespace \
  --set auth.postgresPassword=postgres123 \
  --set primary.persistence.size=10Gi

# List installed releases
helm list --all-namespaces

# Get release status
helm status prometheus -n monitoring
```

---

## Creating Custom Helm Charts

### Basic Chart Structure

`Create a new chart:`
```bash
helm create myapp
```

`Chart structure:`
```
myapp/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default configuration values
├── charts/             # Chart dependencies
├── templates/          # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── serviceaccount.yaml
│   ├── _helpers.tpl    # Template helpers
│   ├── hpa.yaml
│   ├── NOTES.txt       # Installation notes
│   └── tests/
│       └── test-connection.yaml
└── .helmignore         # Files to ignore
```

### Chart.yaml Configuration

`Create charts/myapp/Chart.yaml:`
```yaml
apiVersion: v2
name: myapp
description: A Helm chart for MyApp - a sample web application
type: application
version: 0.1.0
appVersion: "1.0.0"
home: https://github.com/myorg/myapp
sources:
  - https://github.com/myorg/myapp
maintainers:
  - name: DevOps Team
    email: devops@myorg.com
keywords:
  - web
  - application
  - microservice
annotations:
  category: Application
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: "17.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

### Values Configuration

`Create charts/myapp/values.yaml:`
```yaml
# Default values for myapp
replicaCount: 2

image:
  repository: myorg/myapp
  pullPolicy: IfNotPresent
  tag: "1.0.0"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext:
  fsGroup: 2000

securityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

# Application configuration
config:
  environment: production
  logLevel: info
  database:
    host: ""
    port: 5432
    name: myapp
    user: myapp
  redis:
    host: ""
    port: 6379
  features:
    enableMetrics: true
    enableTracing: true

# External dependencies
postgresql:
  enabled: true
  auth:
    postgresPassword: "postgres123"
    username: "myapp"
    password: "myapp123"
    database: "myapp"
  primary:
    persistence:
      enabled: true
      size: 10Gi

redis:
  enabled: true
  auth:
    enabled: false
  master:
    persistence:
      enabled: true
      size: 5Gi

# Monitoring
monitoring:
  enabled: true
  serviceMonitor:
    enabled: true
    interval: 30s
    path: /metrics

# Health checks
healthCheck:
  enabled: true
  livenessProbe:
    httpGet:
      path: /health
      port: http
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /ready
      port: http
    initialDelaySeconds: 5
    periodSeconds: 5
```

### Deployment Template

`Create charts/myapp/templates/deployment.yaml:`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "myapp.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          env:
            - name: ENVIRONMENT
              value: {{ .Values.config.environment }}
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel }}
            - name: DATABASE_HOST
              value: {{ include "myapp.databaseHost" . }}
            - name: DATABASE_PORT
              value: "{{ .Values.config.database.port }}"
            - name: DATABASE_NAME
              value: {{ .Values.config.database.name }}
            - name: DATABASE_USER
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-secret
                  key: database-user
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ include "myapp.fullname" . }}-secret
                  key: database-password
            - name: REDIS_HOST
              value: {{ include "myapp.redisHost" . }}
            - name: REDIS_PORT
              value: "{{ .Values.config.redis.port }}"
          {{- if .Values.healthCheck.enabled }}
          livenessProbe:
            {{- toYaml .Values.healthCheck.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.healthCheck.readinessProbe | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: {{ include "myapp.fullname" . }}-config
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### Service Template

`Create charts/myapp/templates/service.yaml:`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  {{- if .Values.monitoring.enabled }}
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "{{ .Values.service.targetPort }}"
    prometheus.io/path: "/metrics"
  {{- end }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "myapp.selectorLabels" . | nindent 4 }}
```

### ConfigMap Template

`Create charts/myapp/templates/configmap.yaml:`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-config
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
data:
  app.yaml: |
    environment: {{ .Values.config.environment }}
    logLevel: {{ .Values.config.logLevel }}
    features:
      enableMetrics: {{ .Values.config.features.enableMetrics }}
      enableTracing: {{ .Values.config.features.enableTracing }}
    database:
      host: {{ include "myapp.databaseHost" . }}
      port: {{ .Values.config.database.port }}
      name: {{ .Values.config.database.name }}
    redis:
      host: {{ include "myapp.redisHost" . }}
      port: {{ .Values.config.redis.port }}
```

### Helper Templates

`Create charts/myapp/templates/_helpers.tpl:`
```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "myapp.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ include "myapp.chart" . }}
{{ include "myapp.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "myapp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "myapp.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database host helper
*/}}
{{- define "myapp.databaseHost" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "myapp.fullname" .) }}
{{- else }}
{{- .Values.config.database.host }}
{{- end }}
{{- end }}

{{/*
Redis host helper
*/}}
{{- define "myapp.redisHost" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s-redis-master" (include "myapp.fullname" .) }}
{{- else }}
{{- .Values.config.redis.host }}
{{- end }}
{{- end }}
```

---

## Advanced Helm Features

### Multi-Environment Deployments

`Create environment-specific values files:`

`helm-values/values-dev.yaml:`
```yaml
replicaCount: 1

image:
  tag: "dev-latest"

config:
  environment: development
  logLevel: debug

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false

ingress:
  hosts:
    - host: myapp-dev.example.com
      paths:
        - path: /
          pathType: Prefix

postgresql:
  primary:
    persistence:
      size: 5Gi

redis:
  master:
    persistence:
      size: 2Gi
```

`helm-values/values-prod.yaml:`
```yaml
replicaCount: 3

image:
  tag: "1.0.0"

config:
  environment: production
  logLevel: warn

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20

ingress:
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix

postgresql:
  primary:
    persistence:
      size: 50Gi

redis:
  master:
    persistence:
      size: 10Gi

nodeSelector:
  node-type: production

tolerations:
  - key: "production"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

### Deployment Commands

`Deploy to different environments:`
```bash
# Development deployment
helm install myapp-dev ./charts/myapp \
  --namespace dev \
  --create-namespace \
  --values helm-values/values-dev.yaml

# Production deployment
helm install myapp-prod ./charts/myapp \
  --namespace prod \
  --create-namespace \
  --values helm-values/values-prod.yaml

# Upgrade deployment
helm upgrade myapp-prod ./charts/myapp \
  --namespace prod \
  --values helm-values/values-prod.yaml \
  --set image.tag=1.1.0

# Rollback deployment
helm rollback myapp-prod 1 --namespace prod
```

---

## Helm Hooks and Tests

### Pre-install Hook

`Create charts/myapp/templates/pre-install-job.yaml:`
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-pre-install
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    metadata:
      name: {{ include "myapp.fullname" . }}-pre-install
    spec:
      restartPolicy: Never
      containers:
      - name: pre-install
        image: postgres:15-alpine
        command:
          - /bin/sh
          - -c
          - |
            echo "Running pre-install checks..."
            
            # Wait for database to be ready
            until pg_isready -h {{ include "myapp.databaseHost" . }} -p {{ .Values.config.database.port }}; do
              echo "Waiting for database..."
              sleep 2
            done
            
            echo "Database is ready!"
            
            # Run database migrations
            echo "Running database migrations..."
            # Add your migration commands here
            
            echo "Pre-install completed successfully!"
        env:
          - name: PGHOST
            value: {{ include "myapp.databaseHost" . }}
          - name: PGPORT
            value: "{{ .Values.config.database.port }}"
          - name: PGUSER
            value: {{ .Values.config.database.user }}
          - name: PGPASSWORD
            valueFrom:
              secretKeyRef:
                name: {{ include "myapp.fullname" . }}-secret
                key: database-password
```

### Chart Tests

`Create charts/myapp/templates/tests/test-connection.yaml:`
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "myapp.fullname" . }}-test-connection"
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox:1.35
      command: ['wget']
      args: ['{{ include "myapp.fullname" . }}:{{ .Values.service.port }}/health']
    - name: database-test
      image: postgres:15-alpine
      command:
        - /bin/sh
        - -c
        - |
          echo "Testing database connection..."
          pg_isready -h {{ include "myapp.databaseHost" . }} -p {{ .Values.config.database.port }}
          echo "Database connection test passed!"
      env:
        - name: PGHOST
          value: {{ include "myapp.databaseHost" . }}
        - name: PGPORT
          value: "{{ .Values.config.database.port }}"
```

`Run tests:`
```bash
helm test myapp-dev --namespace dev
```

---

## Chart Repository Management

### Package and Publish Charts

`Package chart:`
```bash
# Package the chart
helm package charts/myapp

# Generate index
helm repo index . --url https://charts.example.com

# Upload to chart repository (example with ChartMuseum)
curl --data-binary "@myapp-0.1.0.tgz" \
  -u admin:password \
  http://localhost:8080/api/charts
```

### Private Chart Repository

`Set up private repository:`
```bash
# Add private repository
helm repo add myorg-charts http://localhost:8080 \
  --username admin \
  --password password

# Install from private repository
helm install myapp myorg-charts/myapp \
  --namespace production \
  --create-namespace
```

---

## Helm Best Practices

### Chart Development Guidelines

`Create charts/myapp/.helmignore:`
```
# Patterns to ignore when building packages
.git/
.gitignore
.DS_Store
*.swp
*.bak
*.tmp
*.orig
*~
.project
.idea/
*.tmproj
.vscode/
```

### Security Best Practices

`Create charts/myapp/templates/network-policy.yaml:`
```yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: {{ .Values.service.targetPort }}
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector:
            matchLabels:
              name: redis
      ports:
        - protocol: TCP
          port: 6379
{{- end }}
```

### Monitoring Integration

`Create charts/myapp/templates/servicemonitor.yaml:`
```yaml
{{- if and .Values.monitoring.enabled .Values.monitoring.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: http
      path: {{ .Values.monitoring.serviceMonitor.path }}
      interval: {{ .Values.monitoring.serviceMonitor.interval }}
{{- end }}
```

---

## Common Use Cases

- **Application Packaging**: Package complex Kubernetes applications with dependencies
- **Multi-Environment Deployments**: Deploy applications across dev, staging, and production
- **Configuration Management**: Manage application configurations across environments
- **Dependency Management**: Handle application dependencies and service relationships
- **Release Management**: Version control and rollback capabilities for deployments
- **Template Reusability**: Create reusable templates for similar applications

✅ Helm is now configured for comprehensive Kubernetes application management!
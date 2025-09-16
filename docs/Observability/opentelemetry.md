---
sidebar_position: 7
title: OpenTelemetry
description: OpenTelemetry is an observability framework for generating, collecting, and exporting telemetry data. Learn how to implement comprehensive observability with OpenTelemetry.
slug: /Observability/OpenTelemetry
keywords:
  - OpenTelemetry
  - observability
  - telemetry data
  - distributed tracing
  - metrics collection
  - logging
  - OTEL
  - instrumentation
  - monitoring
  - APM
---

# 🚀 Comprehensive Observability with OpenTelemetry

**OpenTelemetry** is a **vendor-neutral** observability framework for generating, collecting, and exporting **telemetry data** (metrics, logs, and traces). Perfect for **unified observability**, **multi-vendor compatibility**, and **standardized instrumentation** across your entire technology stack.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Docker & Docker Compose** installed
- **Applications** to instrument (Node.js, Python, Java, etc.)
- **Backend systems** (Jaeger, Prometheus, etc.)
- **Basic understanding** of observability concepts

---

## 🔧 Step 1: Setup OpenTelemetry Collector

### Docker Compose Setup

`Create docker-compose.yml:`
```yaml
version: '3.8'

services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.89.0
    container_name: otel-collector
    restart: unless-stopped
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
      - "8888:8888"   # Prometheus metrics
      - "8889:8889"   # Prometheus exporter
      - "13133:13133" # Health check
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol-contrib/otel-collector-config.yaml
    environment:
      - ENVIRONMENT=development
    command: ["--config=/etc/otelcol-contrib/otel-collector-config.yaml"]

  # Jaeger for trace storage
  jaeger:
    image: jaegertracing/all-in-one:1.51
    container_name: jaeger
    restart: unless-stopped
    ports:
      - "16686:16686"  # Jaeger UI
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

volumes:
  otel-data:
```

### OpenTelemetry Collector Configuration

`Create otel-collector-config.yaml:`
```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 30s
          static_configs:
            - targets: ['localhost:8888']

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

  memory_limiter:
    limit_mib: 512

  resource:
    attributes:
      - key: environment
        value: ${ENVIRONMENT}
        action: upsert

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: otel

  logging:
    loglevel: info

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [jaeger, logging]

    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, resource, batch]
      exporters: [prometheus, logging]

  telemetry:
    logs:
      level: info
    metrics:
      address: 0.0.0.0:8888
```

---

## 🏗️ Step 2: Application Instrumentation

### Node.js Auto-Instrumentation

`Create nodejs-otel.js:`
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Configure resource attributes
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'nodejs-service',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
});

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
});

// Initialize SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK
sdk.start();
console.log('OpenTelemetry started successfully');

// Sample Express application
const express = require('express');
const { trace } = require('@opentelemetry/api');

const app = express();
const port = process.env.PORT || 3000;
const tracer = trace.getTracer('sample-app', '1.0.0');

app.get('/api/users/:id', async (req, res) => {
  const span = tracer.startSpan('get_user_handler');
  
  try {
    span.setAttributes({
      'user.id': req.params.id,
      'http.method': req.method,
    });
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    const user = {
      id: req.params.id,
      name: `User ${req.params.id}`,
      email: `user${req.params.id}@example.com`,
    };
    
    res.json(user);
  } catch (error) {
    span.recordException(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Python Auto-Instrumentation

`Create python-otel.py:`
```python
import os
import time
import random
from flask import Flask, jsonify
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Configure resource
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: os.getenv('OTEL_SERVICE_NAME', 'python-service'),
    ResourceAttributes.SERVICE_VERSION: os.getenv('OTEL_SERVICE_VERSION', '1.0.0'),
})

# Configure trace provider
trace_exporter = OTLPSpanExporter(
    endpoint=os.getenv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', 'http://localhost:4318/v1/traces'),
)

trace_provider = TracerProvider(resource=resource)
trace_processor = BatchSpanProcessor(trace_exporter)
trace_provider.add_span_processor(trace_processor)
trace.set_tracer_provider(trace_provider)

# Get tracer
tracer = trace.get_tracer(__name__)

# Initialize Flask app
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    with tracer.start_as_current_span("get_user_handler") as span:
        span.set_attributes({
            "user.id": user_id,
        })
        
        try:
            # Simulate processing
            time.sleep(random.uniform(0.01, 0.1))
            
            user = {
                "id": user_id,
                "name": f"User {user_id}",
                "email": f"user{user_id}@example.com",
            }
            
            return jsonify(user)
            
        except Exception as e:
            span.record_exception(e)
            return jsonify({"error": "Internal server error"}), 500

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

---

## ▶️ Step 3: Kubernetes Deployment

### OpenTelemetry Operator

`Create otel-operator.yaml:`
```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: otel-collector
  namespace: observability
spec:
  mode: deployment
  replicas: 3
  
  image: otel/opentelemetry-collector-contrib:0.89.0
  
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      
      k8s_cluster:
        auth_type: serviceAccount
        
    processors:
      batch:
        timeout: 1s
      
      memory_limiter:
        limit_mib: 1500
      
      k8sattributes:
        auth_type: serviceAccount
        extract:
          metadata:
            - k8s.pod.name
            - k8s.deployment.name
            - k8s.namespace.name
    
    exporters:
      otlp:
        endpoint: http://jaeger-collector:14250
        tls:
          insecure: true
      
      prometheus:
        endpoint: "0.0.0.0:8889"
    
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [otlp]
        
        metrics:
          receivers: [otlp, k8s_cluster]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [prometheus]
```

### Auto-Instrumentation

`Create auto-instrumentation.yaml:`
```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: auto-instrumentation
  namespace: default
spec:
  exporter:
    endpoint: http://otel-collector.observability.svc.cluster.local:4318
  
  nodejs:
    image: otel/autoinstrumentation-nodejs:0.44.0
  
  python:
    image: otel/autoinstrumentation-python:0.41b0

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
      annotations:
        instrumentation.opentelemetry.io/inject-nodejs: "auto-instrumentation"
    spec:
      containers:
      - name: app
        image: your-registry/sample-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: OTEL_SERVICE_NAME
          value: "sample-app"
```

---

## 📊 Step 4: Monitoring and Visualization

### Prometheus Configuration

`Create prometheus.yml:`
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8888']

  - job_name: 'otel-metrics'
    static_configs:
      - targets: ['otel-collector:8889']
```

### Start the Stack

```bash
# Start all services
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs otel-collector

# Access UIs
echo "Jaeger UI: http://localhost:16686"
echo "Prometheus: http://localhost:9090"
echo "Collector Health: http://localhost:13133"
```

---

## 📋 Common Use Cases

### 1. **Unified Observability**
- Single platform for traces, metrics, and logs
- Vendor-neutral instrumentation
- Standardized telemetry collection
- Multi-backend export capabilities

### 2. **Microservices Monitoring**
- Distributed tracing across services
- Service dependency mapping
- Performance bottleneck identification
- Auto-instrumentation for containers

### 3. **Cloud-Native Applications**
- Kubernetes-native observability
- Resource utilization monitoring
- Scalable telemetry collection
- Custom business metrics

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Unified Observability Platform** - Complete OpenTelemetry implementation
2. **📊 Multi-Signal Telemetry** - Traces, metrics, and logs collection
3. **🔍 Auto-Instrumentation** - Automatic telemetry for applications
4. **🚀 Scalable Collection** - High-performance data collection
5. **📈 Custom Metrics** - Business-specific monitoring
6. **🛡️ Vendor Neutrality** - Avoid vendor lock-in
7. **🔄 Multi-Backend Export** - Send data to multiple backends
8. **👥 Developer Experience** - Easy instrumentation and debugging

✅ **OpenTelemetry is now configured for your comprehensive observability workflows!**
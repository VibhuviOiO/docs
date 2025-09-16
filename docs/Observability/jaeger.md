---
sidebar_position: 6
title: Jaeger
description: Jaeger is an open-source distributed tracing system for monitoring and troubleshooting microservices. Learn how to set up Jaeger for comprehensive application observability.
slug: /Observability/Jaeger
keywords:
  - Jaeger
  - distributed tracing
  - microservices monitoring
  - observability
  - OpenTracing
  - performance monitoring
  - request tracing
  - service mesh
  - application monitoring
  - troubleshooting
---

# 🚀 Distributed Tracing and Monitoring with Jaeger

**Jaeger** is an **open-source** distributed tracing system for **monitoring** and **troubleshooting** microservices-based distributed systems. Perfect for **observability**, **performance analysis**, and **debugging** complex **service interactions** with comprehensive **trace visualization**.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Docker & Docker Compose** installed
- **Kubernetes cluster** (optional, for production deployment)
- **Microservices application** to monitor
- **Basic understanding** of distributed systems
- **OpenTracing/OpenTelemetry** knowledge (helpful)

---

## 🔧 Step 1: Setup Jaeger with Docker Compose

### All-in-One Jaeger Deployment

`Create docker-compose.yml:`
```yaml
version: '3.8'

services:
  # Jaeger All-in-One (for development/testing)
  jaeger-all-in-one:
    image: jaegertracing/all-in-one:1.51
    container_name: jaeger
    restart: unless-stopped
    ports:
      - "16686:16686"  # Jaeger UI
      - "14268:14268"  # HTTP collector
      - "14250:14250"  # gRPC collector
      - "6831:6831/udp"  # UDP agent
      - "6832:6832/udp"  # UDP agent
      - "5778:5778"   # Config server
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    command: [
      "--memory.max-traces=50000",
      "--query.base-path=/jaeger/ui"
    ]

  # Sample microservices for demonstration
  frontend:
    image: jaegertracing/example-hotrod:1.51
    container_name: hotrod-frontend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - JAEGER_AGENT_HOST=jaeger-all-in-one
      - JAEGER_AGENT_PORT=6831
    depends_on:
      - jaeger-all-in-one
    command: ["all"]

  # OpenTelemetry Collector (optional)
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.89.0
    container_name: otel-collector
    restart: unless-stopped
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
      - "8888:8888"   # Prometheus metrics
      - "8889:8889"   # Prometheus exporter metrics
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol-contrib/otel-collector-config.yaml
    command: ["--config=/etc/otelcol-contrib/otel-collector-config.yaml"]
    depends_on:
      - jaeger-all-in-one

volumes:
  jaeger-data:
```

### Production Jaeger Deployment

`Create docker-compose.prod.yml:`
```yaml
version: '3.8'

services:
  # Elasticsearch for storage
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: jaeger-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Jaeger Collector
  jaeger-collector:
    image: jaegertracing/jaeger-collector:1.51
    container_name: jaeger-collector
    restart: unless-stopped
    ports:
      - "14269:14269"  # Admin port
      - "14268:14268"  # HTTP collector
      - "14250:14250"  # gRPC collector
      - "9411:9411"    # Zipkin compatible
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
      - ES_NUM_SHARDS=1
      - ES_NUM_REPLICAS=0
      - COLLECTOR_OTLP_ENABLED=true
    depends_on:
      elasticsearch:
        condition: service_healthy
    command: [
      "--es.num-shards=1",
      "--es.num-replicas=0",
      "--collector.otlp.enabled=true"
    ]

  # Jaeger Query Service
  jaeger-query:
    image: jaegertracing/jaeger-query:1.51
    container_name: jaeger-query
    restart: unless-stopped
    ports:
      - "16686:16686"  # Jaeger UI
      - "16687:16687"  # Admin port
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
      - ES_NUM_SHARDS=1
      - ES_NUM_REPLICAS=0
    depends_on:
      elasticsearch:
        condition: service_healthy
    command: [
      "--es.num-shards=1",
      "--es.num-replicas=0"
    ]

  # Jaeger Agent
  jaeger-agent:
    image: jaegertracing/jaeger-agent:1.51
    container_name: jaeger-agent
    restart: unless-stopped
    ports:
      - "5775:5775/udp"  # Zipkin Thrift
      - "6831:6831/udp"  # Jaeger Thrift
      - "6832:6832/udp"  # Jaeger binary
      - "5778:5778"      # Config server
    environment:
      - REPORTER_GRPC_HOST_PORT=jaeger-collector:14250
    depends_on:
      - jaeger-collector
    command: [
      "--reporter.grpc.host-port=jaeger-collector:14250"
    ]

volumes:
  elasticsearch-data:
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
  
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268
      thrift_compact:
        endpoint: 0.0.0.0:6831
      thrift_binary:
        endpoint: 0.0.0.0:6832

  zipkin:
    endpoint: 0.0.0.0:9411

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048

  memory_limiter:
    limit_mib: 512

  resource:
    attributes:
      - key: environment
        value: production
        action: upsert

exporters:
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true

  prometheus:
    endpoint: "0.0.0.0:8889"

  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp, jaeger, zipkin]
      processors: [memory_limiter, resource, batch]
      exporters: [jaeger, logging]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [prometheus, logging]

  extensions: [health_check, pprof, zpages]
```

---

## 🏗️ Step 2: Instrument Applications for Tracing

### Node.js Application Instrumentation

`Create nodejs-tracing.js:`
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Initialize Jaeger exporter
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'nodejs-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.ENVIRONMENT || 'development',
  }),
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable file system instrumentation (too noisy)
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Configure HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          // Ignore health check endpoints
          return req.url?.includes('/health') || req.url?.includes('/metrics');
        },
      },
      // Configure Express instrumentation
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK
sdk.start();

console.log('OpenTelemetry tracing initialized');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

// Sample Express application
const express = require('express');
const axios = require('axios');
const { trace, context } = require('@opentelemetry/api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Custom tracing example
app.get('/api/users/:id', async (req, res) => {
  const tracer = trace.getTracer('user-service');
  
  // Create a custom span
  const span = tracer.startSpan('get-user-details');
  
  try {
    // Add span attributes
    span.setAttributes({
      'user.id': req.params.id,
      'http.method': req.method,
      'http.url': req.url,
    });
    
    // Simulate database call
    const user = await getUserFromDatabase(req.params.id);
    
    // Add more attributes based on result
    span.setAttributes({
      'user.found': !!user,
      'user.name': user?.name || 'unknown',
    });
    
    if (user) {
      // Make external API call with tracing context
      const enrichedUser = await context.with(trace.setSpan(context.active(), span), async () => {
        return await enrichUserData(user);
      });
      
      res.json(enrichedUser);
    } else {
      span.recordException(new Error('User not found'));
      span.setStatus({ code: trace.SpanStatusCode.ERROR, message: 'User not found' });
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    // Record exception in span
    span.recordException(error);
    span.setStatus({ code: trace.SpanStatusCode.ERROR, message: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Always end the span
    span.end();
  }
});

// Simulate database operation
async function getUserFromDatabase(userId) {
  const tracer = trace.getTracer('database');
  const span = tracer.startSpan('db.query.select_user');
  
  try {
    span.setAttributes({
      'db.system': 'postgresql',
      'db.statement': 'SELECT * FROM users WHERE id = $1',
      'db.operation': 'select',
      'db.table': 'users',
    });
    
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Mock user data
    const user = {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      created_at: new Date().toISOString(),
    };
    
    span.setAttributes({
      'db.rows_affected': 1,
    });
    
    return user;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: trace.SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

// Simulate external API call
async function enrichUserData(user) {
  const tracer = trace.getTracer('external-api');
  const span = tracer.startSpan('external.api.user_profile');
  
  try {
    span.setAttributes({
      'http.method': 'GET',
      'http.url': `https://api.example.com/profiles/${user.id}`,
      'external.service': 'profile-service',
    });
    
    // Simulate external API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    // Mock enriched data
    const enrichedData = {
      ...user,
      profile: {
        avatar: `https://avatars.example.com/${user.id}`,
        bio: `Bio for ${user.name}`,
        followers: Math.floor(Math.random() * 1000),
      },
    };
    
    span.setAttributes({
      'http.status_code': 200,
      'profile.followers': enrichedData.profile.followers,
    });
    
    return enrichedData;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: trace.SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({ code: trace.SpanStatusCode.ERROR, message: error.message });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Python Application Instrumentation

`Create python-tracing.py:`
```python
import os
import time
import random
from flask import Flask, request, jsonify
import requests
import psycopg2
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

# Configure OpenTelemetry
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: os.getenv('SERVICE_NAME', 'python-service'),
    ResourceAttributes.SERVICE_VERSION: os.getenv('SERVICE_VERSION', '1.0.0'),
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv('ENVIRONMENT', 'development'),
})

# Initialize tracer provider
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer_provider = trace.get_tracer_provider()

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name=os.getenv('JAEGER_AGENT_HOST', 'localhost'),
    agent_port=int(os.getenv('JAEGER_AGENT_PORT', '6831')),
)

# Add span processor
span_processor = BatchSpanProcessor(jaeger_exporter)
tracer_provider.add_span_processor(span_processor)

# Get tracer
tracer = trace.get_tracer(__name__)

# Initialize Flask app
app = Flask(__name__)

# Auto-instrument Flask, Requests, and Psycopg2
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
Psycopg2Instrumentor().instrument()

class DatabaseService:
    def __init__(self):
        self.connection_string = os.getenv(
            'DATABASE_URL', 
            'postgresql://user:password@localhost:5432/mydb'
        )
    
    def get_user(self, user_id):
        """Get user from database with tracing"""
        with tracer.start_as_current_span("db.get_user") as span:
            span.set_attributes({
                "db.system": "postgresql",
                "db.operation": "select",
                "db.table": "users",
                "user.id": user_id,
            })
            
            try:
                # Simulate database connection and query
                time.sleep(random.uniform(0.01, 0.1))  # Simulate DB latency
                
                # Mock user data
                user = {
                    "id": user_id,
                    "name": f"User {user_id}",
                    "email": f"user{user_id}@example.com",
                    "created_at": "2024-01-01T00:00:00Z"
                }
                
                span.set_attributes({
                    "db.rows_affected": 1,
                    "user.name": user["name"],
                })
                
                return user
                
            except Exception as e:
                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                raise

class ExternalAPIService:
    def __init__(self):
        self.base_url = os.getenv('EXTERNAL_API_URL', 'https://api.example.com')
    
    def enrich_user_data(self, user):
        """Enrich user data from external API"""
        with tracer.start_as_current_span("external.api.enrich_user") as span:
            span.set_attributes({
                "http.method": "GET",
                "http.url": f"{self.base_url}/profiles/{user['id']}",
                "external.service": "profile-service",
                "user.id": user["id"],
            })
            
            try:
                # Simulate external API call
                time.sleep(random.uniform(0.05, 0.2))  # Simulate API latency
                
                # Mock enriched data
                enriched_user = {
                    **user,
                    "profile": {
                        "avatar": f"https://avatars.example.com/{user['id']}",
                        "bio": f"Bio for {user['name']}",
                        "followers": random.randint(0, 1000),
                        "verified": random.choice([True, False])
                    }
                }
                
                span.set_attributes({
                    "http.status_code": 200,
                    "profile.followers": enriched_user["profile"]["followers"],
                    "profile.verified": enriched_user["profile"]["verified"],
                })
                
                return enriched_user
                
            except Exception as e:
                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                raise

# Initialize services
db_service = DatabaseService()
api_service = ExternalAPIService()

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    """Get user endpoint with comprehensive tracing"""
    with tracer.start_as_current_span("get_user_handler") as span:
        span.set_attributes({
            "http.method": request.method,
            "http.url": request.url,
            "http.route": "/api/users/<int:user_id>",
            "user.id": user_id,
        })
        
        try:
            # Get user from database
            user = db_service.get_user(user_id)
            
            if not user:
                span.set_attributes({"user.found": False})
                span.set_status(trace.Status(trace.StatusCode.ERROR, "User not found"))
                return jsonify({"error": "User not found"}), 404
            
            span.set_attributes({
                "user.found": True,
                "user.name": user["name"],
            })
            
            # Enrich user data
            enriched_user = api_service.enrich_user_data(user)
            
            # Add response attributes
            span.set_attributes({
                "http.status_code": 200,
                "response.size": len(str(enriched_user)),
            })
            
            return jsonify(enriched_user)
            
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            return jsonify({"error": "Internal server error"}), 500

@app.route('/api/users/<int:user_id>/orders')
def get_user_orders(user_id):
    """Get user orders with distributed tracing"""
    with tracer.start_as_current_span("get_user_orders") as span:
        span.set_attributes({
            "user.id": user_id,
            "operation": "get_orders",
        })
        
        try:
            # Simulate multiple database queries
            with tracer.start_as_current_span("db.get_orders") as db_span:
                db_span.set_attributes({
                    "db.system": "postgresql",
                    "db.operation": "select",
                    "db.table": "orders",
                })
                
                time.sleep(random.uniform(0.02, 0.15))
                
                # Mock orders data
                orders = [
                    {
                        "id": i,
                        "user_id": user_id,
                        "product": f"Product {i}",
                        "amount": random.uniform(10, 500),
                        "status": random.choice(["pending", "completed", "cancelled"])
                    }
                    for i in range(1, random.randint(1, 10))
                ]
                
                db_span.set_attributes({
                    "db.rows_affected": len(orders),
                    "orders.count": len(orders),
                })
            
            # Calculate order statistics
            with tracer.start_as_current_span("calculate_order_stats") as calc_span:
                total_amount = sum(order["amount"] for order in orders)
                completed_orders = len([o for o in orders if o["status"] == "completed"])
                
                calc_span.set_attributes({
                    "orders.total_amount": total_amount,
                    "orders.completed_count": completed_orders,
                })
            
            response = {
                "user_id": user_id,
                "orders": orders,
                "summary": {
                    "total_orders": len(orders),
                    "total_amount": total_amount,
                    "completed_orders": completed_orders,
                }
            }
            
            span.set_attributes({
                "http.status_code": 200,
                "orders.total_count": len(orders),
                "orders.total_amount": total_amount,
            })
            
            return jsonify(response)
            
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            return jsonify({"error": "Internal server error"}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "python-service",
        "timestamp": time.time()
    })

@app.errorhandler(Exception)
def handle_exception(e):
    """Global exception handler with tracing"""
    span = trace.get_current_span()
    if span:
        span.record_exception(e)
        span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
    
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
```

---

## ▶️ Step 3: Kubernetes Deployment

### Jaeger Operator Deployment

`Create jaeger-operator.yaml:`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: observability
---
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-production
  namespace: observability
spec:
  strategy: production
  
  collector:
    maxReplicas: 5
    resources:
      limits:
        cpu: 1000m
        memory: 1Gi
      requests:
        cpu: 500m
        memory: 512Mi
    
  query:
    replicas: 2
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
      requests:
        cpu: 250m
        memory: 256Mi
    
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      redundancyPolicy: SingleRedundancy
      resources:
        limits:
          cpu: 1000m
          memory: 2Gi
        requests:
          cpu: 500m
          memory: 1Gi
      storage:
        size: 10Gi
        storageClassName: fast-ssd
    
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
      - jaeger.example.com
    tls:
      - secretName: jaeger-tls
        hosts:
          - jaeger.example.com

---
apiVersion: v1
kind: Service
metadata:
  name: jaeger-collector-headless
  namespace: observability
  labels:
    app: jaeger
    component: collector
spec:
  clusterIP: None
  ports:
  - name: grpc
    port: 14250
    protocol: TCP
    targetPort: 14250
  - name: http
    port: 14268
    protocol: TCP
    targetPort: 14268
  - name: zipkin
    port: 9411
    protocol: TCP
    targetPort: 9411
  selector:
    app: jaeger
    component: collector
```

### Application Deployment with Sidecar

`Create app-with-jaeger.yaml:`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: default
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
        sidecar.jaegertracing.io/inject: "true"
    spec:
      containers:
      - name: app
        image: your-registry/sample-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: JAEGER_AGENT_HOST
          value: "localhost"
        - name: JAEGER_AGENT_PORT
          value: "6831"
        - name: JAEGER_SERVICE_NAME
          value: "sample-app"
        - name: JAEGER_SAMPLER_TYPE
          value: "const"
        - name: JAEGER_SAMPLER_PARAM
          value: "1"
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sample-app-service
spec:
  selector:
    app: sample-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sample-app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sample-app-service
            port:
              number: 80
```

---

## 📊 Step 4: Advanced Tracing Configuration

### Custom Sampling Strategies

`Create sampling-strategies.json:`
```json
{
  "service_strategies": [
    {
      "service": "frontend-service",
      "type": "probabilistic",
      "param": 1.0,
      "max_traces_per_second": 100
    },
    {
      "service": "user-service",
      "type": "probabilistic",
      "param": 0.5,
      "max_traces_per_second": 50
    },
    {
      "service": "payment-service",
      "type": "probabilistic",
      "param": 1.0,
      "max_traces_per_second": 200,
      "operation_strategies": [
        {
          "operation": "process-payment",
          "type": "probabilistic",
          "param": 1.0
        },
        {
          "operation": "validate-card",
          "type": "probabilistic",
          "param": 0.8
        }
      ]
    },
    {
      "service": "notification-service",
      "type": "probabilistic",
      "param": 0.1,
      "max_traces_per_second": 10
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.1,
    "max_traces_per_second": 50
  },
  "per_operation_strategies": [
    {
      "service": "auth-service",
      "operation": "login",
      "type": "probabilistic",
      "param": 1.0
    },
    {
      "service": "auth-service",
      "operation": "refresh-token",
      "type": "probabilistic",
      "param": 0.1
    }
  ]
}
```

### Jaeger Configuration with Sampling

`Create jaeger-config.yaml:`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jaeger-configuration
  namespace: observability
data:
  sampling-strategies.json: |
    {
      "service_strategies": [
        {
          "service": "critical-service",
          "type": "probabilistic",
          "param": 1.0,
          "max_traces_per_second": 1000
        },
        {
          "service": "background-service",
          "type": "probabilistic",
          "param": 0.01,
          "max_traces_per_second": 10
        }
      ],
      "default_strategy": {
        "type": "adaptive",
        "param": 0.1,
        "max_traces_per_second": 100
      }
    }

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-collector
  namespace: observability
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jaeger-collector
  template:
    metadata:
      labels:
        app: jaeger-collector
    spec:
      containers:
      - name: jaeger-collector
        image: jaegertracing/jaeger-collector:1.51
        ports:
        - containerPort: 14268
        - containerPort: 14250
        - containerPort: 9411
        env:
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: "http://elasticsearch:9200"
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        - name: SAMPLING_STRATEGIES_FILE
          value: "/etc/jaeger/sampling-strategies.json"
        volumeMounts:
        - name: jaeger-config
          mountPath: /etc/jaeger
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: jaeger-config
        configMap:
          name: jaeger-configuration
```

---

## 🔍 Step 5: Monitoring and Alerting

### Jaeger Metrics and Monitoring

`Create jaeger-monitoring.yaml:`
```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: jaeger-collector
  namespace: observability
  labels:
    app: jaeger-collector
spec:
  selector:
    matchLabels:
      app: jaeger-collector
  endpoints:
  - port: admin
    interval: 30s
    path: /metrics

---
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: jaeger-query
  namespace: observability
  labels:
    app: jaeger-query
spec:
  selector:
    matchLabels:
      app: jaeger-query
  endpoints:
  - port: admin
    interval: 30s
    path: /metrics

---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: jaeger-alerts
  namespace: observability
spec:
  groups:
  - name: jaeger.rules
    rules:
    - alert: JaegerCollectorDown
      expr: up{job="jaeger-collector"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Jaeger Collector is down"
        description: "Jaeger Collector has been down for more than 5 minutes"

    - alert: JaegerQueryDown
      expr: up{job="jaeger-query"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Jaeger Query is down"
        description: "Jaeger Query service has been down for more than 5 minutes"

    - alert: JaegerHighErrorRate
      expr: rate(jaeger_collector_spans_rejected_total[5m]) > 0.1
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High span rejection rate in Jaeger Collector"
        description: "Jaeger Collector is rejecting {{ $value }} spans per second"

    - alert: JaegerStorageLatencyHigh
      expr: histogram_quantile(0.95, rate(jaeger_collector_save_latency_bucket[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High storage latency in Jaeger"
        description: "95th percentile storage latency is {{ $value }}s"

    - alert: JaegerMemoryUsageHigh
      expr: (container_memory_usage_bytes{pod=~"jaeger-.*"} / container_spec_memory_limit_bytes) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage in Jaeger component"
        description: "Memory usage is above 80% for {{ $labels.pod }}"
```

### Grafana Dashboard for Jaeger

`Create jaeger-dashboard.json:`
```json
{
  "dashboard": {
    "id": null,
    "title": "Jaeger Tracing Dashboard",
    "tags": ["jaeger", "tracing", "observability"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Traces per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(jaeger_collector_traces_received_total[5m])",
            "legendFormat": "Traces Received",
            "refId": "A"
          },
          {
            "expr": "rate(jaeger_collector_spans_received_total[5m])",
            "legendFormat": "Spans Received",
            "refId": "B"
          }
        ],
        "yAxes": [
          {
            "label": "Rate",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Storage Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(jaeger_collector_save_latency_bucket[5m]))",
            "legendFormat": "50th percentile",
            "refId": "A"
          },
          {
            "expr": "histogram_quantile(0.95, rate(jaeger_collector_save_latency_bucket[5m]))",
            "legendFormat": "95th percentile",
            "refId": "B"
          },
          {
            "expr": "histogram_quantile(0.99, rate(jaeger_collector_save_latency_bucket[5m]))",
            "legendFormat": "99th percentile",
            "refId": "C"
          }
        ],
        "yAxes": [
          {
            "label": "Latency (s)",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Error Rates",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(jaeger_collector_spans_rejected_total[5m])",
            "legendFormat": "Spans Rejected",
            "refId": "A"
          },
          {
            "expr": "rate(jaeger_query_requests_total{result=\"err\"}[5m])",
            "legendFormat": "Query Errors",
            "refId": "B"
          }
        ],
        "yAxes": [
          {
            "label": "Error Rate",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Service Dependencies",
        "type": "nodeGraph",
        "targets": [
          {
            "expr": "jaeger_dependencies",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

---

## 📋 Common Use Cases

### 1. **Microservices Debugging**
- Request flow visualization across services
- Performance bottleneck identification
- Error propagation analysis
- Service dependency mapping

### 2. **Performance Optimization**
- Latency analysis and optimization
- Resource utilization monitoring
- Database query performance
- External API call optimization

### 3. **System Reliability**
- Error rate monitoring and alerting
- Service health tracking
- Capacity planning and scaling
- Incident response and root cause analysis

### 4. **Business Intelligence**
- User journey tracking
- Feature usage analytics
- Performance impact analysis
- A/B testing insights

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Complete Tracing Infrastructure** - Production-ready Jaeger deployment
2. **🔍 Application Instrumentation** - Comprehensive tracing for multiple languages
3. **📊 Visual Trace Analysis** - Interactive trace visualization and analysis
4. **🚀 Performance Monitoring** - Real-time performance metrics and alerting
5. **🛡️ Error Tracking** - Distributed error tracking and debugging
6. **📈 Service Dependencies** - Clear service interaction mapping
7. **🔄 Continuous Monitoring** - Ongoing observability and health tracking
8. **👥 Team Collaboration** - Shared observability platform for development teams

✅ **Jaeger is now configured for your distributed tracing and microservices monitoring workflows!**
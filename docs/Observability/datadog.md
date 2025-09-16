---
sidebar_position: 3
title: Datadog
description: Datadog is a comprehensive monitoring and analytics platform for cloud applications. Learn how to set up Datadog monitoring with Docker and integrate it into your infrastructure.
slug: /Observability/Datadog
keywords:
  - Datadog
  - application monitoring
  - infrastructure monitoring
  - APM
  - log management
  - metrics monitoring
  - observability platform
  - cloud monitoring
  - DevOps monitoring
  - real-time monitoring
---

# 🐕 Datadog - Comprehensive Monitoring and Analytics Platform

**Datadog** is a comprehensive **monitoring and analytics platform** for cloud-scale applications, providing **infrastructure monitoring**, **application performance monitoring (APM)**, **log management**, and **real-time dashboards** in one unified platform.

---

## Set Up Datadog Agent with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  datadog-agent:
    image: gcr.io/datadoghq/agent:7
    container_name: datadog-agent
    restart: unless-stopped
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_HOSTNAME=${DD_HOSTNAME:-docker-host}
      - DD_TAGS=env:production,team:devops
      - DD_APM_ENABLED=true
      - DD_APM_NON_LOCAL_TRAFFIC=true
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
      - DD_CONTAINER_EXCLUDE="name:datadog-agent"
      - DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
      - DD_PROCESS_AGENT_ENABLED=true
      - DD_SYSTEM_PROBE_ENABLED=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /opt/datadog-agent/run:/opt/datadog-agent/run:rw
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
      - /etc/passwd:/etc/passwd:ro
      - /sys/kernel/debug:/sys/kernel/debug
    ports:
      - "8125:8125/udp"  # DogStatsD
      - "8126:8126"      # APM
    cap_add:
      - SYS_ADMIN
      - SYS_RESOURCE
      - SYS_PTRACE
      - NET_ADMIN
      - NET_BROADCAST
      - NET_RAW
      - IPC_LOCK
      - CHOWN
    security_opt:
      - apparmor:unconfined
    pid: host

  # Sample application with Datadog integration
  sample-app:
    image: nginx:alpine
    container_name: sample-app
    ports:
      - "8080:80"
    labels:
      com.datadoghq.ad.check_names: '["nginx"]'
      com.datadoghq.ad.init_configs: '[{}]'
      com.datadoghq.ad.instances: '[{"nginx_status_url": "http://%%host%%:%%port%%/nginx_status"}]'
      com.datadoghq.ad.logs: '[{"source": "nginx", "service": "sample-app"}]'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

volumes:
  datadog-agent-data:
```

`Create .env file:`
```env
DD_API_KEY=your_datadog_api_key_here
DD_SITE=datadoghq.com
DD_HOSTNAME=my-docker-host
```

`Start Datadog Agent:`
```bash
docker compose up -d
```

---

## Application Performance Monitoring (APM)

### Python Application Integration

`Create app.py:`
```python
from flask import Flask, request, jsonify
from ddtrace import tracer, patch_all
from ddtrace.contrib.flask import TraceMiddleware
import logging
import time
import random

# Enable automatic instrumentation
patch_all()

app = Flask(__name__)

# Configure Datadog tracing
TraceMiddleware(app, tracer, service="python-web-app")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    with tracer.trace("home.request") as span:
        span.set_tag("http.method", request.method)
        span.set_tag("http.url", request.url)
        
        # Simulate some work
        time.sleep(random.uniform(0.1, 0.5))
        
        logger.info("Home page accessed", extra={
            "user_id": "12345",
            "endpoint": "/",
            "response_time": 0.2
        })
        
        return jsonify({
            "message": "Hello from Datadog monitored app!",
            "timestamp": time.time()
        })

@app.route('/api/users/<user_id>')
def get_user(user_id):
    with tracer.trace("database.query") as span:
        span.set_tag("db.user_id", user_id)
        
        # Simulate database query
        time.sleep(random.uniform(0.05, 0.2))
        
        if random.random() < 0.1:  # 10% error rate
            span.set_tag("error", True)
            logger.error(f"Database error for user {user_id}")
            return jsonify({"error": "Database connection failed"}), 500
        
        user_data = {
            "id": user_id,
            "name": f"User {user_id}",
            "email": f"user{user_id}@example.com"
        }
        
        logger.info(f"User data retrieved for {user_id}")
        return jsonify(user_data)

@app.route('/api/metrics')
def custom_metrics():
    from datadog import statsd
    
    # Custom metrics
    statsd.increment('custom.api.requests', tags=['endpoint:metrics'])
    statsd.histogram('custom.response.time', random.uniform(0.1, 1.0))
    statsd.gauge('custom.active.users', random.randint(10, 100))
    
    return jsonify({"message": "Custom metrics sent"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

`Create requirements.txt:`
```txt
Flask==2.3.3
ddtrace==1.20.0
datadog==0.47.0
```

`Create Dockerfile:`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["ddtrace-run", "python", "app.py"]
```

### Node.js Application Integration

`Create server.js:`
```javascript
const tracer = require('dd-trace').init({
  service: 'nodejs-web-app',
  env: 'production',
  version: '1.0.0'
});

const express = require('express');
const StatsD = require('hot-shots');
const winston = require('winston');

const app = express();
const dogstatsd = new StatsD();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

app.use(express.json());

// Middleware for custom metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    dogstatsd.histogram('http.request.duration', duration, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    
    dogstatsd.increment('http.requests', 1, {
      method: req.method,
      status_code: res.statusCode
    });
  });
  
  next();
});

app.get('/', (req, res) => {
  const span = tracer.scope().active();
  span?.setTag('custom.user_type', 'guest');
  
  logger.info('Home page accessed', {
    user_agent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.json({
    message: 'Hello from Node.js Datadog app!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/products', async (req, res) => {
  const span = tracer.startSpan('database.query');
  span.setTag('db.operation', 'select');
  span.setTag('db.table', 'products');
  
  try {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    const products = [
      { id: 1, name: 'Product 1', price: 99.99 },
      { id: 2, name: 'Product 2', price: 149.99 }
    ];
    
    dogstatsd.gauge('products.count', products.length);
    
    logger.info('Products retrieved', { count: products.length });
    res.json(products);
  } catch (error) {
    span.setTag('error', true);
    logger.error('Database error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.finish();
  }
});

app.get('/health', (req, res) => {
  dogstatsd.increment('health.check');
  res.json({ status: 'healthy', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  dogstatsd.gauge('app.startup', 1);
});
```

---

## Custom Dashboards and Alerts

### Infrastructure Dashboard Configuration

`Create datadog-dashboard.json:`
```json
{
  "title": "Infrastructure Overview",
  "description": "Comprehensive infrastructure monitoring dashboard",
  "widgets": [
    {
      "id": 1,
      "definition": {
        "type": "timeseries",
        "requests": [
          {
            "q": "avg:system.cpu.user{*} by {host}",
            "display_type": "line",
            "style": {
              "palette": "dog_classic",
              "line_type": "solid",
              "line_width": "normal"
            }
          }
        ],
        "title": "CPU Usage by Host",
        "title_size": "16",
        "title_align": "left"
      },
      "layout": {
        "x": 0,
        "y": 0,
        "width": 47,
        "height": 15
      }
    },
    {
      "id": 2,
      "definition": {
        "type": "query_value",
        "requests": [
          {
            "q": "avg:system.mem.pct_usable{*}",
            "aggregator": "avg"
          }
        ],
        "title": "Memory Usage",
        "title_size": "16",
        "title_align": "left",
        "precision": 2
      },
      "layout": {
        "x": 48,
        "y": 0,
        "width": 24,
        "height": 15
      }
    },
    {
      "id": 3,
      "definition": {
        "type": "toplist",
        "requests": [
          {
            "q": "top(avg:docker.containers.running{*} by {docker_image}, 10, 'mean', 'desc')"
          }
        ],
        "title": "Top Docker Images by Running Containers"
      },
      "layout": {
        "x": 0,
        "y": 16,
        "width": 47,
        "height": 15
      }
    }
  ],
  "template_variables": [
    {
      "name": "host",
      "default": "*",
      "prefix": "host"
    }
  ],
  "layout_type": "ordered",
  "is_read_only": false,
  "notify_list": [],
  "reflow_type": "fixed"
}
```

### Alert Configuration

`Create alert-config.yaml:`
```yaml
alerts:
  - name: "High CPU Usage"
    type: "metric alert"
    query: "avg(last_5m):avg:system.cpu.user{*} by {host} > 80"
    message: |
      CPU usage is above 80% on {{host.name}}
      
      Current value: {{value}}%
      
      @slack-alerts @pagerduty
    tags:
      - "team:infrastructure"
      - "severity:warning"
    options:
      thresholds:
        critical: 80
        warning: 70
      notify_audit: false
      require_full_window: true
      notify_no_data: true
      no_data_timeframe: 10

  - name: "Application Error Rate"
    type: "metric alert"
    query: "avg(last_5m):sum:trace.flask.request.errors{*}.as_rate() > 0.1"
    message: |
      Application error rate is above 10%
      
      Current rate: {{value}}
      
      @slack-alerts @oncall
    tags:
      - "team:backend"
      - "severity:critical"
    options:
      thresholds:
        critical: 0.1
        warning: 0.05

  - name: "Memory Usage High"
    type: "metric alert"
    query: "avg(last_10m):avg:system.mem.pct_usable{*} by {host} < 20"
    message: |
      Available memory is below 20% on {{host.name}}
      
      Available: {{value}}%
      
      @slack-alerts
    tags:
      - "team:infrastructure"
      - "severity:warning"
```

---

## Log Management

### Structured Logging Configuration

`Create log-config.yaml:`
```yaml
# Datadog Agent log configuration
logs:
  - type: file
    path: "/var/log/app/*.log"
    service: "my-application"
    source: "python"
    sourcecategory: "application"
    tags:
      - "env:production"
      - "team:backend"

  - type: docker
    image: "nginx"
    service: "nginx"
    source: "nginx"
    
  - type: docker
    image: "postgres"
    service: "database"
    source: "postgresql"
    log_processing_rules:
      - type: exclude_at_match
        name: exclude_debug
        pattern: "DEBUG"
```

### Custom Log Processing

`Create log-processor.py:`
```python
import json
import logging
from datadog import initialize, api
from datadog.api.logs import Logs

# Initialize Datadog
options = {
    'api_key': 'your_api_key',
    'app_key': 'your_app_key'
}
initialize(**options)

class DatadogLogHandler(logging.Handler):
    def __init__(self, service_name, source='python'):
        super().__init__()
        self.service_name = service_name
        self.source = source
        
    def emit(self, record):
        log_entry = {
            'timestamp': record.created * 1000,  # Convert to milliseconds
            'level': record.levelname,
            'message': record.getMessage(),
            'service': self.service_name,
            'source': self.source,
            'logger': record.name,
            'thread': record.thread,
            'filename': record.filename,
            'line_number': record.lineno
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
            
        # Send to Datadog
        try:
            Logs.send(log_entry)
        except Exception as e:
            print(f"Failed to send log to Datadog: {e}")

# Usage example
logger = logging.getLogger(__name__)
logger.addHandler(DatadogLogHandler('my-service'))
logger.setLevel(logging.INFO)

# Log with custom fields
logger.info("User login successful", extra={
    'user_id': '12345',
    'request_id': 'req-abc-123',
    'ip_address': '192.168.1.1'
})
```

---

## Kubernetes Integration

### Datadog Agent DaemonSet

`Create datadog-agent.yaml:`
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: datadog-agent
  namespace: datadog
spec:
  selector:
    matchLabels:
      app: datadog-agent
  template:
    metadata:
      labels:
        app: datadog-agent
      name: datadog-agent
    spec:
      serviceAccountName: datadog-agent
      containers:
      - image: gcr.io/datadoghq/agent:7
        imagePullPolicy: Always
        name: datadog-agent
        ports:
        - containerPort: 8125
          name: dogstatsdport
          protocol: UDP
        - containerPort: 8126
          name: traceport
          protocol: TCP
        env:
        - name: DD_API_KEY
          valueFrom:
            secretKeyRef:
              name: datadog-secret
              key: api-key
        - name: DD_SITE
          value: "datadoghq.com"
        - name: DD_COLLECT_KUBERNETES_EVENTS
          value: "true"
        - name: DD_LEADER_ELECTION
          value: "true"
        - name: DD_APM_ENABLED
          value: "true"
        - name: DD_LOGS_ENABLED
          value: "true"
        - name: DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL
          value: "true"
        - name: DD_CONTAINER_EXCLUDE
          value: "name:datadog-agent"
        - name: DD_KUBERNETES_KUBELET_HOST
          valueFrom:
            fieldRef:
              fieldPath: status.hostIP
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: dockersocket
          mountPath: /var/run/docker.sock
        - name: procdir
          mountPath: /host/proc
          readOnly: true
        - name: cgroups
          mountPath: /host/sys/fs/cgroup
          readOnly: true
        - name: pointdir
          mountPath: /opt/datadog-agent/run
        livenessProbe:
          exec:
            command:
            - ./probe.sh
          initialDelaySeconds: 15
          periodSeconds: 5
      volumes:
      - hostPath:
          path: /var/run/docker.sock
        name: dockersocket
      - hostPath:
          path: /proc
        name: procdir
      - hostPath:
          path: /sys/fs/cgroup
        name: cgroups
      - emptyDir: {}
        name: pointdir
      nodeSelector:
        beta.kubernetes.io/os: linux
---
apiVersion: v1
kind: Secret
metadata:
  name: datadog-secret
  namespace: datadog
type: Opaque
data:
  api-key: <base64-encoded-api-key>
```

---

## Synthetic Monitoring

### API Test Configuration

`Create synthetic-test.json:`
```json
{
  "name": "API Health Check",
  "type": "api",
  "subtype": "http",
  "config": {
    "request": {
      "method": "GET",
      "url": "https://api.example.com/health",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "assertions": [
      {
        "type": "statusCode",
        "operator": "is",
        "target": 200
      },
      {
        "type": "responseTime",
        "operator": "lessThan",
        "target": 1000
      },
      {
        "type": "body",
        "operator": "contains",
        "target": "healthy"
      }
    ]
  },
  "locations": ["aws:us-east-1", "aws:eu-west-1"],
  "options": {
    "tick_every": 300,
    "retry": {
      "count": 2,
      "interval": 300
    },
    "monitor_options": {
      "renotify_interval": 0
    }
  },
  "message": "API health check failed @slack-alerts",
  "tags": ["env:production", "service:api"]
}
```

---

## Common Use Cases

- **Infrastructure Monitoring**: Server metrics, container monitoring, cloud services
- **Application Performance**: Request tracing, error tracking, performance optimization
- **Log Analytics**: Centralized logging, log correlation, troubleshooting
- **Business Metrics**: Custom KPIs, user analytics, conversion tracking
- **Security Monitoring**: Threat detection, compliance monitoring, audit trails

✅ Datadog is now configured for comprehensive monitoring and observability!
---
sidebar_position: 5
title: ELK Stack
description: ELK Stack (Elasticsearch, Logstash, Kibana) is a powerful platform for searching, analyzing, and visualizing log data in real time. Learn how to set up ELK Stack with Docker.
slug: /Observability/ELKStack
keywords:
  - ELK Stack
  - Elasticsearch
  - Logstash
  - Kibana
  - log management
  - log analysis
  - data visualization
  - search analytics
  - observability
  - centralized logging
---

# 📊 ELK Stack - Elasticsearch, Logstash, and Kibana

**ELK Stack** is a collection of three open-source products: **Elasticsearch**, **Logstash**, and **Kibana**. Together they provide a powerful platform for **searching**, **analyzing**, and **visualizing log data** in real time.

---

## Set Up ELK Stack with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    restart: unless-stopped
    environment:
      - node.name=elasticsearch
      - cluster.name=elk-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Logstash
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    restart: unless-stopped
    volumes:
      - ./logstash/config:/usr/share/logstash/config:ro
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      - "LS_JAVA_OPTS=-Xmx512m -Xms512m"
    depends_on:
      elasticsearch:
        condition: service_healthy

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    restart: unless-stopped
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=kibana_password
    volumes:
      - ./kibana/config:/usr/share/kibana/config:ro
    depends_on:
      elasticsearch:
        condition: service_healthy

  # Filebeat for log shipping
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: filebeat
    restart: unless-stopped
    user: root
    volumes:
      - ./filebeat/config/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./logs:/var/log/app:ro
    environment:
      - output.elasticsearch.hosts=["elasticsearch:9200"]
    depends_on:
      elasticsearch:
        condition: service_healthy

  # Sample application generating logs
  sample-app:
    image: nginx:alpine
    container_name: sample-nginx
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./logs:/var/log/nginx
    labels:
      - "co.elastic.logs/enabled=true"
      - "co.elastic.logs/module=nginx"

volumes:
  elasticsearch-data:
```

`Create necessary directories:`
```bash
mkdir -p logstash/config logstash/pipeline kibana/config filebeat/config nginx logs
```

---

## Configuration Files

### Logstash Configuration

`Create logstash/config/logstash.yml:`
```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
path.config: /usr/share/logstash/pipeline
```

`Create logstash/pipeline/logstash.conf:`
```ruby
input {
  beats {
    port => 5044
  }
  
  tcp {
    port => 5000
    codec => json_lines
  }
  
  udp {
    port => 5000
    codec => json_lines
  }
  
  http {
    port => 8080
  }
}

filter {
  # Parse nginx logs
  if [fields][logtype] == "nginx" {
    grok {
      match => { 
        "message" => "%{NGINXACCESS}" 
      }
    }
    
    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
    }
    
    mutate {
      convert => { "response" => "integer" }
      convert => { "bytes" => "integer" }
    }
  }
  
  # Parse application logs
  if [fields][logtype] == "application" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [level] {
      mutate {
        uppercase => [ "level" ]
      }
    }
  }
  
  # Parse Docker container logs
  if [container] {
    mutate {
      add_field => { "container_name" => "%{[container][name]}" }
      add_field => { "container_image" => "%{[container][image][name]}" }
    }
  }
  
  # GeoIP enrichment for IP addresses
  if [clientip] {
    geoip {
      source => "clientip"
      target => "geoip"
    }
  }
  
  # User agent parsing
  if [agent] {
    useragent {
      source => "agent"
      target => "user_agent"
    }
  }
  
  # Add custom fields
  mutate {
    add_field => { "[@metadata][index]" => "logs-%{+YYYY.MM.dd}" }
    add_field => { "processed_at" => "%{@timestamp}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index]}"
    template_name => "logs"
    template_pattern => "logs-*"
    template => {
      "index_patterns" => ["logs-*"],
      "settings" => {
        "number_of_shards" => 1,
        "number_of_replicas" => 0
      },
      "mappings" => {
        "properties" => {
          "@timestamp" => { "type" => "date" },
          "level" => { "type" => "keyword" },
          "message" => { "type" => "text" },
          "host" => { "type" => "keyword" },
          "container_name" => { "type" => "keyword" },
          "geoip" => {
            "properties" => {
              "location" => { "type" => "geo_point" }
            }
          }
        }
      }
    }
  }
  
  # Debug output
  stdout { 
    codec => rubydebug 
  }
}
```

### Filebeat Configuration

`Create filebeat/config/filebeat.yml:`
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  fields:
    logtype: application
  fields_under_root: true
  multiline.pattern: '^\d{4}-\d{2}-\d{2}'
  multiline.negate: true
  multiline.match: after

- type: container
  enabled: true
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

- type: log
  enabled: true
  paths:
    - /var/log/nginx/access.log
  fields:
    logtype: nginx
  fields_under_root: true

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_cloud_metadata: ~
  - add_docker_metadata: ~

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

### Kibana Configuration

`Create kibana/config/kibana.yml:`
```yaml
server.name: kibana
server.host: "0.0.0.0"
elasticsearch.hosts: [ "http://elasticsearch:9200" ]
monitoring.ui.container.elasticsearch.enabled: true
```

---

## Sample Applications and Log Generation

### Python Application with Structured Logging

`Create sample-apps/python-app/app.py:`
```python
#!/usr/bin/env python3
import json
import logging
import time
import random
from datetime import datetime
from flask import Flask, request, jsonify
import requests

# Configure structured logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'duration'):
            log_entry['duration'] = record.duration
            
        return json.dumps(log_entry)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = logging.FileHandler('/var/log/app/application.log')
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# Console handler for debugging
console_handler = logging.StreamHandler()
console_handler.setFormatter(JSONFormatter())
logger.addHandler(console_handler)

app = Flask(__name__)

@app.before_request
def before_request():
    request.start_time = time.time()
    request.request_id = f"req-{random.randint(100000, 999999)}"

@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    
    logger.info("Request completed", extra={
        'request_id': request.request_id,
        'method': request.method,
        'url': request.url,
        'status_code': response.status_code,
        'duration': round(duration * 1000, 2),  # milliseconds
        'user_agent': request.headers.get('User-Agent'),
        'remote_addr': request.remote_addr
    })
    
    return response

@app.route('/')
def home():
    logger.info("Home page accessed", extra={
        'request_id': request.request_id,
        'endpoint': '/'
    })
    
    return jsonify({
        'message': 'Hello from Python Flask App!',
        'timestamp': datetime.utcnow().isoformat(),
        'request_id': request.request_id
    })

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    logger.info("User data requested", extra={
        'request_id': request.request_id,
        'user_id': user_id,
        'endpoint': '/api/users'
    })
    
    # Simulate database query
    time.sleep(random.uniform(0.1, 0.5))
    
    if user_id == 404:
        logger.warning("User not found", extra={
            'request_id': request.request_id,
            'user_id': user_id
        })
        return jsonify({'error': 'User not found'}), 404
    
    user_data = {
        'id': user_id,
        'name': f'User {user_id}',
        'email': f'user{user_id}@example.com'
    }
    
    logger.info("User data retrieved successfully", extra={
        'request_id': request.request_id,
        'user_id': user_id
    })
    
    return jsonify(user_data)

@app.route('/api/error')
def trigger_error():
    logger.error("Intentional error triggered", extra={
        'request_id': request.request_id,
        'endpoint': '/api/error'
    })
    
    raise Exception("This is an intentional error for testing")

@app.route('/api/slow')
def slow_endpoint():
    delay = random.uniform(2, 5)
    
    logger.warning("Slow endpoint accessed", extra={
        'request_id': request.request_id,
        'delay': delay,
        'endpoint': '/api/slow'
    })
    
    time.sleep(delay)
    
    return jsonify({
        'message': 'Slow response completed',
        'delay': delay
    })

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error("Unhandled exception", extra={
        'request_id': getattr(request, 'request_id', 'unknown'),
        'error': str(e),
        'error_type': type(e).__name__
    })
    
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Application starting", extra={
        'event': 'startup',
        'port': 5000
    })
    
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Log Generator Script

`Create scripts/log-generator.py:`
```python
#!/usr/bin/env python3
import json
import time
import random
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    filename='/var/log/app/generated.log',
    level=logging.INFO,
    format='%(message)s'
)

logger = logging.getLogger(__name__)

def generate_log_entry(level, message, **kwargs):
    """Generate a structured log entry"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': level,
        'message': message,
        'service': 'log-generator',
        **kwargs
    }
    
    logger.info(json.dumps(log_entry))

def simulate_user_activity():
    """Simulate user activity logs"""
    users = ['alice', 'bob', 'charlie', 'diana', 'eve']
    actions = ['login', 'logout', 'view_page', 'purchase', 'search']
    
    user = random.choice(users)
    action = random.choice(actions)
    
    generate_log_entry(
        'INFO',
        f'User {action} event',
        user_id=user,
        action=action,
        session_id=f'sess-{random.randint(1000, 9999)}',
        ip_address=f'192.168.1.{random.randint(1, 254)}'
    )

def simulate_system_events():
    """Simulate system events"""
    events = [
        ('INFO', 'System health check passed'),
        ('WARNING', 'High memory usage detected'),
        ('ERROR', 'Database connection failed'),
        ('INFO', 'Backup completed successfully'),
        ('WARNING', 'Disk space running low')
    ]
    
    level, message = random.choice(events)
    
    generate_log_entry(
        level,
        message,
        component='system',
        cpu_usage=random.uniform(10, 90),
        memory_usage=random.uniform(20, 95),
        disk_usage=random.uniform(30, 85)
    )

def simulate_api_requests():
    """Simulate API request logs"""
    endpoints = ['/api/users', '/api/orders', '/api/products', '/api/health']
    methods = ['GET', 'POST', 'PUT', 'DELETE']
    status_codes = [200, 201, 400, 404, 500]
    
    endpoint = random.choice(endpoints)
    method = random.choice(methods)
    status = random.choice(status_codes)
    duration = random.uniform(10, 2000)  # milliseconds
    
    level = 'ERROR' if status >= 500 else 'WARNING' if status >= 400 else 'INFO'
    
    generate_log_entry(
        level,
        f'{method} {endpoint}',
        method=method,
        endpoint=endpoint,
        status_code=status,
        duration=round(duration, 2),
        request_id=f'req-{random.randint(100000, 999999)}'
    )

def main():
    """Main log generation loop"""
    print("Starting log generator...")
    
    while True:
        # Generate different types of logs
        log_type = random.choice(['user', 'system', 'api'])
        
        if log_type == 'user':
            simulate_user_activity()
        elif log_type == 'system':
            simulate_system_events()
        else:
            simulate_api_requests()
        
        # Random delay between log entries
        time.sleep(random.uniform(0.5, 3.0))

if __name__ == '__main__':
    main()
```

---

## Kibana Dashboards and Visualizations

### Index Patterns and Field Mappings

`Create kibana-setup.py:`
```python
#!/usr/bin/env python3
import requests
import json
import time

KIBANA_URL = "http://localhost:5601"
ELASTICSEARCH_URL = "http://localhost:9200"

def wait_for_kibana():
    """Wait for Kibana to be ready"""
    while True:
        try:
            response = requests.get(f"{KIBANA_URL}/api/status")
            if response.status_code == 200:
                print("Kibana is ready!")
                break
        except requests.exceptions.ConnectionError:
            print("Waiting for Kibana...")
            time.sleep(5)

def create_index_pattern():
    """Create index pattern in Kibana"""
    index_pattern = {
        "attributes": {
            "title": "logs-*",
            "timeFieldName": "@timestamp"
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "kbn-xsrf": "true"
    }
    
    response = requests.post(
        f"{KIBANA_URL}/api/saved_objects/index-pattern/logs-pattern",
        headers=headers,
        json=index_pattern
    )
    
    if response.status_code in [200, 409]:  # 409 means already exists
        print("Index pattern created successfully!")
    else:
        print(f"Failed to create index pattern: {response.text}")

def create_dashboard():
    """Create sample dashboard"""
    dashboard = {
        "attributes": {
            "title": "Application Logs Dashboard",
            "type": "dashboard",
            "description": "Dashboard for monitoring application logs",
            "panelsJSON": json.dumps([
                {
                    "version": "8.11.0",
                    "type": "visualization",
                    "gridData": {
                        "x": 0, "y": 0, "w": 24, "h": 15
                    },
                    "panelIndex": "1",
                    "embeddableConfig": {},
                    "panelRefName": "panel_1"
                }
            ])
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "kbn-xsrf": "true"
    }
    
    response = requests.post(
        f"{KIBANA_URL}/api/saved_objects/dashboard/app-logs-dashboard",
        headers=headers,
        json=dashboard
    )
    
    if response.status_code in [200, 409]:
        print("Dashboard created successfully!")
    else:
        print(f"Failed to create dashboard: {response.text}")

if __name__ == "__main__":
    wait_for_kibana()
    time.sleep(10)  # Additional wait for full initialization
    create_index_pattern()
    create_dashboard()
```

---

## Start ELK Stack

`Start the complete stack:`
```bash
docker compose up -d
```

`Run log generator:`
```bash
docker exec -d sample-nginx python3 /scripts/log-generator.py
```

`Access services:`
```bash
echo "Elasticsearch: http://localhost:9200"
echo "Kibana: http://localhost:5601"
echo "Logstash: http://localhost:9600"
```

---

## Common Use Cases

- **Centralized Logging**: Collect logs from multiple applications and services
- **Log Analysis**: Search, filter, and analyze log data for troubleshooting
- **Real-time Monitoring**: Monitor application and system metrics in real-time
- **Security Analytics**: Detect security threats and anomalies in log data
- **Business Intelligence**: Extract business insights from application logs
- **Compliance**: Maintain audit trails and compliance reporting

✅ ELK Stack is now configured for comprehensive log management and analysis!
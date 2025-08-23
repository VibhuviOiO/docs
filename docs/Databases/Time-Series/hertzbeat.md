---
sidebar_position: 3
title: HertzBeat
description: HertzBeat is an open-source monitoring platform with time-series database backend for metrics collection and alerting. Learn how to dockerize and run HertzBeat.
slug: /TimeSeries/HertzBeat
keywords:
  - HertzBeat
  - monitoring platform
  - time-series monitoring
  - metrics collection
  - Docker HertzBeat
  - monitoring system
  - alerting system
  - infrastructure monitoring
  - application monitoring
  - observability
---

# 💓 Dockerizing HertzBeat for Comprehensive Monitoring and Alerting

**HertzBeat** is an open-source monitoring platform that provides **real-time monitoring**, **alerting**, and **time-series data storage**. Perfect for **infrastructure monitoring**, **application monitoring**, and **business metrics** with a user-friendly web interface.

---

## Set Up HertzBeat with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  hertzbeat:
    image: tancloud/hertzbeat:latest
    container_name: hertzbeat
    restart: unless-stopped
    ports:
      - "1157:1157"
    environment:
      TZ: UTC
      LANG: en_US.UTF-8
    volumes:
      - hertzbeat-data:/opt/hertzbeat/data
      - hertzbeat-logs:/opt/hertzbeat/logs
      - ./hertzbeat-config:/opt/hertzbeat/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:1157/api/summary"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Optional: TDengine for time-series storage (alternative to built-in H2)
  tdengine:
    image: tdengine/tdengine:3.0.4.0
    container_name: hertzbeat-tdengine
    restart: unless-stopped
    ports:
      - "6030:6030"
      - "6041:6041"
    environment:
      TZ: UTC
    volumes:
      - tdengine-data:/var/lib/taos
      - tdengine-log:/var/log/taos
    command: taosd

  # Optional: PostgreSQL for metadata storage
  postgres:
    image: postgres:15
    container_name: hertzbeat-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: hertzbeat
      POSTGRES_USER: hertzbeat
      POSTGRES_PASSWORD: hertzbeat123
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  hertzbeat-data:
  hertzbeat-logs:
  tdengine-data:
  tdengine-log:
  postgres-data:
```

`Create configuration directory:`
```bash
mkdir -p hertzbeat-config
```

`Create hertzbeat-config/application.yml:`
```yaml
server:
  port: 1157

spring:
  application:
    name: hertzbeat
  profiles:
    active: prod
  datasource:
    driver-class-name: org.h2.Driver
    username: sa
    password: 123456
    url: jdbc:h2:./data/hertzbeat;MODE=MYSQL
    hikari:
      max-lifetime: 120000
  jpa:
    show-sql: false
    database-platform: org.eclipse.persistence.platform.database.H2Platform
    database: h2
    properties:
      eclipselink:
        logging:
          level: SEVERE

common:
  queue:
    type: memory

warehouse:
  store:
    jpa:
      enabled: true
    td-engine:
      enabled: false
      driver-class-name: com.taosdata.jdbc.TSDBDriver
      url: jdbc:TAOS://tdengine:6030/hertzbeat
      username: root
      password: taosdata

alerter:
  console:
    enabled: true
  email:
    enabled: false
  webhook:
    enabled: false
  discord:
    enabled: false
  slack:
    enabled: false
  telegram:
    enabled: false
  wework:
    enabled: false
  dingtalk:
    enabled: false
  feishu:
    enabled: false

scheduler:
  server:
    enabled: true
    port: 1158
```

`Start HertzBeat:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Access HertzBeat Web Interface

1. Open your browser and go to `http://localhost:1157`
2. Default login credentials:
   - Username: `admin`
   - Password: `hertzbeat`

---

## Basic HertzBeat Operations

### Using Web Interface

1. **Add Monitors**: Go to "Monitor" → "Application Service" → "Add Monitor"
2. **View Dashboards**: Go to "Dashboard" to see monitoring overview
3. **Configure Alerts**: Go to "Alert" → "Alert Define" to set up alerting rules
4. **View Metrics**: Go to "Monitor" → "Monitor Detail" to see detailed metrics

### Using REST API

`Get system summary:`
```bash
curl -X GET "http://localhost:1157/api/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

`Add a new monitor via API:`
```bash
curl -X POST "http://localhost:1157/api/monitor" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "monitor": {
      "name": "Test Website",
      "app": "website",
      "host": "example.com",
      "intervals": 60,
      "status": 1,
      "description": "Monitor example.com website"
    },
    "params": [
      {
        "field": "host",
        "value": "example.com"
      },
      {
        "field": "port", 
        "value": "80"
      },
      {
        "field": "uri",
        "value": "/"
      }
    ]
  }'
```

---

## Python Integration

`Install required packages:`
```bash
pip install requests pandas matplotlib
```

`Create a file hertzbeat_test.py:`
```python
import requests
import json
import time
import pandas as pd
from datetime import datetime, timedelta
import random

# HertzBeat API configuration
HERTZBEAT_URL = "http://localhost:1157"
USERNAME = "admin"
PASSWORD = "hertzbeat"

class HertzBeatClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.login(username, password)
    
    def login(self, username, password):
        """Login and get authentication token"""
        login_data = {
            "identifier": username,
            "credential": password
        }
        
        response = self.session.post(
            f"{self.base_url}/api/account/auth/form",
            json=login_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                self.token = result["data"]["token"]
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                print("Successfully logged in to HertzBeat")
                return True
        
        print(f"Login failed: {response.text}")
        return False
    
    def get_summary(self):
        """Get system summary"""
        response = self.session.get(f"{self.base_url}/api/summary")
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_monitors(self):
        """Get all monitors"""
        response = self.session.get(f"{self.base_url}/api/monitors")
        if response.status_code == 200:
            return response.json()
        return None
    
    def add_monitor(self, monitor_config):
        """Add a new monitor"""
        response = self.session.post(
            f"{self.base_url}/api/monitor",
            json=monitor_config
        )
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_monitor_metrics(self, monitor_id, metric_name, start_time=None, end_time=None):
        """Get metrics for a specific monitor"""
        if not start_time:
            start_time = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
        if not end_time:
            end_time = int(datetime.now().timestamp() * 1000)
        
        params = {
            "monitorId": monitor_id,
            "metric": metric_name,
            "startTime": start_time,
            "endTime": end_time
        }
        
        response = self.session.get(
            f"{self.base_url}/api/monitor/metric/history",
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        return None

try:
    # Initialize HertzBeat client
    client = HertzBeatClient(HERTZBEAT_URL, USERNAME, PASSWORD)
    
    if not client.token:
        print("Failed to authenticate with HertzBeat")
        exit(1)
    
    # Get system summary
    summary = client.get_summary()
    if summary and summary.get("code") == 0:
        data = summary["data"]
        print("=== HertzBeat System Summary ===")
        print(f"Total Monitors: {data.get('apps', 0)}")
        print(f"Available Monitors: {data.get('availableMonitors', 0)}")
        print(f"Unavailable Monitors: {data.get('unAvailableMonitors', 0)}")
        print(f"Unmanaged Monitors: {data.get('unManageMonitors', 0)}")
    
    # Add sample monitors
    print("\n=== Adding Sample Monitors ===")
    
    # Website monitor
    website_monitor = {
        "monitor": {
            "name": "Google Website",
            "app": "website",
            "host": "google.com",
            "intervals": 60,
            "status": 1,
            "description": "Monitor Google website availability"
        },
        "params": [
            {"field": "host", "value": "google.com"},
            {"field": "port", "value": "443"},
            {"field": "uri", "value": "/"},
            {"field": "ssl", "value": "true"},
            {"field": "timeout", "value": "6000"}
        ]
    }
    
    result = client.add_monitor(website_monitor)
    if result and result.get("code") == 0:
        print("✓ Added Google website monitor")
        google_monitor_id = result["data"]
    else:
        print("✗ Failed to add Google website monitor")
    
    # HTTP API monitor
    api_monitor = {
        "monitor": {
            "name": "JSONPlaceholder API",
            "app": "api",
            "host": "jsonplaceholder.typicode.com",
            "intervals": 30,
            "status": 1,
            "description": "Monitor JSONPlaceholder API"
        },
        "params": [
            {"field": "host", "value": "jsonplaceholder.typicode.com"},
            {"field": "port", "value": "443"},
            {"field": "uri", "value": "/posts/1"},
            {"field": "ssl", "value": "true"},
            {"field": "method", "value": "GET"},
            {"field": "timeout", "value": "6000"}
        ]
    }
    
    result = client.add_monitor(api_monitor)
    if result and result.get("code") == 0:
        print("✓ Added JSONPlaceholder API monitor")
        api_monitor_id = result["data"]
    else:
        print("✗ Failed to add API monitor")
    
    # Ping monitor
    ping_monitor = {
        "monitor": {
            "name": "Ping Google DNS",
            "app": "ping",
            "host": "8.8.8.8",
            "intervals": 30,
            "status": 1,
            "description": "Ping Google DNS server"
        },
        "params": [
            {"field": "host", "value": "8.8.8.8"},
            {"field": "timeout", "value": "6000"}
        ]
    }
    
    result = client.add_monitor(ping_monitor)
    if result and result.get("code") == 0:
        print("✓ Added Ping monitor")
        ping_monitor_id = result["data"]
    else:
        print("✗ Failed to add Ping monitor")
    
    # Wait for monitors to collect some data
    print("\nWaiting for monitors to collect data...")
    time.sleep(60)
    
    # Get all monitors
    monitors = client.get_monitors()
    if monitors and monitors.get("code") == 0:
        print(f"\n=== Current Monitors ({len(monitors['data']['content'])} total) ===")
        for monitor in monitors["data"]["content"]:
            status = "🟢 UP" if monitor["status"] == 1 else "🔴 DOWN"
            print(f"{status} {monitor['name']} ({monitor['app']}) - {monitor['host']}")
    
    # Simulate custom metrics collection
    print("\n=== Custom Metrics Simulation ===")
    
    # Simulate system metrics
    system_metrics = []
    for i in range(10):
        timestamp = datetime.now() - timedelta(minutes=i*5)
        metrics = {
            "timestamp": timestamp.isoformat(),
            "cpu_usage": round(random.uniform(20, 80), 2),
            "memory_usage": round(random.uniform(40, 90), 2),
            "disk_usage": round(random.uniform(30, 70), 2),
            "network_io": round(random.uniform(100, 1000), 2)
        }
        system_metrics.append(metrics)
    
    # Convert to DataFrame for analysis
    df = pd.DataFrame(system_metrics)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    print("System Metrics Summary:")
    print(f"  Average CPU Usage: {df['cpu_usage'].mean():.1f}%")
    print(f"  Average Memory Usage: {df['memory_usage'].mean():.1f}%")
    print(f"  Average Disk Usage: {df['disk_usage'].mean():.1f}%")
    print(f"  Average Network I/O: {df['network_io'].mean():.1f} MB/s")
    
    # Simulate alerting conditions
    print("\n=== Alert Simulation ===")
    
    high_cpu = df[df['cpu_usage'] > 70]
    if not high_cpu.empty:
        print(f"🚨 HIGH CPU ALERT: {len(high_cpu)} instances above 70%")
        for _, row in high_cpu.iterrows():
            print(f"   {row['timestamp'].strftime('%H:%M:%S')}: {row['cpu_usage']:.1f}%")
    
    high_memory = df[df['memory_usage'] > 85]
    if not high_memory.empty:
        print(f"🚨 HIGH MEMORY ALERT: {len(high_memory)} instances above 85%")
        for _, row in high_memory.iterrows():
            print(f"   {row['timestamp'].strftime('%H:%M:%S')}: {row['memory_usage']:.1f}%")
    
    if high_cpu.empty and high_memory.empty:
        print("✅ All metrics within normal ranges")
    
    # Monitor health check
    print("\n=== Monitor Health Check ===")
    
    def check_service_health(name, url, timeout=5):
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code == 200:
                return f"✅ {name}: Healthy (Response time: {response.elapsed.total_seconds():.3f}s)"
            else:
                return f"⚠️ {name}: Unhealthy (Status: {response.status_code})"
        except requests.exceptions.RequestException as e:
            return f"❌ {name}: Failed ({str(e)})"
    
    services_to_check = [
        ("Google", "https://google.com"),
        ("GitHub", "https://github.com"),
        ("JSONPlaceholder API", "https://jsonplaceholder.typicode.com/posts/1")
    ]
    
    for name, url in services_to_check:
        result = check_service_health(name, url)
        print(f"  {result}")
    
    # Performance metrics
    print("\n=== Performance Metrics ===")
    
    # Simulate response time data
    response_times = [random.uniform(50, 500) for _ in range(20)]
    
    print(f"Response Time Statistics:")
    print(f"  Average: {sum(response_times)/len(response_times):.1f}ms")
    print(f"  Min: {min(response_times):.1f}ms")
    print(f"  Max: {max(response_times):.1f}ms")
    print(f"  95th Percentile: {sorted(response_times)[int(len(response_times)*0.95)]:.1f}ms")
    
    # Uptime calculation
    total_checks = 100
    successful_checks = random.randint(95, 100)
    uptime_percentage = (successful_checks / total_checks) * 100
    
    print(f"\nUptime Statistics:")
    print(f"  Successful Checks: {successful_checks}/{total_checks}")
    print(f"  Uptime: {uptime_percentage:.2f}%")
    
    if uptime_percentage >= 99.9:
        print("  Status: 🟢 Excellent")
    elif uptime_percentage >= 99.0:
        print("  Status: 🟡 Good")
    else:
        print("  Status: 🔴 Needs Attention")

except Exception as e:
    print(f"Error: {e}")
```

`Run the script:`
```bash
python hertzbeat_test.py
```

---

## Advanced Configuration

### TDengine Integration

`Update hertzbeat-config/application.yml for TDengine:`
```yaml
warehouse:
  store:
    jpa:
      enabled: false
    td-engine:
      enabled: true
      driver-class-name: com.taosdata.jdbc.TSDBDriver
      url: jdbc:TAOS://tdengine:6030/hertzbeat
      username: root
      password: taosdata
      table-num: 1
```

### Custom Monitor Templates

`Create custom monitor template (JSON):`
```json
{
  "app": "custom_api",
  "category": "custom",
  "name": {
    "zh-CN": "自定义API",
    "en-US": "Custom API"
  },
  "params": [
    {
      "field": "host",
      "name": {
        "zh-CN": "主机Host",
        "en-US": "Host"
      },
      "type": "host",
      "required": true
    },
    {
      "field": "port",
      "name": {
        "zh-CN": "端口",
        "en-US": "Port"
      },
      "type": "number",
      "range": "[0,65535]",
      "required": true,
      "defaultValue": 80
    }
  ],
  "metrics": [
    {
      "name": "response_time",
      "priority": 0,
      "fields": [
        {
          "field": "responseTime",
          "type": 0,
          "unit": "ms"
        },
        {
          "field": "statusCode",
          "type": 1
        }
      ],
      "protocol": "http",
      "http": {
        "host": "^_^host^_^",
        "port": "^_^port^_^",
        "url": "/api/health",
        "method": "GET",
        "parseType": "default"
      }
    }
  ]
}
```

---

## Alerting Configuration

### Email Alerts

`Configure email alerts in application.yml:`
```yaml
alerter:
  email:
    enabled: true
    mail-server-host: smtp.gmail.com
    mail-server-port: 587
    mail-server-username: your-email@gmail.com
    mail-server-password: your-app-password
    mail-from: your-email@gmail.com
    enable-ssl: true
```

### Webhook Alerts

```yaml
alerter:
  webhook:
    enabled: true
    webhook-url: http://your-webhook-endpoint.com/alerts
```

### Custom Alert Rules

```python
# Example alert rule configuration
alert_rule = {
    "name": "High CPU Usage Alert",
    "app": "linux",
    "metric": "cpu",
    "field": "usage",
    "preset": false,
    "expr": "usage > 80",
    "priority": 1,
    "times": 3,
    "enable": True,
    "recoverNotice": True,
    "template": "CPU usage is ${usage}% on ${monitorName}",
    "tags": ["production", "critical"]
}
```

---

## Monitoring Best Practices

### Monitor Categories

1. **Infrastructure Monitoring**
   - Server resources (CPU, Memory, Disk)
   - Network connectivity
   - Database performance

2. **Application Monitoring**
   - API endpoints
   - Response times
   - Error rates

3. **Business Metrics**
   - User activity
   - Transaction volumes
   - Revenue metrics

### Alert Thresholds

```python
# Recommended thresholds
thresholds = {
    "cpu_usage": {"warning": 70, "critical": 85},
    "memory_usage": {"warning": 80, "critical": 90},
    "disk_usage": {"warning": 80, "critical": 90},
    "response_time": {"warning": 1000, "critical": 3000},  # milliseconds
    "error_rate": {"warning": 1, "critical": 5}  # percentage
}
```

---

## Data Retention and Storage

### Configure Data Retention

```yaml
warehouse:
  store:
    td-engine:
      enabled: true
      # Data retention period (days)
      data-expire-time: 30
      # Automatic data cleanup
      auto-create-table: true
```

### Backup Configuration

```bash
# Backup HertzBeat data
docker exec hertzbeat tar -czf /tmp/hertzbeat-backup.tar.gz /opt/hertzbeat/data

# Copy backup to host
docker cp hertzbeat:/tmp/hertzbeat-backup.tar.gz ./hertzbeat-backup.tar.gz
```

---

## Common Use Cases

- **Infrastructure Monitoring**: Server health, network performance, resource utilization
- **Application Monitoring**: API availability, response times, error tracking
- **Website Monitoring**: Uptime monitoring, performance tracking, SSL certificate monitoring
- **Database Monitoring**: Connection health, query performance, replication status
- **Business Monitoring**: Custom metrics, KPI tracking, SLA monitoring

✅ HertzBeat is now running in Docker and ready for comprehensive monitoring and alerting!
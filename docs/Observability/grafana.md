---
sidebar_position: 2
title: Grafana
description: Grafana is a visualization and analytics platform for monitoring data. Learn how to set up Grafana with Prometheus for creating monitoring dashboards.
slug: /Observability/Grafana
keywords:
  - Grafana
  - visualization
  - dashboards
  - monitoring
  - analytics
  - observability
---

# 📈 Grafana Visualization & Analytics

**Grafana** is a **visualization** and **analytics platform** for creating **monitoring dashboards** with support for multiple **data sources**.

---

## 🔧 Docker Setup

`Add to docker-compose.yml:`
```yaml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

`Start services:`
```bash
docker-compose up -d
# Access Grafana at http://localhost:3000
# Login: admin / admin123
```

## 📊 Data Source Configuration

`Create grafana/provisioning/datasources/prometheus.yml:`
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

## 📈 Dashboard Configuration

`Create grafana/provisioning/dashboards/dashboard.yml:`
```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
```

`Create system-dashboard.json:`
```json
{
  "dashboard": {
    "title": "System Monitoring",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "red", "value": 90}
              ]
            }
          }
        }
      }
    ]
  }
}
```

## ▶️ Sample Dashboard Queries

```bash
# CPU Usage Panel
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage Panel
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk I/O Panel
rate(node_disk_read_bytes_total[5m])
rate(node_disk_written_bytes_total[5m])

# Network Traffic Panel
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])

# HTTP Request Rate Panel
sum(rate(http_requests_total[5m])) by (status)

# Response Time Panel
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

## 🚨 Alerting

`Configure alert notification:`
```json
{
  "name": "slack-alerts",
  "type": "slack",
  "settings": {
    "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    "channel": "#alerts",
    "username": "Grafana"
  }
}
```

`Create alert rule:`
```json
{
  "alert": {
    "name": "High CPU Alert",
    "frequency": "10s",
    "conditions": [
      {
        "query": {
          "queryType": "",
          "refId": "A"
        },
        "reducer": {
          "type": "last",
          "params": []
        },
        "evaluator": {
          "params": [80],
          "type": "gt"
        }
      }
    ],
    "executionErrorState": "alerting",
    "noDataState": "no_data",
    "for": "5m"
  }
}
```

**Reference:** [Grafana Documentation](https://grafana.com/docs/)
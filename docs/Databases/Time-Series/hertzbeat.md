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
    image: apache/hertzbeat
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
`Access HertzBeat Web Interface`

1. Open your browser and go to `http://localhost:1157`
2. Default login credentials:
   - Username: `admin`
   - Password: `hertzbeat`

---
`Basic HertzBeat Operations`

`Using Web Interface`

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
  }
```

---

## Common Use Cases

- **Infrastructure Monitoring**: Server health, network performance, resource utilization
- **Application Monitoring**: API availability, response times, error tracking
- **Website Monitoring**: Uptime monitoring, performance tracking, SSL certificate monitoring
- **Database Monitoring**: Connection health, query performance, replication status
- **Business Monitoring**: Custom metrics, KPI tracking, SLA monitoring

✅ HertzBeat is now running in Docker and ready for comprehensive monitoring and alerting!## 
References

* [HertzBeat Official GitHub](https://github.com/apache/hertzbeat)
* [HertzBeat Documentation](https://hertzbeat.apache.org/docs/)

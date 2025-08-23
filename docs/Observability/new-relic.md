---
sidebar_position: 4
title: New Relic
description: New Relic is a comprehensive observability platform that provides application performance monitoring, infrastructure monitoring, and digital experience monitoring. Learn how to integrate New Relic with your applications.
slug: /Observability/NewRelic
keywords:
  - New Relic
  - application performance monitoring
  - APM
  - observability platform
  - infrastructure monitoring
  - digital experience monitoring
  - real-time monitoring
  - performance analytics
  - error tracking
  - distributed tracing
---

# 📊 New Relic - Comprehensive Observability Platform

**New Relic** is a comprehensive **observability platform** that provides **application performance monitoring (APM)**, **infrastructure monitoring**, **digital experience monitoring**, and **AI-powered insights** to help you understand and optimize your entire technology stack.

---

## Set Up New Relic with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # New Relic Infrastructure Agent
  newrelic-infra:
    image: newrelic/infrastructure:latest
    container_name: newrelic-infra
    restart: unless-stopped
    cap_add:
      - SYS_PTRACE
    network_mode: host
    pid: host
    privileged: true
    volumes:
      - "/:/host:ro"
      - "/var/run/docker.sock:/var/run/docker.sock"
    environment:
      - NRIA_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
      - NRIA_DISPLAY_NAME=docker-host
      - NRIA_VERBOSE=1
      - NRIA_ENABLE_PROCESS_METRICS=true
      - NRIA_DOCKER_ENABLED=true

  # Sample application with New Relic APM
  sample-app:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: sample-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
      - NEW_RELIC_APP_NAME=Sample Node.js App
      - NEW_RELIC_LOG=stdout
      - NEW_RELIC_LOG_LEVEL=info
      - NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
    volumes:
      - ./app:/app
```

`Create .env file:`
```env
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key_here
```

`Start New Relic monitoring:`
```bash
docker compose up -d
```

---

## Node.js Application Integration

### Basic APM Setup

`Create app/package.json:`
```json
{
  "name": "sample-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "newrelic": "^11.3.0",
    "winston": "^3.10.0"
  }
}
```

`Create app/newrelic.js:`
```javascript
'use strict'

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Sample Node.js App'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    filepath: process.env.NEW_RELIC_LOG || 'stdout'
  },
  distributed_tracing: {
    enabled: true
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000
    }
  }
}
```

`Create app/server.js:`
```javascript
// New Relic must be the first require
require('newrelic');

const express = require('express');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// Home endpoint
app.get('/', (req, res) => {
  logger.info('Home page accessed');
  res.json({ 
    message: 'Welcome to Sample App with New Relic!',
    version: '1.0.0'
  });
});

// Custom metrics endpoint
app.get('/metrics', (req, res) => {
  const newrelic = require('newrelic');
  
  // Record custom metrics
  newrelic.recordMetric('Custom/ActiveUsers', Math.floor(Math.random() * 100));
  newrelic.addCustomAttribute('customAttribute', 'customValue');
  
  logger.info('Custom metrics recorded');
  res.json({ message: 'Custom metrics recorded' });
});

// Error endpoint for testing
app.get('/error', (req, res) => {
  logger.error('Intentional error triggered');
  throw new Error('Intentional error for testing');
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  console.log(`Server running on http://localhost:${port}`);
});
```

---

## Common Use Cases

- **Application Performance Monitoring**: Track response times, throughput, and errors
- **Infrastructure Monitoring**: Monitor servers, containers, and cloud resources
- **Digital Experience Monitoring**: Track user experience and frontend performance
- **Custom Business Metrics**: Monitor KPIs and business-specific metrics
- **Distributed Tracing**: Track requests across microservices
- **Log Management**: Centralized logging with correlation to performance data

✅ New Relic is now configured for comprehensive observability and monitoring!
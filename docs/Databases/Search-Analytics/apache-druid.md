---
sidebar_position: 2
title: Apache Druid
description: Apache Druid is a high-performance real-time analytics database designed for fast aggregations and OLAP queries. Learn how to dockerize and run Druid.
slug: /SearchAnalytics/ApacheDruid
keywords:
  - Apache Druid
  - real-time analytics
  - OLAP database
  - time-series analytics
  - Docker Druid
  - database containerization
  - druid docker
  - analytics database
  - big data analytics
  - streaming analytics
---

# 🐉 Dockerizing Apache Druid for Real-Time Analytics at Scale

**Apache Druid** is a high-performance, real-time analytics database designed for **fast aggregations**, **OLAP queries**, and **streaming analytics**. Perfect for applications requiring **sub-second queries** on **large datasets** with **real-time ingestion**.

---

## Set Up Apache Druid with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # Zookeeper for coordination
  zookeeper:
    image: zookeeper:3.8
    container_name: druid-zookeeper
    restart: unless-stopped
    environment:
      ZOO_MY_ID: 1
      ZOO_SERVERS: server.1=0.0.0.0:2888:3888;2181
    ports:
      - "2181:2181"
    volumes:
      - zookeeper-data:/data
      - zookeeper-logs:/datalog

  # PostgreSQL for metadata storage
  postgres:
    image: postgres:15
    container_name: druid-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: druid
      POSTGRES_USER: druid
      POSTGRES_PASSWORD: druid123
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Druid Coordinator
  coordinator:
    image: apache/druid:28.0.1
    container_name: druid-coordinator
    restart: unless-stopped
    ports:
      - "8081:8081"
    volumes:
      - druid-data:/opt/data
      - ./druid-config:/opt/druid/conf/druid/single-server/nano-quickstart
    environment:
      - DRUID_XMX=1g
      - DRUID_XMS=1g
      - DRUID_MAXNEWSIZE=250m
      - DRUID_NEWSIZE=250m
    command: coordinator
    depends_on:
      - zookeeper
      - postgres

  # Druid Broker
  broker:
    image: apache/druid:28.0.1
    container_name: druid-broker
    restart: unless-stopped
    ports:
      - "8082:8082"
    volumes:
      - druid-data:/opt/data
      - ./druid-config:/opt/druid/conf/druid/single-server/nano-quickstart
    environment:
      - DRUID_XMX=1g
      - DRUID_XMS=1g
      - DRUID_MAXNEWSIZE=250m
      - DRUID_NEWSIZE=250m
    command: broker
    depends_on:
      - zookeeper
      - postgres

  # Druid Historical
  historical:
    image: apache/druid:28.0.1
    container_name: druid-historical
    restart: unless-stopped
    ports:
      - "8083:8083"
    volumes:
      - druid-data:/opt/data
      - ./druid-config:/opt/druid/conf/druid/single-server/nano-quickstart
    environment:
      - DRUID_XMX=1g
      - DRUID_XMS=1g
      - DRUID_MAXNEWSIZE=250m
      - DRUID_NEWSIZE=250m
    command: historical
    depends_on:
      - zookeeper
      - postgres

  # Druid MiddleManager
  middlemanager:
    image: apache/druid:28.0.1
    container_name: druid-middlemanager
    restart: unless-stopped
    ports:
      - "8091:8091"
    volumes:
      - druid-data:/opt/data
      - ./druid-config:/opt/druid/conf/druid/single-server/nano-quickstart
    environment:
      - DRUID_XMX=1g
      - DRUID_XMS=1g
      - DRUID_MAXNEWSIZE=250m
      - DRUID_NEWSIZE=250m
    command: middleManager
    depends_on:
      - zookeeper
      - postgres

  # Druid Router
  router:
    image: apache/druid:28.0.1
    container_name: druid-router
    restart: unless-stopped
    ports:
      - "8888:8888"
    volumes:
      - druid-data:/opt/data
      - ./druid-config:/opt/druid/conf/druid/single-server/nano-quickstart
    environment:
      - DRUID_XMX=1g
      - DRUID_XMS=1g
      - DRUID_MAXNEWSIZE=250m
      - DRUID_NEWSIZE=250m
    command: router
    depends_on:
      - coordinator
      - broker
      - historical
      - middlemanager

volumes:
  zookeeper-data:
  zookeeper-logs:
  postgres-data:
  druid-data:
```

`Create Druid configuration directory:`
```bash
mkdir -p druid-config
```

`Create druid-config/common.runtime.properties:`
```properties
# Zookeeper
druid.zk.service.host=zookeeper:2181

# Metadata storage
druid.metadata.storage.type=postgresql
druid.metadata.storage.connector.connectURI=jdbc:postgresql://postgres:5432/druid
druid.metadata.storage.connector.user=druid
druid.metadata.storage.connector.password=druid123

# Deep storage
druid.storage.type=local
druid.storage.storageDirectory=/opt/data/segments

# Indexing logs
druid.indexer.logs.type=file
druid.indexer.logs.directory=/opt/data/indexing-logs

# Service discovery
druid.selectors.indexing.serviceName=druid/overlord
druid.selectors.coordinator.serviceName=druid/coordinator

# Monitoring
druid.monitoring.monitors=["org.apache.druid.java.util.metrics.JvmMonitor"]
druid.emitter=noop
druid.emitter.logging.logLevel=info

# SQL
druid.sql.enable=true
```

`Start Druid:`
```bash
docker compose up -d
```

`Check if services are running:`
```bash
docker ps
```

---

## Access Druid Console

1. Open your browser and go to `http://localhost:8888`
2. This opens the Druid Console where you can:
   - Load data
   - Query data
   - Monitor cluster status
   - Manage datasources

---

## Basic Druid Operations

### Load Sample Data

`Create a sample data file (sample-data.json):`
```json
{"timestamp":"2024-01-15T10:00:00Z","user_id":"user1","event":"page_view","page":"/home","country":"USA","device":"desktop","session_duration":120}
{"timestamp":"2024-01-15T10:01:00Z","user_id":"user2","event":"click","page":"/products","country":"Canada","device":"mobile","session_duration":45}
{"timestamp":"2024-01-15T10:02:00Z","user_id":"user1","event":"purchase","page":"/checkout","country":"USA","device":"desktop","session_duration":300}
{"timestamp":"2024-01-15T10:03:00Z","user_id":"user3","event":"page_view","page":"/about","country":"UK","device":"tablet","session_duration":90}
{"timestamp":"2024-01-15T10:04:00Z","user_id":"user2","event":"page_view","page":"/contact","country":"Canada","device":"mobile","session_duration":60}
```

### Using REST API

`Load data via ingestion spec:`
```bash
curl -X POST "http://localhost:8888/druid/indexer/v1/task" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "index_parallel",
    "spec": {
      "ioConfig": {
        "type": "index_parallel",
        "inputSource": {
          "type": "inline",
          "data": "{\"timestamp\":\"2024-01-15T10:00:00Z\",\"user_id\":\"user1\",\"event\":\"page_view\",\"page\":\"/home\",\"country\":\"USA\",\"device\":\"desktop\",\"session_duration\":120}\n{\"timestamp\":\"2024-01-15T10:01:00Z\",\"user_id\":\"user2\",\"event\":\"click\",\"page\":\"/products\",\"country\":\"Canada\",\"device\":\"mobile\",\"session_duration\":45}"
        },
        "inputFormat": {
          "type": "json"
        }
      },
      "tuningConfig": {
        "type": "index_parallel"
      },
      "dataSchema": {
        "dataSource": "web_events",
        "timestampSpec": {
          "column": "timestamp",
          "format": "iso"
        },
        "dimensionsSpec": {
          "dimensions": [
            "user_id",
            "event",
            "page",
            "country",
            "device"
          ]
        },
        "metricsSpec": [
          {
            "type": "longSum",
            "name": "session_duration",
            "fieldName": "session_duration"
          },
          {
            "type": "count",
            "name": "event_count"
          }
        ],
        "granularitySpec": {
          "type": "uniform",
          "segmentGranularity": "DAY",
          "queryGranularity": "MINUTE",
          "rollup": true
        }
      }
    }
  }'
```

---

## Python Integration

`Install the Druid client:`
```bash
pip install pydruid pandas requests
```

`Create a file druid_test.py:`
```python
from pydruid.client import Client
import pandas as pd
import requests
import json
from datetime import datetime, timedelta
import random

# Druid connection
druid_client = Client('http://localhost:8082', 'druid/v2/')

# Druid router for ingestion
DRUID_ROUTER_URL = "http://localhost:8888"

try:
    print("Connected to Apache Druid")
    
    # Generate sample e-commerce data
    def generate_sample_data(num_records=1000):
        events = ['page_view', 'add_to_cart', 'purchase', 'click', 'search']
        countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia']
        devices = ['desktop', 'mobile', 'tablet']
        pages = ['/home', '/products', '/category/electronics', '/category/clothing', 
                '/checkout', '/profile', '/search', '/about', '/contact']
        
        data = []
        base_time = datetime.now() - timedelta(days=7)
        
        for i in range(num_records):
            timestamp = base_time + timedelta(
                days=random.randint(0, 6),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            record = {
                "timestamp": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "user_id": f"user_{random.randint(1, 100)}",
                "event": random.choice(events),
                "page": random.choice(pages),
                "country": random.choice(countries),
                "device": random.choice(devices),
                "session_duration": random.randint(10, 600),
                "revenue": round(random.uniform(0, 500), 2) if random.choice(events) == 'purchase' else 0
            }
            data.append(record)
        
        return data
    
    # Generate and prepare data
    sample_data = generate_sample_data(5000)
    data_string = "\n".join([json.dumps(record) for record in sample_data])
    
    print(f"Generated {len(sample_data)} sample records")
    
    # Create ingestion spec
    ingestion_spec = {
        "type": "index_parallel",
        "spec": {
            "ioConfig": {
                "type": "index_parallel",
                "inputSource": {
                    "type": "inline",
                    "data": data_string
                },
                "inputFormat": {
                    "type": "json"
                }
            },
            "tuningConfig": {
                "type": "index_parallel",
                "maxRowsPerSegment": 5000000,
                "maxRowsInMemory": 25000
            },
            "dataSchema": {
                "dataSource": "ecommerce_events",
                "timestampSpec": {
                    "column": "timestamp",
                    "format": "iso"
                },
                "dimensionsSpec": {
                    "dimensions": [
                        "user_id",
                        "event",
                        "page", 
                        "country",
                        "device"
                    ]
                },
                "metricsSpec": [
                    {
                        "type": "longSum",
                        "name": "session_duration",
                        "fieldName": "session_duration"
                    },
                    {
                        "type": "doubleSum",
                        "name": "revenue",
                        "fieldName": "revenue"
                    },
                    {
                        "type": "count",
                        "name": "event_count"
                    }
                ],
                "granularitySpec": {
                    "type": "uniform",
                    "segmentGranularity": "DAY",
                    "queryGranularity": "HOUR",
                    "rollup": True
                }
            }
        }
    }
    
    # Submit ingestion task
    response = requests.post(
        f"{DRUID_ROUTER_URL}/druid/indexer/v1/task",
        headers={"Content-Type": "application/json"},
        json=ingestion_spec
    )
    
    if response.status_code == 200:
        task_id = response.json()["task"]
        print(f"Ingestion task submitted: {task_id}")
        
        # Wait for ingestion to complete (simplified check)
        import time
        print("Waiting for ingestion to complete...")
        time.sleep(30)  # Wait 30 seconds for ingestion
        
    else:
        print(f"Failed to submit ingestion task: {response.text}")
    
    # Query examples using pydruid
    print("\n=== Query Examples ===")
    
    # 1. Total events by country
    query1 = druid_client.timeseries(
        datasource="ecommerce_events",
        granularity="all",
        intervals="2024-01-01/2024-12-31",
        aggregations={
            "total_events": {"type": "longSum", "fieldName": "event_count"},
            "total_revenue": {"type": "doubleSum", "fieldName": "revenue"}
        }
    )
    
    print("\n1. Overall Statistics:")
    if query1:
        for result in query1:
            print(f"   Total Events: {result['result']['total_events']:,}")
            print(f"   Total Revenue: ${result['result']['total_revenue']:,.2f}")
    
    # 2. Events by country
    query2 = druid_client.groupby(
        datasource="ecommerce_events",
        granularity="all",
        intervals="2024-01-01/2024-12-31",
        dimensions=["country"],
        aggregations={
            "event_count": {"type": "longSum", "fieldName": "event_count"},
            "revenue": {"type": "doubleSum", "fieldName": "revenue"}
        },
        limit_spec={
            "type": "default",
            "limit": 10,
            "columns": [{"dimension": "revenue", "direction": "descending"}]
        }
    )
    
    print("\n2. Events by Country:")
    if query2:
        for result in query2:
            country = result['event']['country']
            events = result['event']['event_count']
            revenue = result['event']['revenue']
            print(f"   {country}: {events:,} events, ${revenue:,.2f} revenue")
    
    # 3. Hourly trend
    query3 = druid_client.timeseries(
        datasource="ecommerce_events",
        granularity="hour",
        intervals="2024-01-01/2024-12-31",
        aggregations={
            "events": {"type": "longSum", "fieldName": "event_count"},
            "avg_session": {"type": "doubleSum", "fieldName": "session_duration"}
        },
        limit=24
    )
    
    print("\n3. Recent Hourly Activity:")
    if query3:
        for result in query3[-5:]:  # Show last 5 hours
            timestamp = result['timestamp']
            events = result['result']['events']
            print(f"   {timestamp}: {events} events")
    
    # 4. Device breakdown
    query4 = druid_client.groupby(
        datasource="ecommerce_events",
        granularity="all",
        intervals="2024-01-01/2024-12-31",
        dimensions=["device"],
        aggregations={
            "events": {"type": "longSum", "fieldName": "event_count"},
            "unique_users": {"type": "cardinality", "fieldNames": ["user_id"]}
        }
    )
    
    print("\n4. Device Breakdown:")
    if query4:
        for result in query4:
            device = result['event']['device']
            events = result['event']['events']
            users = result['event']['unique_users']
            print(f"   {device}: {events:,} events from {users:,} users")
    
    # 5. Top pages
    query5 = druid_client.topn(
        datasource="ecommerce_events",
        granularity="all",
        intervals="2024-01-01/2024-12-31",
        dimension="page",
        metric="events",
        threshold=10,
        aggregations={
            "events": {"type": "longSum", "fieldName": "event_count"}
        }
    )
    
    print("\n5. Top Pages:")
    if query5:
        for result in query5:
            for item in result['result']:
                page = item['page']
                events = item['events']
                print(f"   {page}: {events:,} events")
    
    # Using SQL queries (if SQL is enabled)
    print("\n=== SQL Query Example ===")
    
    sql_query = """
    SELECT 
        country,
        device,
        SUM(event_count) as total_events,
        SUM(revenue) as total_revenue,
        AVG(session_duration) as avg_session_duration
    FROM ecommerce_events
    WHERE __time >= TIMESTAMP '2024-01-01 00:00:00'
    GROUP BY country, device
    ORDER BY total_revenue DESC
    LIMIT 10
    """
    
    sql_response = requests.post(
        f"{DRUID_ROUTER_URL}/druid/v2/sql",
        headers={"Content-Type": "application/json"},
        json={"query": sql_query}
    )
    
    if sql_response.status_code == 200:
        sql_results = sql_response.json()
        print("\nSQL Query Results (Country + Device breakdown):")
        for row in sql_results[:5]:  # Show top 5
            print(f"   {row['country']} - {row['device']}: {row['total_events']} events, ${row['total_revenue']:.2f}")
    
    # Check datasource status
    datasources_response = requests.get(f"{DRUID_ROUTER_URL}/druid/coordinator/v1/datasources")
    if datasources_response.status_code == 200:
        datasources = datasources_response.json()
        print(f"\nAvailable datasources: {datasources}")

except Exception as e:
    print(f"Error: {e}")
```

`Run the script:`
```bash
python druid_test.py
```

---

## Advanced Features

### Real-time Streaming Ingestion

```json
{
  "type": "kafka",
  "spec": {
    "ioConfig": {
      "type": "kafka",
      "consumerProperties": {
        "bootstrap.servers": "kafka:9092"
      },
      "topic": "events",
      "useEarliestOffset": true
    },
    "tuningConfig": {
      "type": "kafka",
      "maxRowsPerSegment": 5000000
    },
    "dataSchema": {
      "dataSource": "realtime_events",
      "timestampSpec": {
        "column": "timestamp",
        "format": "iso"
      },
      "dimensionsSpec": {
        "dimensions": ["user_id", "event_type", "page"]
      },
      "metricsSpec": [
        {"type": "count", "name": "count"},
        {"type": "longSum", "name": "value", "fieldName": "value"}
      ]
    }
  }
}
```

### Data Rollup and Aggregation

```json
{
  "granularitySpec": {
    "type": "uniform",
    "segmentGranularity": "DAY",
    "queryGranularity": "HOUR",
    "rollup": true
  },
  "metricsSpec": [
    {
      "type": "count",
      "name": "events"
    },
    {
      "type": "longSum", 
      "name": "total_value",
      "fieldName": "value"
    },
    {
      "type": "doubleMin",
      "name": "min_value", 
      "fieldName": "value"
    },
    {
      "type": "doubleMax",
      "name": "max_value",
      "fieldName": "value"
    }
  ]
}
```

---

## Performance Optimization

### Segment Optimization

```bash
# Compact segments
curl -X POST "http://localhost:8888/druid/coordinator/v1/datasources/ecommerce_events/compact"

# Check segment information
curl "http://localhost:8888/druid/coordinator/v1/datasources/ecommerce_events/segments"
```

### Query Optimization

```python
# Use appropriate granularity
query = druid_client.timeseries(
    datasource="ecommerce_events",
    granularity="hour",  # Match your query needs
    intervals="2024-01-15/2024-01-16",
    aggregations={
        "events": {"type": "longSum", "fieldName": "event_count"}
    }
)

# Use filters to reduce data scanned
query_with_filter = druid_client.timeseries(
    datasource="ecommerce_events", 
    granularity="hour",
    intervals="2024-01-15/2024-01-16",
    filter={
        "type": "selector",
        "dimension": "country",
        "value": "USA"
    },
    aggregations={
        "events": {"type": "longSum", "fieldName": "event_count"}
    }
)
```

---

## Monitoring and Maintenance

### Cluster Health

```bash
# Check cluster status
curl "http://localhost:8888/status/health"

# Check coordinator status
curl "http://localhost:8081/status"

# Check broker status  
curl "http://localhost:8082/status"
```

### Data Management

```bash
# List datasources
curl "http://localhost:8888/druid/coordinator/v1/datasources"

# Get datasource details
curl "http://localhost:8888/druid/coordinator/v1/datasources/ecommerce_events"

# Drop datasource
curl -X DELETE "http://localhost:8888/druid/coordinator/v1/datasources/ecommerce_events"
```

---

## Common Use Cases

- **Real-time Analytics**: User behavior tracking, operational monitoring
- **Business Intelligence**: Sales analytics, marketing campaign analysis
- **IoT Analytics**: Sensor data analysis, device monitoring
- **Ad Tech**: Campaign performance, audience analytics
- **Gaming Analytics**: Player behavior, game metrics, monetization

✅ Apache Druid is now running in Docker and ready for your real-time analytics workloads!
---
sidebar_position: 1
title: InfluxDB
description: InfluxDB is a high-performance time-series database designed for handling metrics, events, and real-time analytics. Learn how to dockerize and run InfluxDB.
slug: /TimeSeries/InfluxDB
keywords:
  - InfluxDB
  - time-series database
  - metrics database
  - monitoring
  - Docker InfluxDB
  - database containerization
  - influxdb docker
  - time-series data
  - IoT database
  - analytics
---

# 📈 Dockerizing InfluxDB for High-Performance Time-Series Data

**InfluxDB** is a high-performance time-series database designed for handling **metrics**, **events**, and **real-time analytics**. Perfect for **IoT applications**, **monitoring systems**, and **financial data** that require fast writes and efficient time-based queries.

---

## Set Up InfluxDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  influxdb:
    image: influxdb:2.7
    container_name: influxdb
    restart: unless-stopped
    ports:
      - "8086:8086"
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: admin
      DOCKER_INFLUXDB_INIT_PASSWORD: password123
      DOCKER_INFLUXDB_INIT_ORG: myorg
      DOCKER_INFLUXDB_INIT_BUCKET: mybucket
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: my-super-secret-auth-token
    volumes:
      - influxdb-data:/var/lib/influxdb2
      - influxdb-config:/etc/influxdb2
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - influxdb

volumes:
  influxdb-data:
  influxdb-config:
  grafana-data:
```

`Start InfluxDB:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to InfluxDB

### Using InfluxDB CLI

`Connect directly to the container:`
```bash
docker exec -it influxdb influx
```

### Web UI Access

1. Open your browser and go to `http://localhost:8086`
2. Login with:
   - Username: `admin`
   - Password: `password123`

---

## Basic InfluxDB Operations

### Using InfluxDB CLI

`Basic commands:`
```bash
# List organizations
influx org list

# List buckets
influx bucket list

# Create a new bucket
influx bucket create -n sensors -o myorg

# Write data using line protocol
influx write -b mybucket -o myorg '
temperature,location=room1,sensor=temp01 value=23.5 1640995200000000000
temperature,location=room2,sensor=temp02 value=24.1 1640995200000000000
humidity,location=room1,sensor=hum01 value=65.2 1640995200000000000
'

# Query data using Flux
influx query 'from(bucket:"mybucket") |> range(start:-1h) |> filter(fn:(r) => r._measurement == "temperature")'
```

---

## Python Integration

`Install the InfluxDB client:`
```bash
pip install influxdb-client
```

`Create a file influxdb_test.py:`
```python
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timezone
import random
import time

# Database connection parameters
url = "http://localhost:8086"
token = "my-super-secret-auth-token"
org = "myorg"
bucket = "mybucket"

# Create client
client = InfluxDBClient(url=url, token=token, org=org)

try:
    # Write API
    write_api = client.write_api(write_options=SYNCHRONOUS)
    
    # Query API
    query_api = client.query_api()
    
    print("Connected to InfluxDB")
    
    # Write single point
    point = Point("temperature") \
        .tag("location", "office") \
        .tag("sensor", "temp01") \
        .field("value", 22.5) \
        .time(datetime.now(timezone.utc), WritePrecision.NS)
    
    write_api.write(bucket=bucket, org=org, record=point)
    print("Wrote single temperature point")
    
    # Write multiple points
    points = []
    locations = ["office", "warehouse", "server_room"]
    
    for i in range(10):
        for location in locations:
            # Temperature data
            temp_point = Point("temperature") \
                .tag("location", location) \
                .tag("sensor", f"temp_{location}") \
                .field("value", round(20 + random.uniform(-5, 10), 1)) \
                .time(datetime.now(timezone.utc), WritePrecision.NS)
            points.append(temp_point)
            
            # Humidity data
            hum_point = Point("humidity") \
                .tag("location", location) \
                .tag("sensor", f"hum_{location}") \
                .field("value", round(50 + random.uniform(-20, 30), 1)) \
                .time(datetime.now(timezone.utc), WritePrecision.NS)
            points.append(hum_point)
        
        time.sleep(0.1)  # Small delay between batches
    
    write_api.write(bucket=bucket, org=org, record=points)
    print(f"Wrote {len(points)} data points")
    
    # Query data
    print("\n=== Query Examples ===")
    
    # 1. Get latest temperature readings
    query = f'''
    from(bucket: "{bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "temperature")
        |> last()
    '''
    
    result = query_api.query(org=org, query=query)
    print("\n1. Latest temperature readings:")
    for table in result:
        for record in table.records:
            print(f"   {record.get_field()}: {record.get_value()}°C at {record.values['location']}")
    
    # 2. Average temperature by location
    query = f'''
    from(bucket: "{bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "temperature")
        |> group(columns: ["location"])
        |> mean()
    '''
    
    result = query_api.query(org=org, query=query)
    print("\n2. Average temperature by location:")
    for table in result:
        for record in table.records:
            location = record.values.get('location', 'unknown')
            avg_temp = round(record.get_value(), 1)
            print(f"   {location}: {avg_temp}°C")
    
    # 3. Temperature trend (last 10 minutes)
    query = f'''
    from(bucket: "{bucket}")
        |> range(start: -10m)
        |> filter(fn: (r) => r._measurement == "temperature" and r.location == "office")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
    '''
    
    result = query_api.query(org=org, query=query)
    print("\n3. Office temperature trend (1-minute intervals):")
    for table in result:
        for record in table.records:
            timestamp = record.get_time().strftime('%H:%M:%S')
            temp = round(record.get_value(), 1)
            print(f"   {timestamp}: {temp}°C")
    
    # 4. High temperature alerts
    query = f'''
    from(bucket: "{bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "temperature")
        |> filter(fn: (r) => r._value > 25.0)
        |> sort(columns: ["_time"], desc: true)
    '''
    
    result = query_api.query(org=org, query=query)
    print("\n4. High temperature alerts (>25°C):")
    for table in result:
        for record in table.records:
            timestamp = record.get_time().strftime('%H:%M:%S')
            location = record.values.get('location', 'unknown')
            temp = round(record.get_value(), 1)
            print(f"   {timestamp}: {temp}°C at {location}")

except Exception as e:
    print(f"Error: {e}")

finally:
    client.close()
```

`Run the script:`
```bash
python influxdb_test.py
```

---

## Advanced Queries with Flux

### Time-based Aggregations

```flux
// Hourly averages
from(bucket: "mybucket")
    |> range(start: -24h)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)

// Daily max/min
from(bucket: "mybucket")
    |> range(start: -7d)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> aggregateWindow(every: 1d, fn: max, createEmpty: false)
```

### Data Transformations

```flux
// Calculate temperature difference
from(bucket: "mybucket")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> pivot(rowKey:["_time"], columnKey: ["location"], valueColumn: "_value")
    |> map(fn: (r) => ({ r with diff: r.office - r.warehouse }))

// Moving average
from(bucket: "mybucket")
    |> range(start: -2h)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> movingAverage(n: 5)
```

---

## Data Retention and Downsampling

### Create Retention Policy

```bash
# Create bucket with retention policy (30 days)
influx bucket create -n short_term -o myorg --retention 720h

# Create bucket for long-term storage (1 year)
influx bucket create -n long_term -o myorg --retention 8760h
```

### Downsampling Task

`Create a downsampling task in InfluxDB UI or CLI:`
```flux
option task = {name: "downsample-temperature", every: 1h}

from(bucket: "mybucket")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
    |> to(bucket: "downsampled", org: "myorg")
```

---

## Monitoring Setup

### System Metrics Collection

`Create a system monitoring script:`
```python
import psutil
import time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from datetime import datetime, timezone

client = InfluxDBClient(url="http://localhost:8086", 
                       token="my-super-secret-auth-token", 
                       org="myorg")
write_api = client.write_api()

def collect_system_metrics():
    while True:
        # CPU usage
        cpu_point = Point("system_metrics") \
            .tag("metric", "cpu_usage") \
            .tag("host", "localhost") \
            .field("value", psutil.cpu_percent()) \
            .time(datetime.now(timezone.utc), WritePrecision.NS)
        
        # Memory usage
        memory = psutil.virtual_memory()
        mem_point = Point("system_metrics") \
            .tag("metric", "memory_usage") \
            .tag("host", "localhost") \
            .field("value", memory.percent) \
            .time(datetime.now(timezone.utc), WritePrecision.NS)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_point = Point("system_metrics") \
            .tag("metric", "disk_usage") \
            .tag("host", "localhost") \
            .field("value", (disk.used / disk.total) * 100) \
            .time(datetime.now(timezone.utc), WritePrecision.NS)
        
        write_api.write(bucket="mybucket", org="myorg", 
                       record=[cpu_point, mem_point, disk_point])
        
        time.sleep(10)  # Collect every 10 seconds

if __name__ == "__main__":
    collect_system_metrics()
```

---

## Backup and Restore

### Backup Data

```bash
# Backup all data
docker exec influxdb influx backup /tmp/backup -t my-super-secret-auth-token

# Copy backup to host
docker cp influxdb:/tmp/backup ./influxdb-backup
```

### Restore Data

```bash
# Copy backup to container
docker cp ./influxdb-backup influxdb:/tmp/restore

# Restore data
docker exec influxdb influx restore /tmp/restore -t my-super-secret-auth-token
```

---

## Performance Optimization

### Batch Writes

```python
# Use batch writing for better performance
from influxdb_client.client.write_api import ASYNCHRONOUS

write_api = client.write_api(write_options=ASYNCHRONOUS)

# Write large batches
batch_size = 1000
points = []

for i in range(batch_size):
    point = Point("sensor_data") \
        .tag("sensor_id", f"sensor_{i % 10}") \
        .field("value", random.uniform(0, 100)) \
        .time(datetime.now(timezone.utc), WritePrecision.NS)
    points.append(point)

write_api.write(bucket=bucket, org=org, record=points)
```

### Query Optimization

```flux
// Use specific time ranges
from(bucket: "mybucket")
    |> range(start: -1h, stop: now())  // Specific time range
    |> filter(fn: (r) => r._measurement == "temperature")
    |> filter(fn: (r) => r.location == "office")  // Filter early

// Limit results
from(bucket: "mybucket")
    |> range(start: -24h)
    |> filter(fn: (r) => r._measurement == "temperature")
    |> sort(columns: ["_time"], desc: true)
    |> limit(n: 100)  // Limit results
```

---

## Common Use Cases

- **IoT Monitoring**: Sensor data, device metrics, environmental monitoring
- **Application Performance**: Response times, error rates, throughput metrics
- **Infrastructure Monitoring**: Server metrics, network performance, resource usage
- **Financial Data**: Stock prices, trading volumes, market indicators
- **Industrial Automation**: Machine metrics, production data, quality measurements

✅ InfluxDB is now running in Docker and ready for your time-series data needs!
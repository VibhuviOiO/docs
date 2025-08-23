---
sidebar_position: 2
title: TimescaleDB
description: TimescaleDB is a PostgreSQL extension for time-series data that combines the reliability of PostgreSQL with time-series optimizations. Learn how to dockerize and run TimescaleDB.
slug: /TimeSeries/TimescaleDB
keywords:
  - TimescaleDB
  - time-series database
  - PostgreSQL extension
  - metrics database
  - Docker TimescaleDB
  - database containerization
  - timescaledb docker
  - time-series data
  - SQL time-series
  - hypertables
---

# ⏰ Dockerizing TimescaleDB for SQL-Based Time-Series Analytics

**TimescaleDB** is a PostgreSQL extension that transforms PostgreSQL into a powerful time-series database. It combines the **reliability of PostgreSQL** with **time-series optimizations**, making it perfect for applications that need **SQL compatibility** with **time-series performance**.

---

## Set Up TimescaleDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    container_name: timescaledb
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tsdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    volumes:
      - timescaledb-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d tsdb"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - timescaledb

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
      - timescaledb

volumes:
  timescaledb-data:
  pgadmin-data:
  grafana-data:
```

`Start TimescaleDB:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to TimescaleDB

### Using psql

`Connect directly to the container:`
```bash
docker exec -it timescaledb psql -U postgres -d tsdb
```

### Basic TimescaleDB Operations

`Create hypertables and insert time-series data:`
```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create a regular table
CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    pressure DOUBLE PRECISION
);

-- Convert to hypertable (time-series optimized)
SELECT create_hypertable('sensor_data', 'time');

-- Create indexes for better query performance
CREATE INDEX ON sensor_data (sensor_id, time DESC);
CREATE INDEX ON sensor_data (location, time DESC);

-- Insert sample data
INSERT INTO sensor_data (time, sensor_id, location, temperature, humidity, pressure) VALUES
    (NOW() - INTERVAL '1 hour', 1, 'office', 22.5, 65.2, 1013.25),
    (NOW() - INTERVAL '1 hour', 2, 'warehouse', 18.3, 70.1, 1012.80),
    (NOW() - INTERVAL '50 minutes', 1, 'office', 23.1, 64.8, 1013.30),
    (NOW() - INTERVAL '50 minutes', 2, 'warehouse', 18.7, 69.5, 1012.75),
    (NOW() - INTERVAL '40 minutes', 1, 'office', 22.8, 65.5, 1013.20),
    (NOW() - INTERVAL '40 minutes', 2, 'warehouse', 19.1, 68.9, 1012.90);

-- Query recent data
SELECT * FROM sensor_data 
WHERE time > NOW() - INTERVAL '1 hour' 
ORDER BY time DESC;

-- Time-based aggregations
SELECT 
    time_bucket('10 minutes', time) AS bucket,
    location,
    AVG(temperature) as avg_temp,
    MAX(temperature) as max_temp,
    MIN(temperature) as min_temp
FROM sensor_data 
WHERE time > NOW() - INTERVAL '2 hours'
GROUP BY bucket, location
ORDER BY bucket DESC, location;
```

---

## Python Integration

`Install the PostgreSQL adapter:`
```bash
pip install psycopg2-binary pandas
```

`Create a file timescaledb_test.py:`
```python
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime, timedelta
import random
import time

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'tsdb',
    'user': 'postgres',
    'password': 'password123'
}

try:
    # Connect to TimescaleDB
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("Connected to TimescaleDB")
    
    # Create metrics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_metrics (
            time TIMESTAMPTZ NOT NULL,
            host TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value DOUBLE PRECISION,
            tags JSONB
        )
    """)
    
    # Convert to hypertable
    cursor.execute("""
        SELECT create_hypertable('system_metrics', 'time', if_not_exists => TRUE)
    """)
    
    # Create indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_system_metrics_host_time 
        ON system_metrics (host, time DESC)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_system_metrics_metric_time 
        ON system_metrics (metric_name, time DESC)
    """)
    
    print("Created hypertable and indexes")
    
    # Generate and insert sample data
    hosts = ['web-server-1', 'web-server-2', 'db-server-1']
    metrics = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_io']
    
    # Insert historical data (last 24 hours)
    base_time = datetime.now() - timedelta(hours=24)
    data_points = []
    
    for i in range(1440):  # 1440 minutes = 24 hours
        timestamp = base_time + timedelta(minutes=i)
        
        for host in hosts:
            for metric in metrics:
                # Generate realistic metric values
                if metric == 'cpu_usage':
                    value = random.uniform(10, 90)
                elif metric == 'memory_usage':
                    value = random.uniform(30, 85)
                elif metric == 'disk_usage':
                    value = random.uniform(20, 70)
                else:  # network_io
                    value = random.uniform(0, 1000)
                
                tags = {
                    'environment': 'production',
                    'datacenter': 'us-east-1',
                    'service': 'web' if 'web' in host else 'database'
                }
                
                data_points.append((timestamp, host, metric, value, tags))
    
    # Batch insert for better performance
    cursor.executemany("""
        INSERT INTO system_metrics (time, host, metric_name, value, tags)
        VALUES (%s, %s, %s, %s, %s)
    """, data_points)
    
    conn.commit()
    print(f"Inserted {len(data_points)} data points")
    
    # Query examples
    print("\n=== Query Examples ===")
    
    # 1. Latest metrics for each host
    cursor.execute("""
        SELECT DISTINCT ON (host, metric_name)
            host, metric_name, value, time
        FROM system_metrics
        ORDER BY host, metric_name, time DESC
    """)
    
    print("\n1. Latest metrics by host:")
    current_host = None
    for row in cursor.fetchall():
        if row['host'] != current_host:
            current_host = row['host']
            print(f"\n   {current_host}:")
        print(f"     {row['metric_name']}: {row['value']:.1f}")
    
    # 2. Average CPU usage by host (last 6 hours)
    cursor.execute("""
        SELECT 
            time_bucket('1 hour', time) AS hour,
            host,
            AVG(value) as avg_cpu
        FROM system_metrics 
        WHERE metric_name = 'cpu_usage' 
        AND time > NOW() - INTERVAL '6 hours'
        GROUP BY hour, host
        ORDER BY hour DESC, host
    """)
    
    print("\n2. Average CPU usage by hour (last 6 hours):")
    for row in cursor.fetchall():
        hour = row['hour'].strftime('%H:%M')
        print(f"   {hour} - {row['host']}: {row['avg_cpu']:.1f}%")
    
    # 3. High CPU usage alerts
    cursor.execute("""
        SELECT time, host, value
        FROM system_metrics
        WHERE metric_name = 'cpu_usage'
        AND value > 80
        AND time > NOW() - INTERVAL '2 hours'
        ORDER BY time DESC
        LIMIT 10
    """)
    
    print("\n3. High CPU usage alerts (>80%):")
    for row in cursor.fetchall():
        timestamp = row['time'].strftime('%H:%M:%S')
        print(f"   {timestamp} - {row['host']}: {row['value']:.1f}%")
    
    # 4. Continuous aggregates example
    cursor.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_metrics
        WITH (timescaledb.continuous) AS
        SELECT 
            time_bucket('1 hour', time) AS hour,
            host,
            metric_name,
            AVG(value) as avg_value,
            MAX(value) as max_value,
            MIN(value) as min_value,
            COUNT(*) as data_points
        FROM system_metrics
        GROUP BY hour, host, metric_name
        WITH NO DATA
    """)
    
    # Refresh the materialized view
    cursor.execute("CALL refresh_continuous_aggregate('hourly_metrics', NULL, NULL)")
    conn.commit()
    
    # Query the continuous aggregate
    cursor.execute("""
        SELECT hour, host, avg_value, max_value
        FROM hourly_metrics
        WHERE metric_name = 'cpu_usage'
        AND hour > NOW() - INTERVAL '6 hours'
        ORDER BY hour DESC, host
        LIMIT 10
    """)
    
    print("\n4. Hourly CPU statistics (from continuous aggregate):")
    for row in cursor.fetchall():
        hour = row['hour'].strftime('%H:%M')
        print(f"   {hour} - {row['host']}: avg={row['avg_value']:.1f}%, max={row['max_value']:.1f}%")
    
    # 5. Using pandas for analysis
    df = pd.read_sql("""
        SELECT 
            time_bucket('15 minutes', time) AS bucket,
            AVG(value) as avg_cpu
        FROM system_metrics 
        WHERE metric_name = 'cpu_usage'
        AND time > NOW() - INTERVAL '4 hours'
        GROUP BY bucket
        ORDER BY bucket
    """, conn)
    
    print(f"\n5. Pandas DataFrame analysis:")
    print(f"   Data points: {len(df)}")
    print(f"   Average CPU: {df['avg_cpu'].mean():.1f}%")
    print(f"   Max CPU: {df['avg_cpu'].max():.1f}%")
    print(f"   Min CPU: {df['avg_cpu'].min():.1f}%")

except Exception as e:
    print(f"Error: {e}")

finally:
    if conn:
        cursor.close()
        conn.close()
```

`Run the script:`
```bash
python timescaledb_test.py
```

---

## Advanced TimescaleDB Features

### Continuous Aggregates

```sql
-- Create a continuous aggregate for hourly averages
CREATE MATERIALIZED VIEW sensor_data_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS hour,
    sensor_id,
    location,
    AVG(temperature) as avg_temp,
    AVG(humidity) as avg_humidity,
    COUNT(*) as readings
FROM sensor_data
GROUP BY hour, sensor_id, location;

-- Add refresh policy (automatic updates)
SELECT add_continuous_aggregate_policy('sensor_data_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### Data Retention Policies

```sql
-- Add retention policy (keep data for 30 days)
SELECT add_retention_policy('sensor_data', INTERVAL '30 days');

-- Add compression policy (compress data older than 7 days)
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id, location'
);

SELECT add_compression_policy('sensor_data', INTERVAL '7 days');
```

### Hierarchical Continuous Aggregates

```sql
-- Daily aggregates from hourly aggregates
CREATE MATERIALIZED VIEW sensor_data_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', hour) AS day,
    sensor_id,
    location,
    AVG(avg_temp) as daily_avg_temp,
    MAX(avg_temp) as daily_max_temp,
    MIN(avg_temp) as daily_min_temp,
    SUM(readings) as total_readings
FROM sensor_data_hourly
GROUP BY day, sensor_id, location;
```

---

## Performance Optimization

### Chunk Management

```sql
-- Check chunk information
SELECT * FROM timescaledb_information.chunks 
WHERE hypertable_name = 'sensor_data';

-- Set chunk time interval (default is 7 days)
SELECT set_chunk_time_interval('sensor_data', INTERVAL '1 day');

-- Manual chunk creation
SELECT add_dimension('sensor_data', 'sensor_id', number_partitions => 4);
```

### Query Optimization

```sql
-- Use time_bucket for time-based aggregations
SELECT 
    time_bucket('5 minutes', time) AS bucket,
    AVG(temperature)
FROM sensor_data 
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY bucket
ORDER BY bucket;

-- Use EXPLAIN to analyze query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM sensor_data 
WHERE time > NOW() - INTERVAL '1 day' 
AND sensor_id = 1;
```

---

## Backup and Restore

### Backup with pg_dump

```bash
# Backup entire database
docker exec timescaledb pg_dump -U postgres tsdb > timescaledb_backup.sql

# Backup specific table
docker exec timescaledb pg_dump -U postgres -t sensor_data tsdb > sensor_data_backup.sql
```

### Restore Database

```bash
# Restore database
docker exec -i timescaledb psql -U postgres tsdb < timescaledb_backup.sql
```

---

## Monitoring and Maintenance

### Database Statistics

```sql
-- Hypertable information
SELECT * FROM timescaledb_information.hypertables;

-- Chunk statistics
SELECT 
    hypertable_name,
    COUNT(*) as num_chunks,
    pg_size_pretty(SUM(total_bytes)) as total_size
FROM timescaledb_information.chunks
GROUP BY hypertable_name;

-- Compression statistics
SELECT 
    hypertable_name,
    compression_status,
    COUNT(*) as num_chunks,
    pg_size_pretty(SUM(before_compression_total_bytes)) as before_compression,
    pg_size_pretty(SUM(after_compression_total_bytes)) as after_compression
FROM timescaledb_information.chunks
GROUP BY hypertable_name, compression_status;
```

### Performance Monitoring

```sql
-- Query performance statistics
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE tablename LIKE '%sensor_data%';

-- Index usage statistics
SELECT 
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'sensor_data';
```

---

## Common Use Cases

- **IoT and Sensor Data**: Environmental monitoring, industrial sensors
- **Application Monitoring**: Performance metrics, error tracking, user analytics
- **Financial Data**: Stock prices, trading data, market analysis
- **DevOps Monitoring**: Infrastructure metrics, log aggregation, alerting
- **Business Analytics**: Sales data, customer behavior, operational metrics

✅ TimescaleDB is now running in Docker and ready for your SQL-based time-series applications!
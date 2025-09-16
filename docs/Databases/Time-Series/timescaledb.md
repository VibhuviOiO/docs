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
services:
  timescaledb:
    image: timescale/timescaledb:2.22.0-pg17
    container_name: timescaledb
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=tsdb
    ports:
      - "5432:5432"
    volumes:
      - timescale_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@admin.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    ports:
      - "5050:80"

volumes:
  timescale_data:

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

`Connect directly to the container:`
```bash
docker exec -it timescaledb psql -U postgres -d tsdb
```

### Basic TimescaleDB Operations

`Create hypertables and insert time-series data:`

`Enable TimescaleDB extension:`
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

`Create a regular table`
```sql

CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    location TEXT,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION
);
```
`Convert to hypertable (time-series optimized)`
```sql

SELECT create_hypertable('sensor_data', 'time');
```
`Insert sample data`
```sql

INSERT INTO sensor_data (time, sensor_id, location, temperature, humidity, pressure) VALUES
    (NOW() - INTERVAL '1 hour', 1, 'office', 22.5, 65.2, 1013.25),
    (NOW() - INTERVAL '1 hour', 2, 'warehouse', 18.3, 70.1, 1012.80),
    (NOW() - INTERVAL '50 minutes', 1, 'office', 23.1, 64.8, 1013.30),
    (NOW() - INTERVAL '50 minutes', 2, 'warehouse', 18.7, 69.5, 1012.75),
    (NOW() - INTERVAL '40 minutes', 1, 'office', 22.8, 65.5, 1013.20),
    (NOW() - INTERVAL '40 minutes', 2, 'warehouse', 19.1, 68.9, 1012.90);
```

` Query recent data`
```sql
SELECT * FROM sensor_data ORDER BY time;

```
`Result`
```yml

             time              | location | temperature | humidity 
-------------------------------+----------+-------------+----------
 2025-09-06 10:01:46.190545+00 | room1    |        25.3 |     41.2
 2025-09-06 10:02:46.190545+00 | room1    |        26.1 |       42
 2025-09-06 10:03:46.190545+00 | room1    |        27.4 |     43.1
 2025-09-06 10:04:46.190545+00 | lab      |        24.8 |     39.5
 2025-09-06 10:05:46.190545+00 | lab      |        25.6 |     40.2
(5 rows)
```

---

### Common Use Cases

- **IoT and Sensor Data**: Environmental monitoring, industrial sensors
- **Application Monitoring**: Performance metrics, error tracking, user analytics
- **Financial Data**: Stock prices, trading data, market analysis
- **DevOps Monitoring**: Infrastructure metrics, log aggregation, alerting
- **Business Analytics**: Sales data, customer behavior, operational metrics

✅ TimescaleDB is now running in Docker and ready for your SQL-based time-series applications!## Refe
rences

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
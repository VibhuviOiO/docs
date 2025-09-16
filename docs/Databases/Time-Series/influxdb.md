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

### Connect to InfluxDB

`Connect directly to the container:`
```shell
docker exec -it influxdb influx bucket create \
  --name demo-bucket \
  --org myorg \
  --token my-super-secret-auth-token \
  --host http://localhost:8086
```
`Write Data`

```bash
docker exec -it influxdb influx write \
  --bucket demo-bucket \
  --org myorg \
  --token my-super-secret-auth-token \
  -p s \
  "sensors,location=lab temperature=24.8,humidity=39.5 $(date +%s)"
```
`another point`
```bash
docker exec -it influxdb influx write \
  --bucket demo-bucket \
  --org myorg \
  --token my-super-secret-auth-token \
  -p s \
  "sensors,location=lab temperature=26.1,humidity=42.0 $(date +%s)"
```
`Query :`
```bash
docker exec -it influxdb influx query '
  from(bucket:"demo-bucket")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "sensors")
' --org myorg --token my-super-secret-auth-token --host http://localhost:8086
```

`Result:`
```less
Table: keys: [_start, _stop, _field, _measurement, location]
                   _start:time                      _stop:time           _field:string     _measurement:string         location:string                      _time:time                  _value:float
------------------------------  ------------------------------  ----------------------  ----------------------  ----------------------  ------------------------------  ----------------------------
2025-09-06T07:51:46.797214522Z  2025-09-06T08:51:46.797214522Z                humidity                 sensors                     lab  2025-09-06T08:50:57.000000000Z                          39.5
2025-09-06T07:51:46.797214522Z  2025-09-06T08:51:46.797214522Z                humidity                 sensors                     lab  2025-09-06T08:51:29.000000000Z                          42
Table: keys: [_start, _stop, _field, _measurement, location]
                   _start:time                      _stop:time           _field:string     _measurement:string         location:string                      _time:time                  _value:float
------------------------------  ------------------------------  ----------------------  ----------------------  ----------------------  ------------------------------  ----------------------------
2025-09-06T07:51:46.797214522Z  2025-09-06T08:51:46.797214522Z             temperature                 sensors                     lab  2025-09-06T08:50:57.000000000Z                          24.8
2025-09-06T07:51:46.797214522Z  2025-09-06T08:51:46.797214522Z             temperature                 sensors                     lab  2025-09-06T08:51:29.000000000Z                          26.0
```


### Common Use Cases

- **IoT Monitoring**: Sensor data, device metrics, environmental monitoring
- **Application Performance**: Response times, error rates, throughput metrics
- **Infrastructure Monitoring**: Server metrics, network performance, resource usage
- **Financial Data**: Stock prices, trading volumes, market indicators
- **Industrial Automation**: Machine metrics, production data, quality measurements

✅ InfluxDB is now running in Docker and ready for your time-series data needs!## Ref
erences

* [InfluxDB Official Documentation](https://docs.influxdata.com/influxdb/v2.7/)
* [Docker Official Documentation](https://docs.docker.com/)
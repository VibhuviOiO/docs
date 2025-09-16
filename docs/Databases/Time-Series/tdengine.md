# TDengine

TDengine is a high-performance, distributed time-series database designed for IoT, Industrial IoT, and other time-series data applications. It provides SQL-like query language, built-in caching, stream processing, and data subscription features.

## Key Features

- **High Performance**: 10x faster than traditional databases for time-series workloads
- **SQL Support**: Standard SQL with time-series extensions
- **Built-in Caching**: Automatic caching of recent data in memory
- **Stream Processing**: Real-time data processing and analytics
- **Data Compression**: Up to 90% compression ratio
- **Clustering**: Horizontal scaling with automatic sharding
- **Multi-tenancy**: Database isolation and resource management

## Installation

### Docker Installation

```bash
# Pull TDengine image
docker pull tdengine/tdengine:latest

# Run TDengine container
docker run -d \
  --name tdengine \
  -p 6030:6030 \
  -p 6041:6041 \
  -p 6043-6049:6043-6049 \
  -p 6043-6049:6043-6049/udp \
  -v tdengine-data:/var/lib/taos \
  tdengine/tdengine:latest
```

### Native Installation (Ubuntu/Debian)

```bash
# Download and install TDengine
wget https://www.taosdata.com/assets-download/3.0/TDengine-server-3.0.0.0-Linux-x64.tar.gz
tar -xzf TDengine-server-3.0.0.0-Linux-x64.tar.gz
cd TDengine-server-3.0.0.0
sudo ./install.sh

# Start TDengine service
sudo systemctl start taosd
sudo systemctl enable taosd
```

## Configuration

### Basic Configuration (`/etc/taos/taos.cfg`)

```ini
# Basic settings
firstEp                   localhost:6030
fqdn                      localhost
serverPort                6030
httpPort                  6041

# Data directory
dataDir                   /var/lib/taos

# Log settings
logDir                    /var/log/taos
logLevel                  info

# Memory settings
blocks                    6
cache                     16
```

### Cluster Configuration

```ini
# Cluster settings
firstEp                   node1.example.com:6030
secondEp                  node2.example.com:6030
fqdn                      node1.example.com
replica                   3

# Network settings
rpcMaxTime                300
shellActivityTimer        3
```

## Basic Usage

### Connect to TDengine

```bash
# Using TDengine CLI
taos

# Connect to remote instance
taos -h hostname -P port -u username -p password
```

### Database Operations

```sql
-- Create database
CREATE DATABASE iot_sensors;

-- Use database
USE iot_sensors;

-- Show databases
SHOW DATABASES;

-- Drop database
DROP DATABASE iot_sensors;
```

### Table Operations

```sql
-- Create super table (template)
CREATE STABLE sensors (
    ts TIMESTAMP,
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT
) TAGS (
    device_id NCHAR(50),
    location NCHAR(100),
    type NCHAR(20)
);

-- Create table from super table
CREATE TABLE sensor_001 USING sensors TAGS ('device_001', 'Building_A', 'temperature');

-- Insert data
INSERT INTO sensor_001 VALUES 
    (NOW, 23.5, 65.2, 1013.25),
    (NOW + 1s, 23.7, 65.0, 1013.30);

-- Batch insert
INSERT INTO 
    sensor_001 VALUES (NOW, 24.1, 64.8, 1013.35)
    sensor_002 VALUES (NOW, 22.9, 66.1, 1013.20);
```

## Advanced Features

### Time-Series Queries

```sql
-- Time range queries
SELECT * FROM sensors 
WHERE ts >= '2024-01-01 00:00:00' 
  AND ts < '2024-01-02 00:00:00';

-- Aggregation functions
SELECT AVG(temperature), MAX(humidity), MIN(pressure)
FROM sensors 
WHERE ts >= NOW - 1h
INTERVAL(10m);

-- Downsampling
SELECT FIRST(temperature), LAST(temperature), AVG(temperature)
FROM sensors 
WHERE ts >= NOW - 1d
INTERVAL(1h) FILL(LINEAR);
```

### Stream Processing

```sql
-- Create stream
CREATE STREAM temp_alerts AS
SELECT ts, device_id, temperature
FROM sensors
WHERE temperature > 30.0;

-- Show streams
SHOW STREAMS;

-- Drop stream
DROP STREAM temp_alerts;
```

### Data Subscription

```sql
-- Create topic
CREATE TOPIC sensor_topic AS SELECT * FROM sensors;

-- Show topics
SHOW TOPICS;

-- Consumer example (using TDengine connector)
```

## Monitoring and Management

### System Information

```sql
-- Show server status
SHOW VARIABLES;

-- Show connections
SHOW CONNECTIONS;

-- Show queries
SHOW QUERIES;

-- Show consumers
SHOW CONSUMERS;
```

### Performance Monitoring

```sql
-- Database statistics
SELECT DATABASE(), COUNT(*) FROM sensors;

-- Table information
DESCRIBE sensors;

-- Show table distribution
SHOW TABLE DISTRIBUTED sensors;
```

## Client Libraries

### Python Example

```python
import taos

# Connect to TDengine
conn = taos.connect(
    host='localhost',
    user='root',
    password='taosdata',
    database='iot_sensors'
)

# Execute query
cursor = conn.cursor()
cursor.execute("SELECT * FROM sensors LIMIT 10")

# Fetch results
results = cursor.fetchall()
for row in results:
    print(row)

# Close connection
cursor.close()
conn.close()
```

### Node.js Example

```javascript
const taos = require('td2.0-connector');

// Create connection
const conn = taos.connect({
  host: 'localhost',
  user: 'root',
  password: 'taosdata',
  database: 'iot_sensors'
});

// Execute query
const cursor = conn.cursor();
cursor.query('SELECT * FROM sensors LIMIT 10');

// Handle results
cursor.fetchall((result) => {
  console.log(result);
});
```

## Best Practices

### Schema Design

- Use super tables for similar time-series data
- Choose appropriate data types for optimal storage
- Design tag schema for efficient filtering
- Limit the number of tags (recommended < 128)

### Performance Optimization

```sql
-- Create indexes on frequently queried tags
CREATE INDEX idx_device ON sensors (device_id);

-- Use appropriate time intervals for aggregation
SELECT AVG(temperature) FROM sensors 
WHERE ts >= NOW - 1d 
INTERVAL(5m);

-- Optimize batch inserts
INSERT INTO sensors VALUES 
    ('2024-01-01 10:00:00', 23.5, 65.2, 1013.25, 'dev1', 'room1', 'temp'),
    ('2024-01-01 10:00:01', 23.6, 65.1, 1013.26, 'dev1', 'room1', 'temp');
```

### Data Retention

```sql
-- Set data retention policy
ALTER DATABASE iot_sensors KEEP 365;

-- Set cache size
ALTER DATABASE iot_sensors CACHE 32;

-- Set compression
ALTER DATABASE iot_sensors COMP 2;
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   ```bash
   # Check TDengine service status
   sudo systemctl status taosd
   
   # Check logs
   tail -f /var/log/taos/taosdlog.0
   ```

2. **Performance Issues**
   ```sql
   -- Check system resources
   SHOW VARIABLES;
   
   -- Monitor active queries
   SHOW QUERIES;
   ```

3. **Storage Issues**
   ```bash
   # Check disk usage
   du -sh /var/lib/taos/
   
   # Clean old data
   taos -s "DROP DATABASE old_database;"
   ```

## Integration Examples

### Grafana Integration

```yaml
# grafana datasource config
apiVersion: 1
datasources:
  - name: TDengine
    type: tdengine-datasource
    url: http://localhost:6041
    user: root
    password: taosdata
    database: iot_sensors
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: tdengine
spec:
  serviceName: tdengine
  replicas: 3
  selector:
    matchLabels:
      app: tdengine
  template:
    metadata:
      labels:
        app: tdengine
    spec:
      containers:
      - name: tdengine
        image: tdengine/tdengine:latest
        ports:
        - containerPort: 6030
        - containerPort: 6041
        volumeMounts:
        - name: tdengine-data
          mountPath: /var/lib/taos
        env:
        - name: TAOS_FQDN
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
  volumeClaimTemplates:
  - metadata:
      name: tdengine-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

## Resources

- [Official Documentation](https://docs.tdengine.com/)
- [GitHub Repository](https://github.com/taosdata/TDengine)
- [Community Forum](https://github.com/taosdata/TDengine/discussions)
- [Docker Hub](https://hub.docker.com/r/tdengine/tdengine)## Refer
ences

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
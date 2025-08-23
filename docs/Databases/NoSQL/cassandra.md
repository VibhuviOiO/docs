---
sidebar_position: 2
title: Cassandra
description: Apache Cassandra is a highly scalable NoSQL database designed for handling large amounts of data. Learn how to dockerize and run Cassandra with Docker Compose.
slug: /NoSQL/Cassandra
keywords:
  - Cassandra
  - Apache Cassandra
  - NoSQL database
  - distributed database
  - Docker Cassandra
  - database containerization
  - cassandra docker
  - database setup
  - wide-column store
  - scalable database
---

# 🚀 Dockerizing Apache Cassandra for Scalable Distributed Applications

Apache Cassandra is a **highly scalable, distributed NoSQL database** designed to handle large amounts of data across many commodity servers. It is ideal for applications requiring **high availability**, **linear scalability**, and **fault tolerance**.

In this guide, we’ll walk through setting up Cassandra using Docker Compose, performing basic operations, and integrating it with Python.

---

## 🧰 Prerequisites

Before starting, ensure you have the following installed:

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 1.29 or later
- **Python**: Version 3.8 or later (for Python integration)
- **pip**: Python package manager

---

## 🔧 Step 1: Set Up Cassandra with Docker Compose

Create a `docker-compose.yml` file to define the Cassandra service.

```yaml
version: '3.8'

services:
  cassandra:
    image: cassandra:4.1
    container_name: cassandra-node
    restart: unless-stopped
    ports:
      - "9042:9042"  # CQL port
      - "7000:7000"  # Inter-node communication
    environment:
      CASSANDRA_CLUSTER_NAME: "MyCluster"
      CASSANDRA_DC: "datacenter1"
      CASSANDRA_RACK: "rack1"
      CASSANDRA_ENDPOINT_SNITCH: "GossipingPropertyFileSnitch"
    volumes:
      - cassandra-data:/var/lib/cassandra
    healthcheck:
      test: ["CMD-SHELL", "cqlsh -e 'describe cluster'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

volumes:
  cassandra-data:
```

### Start Cassandra

Run the following command to start Cassandra:

```bash
docker compose up -d
```

### Verify the Setup

Check if the container is running:

```bash
docker ps
docker logs cassandra-node
```

---

## 🏗️ Step 2: Install cqlsh (Cassandra Query Language Shell)

The `cqlsh` tool is included in the Cassandra Docker image. You can access it directly from the running container.

### Connect to Cassandra

```bash
docker exec -it cassandra-node cqlsh
```

---

## 📁 Step 3: Add Configuration and Perform Basic Operations

Once connected to `cqlsh`, you can perform basic operations like creating a keyspace, tables, and inserting data.

### Example CQL Commands

```sql
-- Create a keyspace
CREATE KEYSPACE myapp 
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

-- Use the keyspace
USE myapp;

-- Create a table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    age INT,
    created_at TIMESTAMP
);

-- Insert data
INSERT INTO users (id, name, email, age, created_at) 
VALUES (uuid(), 'John Doe', 'john@example.com', 30, toTimestamp(now()));

-- Query data
SELECT * FROM users;
```

---

## ▶️ Step 4: Integrate Cassandra with Python

To interact with Cassandra programmatically, use the Python Cassandra driver.

### Install the Driver

```bash
pip install cassandra-driver
```

### Example Python Script

Create a file named `cassandra_test.py`:

```python
from cassandra.cluster import Cluster
import uuid
from datetime import datetime

# Connect to Cassandra
cluster = Cluster(['localhost'], port=9042)
session = cluster.connect()

# Create keyspace
session.execute("""
    CREATE KEYSPACE IF NOT EXISTS myapp 
    WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
    }
""")

# Use keyspace
session.set_keyspace('myapp')

# Create table
session.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name TEXT,
        price DECIMAL,
        created_at TIMESTAMP
    )
""")

# Insert data
product_id = uuid.uuid4()
session.execute("""
    INSERT INTO products (id, name, price, created_at)
    VALUES (%s, %s, %s, %s)
""", (product_id, 'Laptop', 999.99, datetime.now()))

print(f"Inserted product with ID: {product_id}")

# Query data
rows = session.execute("SELECT * FROM products")
for row in rows:
    print(f"- {row.name}: ${row.price}")
```

Run the script:

```bash
python cassandra_test.py
```

---

## 📊 Step 5: Explore the Cluster and Monitor Performance

### Check Cluster Status

```bash
docker exec cassandra-node nodetool status
```

### Performance Metrics

```bash
docker exec cassandra-node nodetool info
docker exec cassandra-node nodetool compactionstats
```

---

## 🔍 What You’ll See / Interpret Results

- **Cluster Status**: Use `nodetool status` to verify the health of the cluster.
- **Data Queries**: Use `cqlsh` or Python to query and manipulate data.
- **Logs**: Check container logs for any errors or warnings.

---

## Pros & Cons

### Pros

- **Highly Scalable**: Handles large datasets across distributed nodes.
- **Fault Tolerant**: Ensures data availability even during node failures.
- **Flexible Schema**: Supports dynamic and evolving data models.

### Cons

- **Complex Setup**: Multi-node clusters require careful configuration.
- **Query Limitations**: Limited support for complex joins and aggregations.

---

## Conclusion

Apache Cassandra is a powerful NoSQL database for applications requiring high scalability and fault tolerance. By containerizing Cassandra with Docker, you can quickly set up a development or production environment. Whether you're building IoT systems, real-time analytics, or content management platforms, Cassandra is a reliable choice.

Start exploring Cassandra today and unlock the potential of distributed databases!
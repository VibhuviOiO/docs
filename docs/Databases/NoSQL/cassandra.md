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

# Dockerizing Apache Cassandra for Scalable Distributed Applications

Apache Cassandra is a **highly scalable, distributed NoSQL database** designed to handle large amounts of data across many commodity servers. It is ideal for applications requiring **high availability**, **linear scalability**, and **fault tolerance**.


---

`Create a docker-compose.yml file to define the Cassandra service.`

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

`start Cassandra:`

```bash
docker compose up -d
```

`Wait few secs and Check if the container is running:`

```bash
docker ps
```

---
` Connect to Cassandra`

```bash
docker exec -it cassandra-node cqlsh
```

---

` Once connected to cqlsh, you can perform basic operations like creating a keyspace, tables, and inserting data. `

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

#### Reference
- [Instaclustr's Cassandra Architecture Overview](https://www.instaclustr.com/blog/cassandra-architecture/?utm_source=chatgpt.com)* 
[ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
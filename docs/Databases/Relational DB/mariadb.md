---
sidebar_position: 5
title: MariaDB
description: MariaDB is a popular open-source relational database that's a drop-in replacement for MySQL. Learn how to dockerize and run MariaDB for your applications with Docker Compose.
slug: /RelationalDB/MariaDB
keywords:
  - MariaDB
  - MySQL alternative
  - relational database
  - SQL database
  - Docker MariaDB
  - database containerization
  - mariadb docker
  - database setup
  - mariadb tutorial
  - open-source database
---

# 🦭 Dockerizing MariaDB for Reliable Database Applications

**MariaDB** is a popular open-source relational database that started as a fork of MySQL. It's designed to be a **drop-in replacement** for MySQL with enhanced features, better performance, and strong commitment to remaining open-source. MariaDB is trusted by organizations like Wikipedia, Google, and Red Hat.

---

## Set Up MariaDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  mariadb:
    image: mariadb:11.2
    container_name: mariadb-db
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MARIADB_ROOT_PASSWORD: root_password
      MARIADB_DATABASE: myapp
      MARIADB_USER: appuser
      MARIADB_PASSWORD: user_password
    volumes:
      - mariadb-data:/var/lib/mysql
      - ./init-scripts:/docker-entrypoint-initdb.d
      - ./mariadb.cnf:/etc/mysql/conf.d/mariadb.cnf
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: phpMyAdmin for database management
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: phpmyadmin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: root_password
    depends_on:
      - mariadb

  # Optional: Adminer as alternative
  adminer:
    image: adminer:latest
    container_name: adminer
    restart: unless-stopped
    ports:
      - "8081:8080"
    depends_on:
      - mariadb

volumes:
  mariadb-data:
```

`Start MariaDB:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to MariaDB



`Connect directly to the container:`
```bash
docker exec -it mariadb-db mariadb -u root -p
```

`Enter Password :`
```bash
root_password
```

### Basic SQL Operations

`Create a table and insert data:`
```sql
-- Use the database
USE myapp;

-- Create a users table with MariaDB-specific features
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    profile JSON,  -- JSON support in MariaDB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data with JSON
INSERT INTO users (name, email, profile) VALUES 
    ('John Doe', 'john@example.com', '{"age": 30, "city": "New York", "interests": ["tech", "sports"]}'),
    ('Jane Smith', 'jane@example.com', '{"age": 25, "city": "Toronto", "interests": ["music", "travel"]}');

-- Query data with JSON functions
SELECT 
    name,
    email,
    JSON_EXTRACT(profile, '$.age') as age,
    JSON_EXTRACT(profile, '$.city') as city
FROM users;

-- Update JSON data
UPDATE users 
SET profile = JSON_SET(profile, '$.age', 31) 
WHERE name = 'John Doe';
```

`Query with JSON array`
```bash
SELECT name, email 
FROM users 
WHERE JSON_CONTAINS(profile, '"tech"', '$.interests');

```

`Output :`

| Name     | Email            |
|----------|-----------------|
| John Doe | john@example.com |

---


## Common Use Cases

- **Web Applications**: Drop-in MySQL replacement with enhanced features
- **E-commerce Platforms**: High-performance transactional processing
- **Content Management**: JSON support for flexible content storage
- **Analytics Workloads**: ColumnStore engine for analytical queries
- **High Availability**: Galera cluster for multi-master replication

✅ MariaDB is now running in Docker and ready for your reliable database applications!## Referen
ces

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
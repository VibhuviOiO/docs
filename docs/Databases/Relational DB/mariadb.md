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

### Using MariaDB CLI

`Connect directly to the container:`
```bash
docker exec -it mariadb-db mariadb -u root -p
```

`Or install MariaDB client locally and connect:`
```bash
# Install MariaDB client
sudo apt-get install mariadb-client  # Ubuntu/Debian
brew install mariadb                  # macOS

# Connect to database
mariadb -h localhost -P 3306 -u appuser -p myapp
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

-- Query with JSON array
SELECT name, email 
FROM users 
WHERE JSON_CONTAINS(profile, '"tech"', '$.interests');
```

---

## Python Integration

`Install the MariaDB connector:`
```bash
pip install mariadb
# or use MySQL connector (compatible)
pip install mysql-connector-python
```

`Create a file mariadb_test.py:`
```python
import mariadb
import json
from datetime import datetime

# Database connection parameters
config = {
    'host': 'localhost',
    'port': 3306,
    'database': 'myapp',
    'user': 'appuser',
    'password': 'user_password'
}

try:
    # Connect to MariaDB
    connection = mariadb.connect(**config)
    cursor = connection.cursor()
    
    print("Connected to MariaDB")
    
    # Create table with advanced features
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            category VARCHAR(50),
            attributes JSON,
            tags SET('electronics', 'clothing', 'books', 'sports', 'home'),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_price (price),
            FULLTEXT idx_description (description)
        )
    """)
    
    # Insert data with JSON and SET types
    products_data = [
        ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 
         json.dumps({"brand": "TechCorp", "ram": "16GB", "storage": "512GB SSD"}), 'electronics'),
        ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics',
         json.dumps({"brand": "MouseCorp", "dpi": 1600, "wireless": True}), 'electronics'),
        ('Office Chair', 'Comfortable ergonomic office chair', 299.99, 'Furniture',
         json.dumps({"material": "mesh", "adjustable": True, "warranty": "5 years"}), 'home'),
        ('Running Shoes', 'Professional running shoes', 129.99, 'Sports',
         json.dumps({"brand": "RunFast", "size": "10", "color": "black"}), 'sports')
    ]
    
    cursor.executemany("""
        INSERT INTO products (name, description, price, category, attributes, tags) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, products_data)
    
    print(f"Inserted {cursor.rowcount} products")
    
    # Query with JSON functions
    cursor.execute("""
        SELECT 
            name,
            price,
            JSON_EXTRACT(attributes, '$.brand') as brand,
            JSON_EXTRACT(attributes, '$.ram') as ram,
            tags
        FROM products 
        WHERE category = 'Electronics'
    """)
    
    print("\nElectronics Products:")
    for row in cursor.fetchall():
        print(f"  {row[0]} - ${row[1]} (Brand: {row[2]})")
    
    # Full-text search
    cursor.execute("""
        SELECT name, description, price
        FROM products 
        WHERE MATCH(description) AGAINST('professional' IN NATURAL LANGUAGE MODE)
    """)
    
    print("\nProducts matching 'professional':")
    for row in cursor.fetchall():
        print(f"  {row[0]} - {row[1][:50]}...")
    
    # Advanced aggregation
    cursor.execute("""
        SELECT 
            category,
            COUNT(*) as product_count,
            AVG(price) as avg_price,
            MIN(price) as min_price,
            MAX(price) as max_price,
            SUM(price) as total_value
        FROM products
        GROUP BY category
        ORDER BY avg_price DESC
    """)
    
    print("\nCategory Analysis:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} products, Avg: ${row[2]:.2f}")
    
    # Window functions (MariaDB 10.2+)
    cursor.execute("""
        SELECT 
            name,
            category,
            price,
            ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) as price_rank,
            RANK() OVER (ORDER BY price DESC) as overall_rank
        FROM products
        ORDER BY category, price_rank
    """)
    
    print("\nProduct Rankings:")
    for row in cursor.fetchall():
        print(f"  {row[1]} - {row[0]}: ${row[2]} (Rank in category: {row[3]})")
    
    # Commit changes
    connection.commit()
    
except mariadb.Error as e:
    print(f"Database error: {e}")
    
finally:
    if connection:
        cursor.close()
        connection.close()
```

`Run the script:`
```bash
python mariadb_test.py
```

---

## Advanced MariaDB Features

### Custom Configuration

`Create a custom mariadb.cnf file:`
```ini
[mariadb]
# General settings
max_connections = 200
max_allowed_packet = 64M
thread_cache_size = 8
query_cache_size = 32M
query_cache_limit = 2M

# InnoDB settings
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_lock_wait_timeout = 50

# MariaDB specific optimizations
optimizer_switch = 'rowid_filter=on'
join_cache_level = 8
mrr = on
mrr_sort_keys = on

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
```

### Columnar Storage with ColumnStore

`Enable ColumnStore engine:`
```sql
-- Install ColumnStore engine (if available)
INSTALL SONAME 'ha_columnstore';

-- Create table with ColumnStore for analytics
CREATE TABLE sales_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE,
    customer_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    region VARCHAR(50)
) ENGINE=ColumnStore;

-- Insert sample data
INSERT INTO sales_analytics (transaction_date, customer_id, product_id, quantity, unit_price, total_amount, region) VALUES
    ('2024-01-15', 1001, 2001, 2, 25.99, 51.98, 'North'),
    ('2024-01-15', 1002, 2002, 1, 199.99, 199.99, 'South'),
    ('2024-01-16', 1003, 2001, 3, 25.99, 77.97, 'East'),
    ('2024-01-16', 1001, 2003, 1, 49.99, 49.99, 'North');

-- Analytical query
SELECT 
    region,
    COUNT(*) as transactions,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_transaction
FROM sales_analytics
GROUP BY region
ORDER BY revenue DESC;
```

---

## Galera Cluster Setup

### Multi-Master Replication

`docker-compose.yml for Galera cluster:`
```yaml
version: '3.8'

services:
  mariadb-node1:
    image: mariadb:11.2
    container_name: mariadb-node1
    environment:
      MARIADB_ROOT_PASSWORD: cluster_password
      MARIADB_GALERA_CLUSTER: "yes"
      MARIADB_GALERA_CLUSTER_NAME: "galera_cluster"
      MARIADB_GALERA_CLUSTER_ADDRESS: "gcomm://mariadb-node1,mariadb-node2,mariadb-node3"
      MARIADB_GALERA_NODE_ADDRESS: "mariadb-node1"
    volumes:
      - mariadb-node1-data:/var/lib/mysql
      - ./galera.cnf:/etc/mysql/conf.d/galera.cnf
    ports:
      - "3306:3306"

  mariadb-node2:
    image: mariadb:11.2
    container_name: mariadb-node2
    environment:
      MARIADB_ROOT_PASSWORD: cluster_password
      MARIADB_GALERA_CLUSTER: "yes"
      MARIADB_GALERA_CLUSTER_NAME: "galera_cluster"
      MARIADB_GALERA_CLUSTER_ADDRESS: "gcomm://mariadb-node1,mariadb-node2,mariadb-node3"
      MARIADB_GALERA_NODE_ADDRESS: "mariadb-node2"
    volumes:
      - mariadb-node2-data:/var/lib/mysql
      - ./galera.cnf:/etc/mysql/conf.d/galera.cnf
    ports:
      - "3307:3306"
    depends_on:
      - mariadb-node1

  mariadb-node3:
    image: mariadb:11.2
    container_name: mariadb-node3
    environment:
      MARIADB_ROOT_PASSWORD: cluster_password
      MARIADB_GALERA_CLUSTER: "yes"
      MARIADB_GALERA_CLUSTER_NAME: "galera_cluster"
      MARIADB_GALERA_CLUSTER_ADDRESS: "gcomm://mariadb-node1,mariadb-node2,mariadb-node3"
      MARIADB_GALERA_NODE_ADDRESS: "mariadb-node3"
    volumes:
      - mariadb-node3-data:/var/lib/mysql
      - ./galera.cnf:/etc/mysql/conf.d/galera.cnf
    ports:
      - "3308:3306"
    depends_on:
      - mariadb-node1

volumes:
  mariadb-node1-data:
  mariadb-node2-data:
  mariadb-node3-data:
```

---

## Backup and Restore

### Using mariadb-dump

`Create backup:`
```bash
# Full database backup
docker exec mariadb-db mariadb-dump -u root -p myapp > backup.sql

# All databases
docker exec mariadb-db mariadb-dump -u root -p --all-databases > full_backup.sql

# Compressed backup
docker exec mariadb-db mariadb-dump -u root -p myapp | gzip > backup.sql.gz
```

### Using Mariabackup

`Hot backup with Mariabackup:`
```bash
# Install mariabackup in container or use it from host
docker exec mariadb-db mariabackup --backup --target-dir=/backup --user=root --password=root_password

# Prepare backup
docker exec mariadb-db mariabackup --prepare --target-dir=/backup

# Restore backup
docker exec mariadb-db mariabackup --copy-back --target-dir=/backup
```

---

## Performance Monitoring

### Built-in Performance Schema

```sql
-- Enable performance schema
SET GLOBAL performance_schema = ON;

-- Check slow queries
SELECT 
    DIGEST_TEXT,
    COUNT_STAR,
    AVG_TIMER_WAIT/1000000000 as avg_time_seconds,
    SUM_TIMER_WAIT/1000000000 as total_time_seconds
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 10;

-- Check table I/O
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ,
    COUNT_WRITE,
    SUM_TIMER_READ/1000000000 as read_time_seconds,
    SUM_TIMER_WRITE/1000000000 as write_time_seconds
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY SUM_TIMER_READ + SUM_TIMER_WRITE DESC;
```

### System Status Monitoring

```sql
-- Check connection status
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- Check query cache
SHOW STATUS LIKE 'Qcache%';

-- Check InnoDB status
SHOW ENGINE INNODB STATUS;

-- Check table status
SHOW TABLE STATUS FROM myapp;
```

---

## Security Features

### User Management

```sql
-- Create users with specific privileges
CREATE USER 'app_read'@'%' IDENTIFIED BY 'read_password';
GRANT SELECT ON myapp.* TO 'app_read'@'%';

CREATE USER 'app_write'@'%' IDENTIFIED BY 'write_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'app_write'@'%';

-- Create admin user
CREATE USER 'app_admin'@'%' IDENTIFIED BY 'admin_password';
GRANT ALL PRIVILEGES ON myapp.* TO 'app_admin'@'%';

-- Enable password validation
INSTALL SONAME 'simple_password_check';
SET GLOBAL simple_password_check_digits = 1;
SET GLOBAL simple_password_check_letters_same_case = 1;
SET GLOBAL simple_password_check_other_characters = 1;

FLUSH PRIVILEGES;
```

### SSL Configuration

```sql
-- Check SSL status
SHOW VARIABLES LIKE 'have_ssl';

-- Force SSL for user
ALTER USER 'app_admin'@'%' REQUIRE SSL;

-- Check SSL connections
SHOW STATUS LIKE 'Ssl_cipher';
```

---

## Common Use Cases

- **Web Applications**: Drop-in MySQL replacement with enhanced features
- **E-commerce Platforms**: High-performance transactional processing
- **Content Management**: JSON support for flexible content storage
- **Analytics Workloads**: ColumnStore engine for analytical queries
- **High Availability**: Galera cluster for multi-master replication

✅ MariaDB is now running in Docker and ready for your reliable database applications!
---
sidebar_position: 2
title: MySQL
description: MySQL is the world's most popular open-source relational database. Learn how to dockerize and run MySQL for your applications with Docker Compose.
slug: /RelationalDB/MySQL
keywords:
  - MySQL
  - relational database
  - SQL database
  - Docker MySQL
  - database containerization
  - mysql docker
  - database setup
  - mysql tutorial
  - open-source database
  - web development
---

# 🐬 Dockerizing MySQL for High-Performance Web Applications

**MySQL** is the world's most popular open-source relational database management system. Known for its **speed**, **reliability**, and **ease of use**, MySQL powers many of the world's largest web applications including Facebook, Twitter, and YouTube.

---

## Set Up MySQL with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: myapp
      MYSQL_USER: appuser
      MYSQL_PASSWORD: user_password
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init-scripts:/docker-entrypoint-initdb.d
      - ./my.cnf:/etc/mysql/conf.d/my.cnf
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$$MYSQL_ROOT_PASSWORD"]
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
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: root_password
    depends_on:
      - mysql

volumes:
  mysql-data:
```

`Start MySQL:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to MySQL

### Using MySQL CLI

`Connect directly to the container:`
```bash
docker exec -it mysql-db mysql -u root -p
```

`Or install MySQL client locally and connect:`
```bash
# Install MySQL client
sudo apt-get install mysql-client  # Ubuntu/Debian
brew install mysql-client          # macOS

# Connect to database
mysql -h localhost -P 3306 -u appuser -p myapp
```

### Basic SQL Operations

`Create a table and insert data:`
```sql
-- Use the database
USE myapp;

-- Create a users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com');

-- Query data
SELECT * FROM users;

-- Update data
UPDATE users SET name = 'John Updated' WHERE id = 1;

-- Delete data
DELETE FROM users WHERE id = 2;

-- Show table structure
DESCRIBE users;
```

---

## Python Integration

`Install the MySQL connector:`
```bash
pip install mysql-connector-python
# or alternatively
pip install PyMySQL
```

`Create a file mysql_test.py:`
```python
import mysql.connector
from mysql.connector import Error

# Database connection parameters
config = {
    'host': 'localhost',
    'port': 3306,
    'database': 'myapp',
    'user': 'appuser',
    'password': 'user_password'
}

try:
    # Connect to MySQL
    connection = mysql.connector.connect(**config)
    cursor = connection.cursor(dictionary=True)
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10,2),
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert data
    insert_query = """
        INSERT INTO products (name, price, category) 
        VALUES (%s, %s, %s)
    """
    cursor.execute(insert_query, ('Laptop', 999.99, 'Electronics'))
    product_id = cursor.lastrowid
    print(f"Inserted product with ID: {product_id}")
    
    # Insert multiple records
    products_data = [
        ('Mouse', 29.99, 'Electronics'),
        ('Keyboard', 79.99, 'Electronics'),
        ('Monitor', 299.99, 'Electronics')
    ]
    cursor.executemany(insert_query, products_data)
    
    # Query data
    cursor.execute("SELECT * FROM products WHERE category = %s", ('Electronics',))
    products = cursor.fetchall()
    
    for product in products:
        print(f"Product: {product['name']}, Price: ${product['price']}")
    
    # Commit changes
    connection.commit()
    
except Error as e:
    print(f"Database error: {e}")
    
finally:
    if connection and connection.is_connected():
        cursor.close()
        connection.close()
```

`Run the script:`
```bash
python mysql_test.py
```

---

## Advanced Configuration

### Custom MySQL Configuration

`Create a custom my.cnf file:`
```ini
[mysqld]
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

### Database Initialization Scripts

`Create init-scripts/01-init.sql:`
```sql
-- Create additional databases
CREATE DATABASE IF NOT EXISTS analytics;
CREATE DATABASE IF NOT EXISTS logs;

-- Create additional users
CREATE USER IF NOT EXISTS 'readonly'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON myapp.* TO 'readonly'@'%';

CREATE USER IF NOT EXISTS 'analytics'@'%' IDENTIFIED BY 'analytics_password';
GRANT ALL PRIVILEGES ON analytics.* TO 'analytics'@'%';

-- Create indexes for better performance
USE myapp;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);

FLUSH PRIVILEGES;
```

---

## Backup and Restore

### Create Backup

`Backup entire database:`
```bash
docker exec mysql-db mysqldump -u root -p myapp > backup.sql
```

`Backup all databases:`
```bash
docker exec mysql-db mysqldump -u root -p --all-databases > full_backup.sql
```

`Backup with compression:`
```bash
docker exec mysql-db mysqldump -u root -p myapp | gzip > backup.sql.gz
```

### Restore Database

`Restore from SQL file:`
```bash
docker exec -i mysql-db mysql -u root -p myapp < backup.sql
```

`Restore compressed backup:`
```bash
gunzip < backup.sql.gz | docker exec -i mysql-db mysql -u root -p myapp
```

---

## Monitoring and Maintenance

### Check Database Size

```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
GROUP BY table_schema;
```

### Monitor Active Connections

```sql
SHOW PROCESSLIST;

-- Or get connection count
SELECT COUNT(*) as connection_count FROM information_schema.processlist;
```

### Optimize Tables

```sql
-- Optimize specific table
OPTIMIZE TABLE users;

-- Optimize all tables in database
SELECT CONCAT('OPTIMIZE TABLE ', table_name, ';') 
FROM information_schema.tables 
WHERE table_schema = 'myapp';
```

### Check Table Status

```sql
SHOW TABLE STATUS FROM myapp;
```

---

## Replication Setup

### Master-Slave Configuration

`docker-compose.yml for master-slave setup:`
```yaml
version: '3.8'

services:
  mysql-master:
    image: mysql:8.0
    container_name: mysql-master
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: myapp
      MYSQL_USER: appuser
      MYSQL_PASSWORD: user_password
    volumes:
      - mysql-master-data:/var/lib/mysql
      - ./master.cnf:/etc/mysql/conf.d/mysql.cnf
    ports:
      - "3306:3306"

  mysql-slave:
    image: mysql:8.0
    container_name: mysql-slave
    environment:
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql-slave-data:/var/lib/mysql
      - ./slave.cnf:/etc/mysql/conf.d/mysql.cnf
    ports:
      - "3307:3306"
    depends_on:
      - mysql-master

volumes:
  mysql-master-data:
  mysql-slave-data:
```

`master.cnf:`
```ini
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
```

`slave.cnf:`
```ini
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
```

---

## Production Considerations

### Environment Variables for Security

`Create a .env file:`
```env
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=myapp
MYSQL_USER=appuser
MYSQL_PASSWORD=your_secure_user_password
```

`Update docker-compose.yml:`
```yaml
services:
  mysql:
    image: mysql:8.0
    env_file:
      - .env
    # ... rest of configuration
```

### SSL Configuration

`Enable SSL in docker-compose.yml:`
```yaml
services:
  mysql:
    image: mysql:8.0
    volumes:
      - ./certs:/var/lib/mysql-certs
    environment:
      MYSQL_SSL_CA: /var/lib/mysql-certs/ca.pem
      MYSQL_SSL_CERT: /var/lib/mysql-certs/server-cert.pem
      MYSQL_SSL_KEY: /var/lib/mysql-certs/server-key.pem
    command: --ssl-ca=/var/lib/mysql-certs/ca.pem --ssl-cert=/var/lib/mysql-certs/server-cert.pem --ssl-key=/var/lib/mysql-certs/server-key.pem
```

---

## Performance Tuning

### Key MySQL Variables

```sql
-- Check current settings
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'query_cache_size';

-- Monitor performance
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
SHOW STATUS LIKE 'Uptime';
```

### Slow Query Analysis

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

---

## Common Use Cases

- **Web Applications**: Content management systems, e-commerce platforms
- **Data Analytics**: Business intelligence, reporting dashboards
- **Gaming**: Player data, leaderboards, game statistics
- **Financial Applications**: Transaction processing, account management
- **Content Delivery**: Media metadata, user preferences

✅ MySQL is now running in Docker and ready for your high-performance applications!
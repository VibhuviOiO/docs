---
sidebar_position: 1
title: PostgreSQL
description: PostgreSQL is a powerful, open-source object-relational database system. Learn how to dockerize and run PostgreSQL for your applications with Docker Compose.
slug: /RelationalDB/PostgreSQL
keywords:
  - PostgreSQL
  - relational database
  - SQL database
  - Docker PostgreSQL
  - database containerization
  - postgres docker
  - database setup
  - postgresql tutorial
  - open-source database
  - ACID compliance
---

# 🐘 Dockerizing PostgreSQL for Robust Relational Database Applications

**PostgreSQL** is a powerful, open-source object-relational database system with over 35 years of active development. Known for its reliability, feature robustness, and performance, PostgreSQL is perfect for applications requiring **ACID compliance**, **complex queries**, and **data integrity**.

---

## Set Up PostgreSQL with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d myapp"]
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
      PGADMIN_DEFAULT_PASSWORD: admin_password
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres-data:
  pgadmin-data:
```

`Start PostgreSQL:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to PostgreSQL

### Using psql (PostgreSQL CLI)

`Connect directly to the container:`
```bash
docker exec -it postgres-db psql -U admin -d myapp
```

`Or install psql locally and connect:`
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install postgresql                 # macOS

# Connect to database
psql -h localhost -p 5432 -U admin -d myapp
```

### Basic SQL Operations

`Create a table and insert data:`
```sql
-- Create a users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
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
```

---

## Python Integration

`Install the PostgreSQL adapter:`
```bash
pip install psycopg2-binary
```

`Create a file postgres_test.py:`
```python
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'myapp',
    'user': 'admin',
    'password': 'secure_password'
}

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10,2),
            category VARCHAR(50)
        )
    """)
    
    # Insert data
    cursor.execute("""
        INSERT INTO products (name, price, category) 
        VALUES (%s, %s, %s) RETURNING id
    """, ('Laptop', 999.99, 'Electronics'))
    
    product_id = cursor.fetchone()['id']
    print(f"Inserted product with ID: {product_id}")
    
    # Query data
    cursor.execute("SELECT * FROM products WHERE category = %s", ('Electronics',))
    products = cursor.fetchall()
    
    for product in products:
        print(f"Product: {product['name']}, Price: ${product['price']}")
    
    # Commit changes
    conn.commit()
    
except psycopg2.Error as e:
    print(f"Database error: {e}")
    
finally:
    if conn:
        cursor.close()
        conn.close()
```

`Run the script:`
```bash
python postgres_test.py
```

---

## Advanced Configuration

### Custom PostgreSQL Configuration

`Create a custom postgresql.conf file:`
```ini
# postgresql.conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

`Update docker-compose.yml to use custom config:`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    # ... other configurations
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### Database Initialization Scripts

`Create init-scripts/01-init.sql:`
```sql
-- Create additional databases
CREATE DATABASE analytics;
CREATE DATABASE logs;

-- Create roles
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE myapp TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
```

---

## Backup and Restore

### Create Backup

`Backup entire database:`
```bash
docker exec postgres-db pg_dump -U admin myapp > backup.sql
```

`Backup with compression:`
```bash
docker exec postgres-db pg_dump -U admin -Fc myapp > backup.dump
```

### Restore Database

`Restore from SQL file:`
```bash
docker exec -i postgres-db psql -U admin myapp < backup.sql
```

`Restore from compressed dump:`
```bash
docker exec -i postgres-db pg_restore -U admin -d myapp backup.dump
```

---

## Monitoring and Maintenance

### Check Database Size

```sql
SELECT 
    datname as database_name,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database 
WHERE datistemplate = false;
```

### Monitor Active Connections

```sql
SELECT 
    datname,
    count(*) as connections
FROM pg_stat_activity 
GROUP BY datname;
```

### Vacuum and Analyze

```sql
-- Vacuum to reclaim storage
VACUUM VERBOSE;

-- Analyze to update statistics
ANALYZE VERBOSE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL VERBOSE;
```

---

## Production Considerations

### Environment Variables for Security

`Create a .env file:`
```env
POSTGRES_DB=myapp
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password_here
PGDATA=/var/lib/postgresql/data/pgdata
```

`Update docker-compose.yml:`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    # ... rest of configuration
```

### SSL Configuration

`Enable SSL in docker-compose.yml:`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_SSL_MODE: require
    volumes:
      - ./certs:/var/lib/postgresql/certs
    command: >
      postgres
      -c ssl=on
      -c ssl_cert_file=/var/lib/postgresql/certs/server.crt
      -c ssl_key_file=/var/lib/postgresql/certs/server.key
```

---

## Common Use Cases

- **Web Applications**: User management, content storage, session handling
- **Analytics**: Data warehousing, reporting, business intelligence
- **E-commerce**: Product catalogs, order management, inventory tracking
- **Financial Systems**: Transaction processing, accounting, audit trails
- **Content Management**: Document storage, metadata management, search

✅ PostgreSQL is now running in Docker and ready for your applications!
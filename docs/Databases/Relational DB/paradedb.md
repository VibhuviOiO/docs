---
sidebar_position: 4
title: ParadeDB
description: ParadeDB is a PostgreSQL-based analytics database that combines OLTP and OLAP workloads. Learn how to dockerize and run ParadeDB for analytical applications.
slug: /RelationalDB/ParadeDB
keywords:
  - ParadeDB
  - PostgreSQL analytics
  - OLAP database
  - analytical database
  - Docker ParadeDB
  - database containerization
  - paradedb docker
  - analytics workloads
  - columnar storage
  - data warehouse
---

# 🎪 Dockerizing ParadeDB for High-Performance Analytics on PostgreSQL

**ParadeDB** is a PostgreSQL-based analytics database that brings **columnar storage** and **analytical query performance** to PostgreSQL. Perfect for applications that need both **OLTP** and **OLAP** capabilities in a single database.

---

## Set Up ParadeDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  paradedb:
    image: paradedb/paradedb:latest
    container_name: paradedb
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: analytics
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - paradedb-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d analytics"]
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
      - paradedb

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
      - paradedb

volumes:
  paradedb-data:
  pgadmin-data:
  grafana-data:
```

`Start ParadeDB:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

### Connect to ParadeDB

`Connect directly to the container:`
```bash
docker exec -it paradedb psql -U postgres -d analytics
```

### Basic ParadeDB Operations

`Create tables and enable columnar storage:`
```sql
-- Enable ParadeDB extensions
-- Create OLTP table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(50),
    signup_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OLAP table (no columnar for now)
CREATE TABLE sales_analytics (
    sale_id BIGINT,
    customer_id INTEGER,
    product_id INTEGER,
    product_name VARCHAR(200),
    category VARCHAR(100),
    sale_date DATE,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    country VARCHAR(50),
    sales_rep VARCHAR(100)
);

-- Insert data into customers
INSERT INTO customers (name, email, country, signup_date) VALUES
('John Doe', 'john@example.com', 'USA', '2024-01-15'),
('Jane Smith', 'jane@example.com', 'Canada', '2024-01-20'),
('Bob Wilson', 'bob@example.com', 'UK', '2024-01-25'),
('Alice Brown', 'alice@example.com', 'Germany', '2024-02-01'),
('Charlie Davis', 'charlie@example.com', 'France', '2024-02-05');

-- Insert data into sales_analytics
INSERT INTO sales_analytics (sale_id, customer_id, product_id, product_name, category, sale_date, quantity, unit_price, total_amount, country, sales_rep) VALUES
(1, 1, 101, 'Laptop Pro', 'Electronics', '2024-01-16', 1, 1299.99, 1299.99, 'USA', 'Rep A'),
(2, 1, 102, 'Wireless Mouse', 'Electronics', '2024-01-16', 2, 29.99, 59.98, 'USA', 'Rep A'),
(3, 2, 103, 'Office Chair', 'Furniture', '2024-01-21', 1, 299.99, 299.99, 'Canada', 'Rep B'),
(4, 3, 101, 'Laptop Pro', 'Electronics', '2024-01-26', 1, 1299.99, 1299.99, 'UK', 'Rep C'),
(5, 4, 104, 'Standing Desk', 'Furniture', '2024-02-02', 1, 599.99, 599.99, 'Germany', 'Rep D'),
(6, 5, 105, 'Monitor 4K', 'Electronics', '2024-02-06', 2, 399.99, 799.98, 'France', 'Rep E'),
(7, 2, 106, 'Keyboard Mechanical', 'Electronics', '2024-02-10', 1, 149.99, 149.99, 'Canada', 'Rep B'),
(8, 3, 107, 'Mouse Pad', 'Electronics', '2024-02-12', 1, 89.99, 89.99, 'UK', 'Rep C');

```
`query :`
```bash
SELECT 
    category,
    COUNT(*) as total_sales,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_sale_amount
FROM sales_analytics
GROUP BY category
ORDER BY revenue DESC;
```
---
`output`

| Category     | Total Sales | Revenue  | Avg Sale Amount       |
|-------------|------------|---------|---------------------|
| Electronics | 6          | 3699.92 | 616.65              |
| Furniture   | 2          | 899.98  | 449.99              |

---

## Common Use Cases

- **Business Intelligence**: Sales analytics, customer insights, performance dashboards
- **Data Warehousing**: Historical data analysis, trend analysis, reporting
- **Real-time Analytics**: Operational analytics, monitoring dashboards
- **Financial Analysis**: Revenue analysis, profitability analysis, forecasting
- **Customer Analytics**: Behavior analysis, segmentation, lifetime value

✅ ParadeDB is now running in Docker and ready for your high-performance analytical workloads!## R
eferences

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
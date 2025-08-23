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

## Connect to ParadeDB

### Using psql

`Connect directly to the container:`
```bash
docker exec -it paradedb psql -U postgres -d analytics
```

### Basic ParadeDB Operations

`Create tables and enable columnar storage:`
```sql
-- Enable ParadeDB extensions
CREATE EXTENSION IF NOT EXISTS pg_analytics;

-- Create a regular table for OLTP operations
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(50),
    signup_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a columnar table for analytics (OLAP)
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
) USING columnar;

-- Insert sample data into customers
INSERT INTO customers (name, email, country, signup_date) VALUES
    ('John Doe', 'john@example.com', 'USA', '2024-01-15'),
    ('Jane Smith', 'jane@example.com', 'Canada', '2024-01-20'),
    ('Bob Wilson', 'bob@example.com', 'UK', '2024-01-25'),
    ('Alice Brown', 'alice@example.com', 'Germany', '2024-02-01'),
    ('Charlie Davis', 'charlie@example.com', 'France', '2024-02-05');

-- Insert sample analytical data
INSERT INTO sales_analytics (sale_id, customer_id, product_id, product_name, category, sale_date, quantity, unit_price, total_amount, country, sales_rep) VALUES
    (1, 1, 101, 'Laptop Pro', 'Electronics', '2024-01-16', 1, 1299.99, 1299.99, 'USA', 'Rep A'),
    (2, 1, 102, 'Wireless Mouse', 'Electronics', '2024-01-16', 2, 29.99, 59.98, 'USA', 'Rep A'),
    (3, 2, 103, 'Office Chair', 'Furniture', '2024-01-21', 1, 299.99, 299.99, 'Canada', 'Rep B'),
    (4, 3, 101, 'Laptop Pro', 'Electronics', '2024-01-26', 1, 1299.99, 1299.99, 'UK', 'Rep C'),
    (5, 4, 104, 'Standing Desk', 'Furniture', '2024-02-02', 1, 599.99, 599.99, 'Germany', 'Rep D'),
    (6, 5, 105, 'Monitor 4K', 'Electronics', '2024-02-06', 2, 399.99, 799.98, 'France', 'Rep E'),
    (7, 2, 106, 'Keyboard Mechanical', 'Electronics', '2024-02-10', 1, 149.99, 149.99, 'Canada', 'Rep B'),
    (8, 3, 107, 'Webcam HD', 'Electronics', '2024-02-12', 1, 89.99, 89.99, 'UK', 'Rep C');

-- Analytical queries with columnar performance
SELECT 
    category,
    COUNT(*) as total_sales,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_sale_amount
FROM sales_analytics
GROUP BY category
ORDER BY revenue DESC;

-- Time-based analytics
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    country,
    SUM(total_amount) as monthly_revenue,
    COUNT(*) as sales_count
FROM sales_analytics
GROUP BY month, country
ORDER BY month, monthly_revenue DESC;
```

---

## Python Integration

`Install the PostgreSQL adapter:`
```bash
pip install psycopg2-binary pandas numpy
```

`Create a file paradedb_test.py:`
```python
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Database connection parameters
conn_params = {
    'host': 'localhost',
    'port': 5432,
    'database': 'analytics',
    'user': 'postgres',
    'password': 'password123'
}

try:
    # Connect to ParadeDB
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("Connected to ParadeDB")
    
    # Enable ParadeDB extensions
    cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_analytics")
    
    # Create a large analytical table with columnar storage
    cursor.execute("""
        DROP TABLE IF EXISTS ecommerce_analytics CASCADE
    """)
    
    cursor.execute("""
        CREATE TABLE ecommerce_analytics (
            transaction_id BIGINT,
            customer_id INTEGER,
            product_id INTEGER,
            product_name VARCHAR(200),
            category VARCHAR(100),
            subcategory VARCHAR(100),
            brand VARCHAR(100),
            transaction_date DATE,
            transaction_time TIMESTAMP,
            quantity INTEGER,
            unit_price DECIMAL(10,2),
            discount_percent DECIMAL(5,2),
            total_amount DECIMAL(12,2),
            payment_method VARCHAR(50),
            customer_country VARCHAR(50),
            customer_city VARCHAR(100),
            sales_channel VARCHAR(50),
            sales_rep VARCHAR(100)
        ) USING columnar
    """)
    
    print("Created columnar analytics table")
    
    # Generate large dataset for analytics
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys']
    brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE']
    countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia']
    cities = ['New York', 'Toronto', 'London', 'Berlin', 'Paris', 'Tokyo', 'Sydney']
    channels = ['Online', 'Store', 'Mobile App', 'Phone']
    payment_methods = ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash']
    
    # Generate 50,000 sample transactions
    print("Generating sample data...")
    batch_size = 1000
    total_records = 50000
    
    for batch_start in range(0, total_records, batch_size):
        batch_data = []
        
        for i in range(batch_start, min(batch_start + batch_size, total_records)):
            # Generate realistic transaction data
            transaction_date = datetime.now() - timedelta(days=random.randint(1, 365))
            category = random.choice(categories)
            
            record = (
                i + 1,  # transaction_id
                random.randint(1, 10000),  # customer_id
                random.randint(1, 1000),  # product_id
                f"Product {random.randint(1, 1000)}",  # product_name
                category,  # category
                f"{category} Sub {random.randint(1, 5)}",  # subcategory
                random.choice(brands),  # brand
                transaction_date.date(),  # transaction_date
                transaction_date,  # transaction_time
                random.randint(1, 5),  # quantity
                round(random.uniform(10, 500), 2),  # unit_price
                round(random.uniform(0, 20), 2),  # discount_percent
                0,  # total_amount (will calculate)
                random.choice(payment_methods),  # payment_method
                random.choice(countries),  # customer_country
                random.choice(cities),  # customer_city
                random.choice(channels),  # sales_channel
                f"Rep {random.randint(1, 20)}"  # sales_rep
            )
            
            # Calculate total amount
            unit_price = record[9]
            quantity = record[8]
            discount = record[10]
            total_amount = round(unit_price * quantity * (1 - discount / 100), 2)
            
            record = record[:11] + (total_amount,) + record[12:]
            batch_data.append(record)
        
        # Insert batch
        cursor.executemany("""
            INSERT INTO ecommerce_analytics 
            (transaction_id, customer_id, product_id, product_name, category, subcategory, 
             brand, transaction_date, transaction_time, quantity, unit_price, discount_percent, 
             total_amount, payment_method, customer_country, customer_city, sales_channel, sales_rep)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, batch_data)
        
        conn.commit()
        print(f"Inserted batch {batch_start // batch_size + 1}/{(total_records + batch_size - 1) // batch_size}")
    
    print(f"Generated {total_records} sample transactions")
    
    # Analytical queries
    print("\n=== Analytical Queries ===")
    
    # 1. Revenue by category
    cursor.execute("""
        SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_transaction_value,
            SUM(quantity) as total_units_sold
        FROM ecommerce_analytics
        GROUP BY category
        ORDER BY total_revenue DESC
    """)
    
    print("\n1. Revenue by Category:")
    for row in cursor.fetchall():
        print(f"   {row['category']}: ${row['total_revenue']:,.2f} ({row['transaction_count']:,} transactions)")
    
    # 2. Monthly revenue trend
    cursor.execute("""
        SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            SUM(total_amount) as monthly_revenue,
            COUNT(*) as transaction_count,
            COUNT(DISTINCT customer_id) as unique_customers
        FROM ecommerce_analytics
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
    """)
    
    print("\n2. Monthly Revenue Trend (Last 6 months):")
    for row in cursor.fetchall():
        month = row['month'].strftime('%Y-%m')
        print(f"   {month}: ${row['monthly_revenue']:,.2f} ({row['unique_customers']:,} customers)")
    
    # 3. Top performing sales reps
    cursor.execute("""
        SELECT 
            sales_rep,
            COUNT(*) as sales_count,
            SUM(total_amount) as total_sales,
            AVG(total_amount) as avg_sale_value,
            COUNT(DISTINCT customer_id) as unique_customers
        FROM ecommerce_analytics
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '3 months'
        GROUP BY sales_rep
        ORDER BY total_sales DESC
        LIMIT 10
    """)
    
    print("\n3. Top Sales Reps (Last 3 months):")
    for row in cursor.fetchall():
        print(f"   {row['sales_rep']}: ${row['total_sales']:,.2f} ({row['sales_count']} sales)")
    
    # 4. Country performance analysis
    cursor.execute("""
        SELECT 
            customer_country,
            COUNT(*) as transactions,
            SUM(total_amount) as revenue,
            AVG(total_amount) as avg_order_value,
            SUM(total_amount) / COUNT(DISTINCT customer_id) as revenue_per_customer
        FROM ecommerce_analytics
        GROUP BY customer_country
        ORDER BY revenue DESC
        LIMIT 10
    """)
    
    print("\n4. Country Performance:")
    for row in cursor.fetchall():
        print(f"   {row['customer_country']}: ${row['revenue']:,.2f} (AOV: ${row['avg_order_value']:.2f})")
    
    # 5. Product performance with pandas
    df = pd.read_sql("""
        SELECT 
            category,
            brand,
            COUNT(*) as sales_count,
            SUM(total_amount) as revenue,
            AVG(total_amount) as avg_price,
            SUM(quantity) as units_sold
        FROM ecommerce_analytics
        GROUP BY category, brand
        ORDER BY revenue DESC
    """, conn)
    
    print(f"\n5. Product Analysis with Pandas:")
    print(f"   Total category-brand combinations: {len(df)}")
    print(f"   Top revenue category-brand: {df.iloc[0]['category']} - {df.iloc[0]['brand']}")
    print(f"   Average revenue per combination: ${df['revenue'].mean():,.2f}")
    
    # 6. Time-based analysis
    cursor.execute("""
        SELECT 
            EXTRACT(hour FROM transaction_time) as hour_of_day,
            COUNT(*) as transaction_count,
            SUM(total_amount) as hourly_revenue,
            AVG(total_amount) as avg_transaction_value
        FROM ecommerce_analytics
        GROUP BY hour_of_day
        ORDER BY hour_of_day
    """)
    
    print("\n6. Sales by Hour of Day:")
    hourly_data = cursor.fetchall()
    peak_hour = max(hourly_data, key=lambda x: x['hourly_revenue'])
    print(f"   Peak sales hour: {peak_hour['hour_of_day']}:00 (${peak_hour['hourly_revenue']:,.2f})")
    
    # Performance comparison: Show query execution time
    import time
    
    print("\n=== Performance Test ===")
    
    # Complex analytical query
    start_time = time.time()
    cursor.execute("""
        SELECT 
            category,
            customer_country,
            sales_channel,
            DATE_TRUNC('quarter', transaction_date) as quarter,
            COUNT(*) as transactions,
            SUM(total_amount) as revenue,
            AVG(total_amount) as avg_order_value,
            SUM(quantity) as total_quantity
        FROM ecommerce_analytics
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY category, customer_country, sales_channel, quarter
        HAVING SUM(total_amount) > 1000
        ORDER BY revenue DESC
        LIMIT 50
    """)
    
    results = cursor.fetchall()
    end_time = time.time()
    
    print(f"Complex analytical query executed in {end_time - start_time:.3f} seconds")
    print(f"Returned {len(results)} result rows")

except Exception as e:
    print(f"Error: {e}")

finally:
    if conn:
        cursor.close()
        conn.close()
```

`Run the script:`
```bash
python paradedb_test.py
```

---

## Advanced Analytics Features

### Columnar Storage Benefits

```sql
-- Compare storage and performance
-- Regular table (row-based)
CREATE TABLE sales_regular AS 
SELECT * FROM sales_analytics;

-- Columnar table
CREATE TABLE sales_columnar (LIKE sales_analytics) USING columnar;
INSERT INTO sales_columnar SELECT * FROM sales_analytics;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'sales_%';
```

### Window Functions and Analytics

```sql
-- Advanced analytical queries
SELECT 
    customer_id,
    sale_date,
    total_amount,
    -- Running total
    SUM(total_amount) OVER (
        PARTITION BY customer_id 
        ORDER BY sale_date 
        ROWS UNBOUNDED PRECEDING
    ) as running_total,
    -- Rank by amount
    RANK() OVER (
        PARTITION BY customer_id 
        ORDER BY total_amount DESC
    ) as amount_rank,
    -- Previous purchase amount
    LAG(total_amount) OVER (
        PARTITION BY customer_id 
        ORDER BY sale_date
    ) as previous_amount
FROM sales_analytics
ORDER BY customer_id, sale_date;
```

### Materialized Views for Performance

```sql
-- Create materialized view for frequently accessed aggregations
CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    category,
    country,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction_value,
    SUM(quantity) as total_quantity
FROM sales_analytics
GROUP BY month, category, country;

-- Create index on materialized view
CREATE INDEX idx_monthly_sales_month ON monthly_sales_summary(month);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW monthly_sales_summary;
```

---

## Data Loading and ETL

### Bulk Data Loading

```sql
-- Load data from CSV
COPY ecommerce_analytics FROM '/path/to/data.csv' 
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Load data with transformations
INSERT INTO ecommerce_analytics 
SELECT 
    row_number() OVER () as transaction_id,
    customer_id,
    product_id,
    product_name,
    category,
    subcategory,
    brand,
    transaction_date::date,
    transaction_date::timestamp,
    quantity,
    unit_price,
    discount_percent,
    (unit_price * quantity * (1 - discount_percent/100))::decimal(12,2) as total_amount,
    payment_method,
    customer_country,
    customer_city,
    sales_channel,
    sales_rep
FROM staging_table;
```

### Data Partitioning

```sql
-- Create partitioned table for time-series data
CREATE TABLE sales_partitioned (
    LIKE ecommerce_analytics
) PARTITION BY RANGE (transaction_date);

-- Create monthly partitions
CREATE TABLE sales_2024_01 PARTITION OF sales_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE sales_2024_02 PARTITION OF sales_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

## Monitoring and Performance

### Query Performance Analysis

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Storage Analysis

```sql
-- Analyze columnar storage compression
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables 
WHERE tablename LIKE '%analytics%';
```

---

## Common Use Cases

- **Business Intelligence**: Sales analytics, customer insights, performance dashboards
- **Data Warehousing**: Historical data analysis, trend analysis, reporting
- **Real-time Analytics**: Operational analytics, monitoring dashboards
- **Financial Analysis**: Revenue analysis, profitability analysis, forecasting
- **Customer Analytics**: Behavior analysis, segmentation, lifetime value

✅ ParadeDB is now running in Docker and ready for your high-performance analytical workloads!
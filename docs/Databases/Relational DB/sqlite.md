---
sidebar_position: 6
title: SQLite
description: SQLite is a lightweight, serverless, self-contained SQL database engine. Learn how to use SQLite in containerized applications and development workflows.
slug: /RelationalDB/SQLite
keywords:
  - SQLite
  - lightweight database
  - embedded database
  - serverless database
  - SQL database
  - Docker SQLite
  - database containerization
  - sqlite tutorial
  - file-based database
  - development database
---

# 🪶 Using SQLite for Lightweight Database Applications

**SQLite** is a lightweight, serverless, self-contained SQL database engine. It's the most widely deployed database in the world, embedded in countless applications, mobile devices, and IoT systems. SQLite is perfect for **development**, **testing**, **small applications**, and **embedded systems**.

---

## SQLite in Docker Applications

While SQLite doesn't require a server, it's often used within containerized applications. Here are several approaches:

### Approach 1: SQLite with Python Application

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  sqlite-app:
    build: .
    container_name: sqlite-app
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - sqlite-data:/app/data
      - ./app:/app
    environment:
      DATABASE_PATH: /app/data/app.db
    working_dir: /app

  # SQLite Browser for GUI management
  sqlite-browser:
    image: lscr.io/linuxserver/sqlitebrowser:latest
    container_name: sqlite-browser
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - sqlite-data:/data
    environment:
      PUID: 1000
      PGID: 1000

volumes:
  sqlite-data:
```

`Create a Dockerfile:`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install SQLite and tools
RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["python", "app.py"]
```

`Create requirements.txt:`
```txt
flask==2.3.3
sqlite3
pandas==2.1.1
```

---

## Basic SQLite Operations

### Using SQLite CLI

`Connect to SQLite database:`
```bash
# In container
docker exec -it sqlite-app sqlite3 /app/data/app.db

# Or locally
sqlite3 myapp.db
```

`Basic SQL operations:`
```sql
-- Create a users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Show table schema
.schema users

-- Show all tables
.tables

-- Export to CSV
.headers on
.mode csv
.output users.csv
SELECT * FROM users;
.output stdout

-- Import from CSV
.mode csv
.import data.csv users

-- Show database info
.dbinfo

-- Exit
.quit
```

---

## Python Integration

`Create a file app.py:`
```python
import sqlite3
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)

# Database configuration
DATABASE_PATH = os.getenv('DATABASE_PATH', 'app.db')

def get_db_connection():
    """Get database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_database():
    """Initialize database with tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            profile TEXT,  -- JSON as TEXT
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL,
            category TEXT,
            attributes TEXT,  -- JSON as TEXT
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            total_amount REAL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date)')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def seed_sample_data():
    """Insert sample data for testing"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    
    # Insert sample users
    users_data = [
        ('John Doe', 'john@example.com', json.dumps({"age": 30, "city": "New York"})),
        ('Jane Smith', 'jane@example.com', json.dumps({"age": 25, "city": "Toronto"})),
        ('Bob Wilson', 'bob@example.com', json.dumps({"age": 35, "city": "London"})),
        ('Alice Brown', 'alice@example.com', json.dumps({"age": 28, "city": "Berlin"}))
    ]
    
    cursor.executemany('''
        INSERT INTO users (name, email, profile) VALUES (?, ?, ?)
    ''', users_data)
    
    # Insert sample products
    products_data = [
        ('Laptop Pro', 'High-performance laptop', 1299.99, 'Electronics', 
         json.dumps({"brand": "TechCorp", "ram": "16GB", "storage": "512GB"})),
        ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics',
         json.dumps({"brand": "MouseCorp", "dpi": 1600})),
        ('Office Chair', 'Comfortable office chair', 299.99, 'Furniture',
         json.dumps({"material": "mesh", "adjustable": True})),
        ('Running Shoes', 'Professional running shoes', 129.99, 'Sports',
         json.dumps({"brand": "RunFast", "size": "10"}))
    ]
    
    cursor.executemany('''
        INSERT INTO products (name, description, price, category, attributes) 
        VALUES (?, ?, ?, ?, ?)
    ''', products_data)
    
    # Insert sample orders
    orders_data = [
        (1, 1, 1, 1299.99),  # John buys Laptop
        (1, 2, 1, 29.99),    # John buys Mouse
        (2, 3, 1, 299.99),   # Jane buys Chair
        (3, 1, 1, 1299.99),  # Bob buys Laptop
        (4, 4, 2, 259.98)    # Alice buys 2 Running Shoes
    ]
    
    cursor.executemany('''
        INSERT INTO orders (user_id, product_id, quantity, total_amount) 
        VALUES (?, ?, ?, ?)
    ''', orders_data)
    
    conn.commit()
    conn.close()
    print("Sample data inserted successfully")

# API Routes
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (name, email, profile) VALUES (?, ?, ?)
        ''', (data['name'], data['email'], json.dumps(data.get('profile', {}))))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"id": user_id, "message": "User created successfully"}), 201
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if category:
        cursor.execute('SELECT * FROM products WHERE category = ? ORDER BY name', (category,))
    else:
        cursor.execute('SELECT * FROM products ORDER BY name')
    
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(products)

@app.route('/api/analytics/sales', methods=['GET'])
def get_sales_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Sales by category
    cursor.execute('''
        SELECT 
            p.category,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_revenue,
            AVG(o.total_amount) as avg_order_value
        FROM orders o
        JOIN products p ON o.product_id = p.id
        GROUP BY p.category
        ORDER BY total_revenue DESC
    ''')
    
    sales_by_category = [dict(row) for row in cursor.fetchall()]
    
    # Top customers
    cursor.execute('''
        SELECT 
            u.name,
            u.email,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_spent
        FROM users u
        JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.name, u.email
        ORDER BY total_spent DESC
        LIMIT 10
    ''')
    
    top_customers = [dict(row) for row in cursor.fetchall()]
    
    # Monthly sales trend
    cursor.execute('''
        SELECT 
            strftime('%Y-%m', order_date) as month,
            COUNT(*) as order_count,
            SUM(total_amount) as revenue
        FROM orders
        GROUP BY strftime('%Y-%m', order_date)
        ORDER BY month DESC
        LIMIT 12
    ''')
    
    monthly_trend = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        "sales_by_category": sales_by_category,
        "top_customers": top_customers,
        "monthly_trend": monthly_trend
    })

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Search in products (name and description)
    cursor.execute('''
        SELECT 'product' as type, id, name, description, price, category
        FROM products 
        WHERE name LIKE ? OR description LIKE ?
        UNION ALL
        SELECT 'user' as type, id, name, email, NULL, NULL
        FROM users 
        WHERE name LIKE ? OR email LIKE ?
        LIMIT 20
    ''', (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(results)

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    table = request.args.get('table', 'users')
    
    conn = get_db_connection()
    
    if table == 'users':
        df = pd.read_sql_query('SELECT * FROM users', conn)
    elif table == 'products':
        df = pd.read_sql_query('SELECT * FROM products', conn)
    elif table == 'orders':
        df = pd.read_sql_query('''
            SELECT 
                o.*,
                u.name as user_name,
                p.name as product_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
        ''', conn)
    else:
        conn.close()
        return jsonify({"error": "Invalid table"}), 400
    
    conn.close()
    
    # Save to CSV
    csv_path = f'/app/data/{table}_export.csv'
    df.to_csv(csv_path, index=False)
    
    return jsonify({
        "message": f"Data exported to {csv_path}",
        "records": len(df),
        "columns": list(df.columns)
    })

@app.route('/api/database/info', methods=['GET'])
def database_info():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get table information
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    table_info = {}
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [{"name": col[1], "type": col[2], "nullable": not col[3]} for col in cursor.fetchall()]
        
        table_info[table] = {
            "row_count": count,
            "columns": columns
        }
    
    # Get database size
    cursor.execute("PRAGMA page_count")
    page_count = cursor.fetchone()[0]
    cursor.execute("PRAGMA page_size")
    page_size = cursor.fetchone()[0]
    db_size = page_count * page_size
    
    conn.close()
    
    return jsonify({
        "database_path": DATABASE_PATH,
        "database_size_bytes": db_size,
        "database_size_mb": round(db_size / (1024 * 1024), 2),
        "tables": table_info
    })

@app.route('/')
def index():
    return '''
    <h1>SQLite API Server</h1>
    <h2>Available Endpoints:</h2>
    <ul>
        <li><a href="/api/users">GET /api/users</a> - Get all users</li>
        <li><a href="/api/products">GET /api/products</a> - Get all products</li>
        <li><a href="/api/products?category=Electronics">GET /api/products?category=Electronics</a> - Get products by category</li>
        <li><a href="/api/analytics/sales">GET /api/analytics/sales</a> - Sales analytics</li>
        <li><a href="/api/search?q=laptop">GET /api/search?q=laptop</a> - Search</li>
        <li><a href="/api/database/info">GET /api/database/info</a> - Database info</li>
        <li><a href="/api/export/csv?table=users">GET /api/export/csv?table=users</a> - Export to CSV</li>
    </ul>
    <p>POST /api/users - Create new user</p>
    '''

if __name__ == '__main__':
    print("Initializing SQLite database...")
    init_database()
    seed_sample_data()
    
    print(f"Starting Flask app with database: {DATABASE_PATH}")
    app.run(host='0.0.0.0', port=8000, debug=True)
```

---

## Advanced SQLite Features

### JSON Support (SQLite 3.38+)

```sql
-- Create table with JSON column
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content JSON,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert JSON data
INSERT INTO documents (title, content, metadata) VALUES 
    ('User Guide', '{"sections": ["intro", "setup", "usage"]}', '{"author": "John", "version": "1.0"}'),
    ('API Docs', '{"endpoints": ["/users", "/products"]}', '{"author": "Jane", "version": "2.1"}');

-- Query JSON data
SELECT 
    title,
    json_extract(content, '$.sections') as sections,
    json_extract(metadata, '$.author') as author
FROM documents;

-- JSON array operations
SELECT title FROM documents 
WHERE json_extract(content, '$.sections[0]') = 'intro';
```

### Full-Text Search

```sql
-- Create FTS table
CREATE VIRTUAL TABLE documents_fts USING fts5(title, content);

-- Insert data
INSERT INTO documents_fts (title, content) VALUES 
    ('SQLite Tutorial', 'Learn how to use SQLite database effectively'),
    ('Python Guide', 'Complete guide to Python programming language'),
    ('Docker Basics', 'Introduction to containerization with Docker');

-- Full-text search
SELECT * FROM documents_fts WHERE documents_fts MATCH 'sqlite database';
SELECT * FROM documents_fts WHERE documents_fts MATCH 'python OR docker';
```

### Window Functions

```sql
-- Sales ranking example
SELECT 
    product_name,
    category,
    total_sales,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_sales DESC) as rank_in_category,
    RANK() OVER (ORDER BY total_sales DESC) as overall_rank,
    SUM(total_sales) OVER (PARTITION BY category) as category_total
FROM (
    SELECT 
        p.name as product_name,
        p.category,
        SUM(o.total_amount) as total_sales
    FROM products p
    JOIN orders o ON p.id = o.product_id
    GROUP BY p.id, p.name, p.category
) sales_summary;
```

---

## Backup and Restore

### Using SQLite Commands

```bash
# Backup database
sqlite3 myapp.db ".backup backup.db"

# Or using dump
sqlite3 myapp.db ".dump" > backup.sql

# Restore from backup
sqlite3 restored.db < backup.sql

# Copy database file (simple backup)
cp myapp.db myapp_backup_$(date +%Y%m%d).db
```

### Automated Backup Script

`Create backup.sh:`
```bash
#!/bin/bash

DB_PATH="/app/data/app.db"
BACKUP_DIR="/app/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup $BACKUP_DIR/app_backup_$DATE.db"

# Create SQL dump
sqlite3 $DB_PATH ".dump" > $BACKUP_DIR/app_backup_$DATE.sql

# Compress SQL dump
gzip $BACKUP_DIR/app_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_backup_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/app_backup_$DATE.db"
```

---

## Performance Optimization

### Indexing Strategies

```sql
-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category_price ON products(category, price);
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);

-- Composite index for complex queries
CREATE INDEX idx_orders_complex ON orders(user_id, order_date, total_amount);

-- Partial index (SQLite 3.8.0+)
CREATE INDEX idx_expensive_products ON products(price) WHERE price > 100;

-- Check index usage
EXPLAIN QUERY PLAN SELECT * FROM products WHERE category = 'Electronics' AND price > 50;
```

### Database Optimization

```sql
-- Analyze database for query optimization
ANALYZE;

-- Vacuum to reclaim space and defragment
VACUUM;

-- Check database integrity
PRAGMA integrity_check;

-- Optimize database settings
PRAGMA journal_mode = WAL;  -- Write-Ahead Logging
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
```

---

## Development and Testing

### In-Memory Database

```python
import sqlite3

# Create in-memory database for testing
conn = sqlite3.connect(':memory:')

# Or temporary file database
conn = sqlite3.connect('')  # Empty string creates temp file

# Use for unit tests
def test_database_operations():
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create test table
    cursor.execute('''
        CREATE TABLE test_users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    ''')
    
    # Test operations
    cursor.execute("INSERT INTO test_users (name) VALUES (?)", ("Test User",))
    cursor.execute("SELECT * FROM test_users")
    result = cursor.fetchone()
    
    assert result[1] == "Test User"
    conn.close()
```

### Database Migrations

```python
def get_db_version(conn):
    cursor = conn.cursor()
    cursor.execute("PRAGMA user_version")
    return cursor.fetchone()[0]

def set_db_version(conn, version):
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA user_version = {version}")

def migrate_database(conn):
    version = get_db_version(conn)
    
    if version < 1:
        # Migration 1: Add email column to users
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        set_db_version(conn, 1)
        print("Applied migration 1: Added email column")
    
    if version < 2:
        # Migration 2: Create products table
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL
            )
        ''')
        set_db_version(conn, 2)
        print("Applied migration 2: Created products table")
```

---

## Common Use Cases

- **Development and Testing**: Rapid prototyping, unit tests, local development
- **Mobile Applications**: Embedded database for iOS and Android apps
- **Desktop Applications**: Local data storage for desktop software
- **IoT and Embedded Systems**: Lightweight data storage for resource-constrained devices
- **Configuration Storage**: Application settings and configuration data
- **Caching Layer**: Local caching for web applications
- **Data Analysis**: Small to medium datasets for analysis and reporting

✅ SQLite is now set up and ready for your lightweight database needs!
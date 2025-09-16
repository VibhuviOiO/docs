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

**PostgreSQL** is a powerful, open-source object-relational database system. Known for its reliability, feature robustness, and performance, PostgreSQL is perfect for applications requiring **ACID compliance**, **complex queries**, and **data integrity**.

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

### Connect to PostgreSQL

`Connect directly to the container:`
```bash
docker exec -it postgres-db psql -U admin -d myapp
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
### Common Use

- **Web Applications**: User management, content storage, session handling
- **Analytics**: Data warehousing, reporting, business intelligence
- **E-commerce**: Product catalogs, order management, inventory tracking
- **Financial Systems**: Transaction processing, accounting, audit trails
- **Content Management**: Document storage, metadata management, search

✅ PostgreSQL is now running in Docker and ready for your applications!#
# References

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
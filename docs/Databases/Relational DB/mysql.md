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

### Connect to MySQL

`Connect directly to the container:`
```bash
docker exec -it mysql-db mysql -u root -p
```
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

#s# Common Use Cases

- **Web Applications**: Content management systems, e-commerce platforms
- **Data Analytics**: Business intelligence, reporting dashboards
- **Gaming**: Player data, leaderboards, game statistics
- **Financial Applications**: Transaction processing, account management
- **Content Delivery**: Media metadata, user preferences

✅ MySQL is now running in Docker and ready for your high-performance applications!## Refere
nces

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
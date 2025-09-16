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

### SQLite with Python Application

`Create a file named docker-compose.yml`
```yaml
version: "3.9"
services:
  sqlite:
    image: nouchka/sqlite3   # lightweight image with sqlite3 installed
    container_name: sqlite-app
    volumes:
      - ./data:/data        # local ./data folder maps to /data in container
    tty: true                # keep container running

```
---
` Run the container :`
```bash
docker compose up -d
```
`Enter the container`
```bash
docker exec -it sqlite-app sh
```

`Then open your SQLite database:`
```bash
sqlite3 /data/app.db
```

### Basic SQLite Operations
```bash
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
);
```
`Insert new data:`
```bash
INSERT INTO customers (name, email) VALUES ('John Doe', 'john@example.com');
```

`Update :`
```bash
UPDATE customers SET email='john.doe@example.com' WHERE id=1;
```
`Query :`
```bash
SELECT * FROM customers;
```



## Common Use Cases

- **Development and Testing**: Rapid prototyping, unit tests, local development
- **Mobile Applications**: Embedded database for iOS and Android apps
- **Desktop Applications**: Local data storage for desktop software
- **IoT and Embedded Systems**: Lightweight data storage for resource-constrained devices
- **Configuration Storage**: Application settings and configuration data
- **Caching Layer**: Local caching for web applications
- **Data Analysis**: Small to medium datasets for analysis and reporting

✅ SQLite is now set up and ready for your lightweight database needs!## 
References

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
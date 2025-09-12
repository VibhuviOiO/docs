---
sidebar_position: 4
title: Postgresql
description: ChromaDB is an open-source vector database optimized for embedding-based search and retrieval tasks. Learn how to use ChromaDB for semantic search, similarity comparison, and AI-powered applications.
slug: /VectorDB/Postgresql
keywords:
  - Postgresql
  - vector database
  - semantic search
  - AI database
  - embedding store
  - similarity search
  - machine learning
  - retrieval augmented generation
  - chromadb tutorial
  - open-source vector db
---

# 🐳 Run PostgreSQL as a Vector Database in a Docker Container with `pgvector`

PostgreSQL is a robust relational database—but with the `pgvector` extension, it becomes a **powerful vector database** for AI-driven applications.

---

## ⚙️ Step 1: Setup Project Folder

```bash
mkdir pgvector-docker
cd pgvector-docker
````

---

## 📄Create `docker-compose.yml`

```yaml
services:
  postgres:
    image: ankane/pgvector
    container_name: pgvector-db
    environment:
      POSTGRES_DB: vectordb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

> ✅ `ankane/pgvector` is a Docker image with `pgvector` pre-installed.

---

### ▶️ Start the Container

```bash
docker compose up -d
```

Check the container:

```bash
docker ps
```

---

### 🧠 Connect and Enable `pgvector`

Connect to PostgreSQL:

```bash
docker exec -it pgvector-db psql -U postgres -d vectordb
```

Enable the extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### Store and Query Vectors

Create a table and insert vector data:

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding VECTOR(3)
);

INSERT INTO documents (content, embedding)
VALUES ('Hello AI', '[0.1, 0.2, 0.3]');
```

Run a similarity search:

```sql
SELECT id, content, embedding <-> '[0.1, 0.2, 0.3]' AS distance
FROM documents
ORDER BY distance
LIMIT 1;
```

> 🔍 `<->` is the Euclidean distance operator.

---
## 📦 Summary

| Feature    | Description                     |
| ---------- | ------------------------------- |
| Database   | PostgreSQL                      |
| Extension  | pgvector                        |
| Deployment | Docker (via `docker-compose`)   |
| Use Cases  | AI Search, Recommendations, RAG |

---

#### Use-cases
- [Building a Transaction Search App using FastAPI, React, and PostgreSQL + pgvector](./Use-Case/Transaction-Logs.md)

#### Reference

* [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
* [Ankane/pgvector Docker Image](https://hub.docker.com/r/ankane/pgvector)
* [pgvector: AI-powered PostgreSQL extension](https://ankane.org/pgvector)
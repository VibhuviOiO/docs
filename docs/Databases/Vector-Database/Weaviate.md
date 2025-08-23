---
sidebar_position: 2
title: Weaviate
description: Weaviate is an open-source vector database that supports semantic search, vector embeddings, and GraphQL/REST APIs. Learn how to use Weaviate for AI-powered search, similarity queries, and retrieval-augmented generation (RAG) with Docker Compose.
slug: /VectorDB/Weaviate
keywords:
  - Weaviate
  - vector database
  - semantic search
  - AI database
  - embedding store
  - similarity search
  - GraphQL API
  - REST API
  - retrieval augmented generation
  - weaviate docker setup
  - open-source vector db
---
# Weaviate: An open-source vector database for smart, semantic search.
Weaviate is an open-source vector database designed for storing, indexing, and searching high-dimensional vectors. In this blog, you’ll learn how to run Weaviate locally using Docker Compose, define your schema via REST, insert objects, and perform semantic search using GraphQL—all with simple `curl` commands.

---
### 📁 Setup: docker-compose.yml



```yaml
version: '3.4'

services:
  weaviate:
    image: semitechnologies/weaviate:1.25.3
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "50051:50051"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-transformers'
      ENABLE_MODULES: 'text2vec-transformers'
      TRANSFORMERS_INFERENCE_API: 'http://t2v-transformers:8080'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
    volumes:
      - weaviate-data:/var/lib/weaviate

  t2v-transformers:
    image: semitechnologies/transformers-inference:sentence-transformers-paraphrase-mpnet-base-v2
    environment:
      ENABLE_CUDA: '0'
    restart: unless-stopped

volumes:
  weaviate-data:
````

---

### ▶️ Start Weaviate

Start the services:

```bash
docker compose up -d
```

Check if Weaviate is ready:

```bash
curl http://localhost:8080/v1/.well-known/ready
```

Expected output:

```json
{"status":"READY"}
```
---

### Define schema, insert objects, and query semantically using simple curl commands.
### 🧱 Create Class

```bash
curl -X POST http://localhost:8080/v1/schema -H "Content-Type: application/json" -d '{"class":"Article","vectorizer":"text2vec-transformers","properties":[{"name":"title","dataType":["text"]}]}'
```

---

### ✍️ Insert Data

```bash
curl -X POST http://localhost:8080/v1/objects -H "Content-Type: application/json" -d '{"class":"Article","properties":{"title":"Weaviate simplifies vector search with Docker"}}'

curl -X POST http://localhost:8080/v1/objects -H "Content-Type: application/json" -d '{"class":"Article","properties":{"title":"Semantic search with GraphQL and Weaviate"}}'
```

---

### 🔍 Search (GraphQL)

```bash
curl -X POST http://localhost:8080/v1/graphql -H "Content-Type: application/json" -d '{"query":"{ Get { Article(nearText: { concepts: [\"semantic search\"] }) { title } } }"}'
```
---

### Use-cases
- [A Complete Guide to Building a Semantic Search Engine for Health Articles Using FastAPI, Weaviate, and React](./Use-Case/Health-Search-Recommendation.md)


---
sidebar_position: 8
title: Marqo
description: Marqo is an end-to-end vector search engine that handles embedding generation and vector search. Learn how to dockerize and run Marqo for AI-powered semantic search.
slug: /VectorDB/Marqo
keywords:
  - Marqo
  - vector database
  - vector search engine
  - end-to-end search
  - Docker Marqo
  - semantic search
  - AI search
  - embedding generation
  - machine learning
  - neural search
---

# 🚀 AI-Powered Vector Search with Marqo: Docker Setup, Indexing & Semantic Search

[Marqo](https://marqo.ai) is a state-of-the-art, end-to-end **vector search engine** that automatically handles **embedding generation** and **vector search**.  

It enables developers to implement **semantic search, content discovery, and recommendation systems** without manually managing embeddings or training pipelines.

---

## 🧰 Prerequisites

Before starting, ensure the following are installed:

- [Docker](https://docs.docker.com/) ≥ 20.10  
- [Docker Compose](https://docs.docker.com/compose/) ≥ 1.29  

---

## 🔧 Setting Up Marqo with Docker Compose

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  marqo:
    image: marqoai/marqo:latest
    container_name: marqo
    restart: unless-stopped
    ports:
      - "8882:8882"
    volumes:
      - marqo-data:/opt/marqo
    environment:
      MARQO_MAX_CUDA_MODEL_MEMORY: 4  # Limit GPU memory usage
      MARQO_MAX_CPU_MODEL_MEMORY: 4   # Limit CPU memory usage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8882/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  marqo-data:
````

`Start Marqo`

```bash
docker compose up -d
```

`Verify the setup:`

```bash
docker ps
```

```bash
curl http://localhost:8882/health
```

`Expected output:`

```json
{
  "status": "green",
  "inference": {"status": "green"},
  "backend": {
    "status": "green",
    "memoryIsAvailable": true,
    "storageIsAvailable": true
  }
}
```

---

### 📁 Index Creation & Document Management

`Create an Unstructured Index`

```bash
curl -X POST "http://localhost:8882/indexes/test-index" \
  -H "Content-Type: application/json" \
  -d '{
        "type": "unstructured"
      }'
```

`Response:`

```json
{"acknowledged": true, "index": "test-index"}
```

---

`Add Documents`

```bash
curl -X POST "http://localhost:8882/indexes/test-index/documents" \
  -H "Content-Type: application/json" \
  -d '{
        "documents": [
          {"_id": "1", "text": "The Eiffel Tower is a famous landmark in France"},
          {"_id": "2", "text": "The Colosseum is a historic landmark in Italy"}
        ],
        "tensor_fields": ["text"]
      }'
```

---

`Perform a Semantic Search`

```bash
curl -X POST "http://localhost:8882/indexes/test-index/search" \
  -H "Content-Type: application/json" \
  -d '{
        "q": "famous landmark in France"
      }'
```

`Example response:`

```json
{
  "hits": [
    {"_id": "1", "text": "The Eiffel Tower is a famous landmark in France"}
  ],
  "query": "famous landmark in France",
  "limit": 10,
  "offset": 0,
  "processingTimeMs": 78
}
```

✅ The query successfully retrieves the most semantically relevant document.


## 🔍 What You’ll See / Interpret Results

- **Index Creation**: A new index named `products` will be created.
- **Document Addition**: Documents will be added to the index, and embeddings will be generated automatically.
- **Search Results**: Semantic search results ranked by relevance.

---

## 📚 References  

- [Marqo Documentation](https://docs.marqo.ai)

- [TechCrunch: Meet Marqo, an open source vector search engine for AI applications](https://techcrunch.com/2023/08/16/meet-marqo-an-open-source-vector-search-engine-for-ai-applications/)

- [DB-Engines: Listing Marqo as an open source vector-based search engine](https://db-engines.com/en/system/Marqo)

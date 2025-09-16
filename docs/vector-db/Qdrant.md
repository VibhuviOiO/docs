---
title: Qdrant
author: Baalu
sidebar_position: 2
tags: [qdrant, docker, vector-db, rag, llm]
description: Learn how to deploy Qdrant with Docker Compose, persist your vector data, and execute basic vector search queries.
slug: /VectorDB/Qdrant
---

# Running Qdrant with Docker Compose and Performing Basic Queries

Qdrant is a high-performance vector database ideal for powering semantic search, similarity search, and LLM-powered applications. Here’s how to set it up quickly using Docker Compose and run your first queries.

## 🔧 Step 1: Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant-db
    ports:
      - "6333:6333"
    volumes:
      - ./qdrant_data:/qdrant/storage
```

This exposes Qdrant on port `6333` and persists data in `./qdrant_data`.

## ▶️ Step 2: Start Qdrant

Start the container:

```bash
docker-compose up -d
```

Health check:

```bash
curl http://localhost:6333/health
```

You should get:

```json
{"status":"ok"}
```

## 🧠 Step 3: Sample Python Queries

Install the Qdrant client:

```bash
pip install qdrant-client
```

Sample `sample.py`:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

client = QdrantClient("localhost", port=6333)

# Create a collection
client.recreate_collection(
    collection_name="baalu-demo",
    vectors_config=VectorParams(size=4, distance=Distance.COSINE),
)

# Insert vectors
client.upsert(
    collection_name="baalu-demo",
    points=[
        PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4], payload={"source": "vec1"}),
        PointStruct(id=2, vector=[0.2, 0.3, 0.4, 0.5], payload={"source": "vec2"}),
    ]
)

# Search
hits = client.search(
    collection_name="baalu-demo",
    query_vector=[0.1, 0.2, 0.3, 0.4],
    top=2
)

print(hits)
```

Run it:

```bash
python sample.py
```

## 📂 Step 4: Persistence

Qdrant persists vector data to disk automatically via the volume mount:

```yaml
volumes:
  - ./qdrant_data:/qdrant/storage
```

No extra setup needed — your data survives container restarts.

---

Qdrant is scalable, blazing fast, and ready for production RAG workloads. Want to plug it into LangChain or build your own search API on top? Ping me. 🔥

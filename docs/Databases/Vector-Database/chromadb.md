---
sidebar_position: 1
title: ChromaDB
description: ChromaDB is an open-source vector database optimized for embedding-based search and retrieval tasks. Learn how to use ChromaDB for semantic search, similarity comparison, and AI-powered applications.
slug: /VectorDB/ChromaDB
keywords:
  - ChromaDB
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

# 🚢 Dockerizing ChromaDB for Scalable Vector Search Applications

**Chroma** is an open-source embedding database purpose-built for **LLMs**, **vector search**, and **RAG** (Retrieval-Augmented Generation) pipelines.  
This guide shows how to run Chroma using Docker Compose and interact with it using Python.

---

## Set Up ChromaDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  chroma:
    image: ghcr.io/chroma-core/chroma:0.4.24
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      IS_PERSISTENT: "TRUE"

volumes:
  chroma-data:
````

`Start ChromaDB:`
```bash
docker compose up -d
```

`Check if it’s running:`

```bash
docker ps
```
---
### Minimal ChromaDB Setup with Python

`Install ChromaDB using pip:`

```bash
pip install chromadb
````

---

### Connect & Query with Python

`Create a file chromadb_test.py with the following content:`

```python
import chromadb

client = chromadb.Client()  # In-memory DB

collection = client.create_collection(name="test_collection")

collection.add(
    documents=["Hello ChromaDB!"],
    metadatas=[{"source": "demo"}],
    ids=["1"]
)

results = collection.query(
    query_texts=["Hello"],
    n_results=1
)

print(results)
```

`Run it:`

```bash
python chromadb_test.py
```

✅ You should see the results printed with matched document and metadata!

---

### Use-cases
- [Semantic Search for Document Similarity with ChromaDB](./Use-Case/Sematic-search.md)

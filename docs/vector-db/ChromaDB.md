---
title: Chroma
author: Baalu
sidebar_position: 1
tags: [chroma, docker, vector-db, rag, llm]
description: Learn how to run Chroma DB with Docker Compose, persist your embeddings, and perform basic vector search queries.
slug: /VectorDB/ChromaDB
---

# Running Chroma DB with Docker Compose and Sample Queries

Chroma is an open-source embedding database purpose-built for LLMs, vector search, and RAG pipelines. This post shows how to run Chroma using Docker Compose and interact with it using Python.

## 🔧 Step 1: Docker Compose Setup

Create a `docker-compose.yml` file with the following content:

```yaml
version: '3.8'

services:
  chroma:
    image: ghcr.io/chroma-core/chroma:latest
    container_name: chroma-db
    ports:
      - "8000:8000"
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/chroma-data
    volumes:
      - ./chroma-data:/chroma-data
```

## ▶️ Step 2: Start the Service

Run the container:

```bash
docker-compose up -d
```

Check if it’s live:

```bash
curl http://localhost:8000
```

You should see:

```json
{"message":"Chroma is running!"}
```

## 🧠 Step 3: Run Sample Python Queries

Install the client:

```bash
pip install chromadb
```

Then create a `sample.py`:

```python
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
    host="localhost", port=8000, settings=Settings()
)

collection = client.get_or_create_collection(name="baalu-demo")

collection.add(
    documents=["Chroma is a vector DB", "Gen Z loves fast APIs"],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}],
    ids=["id1", "id2"]
)

results = collection.query(
    query_texts=["What do Gen Z love?"], n_results=2
)

print(results)
```

Run the script:

```bash
python sample.py
```

## 📂 Step 4: Persistence

Your vector DB is persistent across restarts thanks to:

```yaml
volumes:
  - ./chroma-data:/chroma-data
```

Everything is saved in `./chroma-data`.

---

Chroma gives you the speed and simplicity Gen Z devs need. Ready for LLM, RAG, or app integration. 🔥

Let me know if you want to plug this into FastAPI, LangChain, or OpenAI pipelines next.

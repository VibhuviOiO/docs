---
sidebar_position: 7
title: Milvus
description: Milvus is a high-performance open-source vector database designed for efficient similarity search and retrieval. Learn how to run Milvus using Docker and perform basic vector operations without writing code.
slug: /VectorDB/Milvus
keywords:
  - Milvus
  - vector database
  - similarity search
  - embedding store
  - open-source vector db
  - docker setup
  - AI database
  - standalone milvus
  - milvus tutorial
  - retrieval systems
---
# Getting Started with Milvus Vector Database
Milvus is a open-source vector database built for scalable similarity search and AI applications. This guide helps you run Milvus using Docker and perform basic operations without writing code.


## Create docker-compose.yml

Create a folder milvus and inside it, add this file:

```yaml
services:
  milvus:
    image: milvusdb/milvus:v2.3.3
    container_name: milvus
    command: ["milvus", "run", "standalone"]
    ports:
      - "19530:19530"
    restart: unless-stopped
````
---

## Start Milvus

From the same folder, run:

```bash
docker compose up -d
```

Check if it’s running:

```bash
curl http://localhost:19530
```

 Output

```json
{"code":0,"message":"OK"}
```

---

## Check Collections

```bash
curl -X GET http://localhost:19530/v1/vector/collections
```

output:

```json
{"collections":[]}
```

---

- [Restaurant Recommendation App with Milvus, FastAPI, and React](./Use-Case/Resuturrent-recommendation.md)
- [ Fraud Detection with Milvus, FastAPI & React](./Use-Case/Fraud-Detection.md)

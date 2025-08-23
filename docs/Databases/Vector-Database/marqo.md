---
sidebar_position: 9
title: Marqo
description: Marqo is an end-to-end vector search engine that handles embedding generation and vector search. Learn how to dockerize and run Marqo for AI-powered search.
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

## 🚀 AI-Powered Vector Search with Marqo: Docker Setup and Integration
**Marqo** is an end-to-end vector search engine that simplifies **embedding generation** and **vector search**. It is ideal for developers looking to implement **AI-powered semantic search** without the complexity of managing embeddings manually. With Marqo, you can build intelligent search systems for e-commerce, content discovery, and more.



### 🧰 Prerequisites
Before starting, ensure you have the following installed:

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 1.29 or later
- **Python**: Version 3.8 or later (for Python integration)
- **pip**: Python package manager

### Set Up Marqo with Docker Compose
Create a docker-compose.yml` file to define the Marqo service.
```bash
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
      MARQO_MAX_CPU_MODEL_MEMORY: 4  # Limit CPU memory usage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8882/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  marqo-data:
```
Start Marqo
Run the following command to start Marqo:
```bash
docker compose up -d
```

Verify the Setup

Wait for few minutes Check if the container is running and healthy:

```bash
docker ps
```

- curl http://localhost:8882/health


### Install the Marqo Python Client
To interact with Marqo programmatically, install the official Python client.

Install the Client
```bash
pip install marqo
```

### Add Configuration and Perform Basic Operations
Once Marqo is running, you can use its REST API or Python client to create indexes, add documents, and perform searches.

Example REST API Operations
Create an Index
```bash
curl -X POST "http://localhost:8882/indexes/products" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "model": "sentence-transformers/all-MiniLM-L6-v2",
      "normalize_embeddings": true
    }
  }'
```

Add Documents
```bash
curl -X POST "http://localhost:8882/indexes/products/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "_id": "1",
        "title": "Wireless Bluetooth Headphones",
        "description": "High-quality wireless headphones with noise cancellation",
        "category": "Electronics",
        "price": 199.99
      },
      {
        "_id": "2", 
        "title": "Gaming Mechanical Keyboard",
        "description": "RGB backlit mechanical keyboard for gaming",
        "category": "Electronics",
        "price": 129.99
      }
    ]
  }'
```
Search Documents
```bash
curl -X POST "http://localhost:8882/indexes/products/search" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "wireless audio devices",
    "limit": 5
  }'
```
---
---
title: Marqo
author: Baalu
sidebar_position: 3
tags: [marqo, docker, vector-db, multimodal, llm, langchain]
description: Learn how to run Marqo, an open-source multi-modal vector search engine, with Docker and perform text and image queries.
slug: /VectorDB/Marqo
---

# Running Marqo with Docker and Performing Vector Search on Multi-Modal Data

[Marqo](https://www.marqo.ai/) is an open-source vector search engine purpose-built for multi-modal data (text, images, and beyond). It handles vector generation internally using open-source or custom models and integrates well with LangChain and LLM workflows.

Here’s how to set it up with Docker and run basic multi-modal vector queries.

## 🔧 Step 1(a): Docker RUN

Pull and run Marqo:

```bash
docker pull marqoai/marqo:latest
docker rm -f marqo
docker run --name marqo -it --privileged -p 8882:8882 --add-host host.docker.internal:host-gateway marqoai/marqo:latest
```

This runs Marqo on `http://localhost:8882`.

## 🔧 Step 1(b): Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
services:
  marqo:
    image: marqoai/marqo:latest
    container_name: marqo
    privileged: true
    ports:
      - "8882:8882"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    volumes:
      - ./marqo_data:/workspace

```

This exposes Qdrant on port `8882` and persists data in `./marqo_data` on the host from the container path `./workspace`.

### ▶️ Step 1(b).1: Start Qdrant

Start the container:

```bash
docker-compose up -d
```


## ▶️ Step 2: Health Check

Ping Marqo to check it’s alive:

```bash
curl http://localhost:8882/version
```

Expected output:

```json
{"version":"<some-version>"}
```

## 🧠 Step 3: Sample Python Queries with LangChain

Install the client and LangChain community module:

```bash
pip install marqo
pip install -qU langchain-community
```

Create a sample script `sample.py`:

```python
import marqo

client = marqo.Client(url="http://localhost:8882")

# Create an index
client.create_index("baalu-multimodal", model="ViT-B/32")  # uses CLIP-based model

# Add documents (text + image)
client.index("baalu-multimodal").add_documents([
    {
        "Title": "The Leaning Tower of Pisa",
        "Description": "A famous landmark in Italy",
        "_image": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Leaning_Tower_of_Pisa_2.jpg"
    },
    {
        "Title": "Eiffel Tower",
        "Description": "Paris landmark with iron structure"
    }
])

# Search with text
results = client.index("baalu-multimodal").search("tilted tower in Italy")
print(results)
```

Run the script:

```bash
python sample.py
```

Marqo will auto-vectorize and rank documents using its internal model.

## 📂 Step 4: Multi-Modal Power

Marqo supports:

- Text queries over text + images
- Image queries over text + images
- Custom models (host your own)

No need to manually embed anything — Marqo handles the vectorization pipeline internally.

---

Marqo makes building semantic + visual search insanely easy. Ready to go full multi-modal with zero vector math. 💥

Let me know if you want to plug it into LangChain or build a full RAG stack with it.

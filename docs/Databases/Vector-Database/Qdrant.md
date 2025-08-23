---
sidebar_position: 6
title: Qdrant
description: Qdrant is an open-source vector database optimized for semantic search, neural network embeddings, and AI-powered applications. Learn how to run Qdrant with Docker and perform high-performance vector similarity searches.
slug: /database/qdrant
keywords:
  - Qdrant
  - vector database
  - semantic search
  - embedding database
  - neural search engine
  - similarity search
  - open-source vector db
  - AI vector search
  - qdrant docker
  - qdrant tutorial
---
# Qdrant Basics: Store and Search High-Dimensional Vectors with Ease

**Qdrant** is an open-source vector database built for storing and searching high-dimensional vectors. It's ideal for powering AI and semantic search applications. In this blog, we’ll:

### Create `docker-compose.yml`

Create a folder (e.g. `qdrant-docker`) and add this `docker-compose.yml`:

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant
    container_name: qdrant-db
    ports:
      - "6333:6333"
    volumes:
      - qdrant-storage:/qdrant/storage
    restart: unless-stopped

volumes:
  qdrant-storage:
````

Then run:

```bash
docker compose up -d
```
### Vector Search with Qdrant using Python

`Install Qdrant Client`

```bash
pip install qdrant-client
````

---

### Full Python Script

Save the following as `qdrant_demo.py`:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Connect to local Qdrant instance
client = QdrantClient(host="localhost", port=6333)

# Create a collection
client.recreate_collection(
    collection_name="my_vectors",
    vectors_config=VectorParams(size=4, distance=Distance.COSINE)
)

# Insert a vector
client.upsert(
    collection_name="my_vectors",
    points=[
        PointStruct(
            id=1,
            vector=[0.1, 0.2, 0.3, 0.4],
            payload={"name": "Igris", "role": "Developer"}
        )
    ]
)

# Perform vector search
result = client.search(
    collection_name="my_vectors",
    query_vector=[0.1, 0.2, 0.3, 0.4],
    limit=1
)

print(result)
```

---

### Run the Script

```bash
python qdrant_demo.py
```

You should see:

```python
[ScoredPoint(id=1, score=1.0, payload={'name': 'Igris', 'role': 'Developer'})]
```
### 🧠 Real-World Use Cases of Qdrant Vector Database

| Use Case                        | Description                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| 🔍 Semantic Search              | Find documents or articles similar in meaning, not just keywords.          |
| 🛍️ Product Recommendation       | Recommend similar products based on image or description embeddings.       |
| 👨‍💻 Resume vs Job Matching      | Match candidate resumes with job descriptions using vector similarity.     |
| 🤖 Chatbot Memory Retrieval      | Retrieve relevant knowledge chunks during conversations.                   |
| 📸 Image Similarity Search       | Find visually similar images using embeddings from models like CLIP.       |
| 🔊 Audio/Voice Matching          | Match voice samples or music clips using audio embeddings.                 |
|

---
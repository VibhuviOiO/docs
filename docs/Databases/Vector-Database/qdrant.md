---
sidebar_position: 8
title: Qdrant
description: Qdrant is a vector similarity search engine with extended filtering support. Learn how to dockerize and run Qdrant for vector search applications.
slug: /VectorDB/Qdrant
keywords:
  - Qdrant
  - vector database
  - similarity search
  - vector search engine
  - Docker Qdrant
  - semantic search
  - AI database
  - embedding store
  - machine learning
  - neural search
---

# 🎯 Dockerizing Qdrant for High-Performance Vector Similarity Search

**Qdrant** is a vector similarity search engine with extended filtering support. Built for **production-ready** vector search with **high performance**, **scalability**, and **advanced filtering** capabilities.

---

## Set Up Qdrant with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: unless-stopped
    ports:
      - "6333:6333"  # REST API
      - "6334:6334"  # gRPC API
    volumes:
      - qdrant-data:/qdrant/storage
    environment:
      QDRANT__SERVICE__HTTP_PORT: 6333
      QDRANT__SERVICE__GRPC_PORT: 6334
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  qdrant-data:
```

`Start Qdrant:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
curl http://localhost:6333/health
```

---

## Basic Qdrant Operations

### Using REST API

`Create a collection:`
```bash
curl -X PUT "http://localhost:6333/collections/products" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine"
    }
  }'
```

`Insert vectors:`
```bash
curl -X PUT "http://localhost:6333/collections/products/points" \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, 0.3, 0.4],
        "payload": {
          "name": "Laptop",
          "category": "Electronics",
          "price": 999.99
        }
      },
      {
        "id": 2,
        "vector": [0.2, 0.3, 0.4, 0.5],
        "payload": {
          "name": "Mouse",
          "category": "Electronics", 
          "price": 29.99
        }
      }
    ]
  }'
```

---

## Python Integration

`Install the Qdrant client:`
```bash
pip install qdrant-client sentence-transformers
```

`Create a file qdrant_test.py:`
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import numpy as np

# Initialize Qdrant client
client = QdrantClient(host="localhost", port=6333)

# Initialize sentence transformer for embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

try:
    # Create collection
    collection_name = "documents"
    
    # Delete collection if exists
    try:
        client.delete_collection(collection_name)
    except:
        pass
    
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Created collection: {collection_name}")
    
    # Sample documents
    documents = [
        {
            "id": 1,
            "text": "Python is a high-level programming language",
            "category": "Programming",
            "tags": ["python", "programming", "language"]
        },
        {
            "id": 2,
            "text": "Machine learning algorithms can process large datasets",
            "category": "AI/ML",
            "tags": ["machine learning", "algorithms", "data"]
        },
        {
            "id": 3,
            "text": "Docker containers provide application isolation",
            "category": "DevOps",
            "tags": ["docker", "containers", "devops"]
        },
        {
            "id": 4,
            "text": "Vector databases enable semantic search capabilities",
            "category": "Database",
            "tags": ["vector", "database", "search"]
        },
        {
            "id": 5,
            "text": "Natural language processing transforms text data",
            "category": "AI/ML",
            "tags": ["nlp", "text", "processing"]
        }
    ]
    
    # Generate embeddings and create points
    points = []
    for doc in documents:
        # Generate embedding for the text
        embedding = model.encode(doc["text"]).tolist()
        
        point = PointStruct(
            id=doc["id"],
            vector=embedding,
            payload={
                "text": doc["text"],
                "category": doc["category"],
                "tags": doc["tags"]
            }
        )
        points.append(point)
    
    # Insert points
    client.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"Inserted {len(points)} documents")
    
    # Search examples
    print("\n=== Search Examples ===")
    
    # 1. Semantic search
    query_text = "programming languages and coding"
    query_vector = model.encode(query_text).tolist()
    
    search_results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=3
    )
    
    print(f"\n1. Semantic search for: '{query_text}'")
    for result in search_results:
        print(f"   Score: {result.score:.3f} - {result.payload['text']}")
    
    # 2. Search with filtering
    search_results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter={
            "must": [
                {"key": "category", "match": {"value": "AI/ML"}}
            ]
        },
        limit=3
    )
    
    print(f"\n2. Filtered search (AI/ML category):")
    for result in search_results:
        print(f"   Score: {result.score:.3f} - {result.payload['text']}")
    
    # 3. Search with complex filters
    search_results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter={
            "should": [
                {"key": "tags", "match": {"any": ["python", "docker"]}},
                {"key": "category", "match": {"value": "Database"}}
            ]
        },
        limit=5
    )
    
    print(f"\n3. Complex filter search (tags: python/docker OR category: Database):")
    for result in search_results:
        print(f"   Score: {result.score:.3f} - {result.payload['text']}")
        print(f"   Category: {result.payload['category']}, Tags: {result.payload['tags']}")
    
    # 4. Recommendation (find similar to a specific document)
    recommend_results = client.recommend(
        collection_name=collection_name,
        positive=[1],  # Similar to document with ID 1
        limit=3
    )
    
    print(f"\n4. Recommendations similar to document ID 1:")
    for result in recommend_results:
        print(f"   Score: {result.score:.3f} - {result.payload['text']}")
    
    # Collection info
    collection_info = client.get_collection(collection_name)
    print(f"\nCollection info:")
    print(f"   Vectors count: {collection_info.points_count}")
    print(f"   Vector size: {collection_info.config.params.vectors.size}")
    print(f"   Distance metric: {collection_info.config.params.vectors.distance}")

except Exception as e:
    print(f"Error: {e}")
```

`Run the script:`
```bash
python qdrant_test.py
```

---

## Advanced Features

### Named Vectors (Multiple Vector Spaces)

```python
# Create collection with multiple vector spaces
client.create_collection(
    collection_name="multi_vector",
    vectors_config={
        "text": VectorParams(size=384, distance=Distance.COSINE),
        "image": VectorParams(size=512, distance=Distance.DOT)
    }
)

# Insert point with multiple vectors
point = PointStruct(
    id=1,
    vector={
        "text": text_embedding,
        "image": image_embedding
    },
    payload={"title": "Product with text and image"}
)

# Search specific vector space
results = client.search(
    collection_name="multi_vector",
    query_vector=("text", query_embedding),
    limit=5
)
```

### Payload Indexing

```python
# Create payload index for faster filtering
client.create_payload_index(
    collection_name=collection_name,
    field_name="category",
    field_schema="keyword"
)

client.create_payload_index(
    collection_name=collection_name,
    field_name="tags",
    field_schema="keyword"
)
```

### Batch Operations

```python
# Batch search
batch_results = client.search_batch(
    collection_name=collection_name,
    requests=[
        {
            "vector": query_vector1,
            "limit": 3,
            "filter": {"must": [{"key": "category", "match": {"value": "AI/ML"}}]}
        },
        {
            "vector": query_vector2,
            "limit": 3,
            "filter": {"must": [{"key": "category", "match": {"value": "Programming"}}]}
        }
    ]
)
```

---

## Cluster Setup

`docker-compose.yml for cluster:`
```yaml
version: '3.8'

services:
  qdrant-node1:
    image: qdrant/qdrant:latest
    container_name: qdrant-node1
    ports:
      - "6333:6333"
    volumes:
      - qdrant-node1-data:/qdrant/storage
    environment:
      QDRANT__CLUSTER__ENABLED: true
      QDRANT__CLUSTER__P2P__PORT: 6335

  qdrant-node2:
    image: qdrant/qdrant:latest
    container_name: qdrant-node2
    ports:
      - "6336:6333"
    volumes:
      - qdrant-node2-data:/qdrant/storage
    environment:
      QDRANT__CLUSTER__ENABLED: true
      QDRANT__CLUSTER__P2P__PORT: 6335
      QDRANT__CLUSTER__BOOTSTRAP: "qdrant-node1:6335"

volumes:
  qdrant-node1-data:
  qdrant-node2-data:
```

---

## Performance Optimization

### HNSW Parameters

```python
# Optimize HNSW parameters for your use case
client.create_collection(
    collection_name="optimized",
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE,
        hnsw_config={
            "m": 16,  # Number of connections
            "ef_construct": 200,  # Size of dynamic candidate list
            "full_scan_threshold": 10000  # Use full scan for small collections
        }
    )
)
```

### Quantization

```python
# Enable scalar quantization to reduce memory usage
client.update_collection(
    collection_name=collection_name,
    quantization_config={
        "scalar": {
            "type": "int8",
            "quantile": 0.99,
            "always_ram": True
        }
    }
)
```

---

## Monitoring and Maintenance

### Collection Statistics

```python
# Get collection info
info = client.get_collection(collection_name)
print(f"Points: {info.points_count}")
print(f"Segments: {info.segments_count}")
print(f"Disk usage: {info.disk_data_size}")

# Get cluster info
cluster_info = client.get_cluster_info()
print(f"Cluster status: {cluster_info}")
```

### Backup and Restore

```bash
# Create snapshot
curl -X POST "http://localhost:6333/collections/products/snapshots"

# List snapshots
curl "http://localhost:6333/collections/products/snapshots"

# Download snapshot
curl "http://localhost:6333/collections/products/snapshots/snapshot_name" -o backup.snapshot
```

---

## Common Use Cases

- **Semantic Search**: Document search, knowledge bases, FAQ systems
- **Recommendation Systems**: Product recommendations, content discovery
- **Image Search**: Visual similarity, reverse image search
- **Anomaly Detection**: Fraud detection, outlier identification
- **Personalization**: User preference matching, content personalization

✅ Qdrant is now running in Docker and ready for your vector similarity search applications!
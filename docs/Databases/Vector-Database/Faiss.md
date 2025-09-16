---
sidebar_position: 4
slug: faiss-docker-rest-api
title: Faiss 
authors: venkatesh
tags: [faiss, docker, vector-search, flask, rest-api]
---
# Build a FAISS REST API with Docker Compose
**FAISS** (Facebook AI Similarity Search) is a powerful library for efficient similarity search and clustering of dense vectors. In this tutorial, you'll learn how to containerize a minimal FAISS-powered REST API using **Flask** and **Docker Compose**.

This setup is perfect for projects involving vector embeddings, semantic search, or AI/ML pipelines.

---
## 📁 Project Structure

Create a new folder called `faiss`:

```bash
mkdir faiss && cd faiss
````
```
faiss/
├── app.py
├── Dockerfile
└── docker-compose.yml
```

---

## Write the Flask + FAISS App

Create a file named app.py :

```python
from flask import Flask, request, jsonify
import faiss
import numpy as np

app = Flask(__name__)

dim = 4
index = faiss.IndexFlatL2(dim)
data = {}

@app.route("/")
def home():
    return "FAISS Server is running!", 200

@app.route("/add", methods=["POST"])
def add_vector():
    content = request.json
    vec = np.array(content["vector"]).astype("float32").reshape(1, -1)
    id = content.get("id", str(len(data)))
    data[id] = vec
    index.add(vec)
    return {"status": "added", "id": id}

@app.route("/search", methods=["POST"])
def search_vector():
    query = np.array(request.json["vector"]).astype("float32").reshape(1, -1)
    k = request.json.get("k", 5)
    distances, indices = index.search(query, k)
    return jsonify({
        "distances": distances.tolist(),
        "indices": indices.tolist()
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
```

---

## Dockerfile to Containerize It

Create a `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install --no-cache-dir flask faiss-cpu numpy

COPY app.py .

CMD ["python", "app.py"]
```

---

## Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
services:
  faiss-server:
    build: .
    ports:
      - "8090:80"
    container_name: faiss-custom
    restart: unless-stopped
```
---

## Build and Run the Server

From your `faiss` folder, run:

```bash
docker compose up --build -d
```

Test that it’s running:

```bash
curl http://localhost:8090/
```
output:

```
FAISS Server is running!
```

---
## ⚙️ Interacting with FAISS Vector Search API and Its Real-World Applications

### ➕ Add a Vector

```bash
curl -X POST http://localhost:8090/add \
  -H "Content-Type: application/json" \
  -d '{"id": "1", "vector": [0.1, 0.2, 0.3, 0.4]}'
```
---
### 🔍 Search for Similar Vectors

```bash
curl -X POST http://localhost:8090/search \
  -H "Content-Type: application/json" \
  -d '{"vector": [0.1, 0.2, 0.3, 0.4], "k": 1}'
```
🌍 Real-World Use Cases of FAISS Vector Search
Domain	Use Case Description
- 🔎 Semantic Search	Search documents, FAQs, or code using meaning (not keywords)
- 🛍️ E-commerce	Find similar products based on image or text embeddings
- 📸 Facial Recognition	Match faces using vector embeddings from face encoders
- 🤖 Chatbots/NLP	Retrieve relevant responses from vectorized knowledge
- 🎧 Music Recommendation	Recommend songs based on user vector preferences
- 🧬 Bioinformatics	Match DNA/protein sequences using high-dimensional vectors

---

### Use-cases
- [Personalized Recommendation ](./Use-Case/Personalized-Recommendation-System.md)

#### References
* [FAISS Documentation](https://faiss.ai/)  
* [Flask Documentation](https://flask.palletsprojects.com/) 

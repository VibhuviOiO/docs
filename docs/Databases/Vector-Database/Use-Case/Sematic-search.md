---
title: Semantic Search
sidebar_position: 1
description: Build a full-stack semantic document similarity app using ChromaDB as the vector store, SentenceTransformers for embeddings, FastAPI backend, and a React frontend UI. Dockerized and production-ready.
slug: /projects/document-similarity-chromadb
tags: [chromadb, fastapi, react, semantic-search, vector-db, docker]
keywords:
  - document similarity
  - chromadb fastapi
  - vector search
  - semantic search
  - fullstack
---

# 🔍 Semantic Search for Document Similarity with ChromaDB
Build a full-stack semantic document similarity app using ChromaDB as the vector store, SentenceTransformers for embeddings, FastAPI backend, and a React frontend UI. Dockerized and production-ready.

---

### 📁 Project Structure

```bash
semantic-search/
├── app/
│   ├── main.py               # Main script for search
│   ├── requirements.txt      # Python dependencies
│   ├── documents.json        # Sample support documents
├── Dockerfile                # Container definition
└── docker-compose.yml        # Optional Docker Compose setup
```



---

### 📄 Step 1: Sample Documents

`Create app/documents.json`:

```json
[
  {
    "id": "doc1",
    "text": "To reset your password, click on 'Forgot Password' at login."
  },
  {
    "id": "doc2",
    "text": "You can delete your account permanently from the settings page."
  },
  {
    "id": "doc3",
    "text": "To upgrade your subscription, go to your billing section."
  }
]
```

---

### 🧠 Step 2: Install Requirements

`Create app/requirements.txt`:

```txt
chromadb
sentence-transformers
```

---

### 🧠 Step 3: Main Python Script

`Create app/main.py`:

```python
import json
from sentence_transformers import SentenceTransformer
import chromadb

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load documents from JSON
with open("app/documents.json") as f:
    docs = json.load(f)

texts = [doc["text"] for doc in docs]
ids = [doc["id"] for doc in docs]

# Convert text to embeddings
embeddings = model.encode(texts).tolist()

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path="./chroma")

# Delete and recreate collection (ensures clean state)
client.delete_collection("support_docs")
collection = client.get_or_create_collection("support_docs")

# Insert documents with embeddings
collection.add(
    documents=texts,
    embeddings=embeddings,
    ids=ids
)

# Query input
query = "I forgot my password and can’t login"
query_embedding = model.encode([query]).tolist()

# Search top N most relevant
results = collection.query(
    query_embeddings=query_embedding,
    n_results=1
)

# Print result
print("🔍 Most Relevant Match:")
print(results["documents"][0][0])
```
---


### 🐳 Step 4: Dockerfile

```
FROM python:3.10-slim

WORKDIR /apps

COPY app/ ./app/
COPY app/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "app/main.py"]
```

---

### 🧱 Step 5: Docker Compose (Optional)

```yaml
version: '3.8'

services:
  semantic-search-app:
    build: .
    container_name: semantic_search
    volumes:
      - ./chroma_data:/app/chroma
    restart: always
```

---

### ▶️ Step 6: Run It

#### Option A: Using Docker Compose

```bash
docker-compose up --build
```

#### Option B: Manual Docker Run

```bash
docker build -t semantic-search .
docker run --name semantic_search -v $(pwd)/chroma_data:/app/chroma semantic-search
```

---

### ✅ Output

```bash
🔍 Most Relevant Match:
To reset your password, click on 'Forgot Password' at login.
```

---

### 🚀 Real-World Applications

- ✅ Support bots (Intercom, Zendesk)
- ✅ Internal search engines (Notion, Confluence)
- ✅ AI assistants for docs (ChatGPT RAG apps)

---
## 🙌 Credits

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)


---

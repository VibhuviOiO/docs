---
title: HealthSearch Recommender
sidebar_position: 2
description: Build a semantic search engine to match user symptoms with health articles or products using Weaviate, SentenceTransformers, a FastAPI backend, and a React frontend. Fully Dockerized and production-ready.
slug: /projects/healthsearch-weaviate
tags: [weaviate, fastapi, react, semantic-search, vector-db, healthcare, docker]
keywords:
  - health recommender
  - weaviate fastapi
  - semantic symptom search
  - symptom to product
  - vector search healthcare
  - react frontend
---

# 🧪 HealthSearch Recommender

A Complete Guide to Building a **Semantic Search Engine for Health Articles Using FastAPI, Weaviate, and React**

This project walks through every step from document ingestion, embedding generation using SentenceTransformers, and querying with Weaviate, to displaying results in a user-friendly React interface. Ideal for healthcare AI assistants, symptom checkers, or wellness product recommendation engines.


---

## 🏧 Architecture

```
                           ┌───────────┐
                           │  React UI  │
                           └──────────┘
                                 │
                            [POST /search]
                                 │
                           ┌──────────┐
                           │  FastAPI   │
                           ├──────────┘
                           │   Embed Q  │
                           │   Search   │
                           └──────────┘
                                 │
                  ┌────────────────────────────────────────────────┐
                  │      Weaviate Vector DB     │
                  │  (Semantic k-NN Search)     │
                  └───────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
healthsearch-recommender/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api.py
│   │   ├── search.py
│   │   ├── config.py
│   │   ├── models.py
│   │   └── embedding.py
│   └── scripts/
│       └── ingest.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│   └── index.html
│   └── package.json
├── data/
│   └── health_articles.json
├── docker-compose.yml
└── Dockerfile
```

---

## ⚙️ Backend Highlights (`FastAPI + Weaviate`)

### 🔄 Ingestion (`scripts/ingest.py`)

```python
import json, weaviate
from app.embedding import get_embedding
from app.config import WEAVIATE_URL

client = weaviate.Client(url=WEAVIATE_URL)

def setup_schema():
    schema = {
        "class": "HealthArticle",
        "properties": [
            {"name": "title", "dataType": ["text"]},
            {"name": "content", "dataType": ["text"]}
        ],
        "vectorizer": "none"
    }
    existing_classes = client.schema.get().get("classes", [])
    if not any(cls["class"] == "HealthArticle" for cls in existing_classes):
        client.schema.create_class(schema)

def ingest():
    setup_schema()

    with open("data/health_articles.json") as f:
        data = json.load(f)

    seen = set()
    for doc in data:
        key = (doc["title"], doc["content"])
        if key in seen:
            continue
        seen.add(key)
        vector = get_embedding(doc["content"])
        client.data_object.create({
            "title": doc["title"],
            "content": doc["content"]
        }, "HealthArticle", vector=vector)
```

---

### 🔍 Semantic Search (`search.py`)

```python
import weaviate
from app.embedding import get_embedding
from app.config import WEAVIATE_URL

client = weaviate.Client(url=WEAVIATE_URL)

def perform_search(query: str):
    vector = get_embedding(query)
    response = client.query.get("HealthArticle", ["title", "content"]) \
        .with_near_vector({"vector": vector}) \
        .with_limit(5).do()

    articles = response.get("data", {}).get("Get", {}).get("HealthArticle", [])
    seen = set()
    unique = []
    for a in articles:
        key = (a["title"], a["content"])
        if key not in seen:
            seen.add(key)
            unique.append(a)
    return unique
```

---

## 🧠 Embeddings

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str):
    return model.encode(text).tolist()
```

---

### 📦 Config (`config.py`)

```python
WEAVIATE_URL = "http://weaviate:8080"
```

---

## ⚛️ Frontend in React

```jsx
// App.jsx
import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await fetch("http://localhost:8000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="app">
      <h1>🧪 HealthSearch Recommender</h1>
      <input
        type="text"
        placeholder="e.g. headache remedies"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {results.map((item, i) => (
          <li key={i}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

---

## 🐳 Docker Compose Setup

```yaml
version: '3.9'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    depends_on:
      - weaviate

  weaviate:
    image: semitechnologies/weaviate:1.21.2
    ports:
      - "8080:8080"
    environment:
      - QUERY_DEFAULTS_LIMIT=25
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
      - DEFAULT_VECTORIZER_MODULE=none
    volumes:
      - weaviate_data:/var/lib/weaviate

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

volumes:
  weaviate_data:
```

### backend/Dockerfile
`Dockerfile`
```bash
FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend /app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
### frontend/Dockerfile
`Dockerfile`
```bash
FROM node:18

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend ./
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]
```


---

## 🧪 Testing It

* Run the full stack:

  ```bash
  docker-compose up --build
  ```

* Visit:

  * `http://localhost:3000` → React UI
  * `http://localhost:8000/docs` → FastAPI Docs

* Try searching: `"flu symptoms"`, `"natural remedies for cold"`, `"treat headache"`

---
## 💬 Conclusion

By combining **FastAPI**, **Weaviate**, and **React**, you’ve built a fully functioning **AI-powered search engine** for health recommendations.
This pattern is applicable across many domains — 
- News
- Education 
- E-commerce
- Even
- Legal search.

**Semantic search isn't the future. It's the present.** And now, it's in your hands.

---
sidebar_position: 5
title: MongoDB Hybrid Search
description: Learn how to build a hybrid semantic search system using MongoDB's vector search capabilities, SentenceTransformers, and Ollama for AI-powered Q&A generation.
slug: /VectorDB/MongoDB-Hybrid-Search
keywords:
  - MongoDB
  - hybrid search
  - semantic search
  - vector database
  - natural language question answering
  - ollama
  - sentence-transformers
  - fastapi
  - retrieval augmented generation
  - mongodb vector search
  - open-source vector db
  - LLM integration
---

# QA Hybrid Search App with MongoDB, FastAPI, Ollama & React

Learn how to build a hybrid semantic search system using MongoDB's vector search capabilities, SentenceTransformers, and Ollama for AI-powered Q&A generation.

---

## 🗂️ Project Structure

```

qa-hybrid-search/
├── backend/
│   ├── app.py
│   ├── embed\_utils.py
│   ├── utils/
│   │   └── llm\_utils.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── Dockerfile
├── scripts/
│   └── load\_squad.py
│   └── dev-v2.0.json
├── .env
├── docker-compose.yml

````

---

## 🔧 Step 1: Backend (FastAPI)

### `backend/app.py`

```python
import os
import numpy as np
from fastapi import FastAPI, Query
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from embed_utils import embed_text
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from utils.llm_utils import generate_answer

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

client = MongoClient(os.getenv("MONGODB_URL"))
db = client["qa_hybrid"]
col = db["documents"]

@app.get("/search")
def hybrid_search(query: str = Query(...)):
    vector = embed_text(query)
    docs = list(col.find({}, {"_id": 1, "question": 1, "answer": 1, "embedding": 1}))

    for doc in docs:
        doc["score"] = cosine_similarity([vector], [doc["embedding"]])[0][0]

    top_docs = sorted([d for d in docs if d["score"] > 0.3], key=lambda x: x["score"], reverse=True)[:3]
    generated = generate_answer(query, top_docs)

    return {
        "query": query,
        "generated_answer": generated,
        "results": [
            {
                "id": str(doc["_id"]),
                "question": doc["question"],
                "answer": doc["answer"],
                "score": round(doc["score"], 4)
            } for doc in top_docs
        ]
    }
````

### `backend/embed_utils.py`

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str):
    return model.encode(text).tolist()
```

### `backend/utils/llm_utils.py`

```python
import os
import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

def generate_answer(query: str, docs: list) -> str:
    context = "\n".join([f"Q: {doc['question']}\nA: {doc['answer']}" for doc in docs])
    prompt = f"""Answer the following question based on the context.

Context:
{context}

Question: {query}
Answer:"""

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    )
    return response.json().get("response", "").strip()
```

### `backend/requirements.txt`

```
fastapi
uvicorn
pymongo
scikit-learn
sentence-transformers
python-dotenv
requests
```

### `backend/Dockerfile`

```Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🧪 Step 2: Load SQuAD Data

Place `dev-v2.0.json` in `scripts/`, then run:

### `scripts/load_squad.py`

```python
import json
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

client = MongoClient("mongodb://mongodb:27017/")
db = client["qa_hybrid"]
col = db["documents"]
model = SentenceTransformer("all-MiniLM-L6-v2")

with open("scripts/dev-v2.0.json") as f:
    squad = json.load(f)

docs = []
for article in squad["data"]:
    for para in article["paragraphs"]:
        ctx = para["context"]
        for qa in para["qas"]:
            if qa["is_impossible"]: continue
            q = qa["question"]
            a = qa["answers"][0]["text"]
            emb = model.encode(q).tolist()
            docs.append({
                "question": q,
                "answer": a,
                "context": ctx,
                "embedding": emb
            })

col.insert_many(docs)
print(f"✅ Inserted {len(docs)} docs")
```

Run it:

```bash
docker-compose run backend python scripts/load_squad.py
```

---

## 🌐 Step 3: Frontend (React + Vite)

### `frontend/src/App.jsx`

```jsx
import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState(null)

  const search = async () => {
    const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResponse(data)
  }

  return (
    <div className="container">
      <h1>🔍 QA Hybrid Search</h1>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask your question..." />
      <button onClick={search}>Search</button>
      {response && (
        <>
          <h3>🧠 Answer: {response.generated_answer}</h3>
          <ul>
            {response.results.map((r, i) => (
              <li key={i}>
                <strong>Q:</strong> {r.question}<br />
                <strong>A:</strong> {r.answer}<br />
                <em>Score:</em> {r.score}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default App
```

### `frontend/src/main.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>QA Hybrid Search</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend/package.json`

```json
{
  "name": "qa-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### `frontend/Dockerfile`

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist"]
```

---

## 🐳 Step 4: Docker Compose

### `.env`

```env
MONGODB_URL=mongodb://mongodb:27017
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3
```

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=${MONGODB_URL}
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
      - OLLAMA_MODEL=${OLLAMA_MODEL}
    volumes:
      - ./backend:/app
    depends_on:
      - mongodb
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongodb:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

volumes:
  mongodb-data:
  ollama-data:
```

---


### `🚀 Run and Test`

### 1. Start services

```bash
docker compose up --build
````
---

### 2. Pull and run LLaMA3

In a **second terminal**, run the following command to load the model:

```bash
docker exec -it qa-hybrid-search-ollama-1 ollama run llama3
```

> This will pull and load the `llama3` model into memory inside the Ollama container so that the FastAPI backend can query it in real-time for answer generation.

---

### 🌐 Access Localhost Services



| Component       | URL                                                      | Description                     |
| --------------- | -------------------------------------------------------- | ------------------------------- |
| 🧠 Ollama API   | [http://localhost:11434](http://localhost:11434)         | Ollama LLM API                  |
| ⚙️ FastAPI Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger/OpenAPI UI              |
| 💻 Frontend UI  | [http://localhost:3000](http://localhost:3000)           | User Interface built with React |
| 🍃 MongoDB      | `mongodb://localhost:27017`                              | MongoDB Connection URI          |

---

### ✅ Result

` query :`

```text
What is the role of customs union?
```

They get a generated answer and matching context from the vector database:

```json
{
  "generated_answer": "A customs union eliminates tariffs and trade barriers...",
  "results": [
    {
      "question": "What helps the process of free movement of goods?",
      "answer": "a customs union, and the principle of non-discrimination",
      "score": 0.93
    }
  ]
}
```
---

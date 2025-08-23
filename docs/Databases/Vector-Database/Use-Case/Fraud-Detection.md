---
title: Fraud Detection
description: A semantic fraud detection system using Milvus vector database, FastAPI, SentenceTransformers, and a clean React frontend.
slug: /projects/fraud-detection-milvus
keywords:
  - Milvus
  - FastAPI
  - React
  - Fraud Detection
  - SentenceTransformers
  - Vector Search
  - Docker
sidebar_position: 7
---

# 🛡️ Fraud Detection with Milvus, FastAPI & React

This project builds a **semantic search-powered fraud detection system** using:

✅ **Milvus** – Open-source vector database  
✅ **SentenceTransformers** – Converts descriptions into vector embeddings  
✅ **FastAPI** – Backend service for inserting and searching  
✅ **React + Vite** – Frontend for user interaction  
✅ **Docker Compose** – Containerized deployment

---

## 📁 Project Structure

```

milvus-fraud-detection/
├── backend/
│   ├── main.py
│   ├── milvus\_client.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml

````

---

## ⚙️ Backend Setup

### `backend/requirements.txt`

```txt
fastapi==0.115.1
uvicorn==0.30.0
pymilvus==2.4.0
sentence-transformers==2.2.2
````

### `backend/milvus_client.py`

```python
from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "fraud_detection"
DIM = 384

connections.connect(alias="default", host="milvus-standalone", port="19530")
model = SentenceTransformer("all-MiniLM-L6-v2")

def create_collection():
    if COLLECTION_NAME in [col.name for col in Collection.list_collections()]:
        print("✅ Collection already exists.")
        return

    print("🛠️ Creating new collection...")
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=1000),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIM),
    ]
    schema = CollectionSchema(fields, description="Fraud detection schema")
    collection = Collection(name=COLLECTION_NAME, schema=schema)

    # Insert a dummy record
    desc = "suspicious transaction mumbai"
    embedding = model.encode([desc]).tolist()
    collection.insert([[1], [desc], embedding])
    collection.flush()

    collection.create_index(
        field_name="embedding",
        index_params={"metric_type": "COSINE", "index_type": "IVF_FLAT", "params": {"nlist": 128}},
    )
    collection.load()

def insert_transaction(id: int, description: str):
    embedding = model.encode([description]).tolist()
    collection = Collection(COLLECTION_NAME)
    collection.insert([[id], [description], embedding])
    collection.flush()

def search_similar(description: str):
    embedding = model.encode([description])
    collection = Collection(COLLECTION_NAME)
    collection.load()
    results = collection.search(
        data=embedding,
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"nprobe": 10}},
        limit=5,
        output_fields=["id", "description"]
    )
    return [{
        "id": match.entity.get("id"),
        "description": match.entity.get("description"),
        "score": round(match.distance, 4)
    } for match in results[0]]
```

### `backend/main.py`

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from milvus_client import create_collection, insert_transaction, search_similar

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_collection()

@app.post("/insert")
async def insert(req: Request):
    data = await req.json()
    insert_transaction(id=data["id"], description=data["description"])
    return {"status": "inserted"}

@app.post("/search")
async def search(req: Request):
    data = await req.json()
    return {"matches": search_similar(data["description"])}
```

### `backend/Dockerfile`

```Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 💻 Frontend Setup (Vite + React)

### `frontend/src/App.jsx`

```jsx
import { useState } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await fetch("http://localhost:8000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: query }),
    });
    const data = await res.json();
    setResults(data.matches || []);
  };

  return (
    <div id="root">
      <h1>🛡️ Fraud Detection Search</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. unauthorized ATM withdrawal in Delhi"
      />
      <button onClick={handleSearch}>Search</button>

      <div className="result-box">
        <h3>Search Results</h3>
        {results.length === 0 ? (
          <p>No results found</p>
        ) : (
          <ul>
            {results.map(({ id, description, score }) => (
              <li key={id}>
                <strong>ID:</strong> {id}<br />
                <strong>Description:</strong> {description}<br />
                <strong>Score:</strong> {score}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
```

---

### `frontend/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

### `frontend/App.css`

```css
#root {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: Arial, sans-serif;
}

input {
  width: 100%;
  max-width: 600px;
  padding: 10px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

button {
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.result-box {
  max-width: 600px;
  margin: 1rem auto;
  border: 1px solid #ddd;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
  text-align: left;
}

.result-box ul {
  list-style-type: none;
  padding: 0;
}

.result-box li {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}
```

---

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

---

### `frontend/Dockerfile`

```Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 🐳 `docker-compose.yml`

```yaml
version: '3.8'

services:
  milvus-standalone:
    image: milvusdb/milvus:v2.4.0
    container_name: milvus-standalone
    ports:
      - "19530:19530"
      - "9091:9091"
    command: ["milvus", "run", "standalone"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  detection-backend:
    build: ./backend
    depends_on:
      - milvus-standalone
    ports:
      - "8000:8000"

  detection-frontend:
    build: ./frontend
    ports:
      - "5173:3000"
```

---

## 🚀 Run the App

```bash
docker-compose up --build
```

* 🧠 Backend: [http://localhost:8000/docs](http://localhost:8000/docs)
* 🌐 Frontend: [http://localhost:5173](http://localhost:5173)

---

📦 Try it Out

#### `Insert new fraud record:`

```bash
curl -X POST http://localhost:8000/insert \
  -H "Content-Type: application/json" \
  -d '{"id": 2, "description": "unauthorized ATM withdrawal in delhi"}'
```

### Search for similar activity:

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"description": "delhi atm fraud"}'
```
---

## 🧠 Output

```json
{
  "matches": [
    {
      "id": 2,
      "description": "unauthorized ATM withdrawal in delhi",
      "score": 0.845
    },
    {
      "id": 1,
      "description": "suspicious transaction mumbai",
      "score": 0.5349
    }
  ]
}
```

---
Frontend: http://localhost:5173

#### API docs (optional): http://localhost:8000/docs
---
```Search On UI :```
```bash
suspicious transaction mumbai
```
---

---
title: Restaurant Recommendation App 
sidebar_position: 6
description: Build a Zomato-style restaurant recommendation system using Milvus vector database, SentenceTransformers, FastAPI backend, and a React frontend UI. Dockerized and production-ready.
slug: /projects/restaurant-recommender
date: 2025-07-03
authors: [venkatesh]
tags: [milvus, fastapi, react, recommendation, vector-db, docker]
keywords:
  - restaurant recommender
  - milvus fastapi
  - vector search
  - semantic search
  - fullstack
---

# 🍽 Restaurant Recommendation App with Milvus, FastAPI, and React

This app recommends restaurants based on user queries (like _"best dosa in Bangalore"_ or _"cheap biryani near me"_) using **vector similarity search** with:

- **Milvus** – to store embeddings
- **SentenceTransformers** – to convert restaurant info and queries into vectors
- **FastAPI** – backend API for search and ingestion
- **React** – frontend with simple search UI
- **Docker Compose** – for orchestration

---

### 📁 Folder Structure

```bash
restaurant-recommender/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── restaurants.csv
│   │   ├── embedding.py
│   │   ├── main.py
│   │   ├── milvus_client.py
│   │   └── utils.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── assets/
│   │       └── react.svg
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml
├── myenv/
└── volumes/

````
```bash
# Create root project folder
mkdir -p restaurant-recommender && cd restaurant-recommender

# ---------------------------
# Backend
# ---------------------------
mkdir -p backend/app/data

# Backend files
touch backend/Dockerfile
touch backend/requirements.txt
touch backend/app/{embedding.py,main.py,milvus_client.py,utils.py}
touch backend/app/data/restaurants.csv   # dataset

# ---------------------------
# Frontend
# ---------------------------
mkdir -p frontend/src/assets frontend/public

# Frontend config + main files
touch frontend/{index.html,package.json,package-lock.json,vite.config.js,eslint.config.js,Dockerfile,README.md}

# Frontend src files
touch frontend/src/{App.css,App.jsx,index.css,main.jsx}
touch frontend/src/assets/react.svg

# ---------------------------
# Root level
# ---------------------------
touch docker-compose.yml

# Environment & volumes (empty dirs)
mkdir myenv volumes
```
---

`backend/app/embedding.py`

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embedding(text: str):
    return model.encode(text).tolist()
```

---

`backend/app/utils.py`

```python
import pandas as pd
from .embedding import generate_embedding

def load_restaurants(csv_path):
    df = pd.read_csv(csv_path)
    restaurants = []
    for _, row in df.iterrows():
        restaurants.append({
            "id": int(row['id']),
            "name": row['name'],
            "description": row['description'],
            "city": row['location'],
        })
    return restaurants
```

---

`backend/app/milvus_client.py`

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
from app.embedding import generate_embedding

COLLECTION_NAME = "restaurants"

def connect_milvus():
    connections.connect("default", host="milvus", port="19530")

def create_collection():
    if utility.has_collection(COLLECTION_NAME):
        return
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=512),
        FieldSchema(name="city", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
    ]
    schema = CollectionSchema(fields, description="Restaurant recommendations")
    collection = Collection(name=COLLECTION_NAME, schema=schema)
    collection.create_index("embedding", {"metric_type": "COSINE", "index_type": "IVF_FLAT", "params": {"nlist": 1024}})
    collection.load()

def insert_data(data: list[dict]):
    collection = Collection(COLLECTION_NAME)
    texts = [f"{r['name']} {r['description']} {r['city']}" for r in data]
    embeddings = [generate_embedding(t) for t in texts]
    entities = [
        [r['name'] for r in data],
        [r['description'] for r in data],
        [r['city'] for r in data],
        embeddings,
    ]
    collection.insert(entities)
    collection.flush()
    collection.load()

def search(embedding: list[float]):
    collection = Collection(COLLECTION_NAME)
    collection.load()
    results = collection.search(
        data=[embedding],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"nprobe": 10}},
        limit=5,
        output_fields=["name", "description", "city"]
    )
    return [{
        "name": hit.entity.get("name"),
        "description": hit.entity.get("description"),
        "city": hit.entity.get("city"),
        "score": hit.distance,
    } for hit in results[0]]
```

---

`backend/app/main.py`

```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app import milvus_client, utils, embedding

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    milvus_client.connect_milvus()
    milvus_client.create_collection()
    data = utils.load_restaurants("app/data/restaurants.csv")
    milvus_client.insert_data(data)

@app.get("/recommend")
def recommend(query: str = Query(...)):
    emb = embedding.generate_embedding(query)
    return {"recommendations": milvus_client.search(emb)}
```

`backend/dockerfile`

```Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`Create your data CSV file at`: `backend/app/data/restaurants.csv`

```csv
id,name,description,cuisine,location
1,Hotel Dosa Palace,Authentic crispy dosas,South Indian,Bangalore
2,Biryani House,Spicy Hyderabadi biryani,Indian,Hyderabad
3,Pasta Delight,Fresh Italian pastas,Italian,Chennai
```
---


## ⚛️ React Frontend (Vite)
`frontend/src/App.jsx`

```jsx
import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await fetch(`http://localhost:8000/recommend?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.recommendations);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🍽 Restaurant Recommender</h1>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g., dosa in Bangalore" />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {results.map((r, i) => (
          <li key={i}>
            <strong>{r.name}</strong> - {r.description} ({r.city})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

---
`frontend/src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
`frontend/src/app.css`
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}
```
`frontend/src/index.css`
```css
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}
```
---

`frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Restaurant Recommender</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

`frontend/package.json`

```json
{
  "name": "restaurant-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---
`frontend/eslint.config.js`
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```


`frontend/vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
```

---

`frontend/Dockerfile`

```Dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

`restaurant-recommender/docker-compose.yml`

```yaml
version: "3.9"

services:
  milvus:
    image: milvusdb/milvus:v2.4.4
    ports:
      - "19530:19530"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 10s
      retries: 3
    ulimits:
      nofile:
        soft: 65535
        hard: 65535

  backend:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - milvus

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
```

---

## 🧪 Run the App

```bash
# Start backend, frontend, and Milvus
docker compose up --build
```

Then open:

* 🔧 FastAPI: [http://localhost:8000/docs](http://localhost:8000/docs)
* 💻 React UI: [http://localhost:5173](http://localhost:5173)

Try searching: `biryani hyderabad` or `best dosa in Bangalore`

---


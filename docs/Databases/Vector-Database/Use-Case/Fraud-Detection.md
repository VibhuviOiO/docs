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
│   ├── milvus_client.py
│   ├── embedder.py
│   ├── models.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api.js
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
│   ├── README.md
│   └── Dockerfile
├── data/
├── docker-compose.yml

```
```bash
# Create root
mkdir -p milvus-fraud-detection && cd milvus-fraud-detection

# ---------------------------
# Backend
# ---------------------------
mkdir -p backend
touch backend/{main.py,milvus_client.py,embedder.py,models.py,requirements.txt,Dockerfile}

# ---------------------------
# Frontend
# ---------------------------
mkdir -p frontend/src/assets frontend/public

# Frontend config files
touch frontend/{index.html,package.json,package-lock.json,vite.config.js,eslint.config.js,README.md,Dockerfile}

# Frontend src files
touch frontend/src/{api.js,App.css,App.jsx,index.css,main.jsx}
touch frontend/src/assets/react.svg

# ---------------------------
# Data folder (empty for now)
# ---------------------------
mkdir data

# ---------------------------
# Root files
# ---------------------------
touch docker-compose.yml
```

---

## ⚙️ Backend Setup

`backend/requirements.txt`

```txt
fastapi==0.115.1
uvicorn==0.30.0
pymilvus==2.4.0
sentence-transformers==2.2.2
```

`backend/milvus_client.py`

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

`backend/main.py`

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
`backend/Dockerfile`

```Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 💻 Frontend Setup (Vite + React)

`frontend/src/App.jsx`

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

`frontend/api.js`
```js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
console.log("Backend URL:", BACKEND_URL);  // ✅ Debug check

export async function searchDescription(description) {
  const response = await fetch(`${BACKEND_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    throw new Error("Search failed");
  }

  const data = await response.json();
  return { results: data.matches || [] };
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

`frontend/src/main.jsx`

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

`frontend/src/App.css`

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
`frontend/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
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
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```
`frontend/package.json`
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.29.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.5.2",
    "eslint": "^9.29.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.2.0",
    "vite": "^5.2.0"
  }
}
```
---

`frontend/Dockerfile`

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

`docker-compose.yml`

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

`Insert new fraud record:`

```bash
curl -X POST http://localhost:8000/insert \
  -H "Content-Type: application/json" \
  -d '{"id": 2, "description": "unauthorized ATM withdrawal in delhi"}'
```

`Search for similar activity:`

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"description": "delhi atm fraud"}'
```
---

`Output`

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
```Search On UI :```
```bash
suspicious transaction mumbai
```
---

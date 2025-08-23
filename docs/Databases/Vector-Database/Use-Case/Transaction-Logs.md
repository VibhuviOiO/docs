---
title: PostgreSQL Transaction Logs
sidebar_position: 3
description: Build a hybrid search system using PostgreSQL for storing ACID-compliant transaction logs and pgvector for semantic similarity search. Backend in FastAPI and frontend in React, fully Dockerized and production-ready.
slug: /projects/transaction-search-pgvector
date: 2025-07-03
authors: [venkatesh]
tags: [postgresql, pgvector, fastapi, react, hybrid-search, docker]
keywords:
  - transaction logs
  - postgres vector search
  - pgvector
  - hybrid semantic search
  - fullstack ACID vector app
---

# 🔍 Building a Transaction Search App using FastAPI, React, and PostgreSQL + pgvector

In this blog post, we’ll walk through how to build an intelligent Transaction Search Web Application. It uses natural language processing to help users find similar past transactions using semantic similarity. The stack includes:

* 🧠 `pgvector` (for vector search in PostgreSQL)
* ⚙️ `FastAPI` (for backend API)
* 🖥️ `React` (for frontend)
* 🐳 `Docker Compose` (for full stack orchestration)

---

## 🧱 Folder Structure

```
pgvector-transaction-search/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── db.py
│   ├── vector_utils.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       └── main.jsx
├── docker-compose.yml
```

---

## ⚙️ 1. Setting Up PostgreSQL with pgvector

We’ll use a pre-built pgvector Docker image.

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: ankane/pgvector
    container_name: pgvector-db
    environment:
      POSTGRES_DB: vectordb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/vectordb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## 🚀 2. Backend (FastAPI + pgvector + SentenceTransformers)

### `backend/Dockerfile`

```Dockerfile
FROM python:3.11

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `backend/requirements.txt`

```
fastapi
uvicorn
psycopg2-binary
python-dotenv
sentence-transformers
```

### `backend/db.py`

```python
import psycopg2
import os

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

def init_db():
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT,
        amount NUMERIC,
        description TEXT,
        embedding VECTOR(384)
    );
    """)
    conn.commit()
```

### `backend/vector_utils.py`

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str) -> list:
    return model.encode(text).tolist()
```

### `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import conn, cur, init_db
from vector_utils import get_embedding

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

class Transaction(BaseModel):
    user_id: int
    amount: float
    description: str

@app.post("/add/")
def add_transaction(tx: Transaction):
    try:
        embedding = get_embedding(tx.description)
        cur.execute(
            "INSERT INTO transactions (user_id, amount, description, embedding) VALUES (%s, %s, %s, %s)",
            (tx.user_id, tx.amount, tx.description, embedding)
        )
        conn.commit()
        return {"message": "Transaction added"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

@app.post("/search/")
def search_similar(tx: Transaction):
    try:
        embedding = get_embedding(tx.description)
        cur.execute("""
            SELECT id, user_id, amount, description, embedding <-> %s::vector AS distance
            FROM transactions
            ORDER BY distance ASC
            LIMIT 5
        """, (embedding,))
        return cur.fetchall()
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
```

---

## 🎨 3. Frontend (React + Vite)

### `frontend/Dockerfile`

```Dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
```

### `frontend/package.json`

```json
{
  "name": "transaction-search-ui",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Transaction Search App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `frontend/src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `frontend/src/App.jsx`

```jsx
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [form, setForm] = useState({ user_id: "", amount: "", description: "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    try {
      await axios.post("http://localhost:8000/add/", {
        user_id: parseInt(form.user_id),
        amount: parseFloat(form.amount),
        description: form.description
      });
      alert("Transaction added!");
    } catch (err) {
      console.error("Add failed", err);
      alert("Error adding transaction");
    }
  };

  const handleSearch = async () => {
    try {
      const res = await axios.post("http://localhost:8000/search/", {
        user_id: parseInt(form.user_id),
        amount: parseFloat(form.amount),
        description: query || form.description,
      });
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
      alert("Error during search");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Transaction Search App</h1>

      <h2>Add Transaction</h2>
      <div>
        <input name="user_id" value={form.user_id} onChange={handleChange} placeholder="User ID" />
        <input name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
        <button onClick={handleAdd}>Add</button>
      </div>

      <h2>Search</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by description" />
      <button onClick={handleSearch}>Search</button>

      {results.length > 0 && (
        <table border="1" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            {results.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.user_id}</td>
                <td>{tx.amount}</td>
                <td>{tx.description}</td>
                <td>{parseFloat(tx.distance).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
```

---

### `🚀 Run with Docker`

```bash
docker compose down
docker compose up --build
```
### `🌐 Use the App`

Open in browser:
Frontend → [http://localhost:3000](http://localhost:3000)

Backend Docs → [http://localhost:8000/docs](http://localhost:8000/docs)

Try adding:

```
User ID: 108  
Amount: 2000  
Description: Train to Shimla
```

Then search for:

```
shimla
```

---

## ✅ Final Result Example

```
Results:
ID   User ID   Amount   Description         Distance
13   108       2000     Train to Shimla     0.6236
5    101       250      Coffee at Starbucks 1.2000
```

---

## 💼 Why is This Useful for Clients?

* 🔍 **Semantic Search**: Search descriptions like “tea bill” and find “Starbucks coffee” – thanks to embeddings.
* 🧾 **Finance Dashboards**: Smart filters for past spending.
* 🧠 **AI-powered UX**: Easily add smart search to legacy systems.
* ✅ **Production Ready**: Containerized, scalable, and easy to deploy.

---


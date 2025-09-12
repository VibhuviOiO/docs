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
🧱 Folder Structure
pgvector-transaction-search/
├── backend/
│   ├── app/
│   │   ├── db.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── vector_utils.py
│   ├── Dockerfile
│   └── wait-for-it.sh
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── components/
│           └── SearchForm.jsx
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md
```
---
```bash
# Create root project
mkdir pgvector-transaction-search && cd pgvector-transaction-search

# Backend
mkdir -p backend/app
touch backend/Dockerfile backend/wait-for-it.sh
touch backend/app/{db.py,main.py,models.py,vector_utils.py}

# Frontend
mkdir -p frontend/src/components frontend/public
touch frontend/Dockerfile frontend/index.html frontend/package.json frontend/vite.config.js
touch frontend/src/{App.jsx,main.jsx}
touch frontend/src/components/SearchForm.jsx

# Root files
touch docker-compose.yml package.json package-lock.json README.md
```

---


---

### Backend (FastAPI + pgvector + SentenceTransformers)
`backend/db.py`

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

`backend/vector_utils.py`

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str) -> list:
    return model.encode(text).tolist()
```

`backend/main.py`

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
`backend/requirements.txt`

```txt
fastapi
uvicorn
psycopg2-binary
python-dotenv
sentence-transformers
```

`backend/Dockerfile`

```Dockerfile
FROM python:3.11

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
`wait-for-it.sh`
```sh
#!/usr/bin/env bash
# Use this script to test if a given TCP host/port are available

WAITFORIT_cmdname=${0##*/}

echoerr() { if [[ $WAITFORIT_QUIET -ne 1 ]]; then echo "$@" 1>&2; fi }

usage()
{
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname host:port [-s] [-t timeout] [-- command args]
    -h HOST | --host=HOST       Host or IP under test
    -p PORT | --port=PORT       TCP port under test
                                Alternatively, you specify the host and port as host:port
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for()
{
    if [[ $WAITFORIT_TIMEOUT -gt 0 ]]; then
        echoerr "$WAITFORIT_cmdname: waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    else
        echoerr "$WAITFORIT_cmdname: waiting for $WAITFORIT_HOST:$WAITFORIT_PORT without a timeout"
    fi
    WAITFORIT_start_ts=$(date +%s)
    while :
    do
        if [[ $WAITFORIT_ISBUSY -eq 1 ]]; then
            nc -z $WAITFORIT_HOST $WAITFORIT_PORT
            WAITFORIT_result=$?
        else
            (echo -n > /dev/tcp/$WAITFORIT_HOST/$WAITFORIT_PORT) >/dev/null 2>&1
            WAITFORIT_result=$?
        fi
        if [[ $WAITFORIT_result -eq 0 ]]; then
            WAITFORIT_end_ts=$(date +%s)
            echoerr "$WAITFORIT_cmdname: $WAITFORIT_HOST:$WAITFORIT_PORT is available after $((WAITFORIT_end_ts - WAITFORIT_start_ts)) seconds"
            break
        fi
        sleep 1
    done
    return $WAITFORIT_result
}

wait_for_wrapper()
{
    # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
    if [[ $WAITFORIT_QUIET -eq 1 ]]; then
        timeout $WAITFORIT_BUSYTIMEFLAG $WAITFORIT_TIMEOUT $0 --quiet --child --host=$WAITFORIT_HOST --port=$WAITFORIT_PORT --timeout=$WAITFORIT_TIMEOUT &
    else
        timeout $WAITFORIT_BUSYTIMEFLAG $WAITFORIT_TIMEOUT $0 --child --host=$WAITFORIT_HOST --port=$WAITFORIT_PORT --timeout=$WAITFORIT_TIMEOUT &
    fi
    WAITFORIT_PID=$!
    trap "kill -INT -$WAITFORIT_PID" INT
    wait $WAITFORIT_PID
    WAITFORIT_RESULT=$?
    if [[ $WAITFORIT_RESULT -ne 0 ]]; then
        echoerr "$WAITFORIT_cmdname: timeout occurred after waiting $WAITFORIT_TIMEOUT seconds for $WAITFORIT_HOST:$WAITFORIT_PORT"
    fi
    return $WAITFORIT_RESULT
}

# process arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        *:* )
        WAITFORIT_hostport=(${1//:/ })
        WAITFORIT_HOST=${WAITFORIT_hostport[0]}
        WAITFORIT_PORT=${WAITFORIT_hostport[1]}
        shift 1
        ;;
        --child)
        WAITFORIT_CHILD=1
        shift 1
        ;;
        -q | --quiet)
        WAITFORIT_QUIET=1
        shift 1
        ;;
        -s | --strict)
        WAITFORIT_STRICT=1
        shift 1
        ;;
        -h)
        WAITFORIT_HOST="$2"
        if [[ $WAITFORIT_HOST == "" ]]; then break; fi
        shift 2
        ;;
        --host=*)
        WAITFORIT_HOST="${1#*=}"
        shift 1
        ;;
        -p)
        WAITFORIT_PORT="$2"
        if [[ $WAITFORIT_PORT == "" ]]; then break; fi
        shift 2
        ;;
        --port=*)
        WAITFORIT_PORT="${1#*=}"
        shift 1
        ;;
        -t)
        WAITFORIT_TIMEOUT="$2"
        if [[ $WAITFORIT_TIMEOUT == "" ]]; then break; fi
        shift 2
        ;;
        --timeout=*)
        WAITFORIT_TIMEOUT="${1#*=}"
        shift 1
        ;;
        --)
        shift
        WAITFORIT_CLI=("$@")
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$WAITFORIT_HOST" == "" || "$WAITFORIT_PORT" == "" ]]; then
    echoerr "Error: you need to provide a host and port to test."
    usage
fi

WAITFORIT_TIMEOUT=${WAITFORIT_TIMEOUT:-15}
WAITFORIT_STRICT=${WAITFORIT_STRICT:-0}
WAITFORIT_CHILD=${WAITFORIT_CHILD:-0}
WAITFORIT_QUIET=${WAITFORIT_QUIET:-0}

# Check to see if timeout is from busybox?
WAITFORIT_TIMEOUT_PATH=$(type -p timeout)
WAITFORIT_TIMEOUT_PATH=$(realpath $WAITFORIT_TIMEOUT_PATH 2>/dev/null || readlink -f $WAITFORIT_TIMEOUT_PATH)

WAITFORIT_BUSYTIMEFLAG=""
if [[ $WAITFORIT_TIMEOUT_PATH =~ "busybox" ]]; then
    WAITFORIT_ISBUSY=1
    # Check if busybox timeout uses -t flag
    # (recent Alpine versions don't support -t anymore)
    if timeout &>/dev/stdout | grep -q -e '-t '; then
        WAITFORIT_BUSYTIMEFLAG="-t"
    fi
else
    WAITFORIT_ISBUSY=0
fi

if [[ $WAITFORIT_CHILD -gt 0 ]]; then
    wait_for
    WAITFORIT_RESULT=$?
    exit $WAITFORIT_RESULT
else
    if [[ $WAITFORIT_TIMEOUT -gt 0 ]]; then
        wait_for_wrapper
        WAITFORIT_RESULT=$?
    else
        wait_for
        WAITFORIT_RESULT=$?
    fi
fi

if [[ $WAITFORIT_CLI != "" ]]; then
    if [[ $WAITFORIT_RESULT -ne 0 && $WAITFORIT_STRICT -eq 1 ]]; then
        echoerr "$WAITFORIT_cmdname: strict mode, refusing to execute subprocess"
        exit $WAITFORIT_RESULT
    fi
    exec "${WAITFORIT_CLI[@]}"
else
    exit $WAITFORIT_RESULT
fi
```

---

### 🎨 3. Frontend (React + Vite)

`frontend/src/main.jsx`

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

`frontend/src/App.jsx`
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

`frontend/src/api.js`
```js
import axios from "axios";

const API_BASE = "http://localhost:8000";  // adjust if using Docker externally

export const addTransaction = async (data) => {
  return axios.post(`${API_BASE}/add/`, data);
};

export const searchTransactions = async (data) => {
  return axios.post(`${API_BASE}/search/`, data);
};
```


`frontend/src/components/SearchForm.jsx`
```jsx
import React, { useState } from "react";
import axios from "axios";

function SearchForm() {
  const [description, setDescription] = useState("");
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:8000/search/", {
      user_id: 0,
      amount: 0,
      description,
    });
    setResults(res.data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Search by description" />
        <button type="submit">Search</button>
      </form>
      <ul>
        {results.map((r) => (
          <li key={r[0]}>{r[3]} (Score: {r[4].toFixed(4)})</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchForm;
```


`frontend/index.html`

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

`frontend/vite.config.js`

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

`frontend/package.json`

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

`frontend/Dockerfile`

```Dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---
`pgvector-transaction-search/package.json`
```json
{
  "dependencies": {
    "axios": "^1.10.0"
  }
}
```

`pgvector-transaction-search`

/docker-compose.yml`

```yaml
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

### ✅ Final Result Example

```
Results:
ID   User ID   Amount   Description         Distance
13   108       2000     Train to Shimla     0.6236
5    101       250      Coffee at Starbucks 1.2000
```

---

### 💼 Why is This Useful

* 🔍 **Semantic Search**: Search descriptions like “tea bill” and find “Starbucks coffee” – thanks to embeddings.
* 🧾 **Finance Dashboards**: Smart filters for past spending.
* 🧠 **AI-powered UX**: Easily add smart search to legacy systems.
* ✅ **Production Ready**: Containerized, scalable, and easy to deploy.

---


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
│   ├── embed_utils.py
│   ├── utils/
│   │   └── llm_utils.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── scripts/
│   │   ├── load_squad.py
│   │   └── dev-v2.0.json
│   └── wheels/
│       └── nvidia_cudnn_cu12-9.5.1.17-py3-none-manylinux_2_28_x86_64.whl
├── frontend/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts
│   │   └── assets/
│   │       └── react.svg
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md


```
```bash
# Create root folder
mkdir -p qa-hybrid-search && cd qa-hybrid-search

# ---------------------------
# Backend
# ---------------------------
mkdir -p backend/utils backend/scripts backend/wheels

# Backend files
touch backend/app.py
touch backend/embed_utils.py
touch backend/requirements.txt
touch backend/Dockerfile

# Backend utils
touch backend/utils/llm_utils.py

# Backend scripts
touch backend/scripts/load_squad.py
touch backend/scripts/dev-v2.0.json

# Backend wheels (placeholder, since real .whl is binary)
touch backend/wheels/nvidia_cudnn_cu12-9.5.1.17-py3-none-manylinux_2_28_x86_64.whl

# ---------------------------
# Frontend
# ---------------------------
mkdir -p frontend/src/assets frontend/public

# Frontend main files
touch frontend/index.html
touch frontend/package.json
touch frontend/package-lock.json
touch frontend/vite.config.ts
touch frontend/tsconfig.json
touch frontend/tsconfig.app.json
touch frontend/tsconfig.node.json
touch frontend/eslint.config.js
touch frontend/Dockerfile
touch frontend/nginx.conf

# Frontend src files
touch frontend/src/App.css
touch frontend/src/App.tsx
touch frontend/src/index.css
touch frontend/src/main.tsx
touch frontend/src/vite-env.d.ts

# Frontend asset
touch frontend/src/assets/react.svg

# ---------------------------
# Root level
# ---------------------------
touch docker-compose.yml
touch README.md
```

---

### Backend (FastAPI)

`backend/app.py`

```py
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
```

`backend/embed_utils.py`

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str):
    return model.encode(text).tolist()
```

`backend/utils/llm_utils.py`

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
`backend/scripts/load_squad_data.py`
```py
import json
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

client = MongoClient("mongodb+srv://mernuser:mernpass@cluster0.dhlaypm.mongodb.net/")
db = client["qa_hybrid"]
collection = db["documents"]
model = SentenceTransformer("all-MiniLM-L6-v2")

with open("scripts/dev-v2.0.json", "r") as f:
    squad_data = json.load(f)

docs_to_insert = []
for article in squad_data["data"]:
    for paragraph in article["paragraphs"]:
        context = paragraph["context"]
        for qa in paragraph["qas"]:
            if qa["is_impossible"]:
                continue
            question = qa["question"]
            answer = qa["answers"][0]["text"]
            embedding = model.encode(question).tolist()

            docs_to_insert.append({
                "question": question,
                "answer": answer,
                "context": context,
                "embedding": embedding,
                "source": "squad"
            })

if docs_to_insert:
    collection.insert_many(docs_to_insert)
    print(f"✅ Inserted {len(docs_to_insert)} documents")
```
`dev-v2.0.json`
```json
{"version": "v2.0", "data": [{"title": "Normans", "paragraphs": [{"qas": [{"question": "In what country is Normandy located?", "id": "56ddde6b9a695914005b9628", "answers": [{"text": "France", "answer_start": 159}, {"text": "France", "answer_start": 159}, {"text": "France", "answer_start": 159}, {"text": "France", "answer_start": 159}], "is_impossible": false}, {"question": "When were the Normans in Normandy?", "id": "56ddde6b9a695914005b9629", "answers": [{"text": "10th and 11th centuries", "answer_start": 94}, {"text": "in the 10th and 11th centuries", "answer_start": 87},
```
`backend/requirements.txt`

```bash
fastapi
uvicorn
pymongo
scikit-learn
sentence-transformers
python-dotenv
requests
```

`backend/Dockerfile`

```Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Load SQuAD Data

Place `dev-v2.0.json` in `scripts/`, then run:

`scripts/load_squad.py`

```py
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

`Run it:`

```bash
docker-compose run backend python scripts/load_squad.py
```

---

### 🌐 Frontend (React + Vite)

`frontend/src/App.tsx`

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

`frontend/src/main.tsx`

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
`frontend/src/App.css`
```css
.app {
  font-family: Arial, sans-serif;
  padding: 2rem;
  max-width: 600px;
  margin: auto;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

button {
  padding: 10px 20px;
  font-size: 1rem;
}

.results .card {
  background-color: #f8f8f8;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

`vite-env.d.ts`
```ts
/// <reference types="vite/client" />
```

`frontend/index.html`

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
`frontend/vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

`frontend/tsconfig.json`
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```
`frontend/tsconfig.app.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`frontend/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```
`frontend/eslint.config.js`
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
```
`nginx.conf`

```bash
server {
  listen 80;
  server_name localhost;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```
`frontend/package.json`

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
`qa-hybrid-search/vite.dev.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

`frontend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist"]
```

---

`qa-hybrid-search/.env`

```bash
MONGODB_URL=mongodb://mongodb:27017
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3
```

`docker-compose.yml`

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

`🚀 Run and Test`

```bash
docker compose up --build
````
---

### Pull and run LLaMA3

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
In what country is Normandy located?"
```

They get a generated answer and matching context from the vector database:

```js
Q: In what country is Normandy located?
A: France

Score: 0.978
```
---

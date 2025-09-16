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


# A Complete Guide to Building a **Semantic Search Engine for Health Articles Using FastAPI, Weaviate, and React**

This project walks through every step from document ingestion, embedding generation using SentenceTransformers, and querying with Weaviate, to displaying results in a user-friendly React interface. Ideal for healthcare AI assistants, symptom checkers, or wellness product recommendation engines.


---

### Architecture

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

### 📁 Folder Structure

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
│   ├── scripts/
│   │   └── ingest.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── App.css
│   ├── index.html
│   ├── package.json
│   └── dockerfile
├── data/
│   └── health_articles.json
├── docker-compose.yml
└── README.md

```
```bash

mkdir -p healthsearch-recommender
cd healthsearch-recommender


touch docker-compose.yml README.md


mkdir -p backend/app backend/scripts
touch backend/Dockerfile backend/requirements.txt
touch backend/app/api.py backend/app/config.py backend/app/embedding.py \
      backend/app/main.py backend/app/models.py backend/app/search.py
touch backend/scripts/ingest.py


mkdir -p data
touch data/health_articles.json


mkdir -p frontend/src frontend/public frontend/node_modules
touch frontend/dockerfile frontend/eslint.config.js frontend/index.html \
      frontend/nginx.conf frontend/package.json frontend/package-lock.json \
      frontend/README.md frontend/vite.config.js


touch frontend/src/App.css frontend/src/App.jsx frontend/src/App.test.js \
      frontend/src/index.css frontend/src/logo.svg frontend/src/main.jsx \
      frontend/src/reportWebVitals.js frontend/src/setupTests.js


touch frontend/public/favicon.ico frontend/public/index.html \
      frontend/public/logo192.png frontend/public/logo512.png \
      frontend/public/manifest.json frontend/public/robots.txt

```



### ⚙️ Backend Setup (FastAPI + Weaviate)

`backend/app/main.py`
```py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router

app = FastAPI(title="HealthSearch Recommender")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="")
```

`backend/app/api.py`
```py
from fastapi import APIRouter
from pydantic import BaseModel
from app.search import perform_search

router = APIRouter()

class SearchRequest(BaseModel):
    query: str

@router.post("/search")
def search_articles(req: SearchRequest):
    return perform_search(req.query)
```

`backend/app/search.py`

```py
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
`backend/app/embedding.py`

```py
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str):
    return model.encode(text).tolist()
```
`backend/app/config.py`
```bash
WEAVIATE_URL = "http://weaviate:8080"
```

`backend/app/models.py`
```py
from pydantic import BaseModel
from typing import List

class Article(BaseModel):
    title: str
    content: str

class SearchResponse(BaseModel):
    results: List[Article]
```

`backend/scripts/ingest.py`
```py
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

if __name__ == "__main__":
    ingest()
```
`backend/requirements.txt`
```txt
fastapi
uvicorn
weaviate-client
sentence-transformers
pydantic

```
`backend/dockerfile`
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN  pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY scripts/ scripts/


CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
### ⚛️ Frontend Setup (React + Vite)

`frontend/src/App.jsx`
```jsx
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
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🧪 HealthSearch Recommender</h1>
      <input
        type="text"
        placeholder="e.g. headache remedies"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px", width: "300px" }}
      />
      <button onClick={handleSearch} style={{ marginLeft: "10px" }}>
        Search
      </button>
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
`frontend/src/App.test.js`
```js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

`frontend/src/index.css`
```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```


`frontend/src/app.css`
```css
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

```
`frontend/src/reportWebVitals.js `
```js
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

```

`frontend/src/setupTests.js`
```js


frontend/package.json
```json
{
  "name": "healthsearch-frontend",
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
    "vite": "^4.4.0"
  }
}
```
#### 📦 Sample Dataset

`data/health_articles.json`
```json
[
  {
    "title": "Natural Remedies for Headaches",
    "content": "Hydration, rest, and magnesium-rich foods can help reduce headaches naturally."
  },
  {
    "title": "Flu Symptoms and Treatments",
    "content": "Common flu symptoms include fever, cough, sore throat, and fatigue. Rest and fluids are key."
  },
  {
    "title": "Boosting Immunity with Vitamin C",
    "content": "Fruits like oranges, kiwi, and bell peppers are rich in Vitamin C and support immunity."
  },
  {
    "title": "Managing Stress for Better Health",
    "content": "Mindfulness, exercise, and proper sleep reduce stress and improve overall health."
  },
  {
    "title": "Natural Cold Remedies",
    "content": "Ginger tea, honey, and steam inhalation are effective for soothing cold symptoms."
  }
]
```
`frontend/dockerfile`
```dockerfile
# Step 1: Build React app
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
`frontend/eslint.config.js`
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
```

`frontend/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🧪 HealthSearch Recommender</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```
`nginx.conf`
```conf
server {
    listen 80;

    server_name localhost;

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve frontend app
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri /index.html;
    }
}
```
`frontend/package.json`
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.1",
    "vite": "^7.1.3"
  }
}
```
`healthsearch-recommender/vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```
`healthsearch-recommender/docker-compose.yml`
```bash
version: "3.9"

services:
  weaviate:
    image: semitechnologies/weaviate:1.31.1
    ports:
      - "8080:8080"
    environment:
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true"
      ENABLE_MODULES: none
      DEFAULT_VECTORIZER_MODULE: none
    volumes:
      - weaviate_data:/var/lib/weaviate

  backend:
    build:
      context: ./backend
    ports:
      - "8001:8000"        # backend reachable on localhost:8001 (mainly for curl)
    depends_on:
      - weaviate
    volumes:
      - ./data:/app/data

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:80"          # app at http://localhost:3000
    depends_on:
      - backend

volumes:
  weaviate_data:

```
`▶️ Run the Project`
```bash
# 1. Build and start all services
docker-compose up --build

# 2. Ingest health articles
docker exec -it healthsearch-recommender-backend-1 python scripts/ingest.py
```
`🌐 Access the Services`
| Component       | URL                                                      | Description                     |
| --------------- | -------------------------------------------------------- | ------------------------------- |
| 💻 React UI     | [http://localhost:3000](http://localhost:3000)           | User Interface built with React |
| ⚙️ FastAPI Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger/OpenAPI UI              |
| 🪶 Weaviate     | [http://localhost:8080](http://localhost:8080)           | Vector Database API             |


`Try queries like:`
```txt
"flu symptoms"

"natural remedies for cold"

"treat headache"
```
`Reference`

- [When Large Language Models Meet Vector Databases: A Survey](https://arxiv.org/html/2402.01763v1?utm_source=chatgpt.com)


---


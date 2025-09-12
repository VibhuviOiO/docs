---
title: Personalized Recommendation
sidebar_position: 4
description: Build a full-stack personalized recommendation system using FAISS for offline ANN-based vector search, SentenceTransformers for item/user embeddings, LightFM for collaborative filtering, FastAPI backend, and a React UI. Fully Dockerized.
slug: /projects/personalized-recommendation-faiss
date: 2025-07-03
authors: [venkatesh]
tags: [faiss, fastapi, react, recommendation-system, vector-db, docker, ann]
keywords:
  - personalized recommendation
  - faiss fastapi react
  - offline ANN search
  - collaborative filtering
  - sentence-transformers
  - fullstack vector search
---

# Build a full-stack personalized recommendation system using FAISS 

For offline ANN-based vector search,SentenceTransformers for item/user embeddings, LightFM for collaborative filtering, FastAPI backend, and a React UI. Fully Dockerized.


## 📁 Folder Structure

```
faiss-docker/personalized-rec/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── embeddings.py
│   └── recommender.py
├── data/
│   ├── items.csv
│   └── interactions.csv
├── rec-frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       └── components/
│           ├── ItemDetails.jsx
│           └── RecommendationForm.jsx
└── docker-compose.yml

```
```bash
# 1️⃣ Create project root and enter
mkdir -p ~/nprojects/faiss-docker/personalized-rec
cd ~/nprojects/faiss-docker/personalized-rec

# 2️⃣ Backend folder and files
mkdir backend
cd backend
touch Dockerfile requirements.txt main.py embeddings.py recommender.py
cd ..

# 3️⃣ Data folder and files
mkdir data
cd data
touch items.csv interactions.csv
cd ..

# 4️⃣ React frontend (create app and components)
npx create-react-app frontend
cd frontend/src
mkdir components
cd components
touch ItemDetails.jsx RecommendationForm.jsx
cd ../../..

# 5️⃣ Docker Compose file at project root
touch docker-compose.yml
```
### ⚙️ Backend Setup (FastAPI + Faiss)

`backend/embeddings.py`

```python
from sentence_transformers import SentenceTransformer
import pandas as pd

model = SentenceTransformer("all-MiniLM-L6-v2")
items = pd.read_csv("data/items.csv")
texts = items["title"] + ". " + items["description"]
item_embeddings = model.encode(texts.tolist(), show_progress_bar=True)
```
---

`backend/main.py`

```python

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.recommender import recommend_items, get_item_metadata

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recommend/{user_id}")
def recommend(user_id: int):
    item_ids = recommend_items(user_id)
    return {"user_id": user_id, "recommended_items": item_ids}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    return get_item_metadata(item_id)
```
`backend/recommander.py`
```py
import pandas as pd
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from lightfm import LightFM
from lightfm.data import Dataset
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Load data
items = pd.read_csv("data/items.csv")
interactions = pd.read_csv("data/interactions.csv")

# SentenceTransformer for item embeddings
model = SentenceTransformer("all-MiniLM-L6-v2")
item_texts = items["title"] + ". " + items["description"]
item_embeddings = model.encode(item_texts.tolist(), show_progress_bar=True)

# LightFM for user embeddings
ds = Dataset()
ds.fit(interactions["user_id"], interactions["item_id"])
num_users, num_items = ds.interactions_shape()
(interaction_matrix, _) = ds.build_interactions([
    (u, i, r) for u, i, r in interactions[["user_id", "item_id", "rating"]].values
])
cf_model = LightFM(loss="warp", no_components=item_embeddings.shape[1])
cf_model.fit(interaction_matrix, epochs=10, num_threads=2)
user_embeddings = cf_model.user_embeddings
user_map = ds.mapping()[0]  # user_id → index
item_map = ds.mapping()[2]  # index → item_id

# FAISS index
index = faiss.IndexFlatL2(item_embeddings.shape[1])
index.add(item_embeddings.astype("float32"))

def recommend_items(user_id, top_k=5):
    if user_id not in user_map:
        return []

    user_idx = user_map[user_id]
    user_vector = user_embeddings[user_idx].reshape(1, -1).astype("float32")
    _, indices = index.search(user_vector, top_k)

    item_ids = [int(items.iloc[i]["item_id"]) for i in indices[0]]
    return item_ids

def get_item_metadata(item_id):
    match = items[items["item_id"] == item_id]
    if not match.empty:
        row = match.iloc[0]
        return {"title": row["title"], "description": row["description"]}
    return None

@app.get("/recommend/{user_id}")
def recommend(user_id: int):
    recs = recommend_items(user_id)
    if not recs:
        raise HTTPException(status_code=404, detail="User not found or no recommendations")
    return {"user_id": user_id, "recommended_items": recs}

@app.get("/items/{item_id}")
def item_info(item_id: int):
    item = get_item_metadata(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```
---
`backend/requirements.txt`
```bash
pandas
faiss-cpu
numpy
sentence-transformers
lightfm
fastapi
uvicorn
```
`backend/dockerfile`

```dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/ ./
COPY data/ ./data/
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Insert Data
 
`data/interactions.csv`
```bash
user_id,item_id,rating
101,1,5
101,2,4
101,3,3
102,2,5
102,4,4
103,1,2
103,5,5
104,3,4
104,4,5
105,2,3
105,5,4
```
`data/items.csv`
```txt
item_id,title,description
1,Wireless Mouse,Ergonomic mouse with USB receiver
2,Mechanical Keyboard,RGB backlit keyboard with blue switches
3,Laptop Stand,Adjustable aluminum stand for laptops
4,USB-C Hub,Multiport adapter with HDMI and USB 3.0
5,Noise Cancelling Headphones,Bluetooth over-ear headphones with mic
```

### React Frontend (Minimal UI)
`frontend/src/components/ItemDetails.jsx`
```jsx
// src/components/ItemDetails.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const ItemDetails = ({ itemIds }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadItems = async () => {
      const results = await Promise.all(
        itemIds.map((id) =>
          axios
            .get(`http://localhost:8000/items/${id}`)
            .then((res) => ({ id, ...res.data }))
            .catch(() => null)
        )
      );
      setItems(results.filter(Boolean));
    };

    if (itemIds.length > 0) loadItems();
  }, [itemIds]);

  return (
    <div>
      <h3>Recommended Items</h3>
      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ccc", margin: "10px" }}>
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ItemDetails;
```
`frontend/src/components/RecommendationForm.jsx`
```jsx
import { useState } from "react";
import axios from "axios";

const RecommendationForm = ({ onRecommendations }) => {
  const [userId, setUserId] = useState("");

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/recommend/${userId}`);
      onRecommendations(res.data.recommended_items);
    } catch (err) {
      alert("No recommendations found for this user ID.");
    }
  };

  return (
    <div>
      <h2>Get Recommendations</h2>
      <input
        type="number"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={fetchRecommendations}>Fetch</button>
    </div>
  );
};

export default RecommendationForm;
```

`frontend/ src/components/App.jsx`
```jsx
import React, { useState } from 'react';

function App() {
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setError('');
    setRecommendations([]);

    try {
      const res = await fetch(`http://localhost:8000/recommend/${userId}`);
      if (!res.ok) throw new Error('User not found or server error');

      const data = await res.json();
      const items = await Promise.all(
        data.recommended_items.map(async (itemId) => {
          const itemRes = await fetch(`http://localhost:8000/items/${itemId}`);
          if (!itemRes.ok) return { title: 'Unknown', description: 'Error loading item' };
          return itemRes.json();
        })
      );
      setRecommendations(items);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Personalized Recommender</h1>

      <input
        type="number"
        placeholder="Enter user ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ marginRight: '1rem', padding: '0.5rem' }}
      />
      <button onClick={fetchRecommendations}>Get Recommendations</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {recommendations.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Recommended Items:</h2>
          {recommendations.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

```
`frontend/src/components/App.test.js`
```js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

`frontend/src/components/index.js`
```js
import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```
`frontend/src/reportWebVitals.js`
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
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
```


---


`frontend/dockerfile`

```dockerfile
FROM node:18
WORKDIR /app
COPY frontend/ ./
RUN npm install
CMD ["npm", "start"]
```
`frontend/package.json`
```json
{
  "name": "rec-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.10.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
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
  }
}
```
`docker-compose.yml`

```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: rec-backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data

  frontend:
    build:
      context: ./rec-frontend
      dockerfile: Dockerfile
    container_name: rec-frontend
    ports:
      - "3000:3000"
```
---
Run all services:

```bash
docker compose up --build
```

---

## ✅ Output

* Access React frontend at: [http://localhost:3000](http://localhost:3000)
* Try user ID like `101`, `102`, etc.
* It will fetch recommended item IDs from FastAPI backend

---

## 🧠 Why This Matters

This solution combines the power of **content-based filtering** and **collaborative filtering** for highly personalized product recommendations. Ideal for:

* E-commerce sites
* Product platforms
* Media recommendation engines

In your case, you gave LightFM a table like this:

| user_id | item_id | rating |
|---------|---------|--------|
| 101     | 1       | 1      |
| 101     | 3       | 1      |
| 102     | 2       | 1      |


---

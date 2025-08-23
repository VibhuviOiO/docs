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
#  Personalized Recommendation System
Build a full-stack personalized recommendation system using FAISS for offline ANN-based vector search, SentenceTransformers for item/user embeddings, LightFM for collaborative filtering, FastAPI backend, and a React UI. Fully Dockerized.


## 📁 Folder Structure

```
personalized-rec/
├── backend/
│   ├── embeddings.py
│   ├── main.py
│   ├── recommender.py
│   ├── requirements.txt
│   └── Dockerfile
├── data/
│   ├── interactions.csv
│   └── items.csv
├── rec-frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   └── src/
│       ├── index.js
│       ├── index.css
│       └── components/
│           └── App.jsx
├── docker-compose.yml
└── README.md
```

---

## 🧱 Step-by-Step Architecture

### Prepare the Dataset

Create two CSV files in `data/`:

* `items.csv`: Contains columns `item_id,title,description`
* `interactions.csv`: Contains columns `user_id,item_id,rating`

Example:

```csv
# items.csv
item_id,title,description
1,Wireless Mouse,Ergonomic mouse with USB receiver
...

# interactions.csv
user_id,item_id,rating
101,1,1
101,2,1
102,3,1

```
---

### Generate Item Embeddings

```python
# embeddings.py
from sentence_transformers import SentenceTransformer
import pandas as pd

model = SentenceTransformer("all-MiniLM-L6-v2")
items = pd.read_csv("data/items.csv")
texts = items["title"] + ". " + items["description"]
item_embeddings = model.encode(texts.tolist(), show_progress_bar=True)
```

---

### Collaborative Filtering with LightFM

```python
from lightfm import LightFM
from lightfm.data import Dataset

interactions = pd.read_csv("data/interactions.csv")
ds = Dataset()
ds.fit(interactions["user_id"], interactions["item_id"])
(interaction_matrix, _) = ds.build_interactions([
    (u, i, r) for u, i, r in interactions[["user_id", "item_id", "rating"]].values
])
cf_model = LightFM(loss="warp", no_components=item_embeddings.shape[1])
cf_model.fit(interaction_matrix, epochs=10)
user_embeddings = cf_model.user_embeddings
```
---

### FastAPI Backend

```python
# main.py
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
---
### Index Items in FAISS

```python
import faiss
import numpy as np

index = faiss.IndexFlatL2(item_embeddings.shape[1])
index.add(item_embeddings.astype("float32"))
```


### React Frontend (Minimal UI)

```jsx
// src/components/App.jsx
import { useState } from 'react';

function App() {
  const [userId, setUserId] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const fetchRecs = async () => {
    const res = await fetch(`http://localhost:8000/recommend/${userId}`);
    const data = await res.json();
    setRecommendations(data.recommended_items);
  };

  return (
    <div>
      <h1>Personalized Recommender</h1>
      <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter user ID" />
      <button onClick={fetchRecs}>Get Recommendations</button>
      <ul>
        {recommendations.map(id => <li key={id}>Item ID: {id}</li>)}
      </ul>
    </div>
  );
}

export default App;
```

---

### Dockerization

**backend/Dockerfile**:

```Dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/ ./
COPY data/ ./data/
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**rec-frontend/Dockerfile**:

```Dockerfile
FROM node:18
WORKDIR /app
COPY rec-frontend/ ./
RUN npm install
CMD ["npm", "start"]
```

**docker-compose.yml**:

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

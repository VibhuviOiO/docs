---
sidebar_position: 5
title: MongoDB
description: MongoDB is a popular NoSQL database designed for high performance, scalability, and flexibility. Learn how to use MongoDB for storing and querying JSON-like documents in modern applications.
slug: /database/mongodb
keywords:
  - MongoDB
  - NoSQL database
  - document database
  - MongoDB tutorial
  - MongoDB for developers
  - schema-less database
  - JSON storage
  - scalable database
  - MongoDB setup
  - MongoDB guide
---
# Run MongoDB in Docker and Perform Basic Queries with Mongosh

 MongoDB is a popular NoSQL database designed for high performance, scalability, and flexibility. Learn how to use MongoDB for storing and querying JSON-like documents in modern applications.

## Create `docker-compose.yml`

Create a new folder mongodb-docker and add this docker-compose.yml :

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongo-db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  mongo-express:
    image: mongo-express
    container_name: mongo-ui
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: root
      ME_CONFIG_MONGODB_ADMINPASSWORD: example
      ME_CONFIG_MONGODB_SERVER: mongodb
    depends_on:
      - mongodb
    restart: unless-stopped

volumes:
  mongo-data:
````

Then run:

```bash
docker compose up -d
```

### 🔍 What’s Running?

* MongoDB: [localhost:27017](http://localhost:27017) (backend)
* Mongo Express UI: [http://localhost:8081](http://localhost:8081) (web dashboard)

---
### Getting Started with MongoDB: Insert & Query Data Using mongosh

Connect Using mongosh

```bash
docker exec -it mongo-db mongosh -u root -p example
```

---

### Insert a Document

```js
use myTestDB
```

```js
db.users.insertOne({
  name: "Venkatesh",
  role: "Developer",
  active: true
})
```

You’ll see a confirmation message like:

```json
{
  acknowledged: true,
  insertedId: ObjectId("...")
}
```

---

### Query the Data

```js
db.users.find().pretty()
```

Expected output:

```json
{
  "_id" : ObjectId("..."),
  "name" : "Venkatesh",
  "role" : "Developer",
  "active" : true
}
```
### `Real-World Use Cases:`

| Industry           | Example Use Case                                                                                                            |
|--------------------|---------------------------------------------------------------------------------------------------------------------------|
| 🔎 Semantic Search | Store product descriptions, articles, or user queries as vector embeddings and retrieve similar ones (like Google Search) |
| 🛍️ E-Commerce     | Recommend similar products by storing product image/text embeddings                                                       |
| 🧠 Chatbots        | Store past conversations or question-answer pairs as embeddings to enable intelligent matching                            |
| 📸 Media Search    | Use vector similarity to find visually similar images, audio files, or videos                                             |
| 🧬 Healthcare      | Search medical cases, X-rays, or gene sequences using vector similarity                                                   |


---
Use case
- [QA Hybrid Search App with MongoDB, FastAPI, Ollama & React](./Use-Case/Hybrid-Search.md)

# References

* [MongoDB Official Documentation](https://www.mongodb.com/docs/)  
* [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
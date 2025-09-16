---
sidebar_position: 1
title: "⚡ Run MongoDB Locally for Dev"
description: "Quick guide to run MongoDB 8 in a container with persistence for dev use. Bind to all IPs, mount data, and you're good to go."
slug: /RunMongoDBForDev
image: https://jinnabalu.com/oio/img/mongo/MongoDevContainer.png
keywords: [mongodb, dev setup, docker, docker-compose, mongo local, mongo 8, persistence]
---

# ⚡ Run MongoDB Locally for Dev

This guide gives you a dead-simple way to run MongoDB 8 in a container **with persistent storage** — perfect for local dev work, prototyping, or quick testing.

---

## 🧾 docker-compose.yml

You’ve got two options — grab it from GitHub or drop it into a file yourself.

### 📥 Option 1: Download from GitHub
- download
```
wget https://raw.githubusercontent.com/jinnabaalu/MongoOperations/refs/heads/main/single-node/developer/docker-compose.yml
``` 

### ✍️ Option 2: Create the file manually

```yaml
services:
  mongodb:
    image: mongo:8
    container_name: mongodb
    hostname: mongodb
    restart: unless-stopped
    environment:
      - MONGO_INITDB_DATABASE=oiodb
    volumes:
      - ./tmp/mongo/data:/data/db
    ports:
      - 27017:27017
    command: ["mongod", "--bind_ip_all"]
```

# 🔁 TL;DR Flow

```bash
docker compose up -d
docker exec -it mongodb mongosh
use oiodb
db.test.insertOne({ hello: "world" })
db.test.find()
```
Boom. MongoDB is working, storing, and querying like a champ. 🧨

## Want to see what you just ran? Here’s a quick recap:

## 🚀 Run It
```bash
docker compose up -d
```

### Then check that it's up:

```bash
docker ps
docker logs -f mongodb | grep "Listening on"
```

## 📂 What You Get
MongoDB 8, running with persistence (./tmp/mongo/data)

Port 27017 exposed to your host — ready for Compass or app connections

No auth, no cluster — just raw MongoDB for dev speed

## 🧪 Connect & Run Basic Mongo Queries

### Option A: Use the shell inside the container
```bash
docker exec -it mongodb mongosh
```
### Run some basic stuff:
```bash
// List databases
show dbs

// Switch/create your dev DB
use oiodb

// Create a collection and insert a doc
db.users.insertOne({ name: "Baalu", role: "Infra Architect" })

// Read it back
db.users.find()

// Count docs
db.users.countDocuments()
```

# Others Options
- Use Mongo Compass or GUI
- Run your own container for GUI [mongo-express](mongo-express)


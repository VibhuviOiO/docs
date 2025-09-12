
---
sidebar_position: 1
title: MongoDB
description: MongoDB is a popular NoSQL document database. Learn how to dockerize and run MongoDB for your applications with Docker Compose.
slug: /NoSQL/MongoDB
keywords:
  - MongoDB
  - NoSQL database
  - document database
  - Docker MongoDB
  - database containerization
  - mongo docker
  - database setup
  - mongodb tutorial
  - document store
  - JSON database
---

# 🍃 Dockerizing MongoDB for Scalable Document-Based Applications

**MongoDB** is a popular NoSQL document database that stores data in flexible, JSON-like documents. Perfect for applications requiring **flexible schemas**, **horizontal scaling**, and **rapid development**.

---

## Set Up MongoDB with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: myapp
    volumes:
      - mongodb-data:/data/db
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Mongo Express for database management
  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password123
      ME_CONFIG_MONGODB_URL: mongodb://admin:password123@mongodb:27017/
      ME_CONFIG_BASICAUTH: false
    depends_on:
      - mongodb

volumes:
  mongodb-data:
```

`Start MongoDB:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

### Connect to MongoDB



`Connect directly to the container:`
```bash
docker exec -it mongodb mongosh -u admin -p password123
```

### Basic MongoDB Operations

`Create a database and collection, then insert data:`
```js
// Switch to database
use myapp;

// Clean old data
db.users.drop();

// ---------------- CREATE ----------------
db.users.insertMany([
  {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    skills: ["Node.js", "MongoDB"]
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    age: 25,
    skills: ["JavaScript", "Python"]
  },
  {
    name: "Bob Wilson",
    email: "bob@example.com",
    age: 35,
    department: "Engineering"
  }
]);
print("\n✅ CREATE: Inserted Users");
printjson(db.users.find().toArray());

// ---------------- READ ----------------
print("\n📖 READ: All Users");
printjson(db.users.find().toArray());

print("\n📖 READ: Search age >= 30");
printjson(db.users.find({ age: { $gte: 30 } }).toArray());

print("\n📖 READ: Find by email (john@example.com)");
printjson(db.users.findOne({ email: "john@example.com" }));

// ---------------- UPDATE ----------------
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { age: 31, lastLogin: new Date() } }
);
print("\n✏️ UPDATE: John’s record updated");
printjson(db.users.findOne({ email: "john@example.com" }));

// ---------------- DELETE ----------------
db.users.deleteOne({ email: "bob@example.com" });
print("\n🗑️ DELETE: Removed Bob");
printjson(db.users.find().toArray());

// ---------------- ADVANCED SEARCH ----------------
print("\n🔍 SEARCH: Users with skill 'JavaScript'");
printjson(db.users.find({ skills: "JavaScript" }).toArray());

```

---
`References :`

### Common Use Cases

- **Content Management**: Blogs, catalogs, user-generated content
- **Real-time Analytics**: Event tracking, user behavior analysis
- **IoT Applications**: Sensor data, device management
- **Mobile Applications**: User profiles, app data synchronization
- **E-commerce**: Product catalogs, shopping carts, recommendations

✅ MongoDB is now running in Docker and ready for your document-based applications!##
 References

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
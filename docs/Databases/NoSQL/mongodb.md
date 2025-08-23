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

## Connect to MongoDB

### Using mongosh (MongoDB Shell)

`Connect directly to the container:`
```bash
docker exec -it mongodb mongosh -u admin -p password123
```

### Basic MongoDB Operations

`Create a database and collection, then insert data:`
```javascript
// Switch to database
use myapp

// Insert documents
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  createdAt: new Date()
})

db.users.insertMany([
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
])

// Query documents
db.users.find()
db.users.find({age: {$gte: 30}})
db.users.findOne({email: "john@example.com"})

// Update documents
db.users.updateOne(
  {email: "john@example.com"},
  {$set: {age: 31, lastLogin: new Date()}}
)

// Delete documents
db.users.deleteOne({email: "bob@example.com"})
```

---

## Python Integration

`Install the MongoDB driver:`
```bash
pip install pymongo
```

`Create a file mongodb_test.py:`
```python
from pymongo import MongoClient
from datetime import datetime
import json

# Database connection
client = MongoClient('mongodb://admin:password123@localhost:27017/')
db = client.myapp
collection = db.products

try:
    # Insert a document
    product = {
        "name": "Laptop",
        "price": 999.99,
        "category": "Electronics",
        "specs": {
            "cpu": "Intel i7",
            "ram": "16GB",
            "storage": "512GB SSD"
        },
        "tags": ["computer", "portable", "work"],
        "createdAt": datetime.now()
    }
    
    result = collection.insert_one(product)
    print(f"Inserted product with ID: {result.inserted_id}")
    
    # Insert multiple documents
    products = [
        {
            "name": "Mouse",
            "price": 29.99,
            "category": "Electronics",
            "tags": ["computer", "accessory"]
        },
        {
            "name": "Keyboard",
            "price": 79.99,
            "category": "Electronics",
            "tags": ["computer", "mechanical"]
        }
    ]
    
    result = collection.insert_many(products)
    print(f"Inserted {len(result.inserted_ids)} products")
    
    # Query documents
    print("\nAll Electronics:")
    for product in collection.find({"category": "Electronics"}):
        print(f"- {product['name']}: ${product['price']}")
    
    # Query with conditions
    print("\nProducts under $50:")
    for product in collection.find({"price": {"$lt": 50}}):
        print(f"- {product['name']}: ${product['price']}")
    
    # Update document
    collection.update_one(
        {"name": "Laptop"},
        {"$set": {"price": 899.99, "onSale": True}}
    )
    print("\nUpdated laptop price")
    
    # Aggregation example
    pipeline = [
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "avgPrice": {"$avg": "$price"}
        }}
    ]
    
    print("\nCategory statistics:")
    for result in collection.aggregate(pipeline):
        print(f"- {result['_id']}: {result['count']} items, avg ${result['avgPrice']:.2f}")

except Exception as e:
    print(f"Error: {e}")

finally:
    client.close()
```

`Run the script:`
```bash
python mongodb_test.py
```

---

## Advanced Configuration

### Replica Set Setup

`docker-compose.yml for replica set:`
```yaml
version: '3.8'

services:
  mongo1:
    image: mongo:7.0
    container_name: mongo1
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo1-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123

  mongo2:
    image: mongo:7.0
    container_name: mongo2
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo2-data:/data/db

  mongo3:
    image: mongo:7.0
    container_name: mongo3
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo3-data:/data/db

volumes:
  mongo1-data:
  mongo2-data:
  mongo3-data:
```

`Initialize replica set:`
```javascript
// Connect to primary
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
```

---

## Backup and Restore

### Create Backup

`Backup database:`
```bash
docker exec mongodb mongodump --username admin --password password123 --authenticationDatabase admin --db myapp --out /backup
docker cp mongodb:/backup ./backup
```

### Restore Database

`Restore database:`
```bash
docker cp ./backup mongodb:/backup
docker exec mongodb mongorestore --username admin --password password123 --authenticationDatabase admin --db myapp /backup/myapp
```

---

## Monitoring

### Database Statistics

```javascript
// Database stats
db.stats()

// Collection stats
db.users.stats()

// Current operations
db.currentOp()

// Server status
db.serverStatus()
```

---

## Common Use Cases

- **Content Management**: Blogs, catalogs, user-generated content
- **Real-time Analytics**: Event tracking, user behavior analysis
- **IoT Applications**: Sensor data, device management
- **Mobile Applications**: User profiles, app data synchronization
- **E-commerce**: Product catalogs, shopping carts, recommendations

✅ MongoDB is now running in Docker and ready for your document-based applications!
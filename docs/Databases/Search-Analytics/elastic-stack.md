---
sidebar_position: 1
title: Elastic Stack (ELK)
description: Elastic Stack (Elasticsearch + Kibana + Logstash) is a powerful search and analytics platform. Learn how to dockerize and run the complete ELK stack.
slug: /SearchAnalytics/ElasticStack
keywords:
  - Elasticsearch
  - Kibana
  - Logstash
  - ELK Stack
  - Elastic Stack
  - search engine
  - log analysis
  - data visualization
  - Docker ELK
  - analytics platform
---

# 🔍 Dockerizing Elastic Stack (ELK) for Powerful Search and Analytics

**Elastic Stack** (formerly ELK Stack) combines **Elasticsearch**, **Kibana**, and **Logstash** to provide a complete search and analytics platform. Perfect for **log analysis**, **full-text search**, **data visualization**, and **real-time monitoring**.

---

## Set Up Elastic Stack with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    restart: unless-stopped
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      discovery.type: single-node
      ES_JAVA_OPTS: "-Xms1g -Xmx1g"
      xpack.security.enabled: false
      xpack.security.enrollment.enabled: false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    restart: unless-stopped
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
      xpack.security.enabled: false
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5601/api/status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    restart: unless-stopped
    ports:
      - "5044:5044"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xms512m -Xmx512m"
    volumes:
      - ./logstash/config:/usr/share/logstash/config
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logs:/usr/share/logstash/logs
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  elasticsearch-data:
```

`Create Logstash configuration directory and files:`
```bash
mkdir -p logstash/config logstash/pipeline logs
```

`Create logstash/config/logstash.yml:`
```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: ["http://elasticsearch:9200"]
```

`Create logstash/pipeline/logstash.conf:`
```ruby
input {
  beats {
    port => 5044
  }
  file {
    path => "/usr/share/logstash/logs/*.log"
    start_position => "beginning"
  }
}

filter {
  if [message] =~ /^\d{4}-\d{2}-\d{2}/ {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:content}" }
    }
    date {
      match => [ "timestamp", "yyyy-MM-dd HH:mm:ss" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

`Start the Elastic Stack:`
```bash
docker compose up -d
```

`Check if services are running:`
```bash
docker ps
```

---

## Test Elasticsearch


`Test Elasticsearch connection:`
```bash
curl -X GET "localhost:9200/"
curl -X GET "localhost:9200/_cluster/health"
```

### Basic Elasticsearch Operations

`Create an index and add documents:`
```bash
# Create index
curl -X PUT "localhost:9200/products" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "name": { "type": "text" },
      "price": { "type": "float" },
      "category": { "type": "keyword" },
      "description": { "type": "text" },
      "created_at": { "type": "date" }
    }
  }
}'

# Add documents
curl -X POST "localhost:9200/products/_doc/1" -H 'Content-Type: application/json' -d'
{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics",
  "description": "High-performance laptop for work and gaming",
  "created_at": "2024-01-15T10:00:00"
}'

curl -X POST "localhost:9200/products/_doc/2" -H 'Content-Type: application/json' -d'
{
  "name": "Wireless Mouse",
  "price": 29.99,
  "category": "Electronics",
  "description": "Ergonomic wireless mouse with long battery life",
  "created_at": "2024-01-15T11:00:00"
}'

# Search documents
curl -X GET "localhost:9200/products/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "description": "wireless"
    }
  }
}'
```

---

## Python Integration

`Install the Elasticsearch client:`
```bash
python3 -m venv venv
source venv/bin/activate
pip install elasticsearch
```

`Create a file elasticsearch_test.py:`
```python
from elasticsearch import Elasticsearch
from datetime import datetime
import json

# Connect to Elasticsearch
es = Elasticsearch([{'host': 'localhost', 'port': 9200, 'scheme': 'http'}])

try:
    # Check connection
    if es.ping():
        print("Connected to Elasticsearch")
    else:
        print("Could not connect to Elasticsearch")
        exit()
    
    # Create index with mapping
    index_name = "ecommerce"
    mapping = {
        "mappings": {
            "properties": {
                "product_name": {"type": "text", "analyzer": "standard"},
                "price": {"type": "float"},
                "category": {"type": "keyword"},
                "brand": {"type": "keyword"},
                "description": {"type": "text"},
                "tags": {"type": "keyword"},
                "in_stock": {"type": "boolean"},
                "created_at": {"type": "date"}
            }
        }
    }
    
    # Delete index if exists
    if es.indices.exists(index=index_name):
        es.indices.delete(index=index_name)
    
    # Create index
    es.indices.create(index=index_name, body=mapping)
    print(f"Created index: {index_name}")
    
    # Sample products
    products = [
        {
            "product_name": "MacBook Pro",
            "price": 1999.99,
            "category": "Laptops",
            "brand": "Apple",
            "description": "Powerful laptop with M2 chip for professionals",
            "tags": ["laptop", "apple", "professional", "m2"],
            "in_stock": True,
            "created_at": datetime.now()
        },
        {
            "product_name": "Gaming Mouse",
            "price": 79.99,
            "category": "Accessories",
            "brand": "Logitech",
            "description": "High-precision gaming mouse with RGB lighting",
            "tags": ["mouse", "gaming", "rgb", "precision"],
            "in_stock": True,
            "created_at": datetime.now()
        },
        {
            "product_name": "Wireless Headphones",
            "price": 299.99,
            "category": "Audio",
            "brand": "Sony",
            "description": "Noise-canceling wireless headphones with premium sound",
            "tags": ["headphones", "wireless", "noise-canceling", "audio"],
            "in_stock": False,
            "created_at": datetime.now()
        }
    ]
    
    # Index documents
    for i, product in enumerate(products, 1):
        response = es.index(index=index_name, id=i, body=product)
        print(f"Indexed product {i}: {response['result']}")
    
    # Refresh index to make documents searchable
    es.indices.refresh(index=index_name)
    
    # Search examples
    print("\n=== Search Examples ===")
    
    # 1. Match query
    search_body = {
        "query": {
            "match": {
                "description": "gaming"
            }
        }
    }
    
    response = es.search(index=index_name, body=search_body)
    print(f"\n1. Products matching 'gaming': {response['hits']['total']['value']} found")
    for hit in response['hits']['hits']:
        print(f"   - {hit['_source']['product_name']}: {hit['_source']['price']}")
    
    # 2. Filter by category and price range
    search_body = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"category": "Accessories"}},
                    {"range": {"price": {"gte": 50, "lte": 100}}}
                ]
            }
        }
    }
    
    response = es.search(index=index_name, body=search_body)
    print(f"\n2. Accessories $50-$100: {response['hits']['total']['value']} found")
    for hit in response['hits']['hits']:
        print(f"   - {hit['_source']['product_name']}: ${hit['_source']['price']}")
    
    # 3. Aggregation - average price by category
    search_body = {
        "size": 0,
        "aggs": {
            "categories": {
                "terms": {"field": "category"},
                "aggs": {
                    "avg_price": {"avg": {"field": "price"}}
                }
            }
        }
    }
    
    response = es.search(index=index_name, body=search_body)
    print("\n3. Average price by category:")
    for bucket in response['aggregations']['categories']['buckets']:
        print(f"   - {bucket['key']}: ${bucket['avg_price']['value']:.2f}")
    
    # 4. Full-text search with highlighting
    search_body = {
        "query": {
            "multi_match": {
                "query": "wireless professional",
                "fields": ["product_name^2", "description"]
            }
        },
        "highlight": {
            "fields": {
                "product_name": {},
                "description": {}
            }
        }
    }
    
    response = es.search(index=index_name, body=search_body)
    print(f"\n4. Full-text search 'wireless professional': {response['hits']['total']['value']} found")
    for hit in response['hits']['hits']:
        print(f"   - {hit['_source']['product_name']} (score: {hit['_score']:.2f})")
        if 'highlight' in hit:
            for field, highlights in hit['highlight'].items():
                print(f"     Highlight in {field}: {highlights[0]}")

except Exception as e:
    print(f"Error: {e}")
```

`Run the script:`
```bash
python elasticsearch_test.py
```

---

## Access Kibana Dashboard

1. Open your browser and go to `http://localhost:5601`
2. Go to **Management > Stack Management > Data View**
3. Create index pattern for your data (e.g., `ecommerce*`)
4. Go to **Analytics > Discover** to explore your data
5. Create visualizations in **Analytics > Visualize**
6. Build dashboards in **Analytics > Dashboard**

---

## Log Processing with Logstash

`Create a sample log file:`
```bash
echo "2024-01-15 10:30:00 INFO User login successful for user@example.com" >> logs/app.log
echo "2024-01-15 10:31:15 ERROR Database connection failed" >> logs/app.log
echo "2024-01-15 10:32:30 WARN High memory usage detected: 85%" >> logs/app.log
```

`Check if logs are processed:`
```bash
curl -X GET "localhost:9200/logs-*/_search" | jq .
```
---

## Common Use Cases

- **Log Analysis**: Application logs, system logs, security logs
- **Full-Text Search**: Document search, product catalogs, knowledge bases
- **Real-time Analytics**: User behavior, business metrics, performance monitoring
- **Security Analytics**: Threat detection, compliance monitoring
- **Business Intelligence**: Sales analytics, customer insights, operational metrics

✅ Elastic Stack is now running in Docker and ready for your search and analytics needs!## Referen
ces

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
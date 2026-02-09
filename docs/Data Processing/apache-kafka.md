---
sidebar_position: 1
title: Apache Kafka
description: Apache Kafka is a distributed streaming platform for building real-time data pipelines and streaming applications. Learn how to set up Kafka with Docker and build streaming applications.
slug: /Data-Processing/ApacheKafka
keywords:
  - Apache Kafka
  - streaming platform
  - message broker
  - event streaming
  - real-time data
  - distributed systems
  - data pipelines
  - stream processing
  - pub-sub messaging
  - event-driven architecture
---

# 🌊 Apache Kafka - Distributed Streaming Platform

**Apache Kafka** is a **distributed streaming platform** that enables you to build **real-time data pipelines** and **streaming applications**. It provides high-throughput, low-latency **publish-subscribe messaging** and **stream processing** capabilities.

---

## Set Up Kafka with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: kafka-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log
    ports:
      - "2181:2181"

  kafka-1:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka-broker-1
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "19092:19092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-1:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29092,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_IN_SYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 19092
      KAFKA_JMX_HOSTNAME: localhost
    volumes:
      - kafka-1-data:/var/lib/kafka/data

  kafka-2:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka-broker-2
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9093:9093"
      - "19093:19093"
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-2:29093,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29093,PLAINTEXT_HOST://0.0.0.0:9093
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_IN_SYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 19093
      KAFKA_JMX_HOSTNAME: localhost
    volumes:
      - kafka-2-data:/var/lib/kafka/data

  kafka-3:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka-broker-3
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9094:9094"
      - "19094:19094"
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-3:29094,PLAINTEXT_HOST://localhost:9094
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29094,PLAINTEXT_HOST://0.0.0.0:9094
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_IN_SYNC_REPLICAS: 2
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 19094
      KAFKA_JMX_HOSTNAME: localhost
    volumes:
      - kafka-3-data:/var/lib/kafka/data

  # Kafka Connect
  kafka-connect:
    image: confluentinc/cp-kafka-connect:7.4.0
    container_name: kafka-connect
    restart: unless-stopped
    depends_on:
      - kafka-1
      - kafka-2
      - kafka-3
    ports:
      - "8083:8083"
    environment:
      CONNECT_BOOTSTRAP_SERVERS: kafka-1:29092,kafka-2:29093,kafka-3:29094
      CONNECT_REST_ADVERTISED_HOST_NAME: kafka-connect
      CONNECT_GROUP_ID: kafka-connect-cluster
      CONNECT_CONFIG_STORAGE_TOPIC: _kafka-connect-configs
      CONNECT_OFFSET_STORAGE_TOPIC: _kafka-connect-offsets
      CONNECT_STATUS_STORAGE_TOPIC: _kafka-connect-status
      CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: 3
      CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: 3
      CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: 3
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.storage.StringConverter
      CONNECT_VALUE_CONVERTER: org.apache.kafka.connect.json.JsonConverter
      CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: "false"
      CONNECT_PLUGIN_PATH: /usr/share/java,/usr/share/confluent-hub-components
    volumes:
      - kafka-connect-data:/var/lib/kafka-connect

  # Schema Registry
  schema-registry:
    image: confluentinc/cp-schema-registry:7.4.0
    container_name: kafka-schema-registry
    restart: unless-stopped
    depends_on:
      - kafka-1
      - kafka-2
      - kafka-3
    ports:
      - "8081:8081"
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: kafka-1:29092,kafka-2:29093,kafka-3:29094
      SCHEMA_REGISTRY_LISTENERS: http://0.0.0.0:8081

  # Kafka UI
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    restart: unless-stopped
    depends_on:
      - kafka-1
      - kafka-2
      - kafka-3
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka-1:29092,kafka-2:29093,kafka-3:29094
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
      KAFKA_CLUSTERS_0_SCHEMAREGISTRY: http://schema-registry:8081
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_NAME: connect
      KAFKA_CLUSTERS_0_KAFKACONNECT_0_ADDRESS: http://kafka-connect:8083

volumes:
  zookeeper-data:
  zookeeper-logs:
  kafka-1-data:
  kafka-2-data:
  kafka-3-data:
  kafka-connect-data:
```

`Start Kafka cluster:`
```bash
docker compose up -d
```

`Access Kafka UI:`
```bash
echo "Kafka UI: http://localhost:8080"
```

---

## Basic Kafka Operations

### Topic Management

`Create and manage topics:`
```bash
# Create a topic
docker exec kafka-broker-1 kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --partitions 3 \
  --replication-factor 3

# List topics
docker exec kafka-broker-1 kafka-topics --list \
  --bootstrap-server localhost:9092

# Describe topic
docker exec kafka-broker-1 kafka-topics --describe \
  --bootstrap-server localhost:9092 \
  --topic user-events

# Delete topic
docker exec kafka-broker-1 kafka-topics --delete \
  --bootstrap-server localhost:9092 \
  --topic user-events
```

### Producer and Consumer

`Test producer and consumer:`
```bash
# Start a console producer
docker exec -it kafka-broker-1 kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic user-events

# Start a console consumer
docker exec -it kafka-broker-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --from-beginning
```

---

## Python Kafka Applications

### Simple Producer

`Create producer.py:`
```python
#!/usr/bin/env python3
from kafka import KafkaProducer
import json
import time
import random
from datetime import datetime

class EventProducer:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',  # Wait for all replicas to acknowledge
            retries=3,
            batch_size=16384,
            linger_ms=10,
            buffer_memory=33554432
        )
    
    def send_user_event(self, user_id, event_type, data=None):
        """Send a user event to Kafka"""
        event = {
            'user_id': user_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data or {}
        }
        
        # Use user_id as partition key for ordering
        future = self.producer.send(
            topic='user-events',
            key=str(user_id),
            value=event
        )
        
        # Optional: wait for confirmation
        try:
            record_metadata = future.get(timeout=10)
            print(f"Event sent to topic {record_metadata.topic} "
                  f"partition {record_metadata.partition} "
                  f"offset {record_metadata.offset}")
        except Exception as e:
            print(f"Failed to send event: {e}")
    
    def send_order_event(self, order_id, user_id, event_type, order_data):
        """Send an order event to Kafka"""
        event = {
            'order_id': order_id,
            'user_id': user_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'order_data': order_data
        }
        
        self.producer.send(
            topic='order-events',
            key=str(order_id),
            value=event
        )
    
    def generate_sample_events(self, num_events=100):
        """Generate sample events for testing"""
        event_types = ['login', 'logout', 'page_view', 'purchase', 'search']
        
        for i in range(num_events):
            user_id = random.randint(1, 1000)
            event_type = random.choice(event_types)
            
            data = {}
            if event_type == 'page_view':
                data = {'page': f'/page/{random.randint(1, 100)}'}
            elif event_type == 'purchase':
                data = {
                    'product_id': random.randint(1, 500),
                    'amount': round(random.uniform(10, 1000), 2)
                }
            elif event_type == 'search':
                data = {'query': f'search term {random.randint(1, 50)}'}
            
            self.send_user_event(user_id, event_type, data)
            time.sleep(0.1)  # Small delay between events
    
    def close(self):
        """Close the producer"""
        self.producer.flush()
        self.producer.close()

# Usage
if __name__ == "__main__":
    producer = EventProducer()
    
    try:
        # Send individual events
        producer.send_user_event(123, 'login', {'ip': '192.168.1.1'})
        producer.send_user_event(123, 'page_view', {'page': '/dashboard'})
        
        # Generate sample events
        print("Generating sample events...")
        producer.generate_sample_events(50)
        
    finally:
        producer.close()
```

### Simple Consumer

`Create consumer.py:`
```python
#!/usr/bin/env python3
from kafka import KafkaConsumer
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EventConsumer:
    def __init__(self, topics, group_id, bootstrap_servers=['localhost:9092']):
        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            auto_commit_interval_ms=1000,
            session_timeout_ms=30000,
            heartbeat_interval_ms=10000
        )
    
    def process_user_event(self, event):
        """Process a user event"""
        user_id = event.get('user_id')
        event_type = event.get('event_type')
        timestamp = event.get('timestamp')
        data = event.get('data', {})
        
        logger.info(f"Processing user event: {event_type} for user {user_id}")
        
        # Process different event types
        if event_type == 'login':
            self.handle_login(user_id, data)
        elif event_type == 'purchase':
            self.handle_purchase(user_id, data)
        elif event_type == 'page_view':
            self.handle_page_view(user_id, data)
        else:
            logger.info(f"Unknown event type: {event_type}")
    
    def handle_login(self, user_id, data):
        """Handle login event"""
        ip = data.get('ip', 'unknown')
        logger.info(f"User {user_id} logged in from {ip}")
        
        # Example: Update user last login time
        # database.update_user_last_login(user_id, datetime.utcnow())
    
    def handle_purchase(self, user_id, data):
        """Handle purchase event"""
        product_id = data.get('product_id')
        amount = data.get('amount')
        logger.info(f"User {user_id} purchased product {product_id} for ${amount}")
        
        # Example: Update analytics, send notifications
        # analytics.track_purchase(user_id, product_id, amount)
        # notification.send_purchase_confirmation(user_id)
    
    def handle_page_view(self, user_id, data):
        """Handle page view event"""
        page = data.get('page')
        logger.info(f"User {user_id} viewed page {page}")
        
        # Example: Update page view analytics
        # analytics.track_page_view(user_id, page)
    
    def consume_events(self):
        """Start consuming events"""
        logger.info("Starting event consumer...")
        
        try:
            for message in self.consumer:
                try:
                    topic = message.topic
                    partition = message.partition
                    offset = message.offset
                    key = message.key
                    value = message.value
                    
                    logger.debug(f"Received message from {topic}[{partition}] at offset {offset}")
                    
                    if topic == 'user-events':
                        self.process_user_event(value)
                    elif topic == 'order-events':
                        self.process_order_event(value)
                    else:
                        logger.warning(f"Unknown topic: {topic}")
                        
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    # In production, you might want to send to a dead letter queue
                    
        except KeyboardInterrupt:
            logger.info("Consumer interrupted by user")
        finally:
            self.consumer.close()
    
    def process_order_event(self, event):
        """Process an order event"""
        order_id = event.get('order_id')
        user_id = event.get('user_id')
        event_type = event.get('event_type')
        
        logger.info(f"Processing order event: {event_type} for order {order_id}")

# Usage
if __name__ == "__main__":
    # Create consumer for user events
    consumer = EventConsumer(
        topics=['user-events', 'order-events'],
        group_id='event-processor-group'
    )
    
    # Start consuming
    consumer.consume_events()
```

---

## Kafka Streams Application

### Stream Processing with Python

`Create stream_processor.py:`
```python
#!/usr/bin/env python3
from kafka import KafkaConsumer, KafkaProducer
import json
import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta
import threading
import time

logger = logging.getLogger(__name__)

class StreamProcessor:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.bootstrap_servers = bootstrap_servers
        
        # Consumer for input streams
        self.consumer = KafkaConsumer(
            'user-events',
            bootstrap_servers=bootstrap_servers,
            group_id='stream-processor',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest'
        )
        
        # Producer for output streams
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        # In-memory state stores (in production, use external stores)
        self.user_sessions = defaultdict(list)
        self.page_view_counts = defaultdict(int)
        self.purchase_totals = defaultdict(float)
        self.recent_events = defaultdict(lambda: deque(maxlen=100))
        
        # Start background tasks
        self.running = True
        self.start_background_tasks()
    
    def start_background_tasks(self):
        """Start background processing tasks"""
        # Windowed aggregations
        threading.Thread(target=self.windowed_aggregations, daemon=True).start()
        
        # Session detection
        threading.Thread(target=self.session_detection, daemon=True).start()
    
    def process_events(self):
        """Main event processing loop"""
        logger.info("Starting stream processor...")
        
        try:
            for message in self.consumer:
                event = message.value
                self.process_single_event(event)
                
        except KeyboardInterrupt:
            logger.info("Stream processor interrupted")
        finally:
            self.cleanup()
    
    def process_single_event(self, event):
        """Process a single event"""
        user_id = event.get('user_id')
        event_type = event.get('event_type')
        timestamp = datetime.fromisoformat(event.get('timestamp'))
        
        # Add to recent events for windowed processing
        self.recent_events[user_id].append({
            'event': event,
            'timestamp': timestamp
        })
        
        # Real-time processing
        if event_type == 'page_view':
            self.process_page_view(event)
        elif event_type == 'purchase':
            self.process_purchase(event)
        elif event_type == 'login':
            self.process_login(event)
        elif event_type == 'logout':
            self.process_logout(event)
    
    def process_page_view(self, event):
        """Process page view events"""
        page = event.get('data', {}).get('page', 'unknown')
        self.page_view_counts[page] += 1
        
        # Emit aggregated page view counts
        if self.page_view_counts[page] % 10 == 0:  # Every 10 views
            self.emit_page_view_stats(page, self.page_view_counts[page])
    
    def process_purchase(self, event):
        """Process purchase events"""
        user_id = event.get('user_id')
        amount = event.get('data', {}).get('amount', 0)
        
        self.purchase_totals[user_id] += amount
        
        # Emit purchase analytics
        self.emit_purchase_analytics(user_id, amount, self.purchase_totals[user_id])
        
        # Check for high-value customers
        if self.purchase_totals[user_id] > 1000:
            self.emit_high_value_customer_alert(user_id, self.purchase_totals[user_id])
    
    def process_login(self, event):
        """Process login events"""
        user_id = event.get('user_id')
        timestamp = datetime.fromisoformat(event.get('timestamp'))
        
        # Start new session
        self.user_sessions[user_id].append({
            'start_time': timestamp,
            'end_time': None,
            'events': []
        })
    
    def process_logout(self, event):
        """Process logout events"""
        user_id = event.get('user_id')
        timestamp = datetime.fromisoformat(event.get('timestamp'))
        
        # End current session
        if self.user_sessions[user_id]:
            current_session = self.user_sessions[user_id][-1]
            current_session['end_time'] = timestamp
            
            # Emit session analytics
            self.emit_session_analytics(user_id, current_session)
    
    def windowed_aggregations(self):
        """Perform windowed aggregations every minute"""
        while self.running:
            try:
                current_time = datetime.utcnow()
                window_start = current_time - timedelta(minutes=5)
                
                # Process 5-minute windows
                for user_id, events in self.recent_events.items():
                    window_events = [
                        e for e in events 
                        if e['timestamp'] >= window_start
                    ]
                    
                    if window_events:
                        self.process_windowed_events(user_id, window_events)
                
                time.sleep(60)  # Run every minute
                
            except Exception as e:
                logger.error(f"Error in windowed aggregations: {e}")
    
    def process_windowed_events(self, user_id, events):
        """Process events in a time window"""
        event_counts = defaultdict(int)
        
        for event_data in events:
            event = event_data['event']
            event_type = event.get('event_type')
            event_counts[event_type] += 1
        
        # Emit windowed statistics
        self.emit_windowed_stats(user_id, dict(event_counts))
    
    def session_detection(self):
        """Detect user sessions based on activity patterns"""
        while self.running:
            try:
                current_time = datetime.utcnow()
                session_timeout = timedelta(minutes=30)
                
                for user_id, events in self.recent_events.items():
                    if events:
                        last_event_time = events[-1]['timestamp']
                        
                        # Check for session timeout
                        if current_time - last_event_time > session_timeout:
                            self.emit_session_timeout(user_id, last_event_time)
                
                time.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in session detection: {e}")
    
    def emit_page_view_stats(self, page, count):
        """Emit page view statistics"""
        stats = {
            'type': 'page_view_stats',
            'page': page,
            'count': count,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('analytics-events', value=stats)
        logger.info(f"Page {page} has {count} views")
    
    def emit_purchase_analytics(self, user_id, amount, total):
        """Emit purchase analytics"""
        analytics = {
            'type': 'purchase_analytics',
            'user_id': user_id,
            'purchase_amount': amount,
            'total_spent': total,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('analytics-events', value=analytics)
    
    def emit_high_value_customer_alert(self, user_id, total_spent):
        """Emit high-value customer alert"""
        alert = {
            'type': 'high_value_customer',
            'user_id': user_id,
            'total_spent': total_spent,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('alerts', value=alert)
        logger.info(f"High-value customer alert: User {user_id} spent ${total_spent}")
    
    def emit_session_analytics(self, user_id, session):
        """Emit session analytics"""
        duration = None
        if session['end_time']:
            duration = (session['end_time'] - session['start_time']).total_seconds()
        
        analytics = {
            'type': 'session_analytics',
            'user_id': user_id,
            'session_start': session['start_time'].isoformat(),
            'session_end': session['end_time'].isoformat() if session['end_time'] else None,
            'duration_seconds': duration,
            'event_count': len(session['events']),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('analytics-events', value=analytics)
    
    def emit_windowed_stats(self, user_id, event_counts):
        """Emit windowed statistics"""
        stats = {
            'type': 'windowed_stats',
            'user_id': user_id,
            'window_duration_minutes': 5,
            'event_counts': event_counts,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('analytics-events', value=stats)
    
    def emit_session_timeout(self, user_id, last_activity):
        """Emit session timeout event"""
        timeout_event = {
            'type': 'session_timeout',
            'user_id': user_id,
            'last_activity': last_activity.isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.producer.send('session-events', value=timeout_event)
    
    def cleanup(self):
        """Cleanup resources"""
        self.running = False
        self.consumer.close()
        self.producer.close()

# Usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    processor = StreamProcessor()
    processor.process_events()
```

---

## Kafka Connect Configuration

### Database Source Connector

`Create connectors/jdbc-source.json:`
```json
{
  "name": "jdbc-source-connector",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "connection.url": "jdbc:postgresql://postgres:5432/myapp",
    "connection.user": "postgres",
    "connection.password": "password",
    "table.whitelist": "users,orders,products",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "db-",
    "poll.interval.ms": 5000,
    "batch.max.rows": 1000,
    "transforms": "createKey,extractInt",
    "transforms.createKey.type": "org.apache.kafka.connect.transforms.ValueToKey",
    "transforms.createKey.fields": "id",
    "transforms.extractInt.type": "org.apache.kafka.connect.transforms.ExtractField$Key",
    "transforms.extractInt.field": "id"
  }
}
```

### Elasticsearch Sink Connector

`Create connectors/elasticsearch-sink.json:`
```json
{
  "name": "elasticsearch-sink-connector",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "topics": "user-events,order-events,analytics-events",
    "connection.url": "http://elasticsearch:9200",
    "type.name": "_doc",
    "key.ignore": "false",
    "schema.ignore": "true",
    "batch.size": 100,
    "max.buffered.records": 1000,
    "flush.timeout.ms": 10000,
    "transforms": "addTimestamp",
    "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
    "transforms.addTimestamp.timestamp.field": "kafka_timestamp"
  }
}
```

`Deploy connectors:`
```bash
# Deploy JDBC source connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @connectors/jdbc-source.json

# Deploy Elasticsearch sink connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @connectors/elasticsearch-sink.json

# Check connector status
curl http://localhost:8083/connectors/jdbc-source-connector/status
```

---

## Monitoring and Operations

### Kafka Monitoring Script

`Create monitoring/kafka-monitor.py:`
```python
#!/usr/bin/env python3
import json
import requests
from kafka.admin import KafkaAdminClient, ConfigResource, ConfigResourceType
from kafka import KafkaConsumer
import logging

logger = logging.getLogger(__name__)

class KafkaMonitor:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.bootstrap_servers = bootstrap_servers
        self.admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers,
            client_id='kafka-monitor'
        )
    
    def get_cluster_metadata(self):
        """Get cluster metadata"""
        metadata = self.admin_client._client.cluster
        
        return {
            'brokers': [
                {
                    'id': broker.nodeId,
                    'host': broker.host,
                    'port': broker.port
                }
                for broker in metadata.brokers()
            ],
            'topics': list(metadata.topics()),
            'controller': metadata.controller.nodeId if metadata.controller else None
        }
    
    def get_topic_details(self, topic_name):
        """Get detailed topic information"""
        metadata = self.admin_client._client.cluster
        topic = metadata.topics.get(topic_name)
        
        if not topic:
            return None
        
        partitions = []
        for partition_id, partition in topic.partitions.items():
            partitions.append({
                'partition_id': partition_id,
                'leader': partition.leader,
                'replicas': partition.replicas,
                'isr': partition.isr
            })
        
        return {
            'name': topic_name,
            'partitions': partitions,
            'partition_count': len(partitions),
            'replication_factor': len(partitions[0]['replicas']) if partitions else 0
        }
    
    def get_consumer_group_info(self, group_id):
        """Get consumer group information"""
        try:
            # This would require additional libraries for full implementation
            # For now, return basic structure
            return {
                'group_id': group_id,
                'state': 'Stable',  # Would need to query actual state
                'members': [],  # Would need to query actual members
                'lag': {}  # Would need to calculate lag
            }
        except Exception as e:
            logger.error(f"Error getting consumer group info: {e}")
            return None
    
    def check_broker_health(self):
        """Check broker health"""
        try:
            metadata = self.get_cluster_metadata()
            healthy_brokers = []
            
            for broker in metadata['brokers']:
                # Simple health check - try to connect
                try:
                    consumer = KafkaConsumer(
                        bootstrap_servers=[f"{broker['host']}:{broker['port']}"],
                        consumer_timeout_ms=5000
                    )
                    consumer.close()
                    healthy_brokers.append(broker['id'])
                except:
                    pass
            
            return {
                'total_brokers': len(metadata['brokers']),
                'healthy_brokers': len(healthy_brokers),
                'unhealthy_brokers': len(metadata['brokers']) - len(healthy_brokers),
                'healthy_broker_ids': healthy_brokers
            }
        except Exception as e:
            logger.error(f"Error checking broker health: {e}")
            return None
    
    def generate_health_report(self):
        """Generate comprehensive health report"""
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'cluster_metadata': self.get_cluster_metadata(),
            'broker_health': self.check_broker_health(),
            'topics': {}
        }
        
        # Get details for each topic
        for topic in report['cluster_metadata']['topics']:
            report['topics'][topic] = self.get_topic_details(topic)
        
        return report

# Usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    monitor = KafkaMonitor()
    health_report = monitor.generate_health_report()
    
    print(json.dumps(health_report, indent=2))
```

---

## Common Use Cases

- **Real-time Analytics**: Stream processing for real-time dashboards and metrics
- **Event-Driven Architecture**: Microservices communication through events
- **Data Integration**: ETL pipelines and data synchronization between systems
- **Log Aggregation**: Centralized logging and log processing
- **IoT Data Processing**: High-throughput ingestion and processing of sensor data

✅ Apache Kafka is now configured for distributed streaming and event processing!
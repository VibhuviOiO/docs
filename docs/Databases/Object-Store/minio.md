---
sidebar_position: 1
title: MinIO
description: MinIO is a high-performance S3-compatible object storage system. Learn how to dockerize and run MinIO for database backups and file storage.
slug: /ObjectStore/MinIO
keywords:
  - MinIO
  - object storage
  - S3 compatible
  - file storage
  - Docker MinIO
  - database backups
  - cloud storage
  - distributed storage
  - backup storage
  - artifact storage
---

# 🗄️ Dockerizing MinIO for S3-Compatible Object Storage

**MinIO** is a high-performance, S3-compatible object storage system that's perfect for **database backups**, **file storage**, **data archiving**, and **distributed applications**. It provides **enterprise-grade** features with **cloud-native** architecture.

---

### Set Up MinIO with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: unless-stopped
    ports:
      - "9000:9000"  # API port
      - "9001:9001"  # Console port
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
      MINIO_CONSOLE_ADDRESS: ":9001"
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Optional: MinIO Client (mc) for CLI operations
  minio-client:
    image: minio/mc:latest
    container_name: minio-client
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 10;
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/database-backups;
      /usr/bin/mc mb myminio/application-data;
      /usr/bin/mc mb myminio/logs;
      /usr/bin/mc mb myminio/artifacts;
      echo 'MinIO buckets created successfully';
      tail -f /dev/null;
      "

volumes:
  minio-data:
```

`Start MinIO:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

### Access MinIO Console

1. Open your browser and go to `http://localhost:9001`
2. Login with:
   - Username: `minioadmin`
   - Password: `minioadmin123`

---

### Basic MinIO Operations

`Connect to the MinIO client container:`
```bash
docker exec -it minio-client /bin/sh
```

`Basic mc commands:`
```bash
# List buckets
mc ls myminio

# Create bucket
mc mb myminio/test-bucket

# Upload file
echo "Hello MinIO" > test.txt
mc cp test.txt myminio/test-bucket/

# Download file
mc cp myminio/test-bucket/test.txt downloaded.txt

# List objects in bucket
mc ls myminio/test-bucket
```

```bash
# Remove object
mc rm myminio/test-bucket/test.txt

# Remove bucket
mc rb myminio/test-bucket
```

---

`References:`
- [MinIO Official Documentation](https://min.io/docs/minio/container/index.html) – Running MinIO with Docker & Kubernetes  
- [MinIO GitHub Repository](https://github.com/minio/minio) – Source code and releases  

## Common Use Cases

- **Database Backups**: Automated backup storage for PostgreSQL, MySQL, MongoDB
- **Application Data**: User uploads, generated reports, temporary files
- **Log Archival**: Long-term storage of application and system logs
- **Artifact Storage**: Build artifacts, deployment packages, documentation
- **Data Lake**: Raw data storage for analytics and machine learning

✅ MinIO is now running in Docker and ready for your object storage needs!
## Refere
nces

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
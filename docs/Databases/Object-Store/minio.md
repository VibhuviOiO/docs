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

## Set Up MinIO with Docker Compose

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

## Access MinIO Console

1. Open your browser and go to `http://localhost:9001`
2. Login with:
   - Username: `minioadmin`
   - Password: `minioadmin123`

---

## Basic MinIO Operations

### Using MinIO Client (mc)

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

# Remove object
mc rm myminio/test-bucket/test.txt

# Remove bucket
mc rb myminio/test-bucket
```

### Using REST API

`Create bucket via API:`
```bash
curl -X PUT "http://localhost:9000/test-api-bucket" \
  -H "Host: localhost:9000" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=minioadmin/20240115/us-east-1/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=..."
```

---

## Python Integration

`Install the MinIO client:`
```bash
pip install minio boto3 pandas
```

`Create a file minio_test.py:`
```python
from minio import Minio
from minio.error import S3Error
import boto3
from botocore.exceptions import ClientError
import io
import json
import pandas as pd
from datetime import datetime, timedelta
import os

# MinIO connection parameters
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin123"
MINIO_SECURE = False  # Set to True for HTTPS

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Initialize boto3 client (S3-compatible)
s3_client = boto3.client(
    's3',
    endpoint_url=f"http://{MINIO_ENDPOINT}",
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    region_name='us-east-1'
)

try:
    print("Connected to MinIO")
    
    # Create buckets for different use cases
    buckets_to_create = [
        "database-backups",
        "application-logs", 
        "user-uploads",
        "analytics-data",
        "system-artifacts"
    ]
    
    print("\n=== Creating Buckets ===")
    for bucket_name in buckets_to_create:
        try:
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
                print(f"✓ Created bucket: {bucket_name}")
            else:
                print(f"✓ Bucket already exists: {bucket_name}")
        except S3Error as e:
            print(f"✗ Error creating bucket {bucket_name}: {e}")
    
    # Upload different types of files
    print("\n=== Uploading Files ===")
    
    # 1. Upload database backup (simulated)
    backup_data = {
        "backup_date": datetime.now().isoformat(),
        "database": "production_db",
        "size_mb": 1024,
        "tables": ["users", "orders", "products", "transactions"],
        "checksum": "abc123def456"
    }
    
    backup_json = json.dumps(backup_data, indent=2)
    backup_stream = io.BytesIO(backup_json.encode('utf-8'))
    
    minio_client.put_object(
        "database-backups",
        f"postgres_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        backup_stream,
        length=len(backup_json),
        content_type="application/json"
    )
    print("✓ Uploaded database backup metadata")
    
    # 2. Upload application logs
    log_entries = []
    for i in range(100):
        log_entry = {
            "timestamp": (datetime.now() - timedelta(minutes=i)).isoformat(),
            "level": "INFO" if i % 10 != 0 else "ERROR",
            "message": f"Application event {i}",
            "user_id": f"user_{i % 20}",
            "endpoint": f"/api/endpoint_{i % 5}"
        }
        log_entries.append(log_entry)
    
    logs_df = pd.DataFrame(log_entries)
    csv_buffer = io.StringIO()
    logs_df.to_csv(csv_buffer, index=False)
    csv_data = csv_buffer.getvalue().encode('utf-8')
    
    minio_client.put_object(
        "application-logs",
        f"app_logs_{datetime.now().strftime('%Y%m%d')}.csv",
        io.BytesIO(csv_data),
        length=len(csv_data),
        content_type="text/csv"
    )
    print("✓ Uploaded application logs")
    
    # 3. Upload analytics data
    analytics_data = {
        "date": datetime.now().strftime('%Y-%m-%d'),
        "metrics": {
            "page_views": 15420,
            "unique_visitors": 3240,
            "bounce_rate": 0.34,
            "avg_session_duration": 245,
            "conversion_rate": 0.023
        },
        "top_pages": [
            {"page": "/home", "views": 5420},
            {"page": "/products", "views": 3240},
            {"page": "/about", "views": 1820}
        ]
    }
    
    analytics_json = json.dumps(analytics_data, indent=2)
    minio_client.put_object(
        "analytics-data",
        f"daily_analytics_{datetime.now().strftime('%Y%m%d')}.json",
        io.BytesIO(analytics_json.encode('utf-8')),
        length=len(analytics_json),
        content_type="application/json"
    )
    print("✓ Uploaded analytics data")
    
    # 4. Upload system artifacts
    artifact_data = {
        "build_id": "build_12345",
        "version": "v1.2.3",
        "commit_hash": "abc123def456",
        "build_date": datetime.now().isoformat(),
        "artifacts": [
            {"name": "app.jar", "size": "25MB", "checksum": "xyz789"},
            {"name": "config.yml", "size": "2KB", "checksum": "def456"}
        ]
    }
    
    artifact_json = json.dumps(artifact_data, indent=2)
    minio_client.put_object(
        "system-artifacts",
        f"build_artifacts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        io.BytesIO(artifact_json.encode('utf-8')),
        length=len(artifact_json),
        content_type="application/json"
    )
    print("✓ Uploaded system artifacts")
    
    # List all buckets and their contents
    print("\n=== Bucket Contents ===")
    buckets = minio_client.list_buckets()
    
    for bucket in buckets:
        print(f"\nBucket: {bucket.name} (Created: {bucket.creation_date})")
        
        try:
            objects = minio_client.list_objects(bucket.name, recursive=True)
            object_count = 0
            total_size = 0
            
            for obj in objects:
                object_count += 1
                total_size += obj.size
                print(f"  📄 {obj.object_name} ({obj.size} bytes, {obj.last_modified})")
            
            print(f"  📊 Total: {object_count} objects, {total_size} bytes")
            
        except S3Error as e:
            print(f"  ❌ Error listing objects: {e}")
    
    # Download and process files
    print("\n=== Downloading and Processing Files ===")
    
    # Download analytics data
    try:
        response = minio_client.get_object("analytics-data", f"daily_analytics_{datetime.now().strftime('%Y%m%d')}.json")
        analytics_content = json.loads(response.read().decode('utf-8'))
        
        print("Analytics Data Summary:")
        metrics = analytics_content["metrics"]
        print(f"  📈 Page Views: {metrics['page_views']:,}")
        print(f"  👥 Unique Visitors: {metrics['unique_visitors']:,}")
        print(f"  📊 Bounce Rate: {metrics['bounce_rate']:.1%}")
        print(f"  ⏱️ Avg Session: {metrics['avg_session_duration']}s")
        
    except S3Error as e:
        print(f"❌ Error downloading analytics: {e}")
    
    # Using boto3 for advanced operations
    print("\n=== Advanced Operations with boto3 ===")
    
    # Set bucket policy (public read for user-uploads)
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::user-uploads/*"
            }
        ]
    }
    
    try:
        s3_client.put_bucket_policy(
            Bucket="user-uploads",
            Policy=json.dumps(bucket_policy)
        )
        print("✓ Set public read policy for user-uploads bucket")
    except ClientError as e:
        print(f"❌ Error setting bucket policy: {e}")
    
    # Generate presigned URL for secure file sharing
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'analytics-data', 'Key': f"daily_analytics_{datetime.now().strftime('%Y%m%d')}.json"},
            ExpiresIn=3600  # 1 hour
        )
        print(f"✓ Generated presigned URL (expires in 1 hour)")
        print(f"  URL: {presigned_url[:80]}...")
    except ClientError as e:
        print(f"❌ Error generating presigned URL: {e}")
    
    # Bucket statistics
    print("\n=== Storage Statistics ===")
    
    total_objects = 0
    total_size = 0
    
    for bucket in buckets:
        try:
            objects = list(minio_client.list_objects(bucket.name, recursive=True))
            bucket_objects = len(objects)
            bucket_size = sum(obj.size for obj in objects)
            
            total_objects += bucket_objects
            total_size += bucket_size
            
            print(f"  {bucket.name}: {bucket_objects} objects, {bucket_size:,} bytes")
            
        except S3Error:
            continue
    
    print(f"\nTotal Storage Usage:")
    print(f"  📦 Total Objects: {total_objects:,}")
    print(f"  💾 Total Size: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
    
    # Cleanup old files (example)
    print("\n=== Cleanup Operations ===")
    
    cutoff_date = datetime.now() - timedelta(days=30)
    
    for bucket in buckets:
        if bucket.name == "application-logs":
            try:
                objects = minio_client.list_objects(bucket.name, recursive=True)
                old_objects = []
                
                for obj in objects:
                    if obj.last_modified < cutoff_date:
                        old_objects.append(obj.object_name)
                
                if old_objects:
                    print(f"  🗑️ Found {len(old_objects)} old objects in {bucket.name}")
                    # Uncomment to actually delete
                    # for obj_name in old_objects:
                    #     minio_client.remove_object(bucket.name, obj_name)
                    #     print(f"    Deleted: {obj_name}")
                else:
                    print(f"  ✅ No old objects to cleanup in {bucket.name}")
                    
            except S3Error as e:
                print(f"  ❌ Error during cleanup: {e}")

except Exception as e:
    print(f"Error: {e}")
```

`Run the script:`
```bash
python minio_test.py
```

---

## Database Backup Integration

### PostgreSQL Backup to MinIO

`Create a backup script (postgres_backup.py):`
```python
import subprocess
import os
from minio import Minio
from datetime import datetime
import gzip
import io

# MinIO configuration
minio_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin123",
    secure=False
)

def backup_postgres_to_minio():
    """Backup PostgreSQL database to MinIO"""
    
    # Database connection details
    db_config = {
        "host": "localhost",
        "port": "5432",
        "database": "myapp",
        "username": "postgres",
        "password": "password123"
    }
    
    # Create backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"postgres_backup_{timestamp}.sql"
    compressed_filename = f"{backup_filename}.gz"
    
    try:
        # Create pg_dump command
        dump_command = [
            "pg_dump",
            f"--host={db_config['host']}",
            f"--port={db_config['port']}",
            f"--username={db_config['username']}",
            f"--dbname={db_config['database']}",
            "--verbose",
            "--clean",
            "--no-owner",
            "--no-privileges"
        ]
        
        # Set password environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]
        
        # Execute pg_dump
        print(f"Creating backup: {backup_filename}")
        result = subprocess.run(
            dump_command,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Compress the backup
        compressed_data = gzip.compress(result.stdout.encode('utf-8'))
        
        # Upload to MinIO
        minio_client.put_object(
            "database-backups",
            compressed_filename,
            io.BytesIO(compressed_data),
            length=len(compressed_data),
            content_type="application/gzip"
        )
        
        print(f"✓ Backup uploaded to MinIO: {compressed_filename}")
        print(f"  Original size: {len(result.stdout)} bytes")
        print(f"  Compressed size: {len(compressed_data)} bytes")
        print(f"  Compression ratio: {len(compressed_data)/len(result.stdout):.2%}")
        
        return compressed_filename
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Backup failed: {e}")
        print(f"Error output: {e.stderr}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Run backup
if __name__ == "__main__":
    backup_postgres_to_minio()
```

### MySQL Backup to MinIO

```python
def backup_mysql_to_minio():
    """Backup MySQL database to MinIO"""
    
    db_config = {
        "host": "localhost",
        "port": "3306",
        "database": "myapp",
        "username": "root",
        "password": "password123"
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"mysql_backup_{timestamp}.sql.gz"
    
    try:
        # Create mysqldump command
        dump_command = [
            "mysqldump",
            f"--host={db_config['host']}",
            f"--port={db_config['port']}",
            f"--user={db_config['username']}",
            f"--password={db_config['password']}",
            "--single-transaction",
            "--routines",
            "--triggers",
            db_config["database"]
        ]
        
        # Execute mysqldump and compress
        dump_process = subprocess.Popen(dump_command, stdout=subprocess.PIPE)
        gzip_process = subprocess.Popen(
            ["gzip"],
            stdin=dump_process.stdout,
            stdout=subprocess.PIPE
        )
        
        dump_process.stdout.close()
        compressed_data, _ = gzip_process.communicate()
        
        # Upload to MinIO
        minio_client.put_object(
            "database-backups",
            backup_filename,
            io.BytesIO(compressed_data),
            length=len(compressed_data),
            content_type="application/gzip"
        )
        
        print(f"✓ MySQL backup uploaded: {backup_filename}")
        return backup_filename
        
    except Exception as e:
        print(f"❌ MySQL backup failed: {e}")
        return None
```

---

## Advanced Features

### Distributed MinIO Setup

`docker-compose.yml for distributed setup:`
```yaml
version: '3.8'

services:
  minio1:
    image: minio/minio:latest
    container_name: minio1
    ports:
      - "9001:9000"
      - "9011:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio1-data:/data
    command: server http://minio{1...4}/data --console-address ":9001"

  minio2:
    image: minio/minio:latest
    container_name: minio2
    ports:
      - "9002:9000"
      - "9012:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio2-data:/data
    command: server http://minio{1...4}/data --console-address ":9001"

  minio3:
    image: minio/minio:latest
    container_name: minio3
    ports:
      - "9003:9000"
      - "9013:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio3-data:/data
    command: server http://minio{1...4}/data --console-address ":9001"

  minio4:
    image: minio/minio:latest
    container_name: minio4
    ports:
      - "9004:9000"
      - "9014:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio4-data:/data
    command: server http://minio{1...4}/data --console-address ":9001"

volumes:
  minio1-data:
  minio2-data:
  minio3-data:
  minio4-data:
```

### Lifecycle Management

```python
# Set lifecycle policy for automatic cleanup
lifecycle_config = {
    "Rules": [
        {
            "ID": "DeleteOldBackups",
            "Status": "Enabled",
            "Filter": {"Prefix": "database-backups/"},
            "Expiration": {"Days": 30}
        },
        {
            "ID": "TransitionToIA",
            "Status": "Enabled", 
            "Filter": {"Prefix": "logs/"},
            "Transitions": [
                {
                    "Days": 7,
                    "StorageClass": "STANDARD_IA"
                }
            ]
        }
    ]
}

s3_client.put_bucket_lifecycle_configuration(
    Bucket="database-backups",
    LifecycleConfiguration=lifecycle_config
)
```

---

## Monitoring and Maintenance

### Storage Metrics

```python
def get_storage_metrics():
    """Get storage usage metrics"""
    buckets = minio_client.list_buckets()
    
    metrics = {
        "total_buckets": len(buckets),
        "total_objects": 0,
        "total_size": 0,
        "buckets": {}
    }
    
    for bucket in buckets:
        objects = list(minio_client.list_objects(bucket.name, recursive=True))
        bucket_objects = len(objects)
        bucket_size = sum(obj.size for obj in objects)
        
        metrics["total_objects"] += bucket_objects
        metrics["total_size"] += bucket_size
        metrics["buckets"][bucket.name] = {
            "objects": bucket_objects,
            "size": bucket_size
        }
    
    return metrics

# Usage
metrics = get_storage_metrics()
print(f"Total storage: {metrics['total_size']/1024/1024:.2f} MB")
```

### Health Checks

```bash
# Check MinIO health
curl http://localhost:9000/minio/health/live

# Check cluster status (for distributed setup)
curl http://localhost:9000/minio/health/cluster
```

---

## Security Best Practices

### Access Keys Management

```python
# Create service-specific access keys
from minio.credentials import StaticProvider

# Create read-only credentials for backup service
backup_credentials = StaticProvider(
    access_key="backup-service-key",
    secret_key="backup-service-secret"
)

# Create application-specific credentials
app_credentials = StaticProvider(
    access_key="app-service-key", 
    secret_key="app-service-secret"
)
```

### Bucket Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::backup-service:user/backup"},
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::database-backups/*"
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::database-backups/*"
    }
  ]
}
```

---

## Common Use Cases

- **Database Backups**: Automated backup storage for PostgreSQL, MySQL, MongoDB
- **Application Data**: User uploads, generated reports, temporary files
- **Log Archival**: Long-term storage of application and system logs
- **Artifact Storage**: Build artifacts, deployment packages, documentation
- **Data Lake**: Raw data storage for analytics and machine learning

✅ MinIO is now running in Docker and ready for your object storage needs!
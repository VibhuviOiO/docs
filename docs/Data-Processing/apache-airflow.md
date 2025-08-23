---
sidebar_position: 2
title: Apache Airflow
description: Apache Airflow is an open-source platform for developing, scheduling, and monitoring workflows. Learn how to set up Airflow with Docker for data pipeline orchestration.
slug: /Data-Processing/ApacheAirflow
keywords:
  - Apache Airflow
  - workflow orchestration
  - data pipelines
  - ETL
  - task scheduling
  - DAG
  - data engineering
  - pipeline automation
  - workflow management
  - batch processing
---

# 🌬️ Apache Airflow - Workflow Orchestration Platform

**Apache Airflow** is an open-source platform for **developing**, **scheduling**, and **monitoring workflows**. It allows you to programmatically author, schedule, and monitor **data pipelines** using **Directed Acyclic Graphs (DAGs)**.

---

## Set Up Airflow with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # PostgreSQL database for Airflow metadata
  postgres:
    image: postgres:15
    container_name: airflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "airflow"]
      interval: 10s
      retries: 5
      start_period: 5s

  # Redis for Celery executor
  redis:
    image: redis:7-alpine
    container_name: airflow-redis
    restart: unless-stopped
    expose:
      - 6379
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 30s
      retries: 50
      start_period: 30s

  # Airflow webserver
  airflow-webserver:
    image: apache/airflow:2.7.3
    container_name: airflow-webserver
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment: &airflow-common-env
      AIRFLOW__CORE__EXECUTOR: CeleryExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__RESULT_BACKEND: db+postgresql://airflow:airflow@postgres/airflow
      AIRFLOW__CELERY__BROKER_URL: redis://:@redis:6379/0
      AIRFLOW__CORE__FERNET_KEY: ''
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
      AIRFLOW__API__AUTH_BACKENDS: 'airflow.api.auth.backend.basic_auth,airflow.api.auth.backend.session'
      AIRFLOW__SCHEDULER__ENABLE_HEALTH_CHECK: 'true'
      AIRFLOW__WEBSERVER__EXPOSE_CONFIG: 'true'
      _PIP_ADDITIONAL_REQUIREMENTS: 'apache-airflow-providers-postgres apache-airflow-providers-redis apache-airflow-providers-docker apache-airflow-providers-kubernetes'
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
      - ./config:/opt/airflow/config
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "8080:8080"
    command: webserver
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # Airflow scheduler
  airflow-scheduler:
    image: apache/airflow:2.7.3
    container_name: airflow-scheduler
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *airflow-common-env
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
      - ./config:/opt/airflow/config
      - /var/run/docker.sock:/var/run/docker.sock
    command: scheduler
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8974/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # Airflow worker
  airflow-worker:
    image: apache/airflow:2.7.3
    container_name: airflow-worker
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *airflow-common-env
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
      - ./config:/opt/airflow/config
      - /var/run/docker.sock:/var/run/docker.sock
    command: celery worker
    healthcheck:
      test: ["CMD-SHELL", 'celery --app airflow.executors.celery_executor.app inspect ping -d "celery@$${HOSTNAME}"']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # Airflow triggerer
  airflow-triggerer:
    image: apache/airflow:2.7.3
    container_name: airflow-triggerer
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *airflow-common-env
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
      - ./config:/opt/airflow/config
    command: triggerer
    healthcheck:
      test: ["CMD-SHELL", 'airflow jobs check --job-type TriggererJob --hostname "$${HOSTNAME}"']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # Flower for monitoring Celery
  flower:
    image: apache/airflow:2.7.3
    container_name: airflow-flower
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
    environment:
      <<: *airflow-common-env
    ports:
      - "5555:5555"
    command: celery flower

  # Airflow CLI for initialization
  airflow-init:
    image: apache/airflow:2.7.3
    container_name: airflow-init
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *airflow-common-env
      _AIRFLOW_DB_UPGRADE: 'true'
      _AIRFLOW_WWW_USER_CREATE: 'true'
      _AIRFLOW_WWW_USER_USERNAME: admin
      _AIRFLOW_WWW_USER_PASSWORD: admin
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
      - ./config:/opt/airflow/config
    command: version

volumes:
  postgres-data:
  redis-data:
```

`Create necessary directories:`
```bash
mkdir -p dags logs plugins config
```

`Start Airflow:`
```bash
docker compose up airflow-init
docker compose up -d
```

`Access Airflow UI:`
```bash
echo "Airflow UI: http://localhost:8080"
echo "Username: admin"
echo "Password: admin"
echo "Flower UI: http://localhost:5555"
```

---

## Basic DAG Examples

### Simple ETL Pipeline

`Create dags/simple_etl_dag.py:`
```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import pandas as pd
import requests

# Default arguments
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'catchup': False
}

# Define DAG
dag = DAG(
    'simple_etl_pipeline',
    default_args=default_args,
    description='A simple ETL pipeline',
    schedule_interval=timedelta(hours=1),
    max_active_runs=1,
    tags=['etl', 'data-pipeline']
)

def extract_data(**context):
    """Extract data from API"""
    print("Extracting data from API...")
    
    # Example API call
    response = requests.get('https://jsonplaceholder.typicode.com/users')
    data = response.json()
    
    # Save to temporary location
    df = pd.DataFrame(data)
    df.to_csv('/tmp/extracted_data.csv', index=False)
    
    print(f"Extracted {len(data)} records")
    return len(data)

def transform_data(**context):
    """Transform the extracted data"""
    print("Transforming data...")
    
    # Read extracted data
    df = pd.read_csv('/tmp/extracted_data.csv')
    
    # Data transformations
    df['full_name'] = df['name'].str.upper()
    df['domain'] = df['email'].str.split('@').str[1]
    df['created_at'] = datetime.now()
    
    # Select relevant columns
    transformed_df = df[['id', 'full_name', 'email', 'domain', 'phone', 'created_at']]
    
    # Save transformed data
    transformed_df.to_csv('/tmp/transformed_data.csv', index=False)
    
    print(f"Transformed {len(transformed_df)} records")
    return len(transformed_df)

def load_data(**context):
    """Load data into database"""
    print("Loading data into database...")
    
    # Read transformed data
    df = pd.read_csv('/tmp/transformed_data.csv')
    
    # Get database connection
    postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    # Insert data
    for _, row in df.iterrows():
        postgres_hook.run("""
            INSERT INTO users (id, full_name, email, domain, phone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                domain = EXCLUDED.domain,
                phone = EXCLUDED.phone,
                created_at = EXCLUDED.created_at
        """, parameters=(
            row['id'], row['full_name'], row['email'], 
            row['domain'], row['phone'], row['created_at']
        ))
    
    print(f"Loaded {len(df)} records into database")
    return len(df)

def cleanup_temp_files(**context):
    """Clean up temporary files"""
    import os
    
    temp_files = ['/tmp/extracted_data.csv', '/tmp/transformed_data.csv']
    
    for file_path in temp_files:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Removed {file_path}")

# Create table task
create_table = PostgresOperator(
    task_id='create_table',
    postgres_conn_id='postgres_default',
    sql="""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            full_name VARCHAR(255),
            email VARCHAR(255),
            domain VARCHAR(255),
            phone VARCHAR(255),
            created_at TIMESTAMP
        );
    """,
    dag=dag
)

# Extract task
extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_data,
    dag=dag
)

# Transform task
transform_task = PythonOperator(
    task_id='transform_data',
    python_callable=transform_data,
    dag=dag
)

# Load task
load_task = PythonOperator(
    task_id='load_data',
    python_callable=load_data,
    dag=dag
)

# Data quality check
quality_check = PostgresOperator(
    task_id='data_quality_check',
    postgres_conn_id='postgres_default',
    sql="""
        SELECT COUNT(*) as record_count,
               COUNT(DISTINCT email) as unique_emails,
               COUNT(CASE WHEN email LIKE '%@%' THEN 1 END) as valid_emails
        FROM users
        WHERE created_at >= NOW() - INTERVAL '1 hour';
    """,
    dag=dag
)

# Cleanup task
cleanup_task = PythonOperator(
    task_id='cleanup_temp_files',
    python_callable=cleanup_temp_files,
    dag=dag,
    trigger_rule='all_done'  # Run regardless of upstream task status
)

# Define task dependencies
create_table >> extract_task >> transform_task >> load_task >> quality_check >> cleanup_task
```

### Data Processing with Docker

`Create dags/docker_processing_dag.py:`
```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'docker_data_processing',
    default_args=default_args,
    description='Data processing using Docker containers',
    schedule_interval='@daily',
    catchup=False,
    tags=['docker', 'data-processing']
)

# Python data processing in Docker
python_processing = DockerOperator(
    task_id='python_data_processing',
    image='python:3.9-slim',
    command=[
        'bash', '-c',
        '''
        pip install pandas requests &&
        python -c "
import pandas as pd
import requests
import json

# Fetch data
response = requests.get('https://api.github.com/repos/apache/airflow/commits')
commits = response.json()

# Process data
df = pd.DataFrame([{
    'sha': commit['sha'][:7],
    'author': commit['commit']['author']['name'],
    'message': commit['commit']['message'][:50],
    'date': commit['commit']['author']['date']
} for commit in commits])

# Save results
df.to_csv('/tmp/processed_commits.csv', index=False)
print(f'Processed {len(df)} commits')
        "
        '''
    ],
    volumes=['/tmp:/tmp'],
    dag=dag
)

# Spark processing in Docker
spark_processing = DockerOperator(
    task_id='spark_data_processing',
    image='bitnami/spark:3.4',
    command=[
        'spark-submit',
        '--master', 'local[*]',
        '--py-files', '/tmp/spark_job.py',
        '/tmp/spark_job.py'
    ],
    volumes=['/tmp:/tmp'],
    dag=dag
)

# Create Spark job file
create_spark_job = BashOperator(
    task_id='create_spark_job',
    bash_command='''
cat > /tmp/spark_job.py << 'EOF'
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

# Initialize Spark
spark = SparkSession.builder.appName("DataProcessing").getOrCreate()

# Create sample data
data = [(1, "Alice", 25), (2, "Bob", 30), (3, "Charlie", 35)]
df = spark.createDataFrame(data, ["id", "name", "age"])

# Process data
result = df.withColumn("age_group", 
    when(col("age") < 30, "Young")
    .when(col("age") < 40, "Middle")
    .otherwise("Senior")
)

# Save results
result.write.mode("overwrite").csv("/tmp/spark_output")

print("Spark processing completed")
spark.stop()
EOF
    ''',
    dag=dag
)

# Task dependencies
create_spark_job >> [python_processing, spark_processing]
```

### Machine Learning Pipeline

`Create dags/ml_pipeline_dag.py:`
```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    description='Machine Learning training pipeline',
    schedule_interval='@weekly',
    catchup=False,
    tags=['ml', 'training']
)

def extract_training_data(**context):
    """Extract data for model training"""
    postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    # Extract features and target
    sql = """
        SELECT feature1, feature2, feature3, feature4, target
        FROM ml_training_data
        WHERE created_at >= NOW() - INTERVAL '30 days'
    """
    
    df = postgres_hook.get_pandas_df(sql)
    
    # Save to temporary location
    df.to_csv('/tmp/training_data.csv', index=False)
    
    print(f"Extracted {len(df)} training samples")
    return len(df)

def preprocess_data(**context):
    """Preprocess the training data"""
    df = pd.read_csv('/tmp/training_data.csv')
    
    # Handle missing values
    df = df.fillna(df.mean())
    
    # Feature engineering
    df['feature_interaction'] = df['feature1'] * df['feature2']
    df['feature_ratio'] = df['feature3'] / (df['feature4'] + 1)
    
    # Save preprocessed data
    df.to_csv('/tmp/preprocessed_data.csv', index=False)
    
    print(f"Preprocessed {len(df)} samples")
    return len(df)

def train_model(**context):
    """Train the machine learning model"""
    df = pd.read_csv('/tmp/preprocessed_data.csv')
    
    # Prepare features and target
    feature_columns = ['feature1', 'feature2', 'feature3', 'feature4', 
                      'feature_interaction', 'feature_ratio']
    X = df[feature_columns]
    y = df['target']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Model accuracy: {accuracy:.4f}")
    
    # Save model
    os.makedirs('/tmp/models', exist_ok=True)
    model_path = f'/tmp/models/model_{context["ds"]}.joblib'
    joblib.dump(model, model_path)
    
    # Save metrics
    metrics = {
        'accuracy': accuracy,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'model_path': model_path
    }
    
    return metrics

def validate_model(**context):
    """Validate the trained model"""
    ti = context['ti']
    metrics = ti.xcom_pull(task_ids='train_model')
    
    # Model validation criteria
    min_accuracy = 0.8
    min_samples = 1000
    
    if metrics['accuracy'] < min_accuracy:
        raise ValueError(f"Model accuracy {metrics['accuracy']:.4f} below threshold {min_accuracy}")
    
    if metrics['training_samples'] < min_samples:
        raise ValueError(f"Training samples {metrics['training_samples']} below threshold {min_samples}")
    
    print("Model validation passed")
    return True

def deploy_model(**context):
    """Deploy the validated model"""
    ti = context['ti']
    metrics = ti.xcom_pull(task_ids='train_model')
    
    model_path = metrics['model_path']
    
    # In production, this would deploy to a model serving platform
    # For now, we'll just copy to a "production" location
    production_path = '/tmp/models/production_model.joblib'
    
    import shutil
    shutil.copy2(model_path, production_path)
    
    print(f"Model deployed to {production_path}")
    
    # Log deployment
    postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
    postgres_hook.run("""
        INSERT INTO model_deployments (model_path, accuracy, deployed_at)
        VALUES (%s, %s, %s)
    """, parameters=(production_path, metrics['accuracy'], datetime.now()))
    
    return production_path

# Define tasks
extract_task = PythonOperator(
    task_id='extract_training_data',
    python_callable=extract_training_data,
    dag=dag
)

preprocess_task = PythonOperator(
    task_id='preprocess_data',
    python_callable=preprocess_data,
    dag=dag
)

train_task = PythonOperator(
    task_id='train_model',
    python_callable=train_model,
    dag=dag
)

validate_task = PythonOperator(
    task_id='validate_model',
    python_callable=validate_model,
    dag=dag
)

deploy_task = PythonOperator(
    task_id='deploy_model',
    python_callable=deploy_model,
    dag=dag
)

# Task dependencies
extract_task >> preprocess_task >> train_task >> validate_task >> deploy_task
```

---

## Advanced Features

### Dynamic DAGs

`Create dags/dynamic_dag_generator.py:`
```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

# Configuration for different data sources
DATA_SOURCES = {
    'users': {
        'table': 'users',
        'api_endpoint': 'https://api.example.com/users',
        'schedule': '@hourly'
    },
    'orders': {
        'table': 'orders',
        'api_endpoint': 'https://api.example.com/orders',
        'schedule': '@daily'
    },
    'products': {
        'table': 'products',
        'api_endpoint': 'https://api.example.com/products',
        'schedule': '@weekly'
    }
}

def create_dag(source_name, config):
    """Create a DAG for a specific data source"""
    
    default_args = {
        'owner': 'data-team',
        'depends_on_past': False,
        'start_date': datetime(2024, 1, 1),
        'retries': 2,
        'retry_delay': timedelta(minutes=5)
    }
    
    dag = DAG(
        f'etl_{source_name}',
        default_args=default_args,
        description=f'ETL pipeline for {source_name}',
        schedule_interval=config['schedule'],
        catchup=False,
        tags=['etl', 'dynamic', source_name]
    )
    
    def extract_data(**context):
        import requests
        import pandas as pd
        
        response = requests.get(config['api_endpoint'])
        data = response.json()
        
        df = pd.DataFrame(data)
        df.to_csv(f'/tmp/{source_name}_data.csv', index=False)
        
        return len(data)
    
    def load_data(**context):
        import pandas as pd
        from airflow.providers.postgres.hooks.postgres import PostgresHook
        
        df = pd.read_csv(f'/tmp/{source_name}_data.csv')
        postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
        
        # Truncate and load
        postgres_hook.run(f'TRUNCATE TABLE {config["table"]}')
        
        for _, row in df.iterrows():
            columns = ', '.join(row.index)
            values = ', '.join(['%s'] * len(row))
            sql = f'INSERT INTO {config["table"]} ({columns}) VALUES ({values})'
            postgres_hook.run(sql, parameters=tuple(row.values))
        
        return len(df)
    
    # Create tasks
    extract_task = PythonOperator(
        task_id=f'extract_{source_name}',
        python_callable=extract_data,
        dag=dag
    )
    
    load_task = PythonOperator(
        task_id=f'load_{source_name}',
        python_callable=load_data,
        dag=dag
    )
    
    cleanup_task = BashOperator(
        task_id=f'cleanup_{source_name}',
        bash_command=f'rm -f /tmp/{source_name}_data.csv',
        dag=dag
    )
    
    # Set dependencies
    extract_task >> load_task >> cleanup_task
    
    return dag

# Generate DAGs for each data source
for source_name, config in DATA_SOURCES.items():
    globals()[f'etl_{source_name}_dag'] = create_dag(source_name, config)
```

### Custom Operators

`Create plugins/operators/custom_operators.py:`
```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
from airflow.providers.postgres.hooks.postgres import PostgresHook
import requests
import pandas as pd

class APIToPostgresOperator(BaseOperator):
    """Custom operator to extract data from API and load to PostgreSQL"""
    
    template_fields = ['api_endpoint', 'table_name']
    
    @apply_defaults
    def __init__(
        self,
        api_endpoint,
        table_name,
        postgres_conn_id='postgres_default',
        method='GET',
        headers=None,
        params=None,
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.api_endpoint = api_endpoint
        self.table_name = table_name
        self.postgres_conn_id = postgres_conn_id
        self.method = method
        self.headers = headers or {}
        self.params = params or {}
    
    def execute(self, context):
        # Extract data from API
        self.log.info(f"Extracting data from {self.api_endpoint}")
        
        response = requests.request(
            method=self.method,
            url=self.api_endpoint,
            headers=self.headers,
            params=self.params
        )
        response.raise_for_status()
        
        data = response.json()
        df = pd.DataFrame(data)
        
        self.log.info(f"Extracted {len(df)} records")
        
        # Load data to PostgreSQL
        postgres_hook = PostgresHook(postgres_conn_id=self.postgres_conn_id)
        
        # Create table if not exists (basic implementation)
        if not df.empty:
            columns = []
            for col in df.columns:
                if df[col].dtype == 'object':
                    columns.append(f"{col} TEXT")
                elif df[col].dtype in ['int64', 'int32']:
                    columns.append(f"{col} INTEGER")
                elif df[col].dtype in ['float64', 'float32']:
                    columns.append(f"{col} FLOAT")
                else:
                    columns.append(f"{col} TEXT")
            
            create_table_sql = f"""
                CREATE TABLE IF NOT EXISTS {self.table_name} (
                    {', '.join(columns)}
                )
            """
            postgres_hook.run(create_table_sql)
            
            # Insert data
            for _, row in df.iterrows():
                columns_str = ', '.join(row.index)
                values_str = ', '.join(['%s'] * len(row))
                insert_sql = f"INSERT INTO {self.table_name} ({columns_str}) VALUES ({values_str})"
                postgres_hook.run(insert_sql, parameters=tuple(row.values))
        
        self.log.info(f"Loaded {len(df)} records to {self.table_name}")
        return len(df)

class DataQualityOperator(BaseOperator):
    """Custom operator for data quality checks"""
    
    template_fields = ['sql_checks']
    
    @apply_defaults
    def __init__(
        self,
        sql_checks,
        postgres_conn_id='postgres_default',
        *args,
        **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.sql_checks = sql_checks
        self.postgres_conn_id = postgres_conn_id
    
    def execute(self, context):
        postgres_hook = PostgresHook(postgres_conn_id=self.postgres_conn_id)
        
        failed_checks = []
        
        for check_name, check_sql in self.sql_checks.items():
            self.log.info(f"Running data quality check: {check_name}")
            
            result = postgres_hook.get_first(check_sql)
            
            if result and result[0] == 0:
                failed_checks.append(check_name)
                self.log.error(f"Data quality check failed: {check_name}")
            else:
                self.log.info(f"Data quality check passed: {check_name}")
        
        if failed_checks:
            raise ValueError(f"Data quality checks failed: {', '.join(failed_checks)}")
        
        self.log.info("All data quality checks passed")
        return True
```

---

## Monitoring and Alerting

### Custom Monitoring DAG

`Create dags/monitoring_dag.py:`
```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.email.operators.email import EmailOperator
import requests

default_args = {
    'owner': 'ops-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'system_monitoring',
    default_args=default_args,
    description='System monitoring and alerting',
    schedule_interval=timedelta(minutes=15),
    catchup=False,
    tags=['monitoring', 'alerts']
)

def check_dag_failures(**context):
    """Check for failed DAG runs in the last hour"""
    postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    sql = """
        SELECT dag_id, COUNT(*) as failure_count
        FROM dag_run
        WHERE state = 'failed'
        AND start_date >= NOW() - INTERVAL '1 hour'
        GROUP BY dag_id
        HAVING COUNT(*) > 0
    """
    
    failures = postgres_hook.get_records(sql)
    
    if failures:
        failure_msg = "Failed DAGs in the last hour:\n"
        for dag_id, count in failures:
            failure_msg += f"- {dag_id}: {count} failures\n"
        
        context['task_instance'].xcom_push(key='dag_failures', value=failure_msg)
        return True
    
    return False

def check_task_duration(**context):
    """Check for tasks running longer than expected"""
    postgres_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    sql = """
        SELECT dag_id, task_id, 
               EXTRACT(EPOCH FROM (NOW() - start_date))/60 as duration_minutes
        FROM task_instance
        WHERE state = 'running'
        AND start_date < NOW() - INTERVAL '30 minutes'
    """
    
    long_running = postgres_hook.get_records(sql)
    
    if long_running:
        duration_msg = "Long-running tasks:\n"
        for dag_id, task_id, duration in long_running:
            duration_msg += f"- {dag_id}.{task_id}: {duration:.1f} minutes\n"
        
        context['task_instance'].xcom_push(key='long_running_tasks', value=duration_msg)
        return True
    
    return False

def check_system_resources(**context):
    """Check system resource usage"""
    # This would typically check actual system metrics
    # For demo purposes, we'll simulate some checks
    
    alerts = []
    
    # Simulate disk usage check
    disk_usage = 85  # Simulated percentage
    if disk_usage > 80:
        alerts.append(f"High disk usage: {disk_usage}%")
    
    # Simulate memory usage check
    memory_usage = 75  # Simulated percentage
    if memory_usage > 80:
        alerts.append(f"High memory usage: {memory_usage}%")
    
    if alerts:
        resource_msg = "System resource alerts:\n" + "\n".join(f"- {alert}" for alert in alerts)
        context['task_instance'].xcom_push(key='resource_alerts', value=resource_msg)
        return True
    
    return False

def send_alert_if_needed(**context):
    """Send alert email if any issues were found"""
    ti = context['task_instance']
    
    dag_failures = ti.xcom_pull(task_ids='check_dag_failures', key='dag_failures')
    long_running = ti.xcom_pull(task_ids='check_task_duration', key='long_running_tasks')
    resource_alerts = ti.xcom_pull(task_ids='check_system_resources', key='resource_alerts')
    
    if any([dag_failures, long_running, resource_alerts]):
        alert_message = "Airflow System Alert\n\n"
        
        if dag_failures:
            alert_message += dag_failures + "\n"
        
        if long_running:
            alert_message += long_running + "\n"
        
        if resource_alerts:
            alert_message += resource_alerts + "\n"
        
        # In a real implementation, you would send this via email or Slack
        print("ALERT:", alert_message)
        return alert_message
    
    return "No alerts"

# Define tasks
check_dag_failures_task = PythonOperator(
    task_id='check_dag_failures',
    python_callable=check_dag_failures,
    dag=dag
)

check_task_duration_task = PythonOperator(
    task_id='check_task_duration',
    python_callable=check_task_duration,
    dag=dag
)

check_system_resources_task = PythonOperator(
    task_id='check_system_resources',
    python_callable=check_system_resources,
    dag=dag
)

send_alert_task = PythonOperator(
    task_id='send_alert_if_needed',
    python_callable=send_alert_if_needed,
    dag=dag
)

# Task dependencies
[check_dag_failures_task, check_task_duration_task, check_system_resources_task] >> send_alert_task
```

---

## Common Use Cases

- **ETL Pipelines**: Extract, transform, and load data from various sources
- **Data Warehouse Management**: Scheduled data processing and aggregation
- **Machine Learning Workflows**: Model training, validation, and deployment
- **Data Quality Monitoring**: Automated data validation and alerting
- **Report Generation**: Scheduled report creation and distribution
- **System Maintenance**: Automated cleanup and maintenance tasks

✅ Apache Airflow is now configured for comprehensive workflow orchestration!
---
sidebar_position: 3
title: Apache Spark
description: Apache Spark is a unified analytics engine for large-scale data processing. Learn how to set up Spark with Docker for big data processing and analytics.
slug: /Data-Processing/ApacheSpark
keywords:
  - Apache Spark
  - big data processing
  - distributed computing
  - data analytics
  - PySpark
  - Spark SQL
  - machine learning
  - stream processing
  - data engineering
  - cluster computing
---

# ⚡ Apache Spark - Unified Analytics Engine for Big Data

**Apache Spark** is a **unified analytics engine** for large-scale data processing. It provides high-level APIs in **Java**, **Scala**, **Python**, and **R**, and supports **SQL**, **streaming**, **machine learning**, and **graph processing**.

---

## Set Up Spark with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  # Spark Master
  spark-master:
    image: bitnami/spark:3.5
    container_name: spark-master
    restart: unless-stopped
    environment:
      - SPARK_MODE=master
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=no
      - SPARK_SSL_ENABLED=no
      - SPARK_USER=spark
    ports:
      - "8080:8080"  # Spark Master Web UI
      - "7077:7077"  # Spark Master Port
    volumes:
      - ./spark-apps:/opt/bitnami/spark/apps
      - ./spark-data:/opt/bitnami/spark/data
      - ./spark-logs:/opt/bitnami/spark/logs

  # Spark Worker 1
  spark-worker-1:
    image: bitnami/spark:3.5
    container_name: spark-worker-1
    restart: unless-stopped
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
      - SPARK_WORKER_MEMORY=2g
      - SPARK_WORKER_CORES=2
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=no
      - SPARK_SSL_ENABLED=no
      - SPARK_USER=spark
    ports:
      - "8081:8081"  # Spark Worker Web UI
    volumes:
      - ./spark-apps:/opt/bitnami/spark/apps
      - ./spark-data:/opt/bitnami/spark/data
      - ./spark-logs:/opt/bitnami/spark/logs
    depends_on:
      - spark-master

  # Spark Worker 2
  spark-worker-2:
    image: bitnami/spark:3.5
    container_name: spark-worker-2
    restart: unless-stopped
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
      - SPARK_WORKER_MEMORY=2g
      - SPARK_WORKER_CORES=2
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=no
      - SPARK_SSL_ENABLED=no
      - SPARK_USER=spark
    ports:
      - "8082:8082"  # Spark Worker Web UI
    volumes:
      - ./spark-apps:/opt/bitnami/spark/apps
      - ./spark-data:/opt/bitnami/spark/data
      - ./spark-logs:/opt/bitnami/spark/logs
    depends_on:
      - spark-master

  # Jupyter Notebook with PySpark
  jupyter:
    image: jupyter/pyspark-notebook:latest
    container_name: spark-jupyter
    restart: unless-stopped
    ports:
      - "8888:8888"
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - SPARK_MASTER=spark://spark-master:7077
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./spark-data:/home/jovyan/data
    depends_on:
      - spark-master

  # PostgreSQL for data storage
  postgres:
    image: postgres:15
    container_name: spark-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=sparkdb
      - POSTGRES_USER=spark
      - POSTGRES_PASSWORD=spark123
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # MinIO for object storage
  minio:
    image: minio/minio:latest
    container_name: spark-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres-data:
  minio-data:
```

`Create necessary directories:`
```bash
mkdir -p spark-apps spark-data spark-logs notebooks
```

`Start Spark cluster:`
```bash
docker compose up -d
```

`Access Spark UIs:`
```bash
echo "Spark Master UI: http://localhost:8080"
echo "Spark Worker 1 UI: http://localhost:8081"
echo "Spark Worker 2 UI: http://localhost:8082"
echo "Jupyter Notebook: http://localhost:8888"
echo "MinIO Console: http://localhost:9001"
```

---

## Basic PySpark Applications

### Data Processing Example

`Create spark-apps/data_processing.py:`
```python
#!/usr/bin/env python3
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import sys

def create_spark_session(app_name="DataProcessing"):
    """Create Spark session"""
    return SparkSession.builder \
        .appName(app_name) \
        .config("spark.sql.adaptive.enabled", "true") \
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
        .getOrCreate()

def process_sales_data(spark):
    """Process sales data example"""
    
    # Create sample sales data
    sales_data = [
        (1, "2024-01-01", "Electronics", "Laptop", 999.99, 2),
        (2, "2024-01-01", "Electronics", "Mouse", 29.99, 5),
        (3, "2024-01-02", "Books", "Python Guide", 49.99, 3),
        (4, "2024-01-02", "Electronics", "Keyboard", 79.99, 2),
        (5, "2024-01-03", "Books", "Data Science", 59.99, 1),
        (6, "2024-01-03", "Electronics", "Monitor", 299.99, 1),
        (7, "2024-01-04", "Electronics", "Laptop", 999.99, 1),
        (8, "2024-01-04", "Books", "Machine Learning", 69.99, 2)
    ]
    
    schema = StructType([
        StructField("order_id", IntegerType(), True),
        StructField("order_date", StringType(), True),
        StructField("category", StringType(), True),
        StructField("product", StringType(), True),
        StructField("price", DoubleType(), True),
        StructField("quantity", IntegerType(), True)
    ])
    
    df = spark.createDataFrame(sales_data, schema)
    
    # Convert string date to date type
    df = df.withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
    
    # Calculate total amount
    df = df.withColumn("total_amount", col("price") * col("quantity"))
    
    print("=== Original Data ===")
    df.show()
    
    # Aggregations
    print("=== Sales by Category ===")
    category_sales = df.groupBy("category") \
        .agg(
            sum("total_amount").alias("total_sales"),
            count("order_id").alias("order_count"),
            avg("total_amount").alias("avg_order_value")
        ) \
        .orderBy(desc("total_sales"))
    
    category_sales.show()
    
    # Daily sales trend
    print("=== Daily Sales Trend ===")
    daily_sales = df.groupBy("order_date") \
        .agg(
            sum("total_amount").alias("daily_total"),
            count("order_id").alias("daily_orders")
        ) \
        .orderBy("order_date")
    
    daily_sales.show()
    
    # Top products
    print("=== Top Products by Revenue ===")
    product_revenue = df.groupBy("product") \
        .agg(
            sum("total_amount").alias("product_revenue"),
            sum("quantity").alias("total_quantity")
        ) \
        .orderBy(desc("product_revenue"))
    
    product_revenue.show()
    
    # Save results
    category_sales.write \
        .mode("overwrite") \
        .option("header", "true") \
        .csv("/opt/bitnami/spark/data/category_sales")
    
    print("Results saved to /opt/bitnami/spark/data/category_sales")
    
    return df

def process_streaming_data(spark):
    """Example of structured streaming (simulated)"""
    
    # Create a streaming DataFrame (simulated with rate source)
    streaming_df = spark \
        .readStream \
        .format("rate") \
        .option("rowsPerSecond", 10) \
        .load()
    
    # Process the streaming data
    processed_df = streaming_df \
        .withColumn("event_time", current_timestamp()) \
        .withColumn("random_value", rand() * 100) \
        .withColumn("category", 
                   when(col("random_value") < 33, "A")
                   .when(col("random_value") < 66, "B")
                   .otherwise("C"))
    
    # Write to console (for demonstration)
    query = processed_df.writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", "false") \
        .trigger(processingTime='10 seconds') \
        .start()
    
    print("Streaming query started. Press Ctrl+C to stop.")
    
    # In a real application, you might write to Kafka, database, etc.
    # query.awaitTermination()
    
    return query

def main():
    spark = create_spark_session("SalesDataProcessing")
    
    try:
        # Process batch data
        df = process_sales_data(spark)
        
        # Uncomment to run streaming example
        # streaming_query = process_streaming_data(spark)
        
        print("Data processing completed successfully!")
        
    except Exception as e:
        print(f"Error during processing: {e}")
        sys.exit(1)
    
    finally:
        spark.stop()

if __name__ == "__main__":
    main()
```

### Machine Learning with Spark MLlib

`Create spark-apps/ml_pipeline.py:`
```python
#!/usr/bin/env python3
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler, StringIndexer
from pyspark.ml.classification import RandomForestClassifier, LogisticRegression
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
import sys

def create_spark_session():
    """Create Spark session with ML libraries"""
    return SparkSession.builder \
        .appName("MLPipeline") \
        .config("spark.sql.adaptive.enabled", "true") \
        .getOrCreate()

def create_sample_data(spark):
    """Create sample dataset for classification"""
    
    # Generate sample customer data
    data = []
    import random
    
    for i in range(1000):
        age = random.randint(18, 80)
        income = random.randint(20000, 150000)
        spending_score = random.randint(1, 100)
        
        # Create target variable based on some logic
        if age < 30 and income > 50000 and spending_score > 60:
            target = "High Value"
        elif age > 50 and income > 80000:
            target = "High Value"
        elif spending_score < 30:
            target = "Low Value"
        else:
            target = "Medium Value"
        
        data.append((i, age, income, spending_score, target))
    
    schema = StructType([
        StructField("customer_id", IntegerType(), True),
        StructField("age", IntegerType(), True),
        StructField("income", IntegerType(), True),
        StructField("spending_score", IntegerType(), True),
        StructField("customer_segment", StringType(), True)
    ])
    
    return spark.createDataFrame(data, schema)

def build_ml_pipeline():
    """Build machine learning pipeline"""
    
    # Feature engineering
    feature_cols = ["age", "income", "spending_score"]
    vector_assembler = VectorAssembler(
        inputCols=feature_cols,
        outputCol="features_raw"
    )
    
    # Feature scaling
    scaler = StandardScaler(
        inputCol="features_raw",
        outputCol="features",
        withStd=True,
        withMean=True
    )
    
    # Target encoding
    label_indexer = StringIndexer(
        inputCol="customer_segment",
        outputCol="label"
    )
    
    # Classifier
    rf = RandomForestClassifier(
        featuresCol="features",
        labelCol="label",
        numTrees=100,
        maxDepth=10,
        seed=42
    )
    
    # Create pipeline
    pipeline = Pipeline(stages=[
        vector_assembler,
        scaler,
        label_indexer,
        rf
    ])
    
    return pipeline

def train_and_evaluate_model(spark, df):
    """Train and evaluate the ML model"""
    
    print("=== Dataset Overview ===")
    df.show(10)
    df.describe().show()
    
    print("=== Target Distribution ===")
    df.groupBy("customer_segment").count().show()
    
    # Split data
    train_df, test_df = df.randomSplit([0.8, 0.2], seed=42)
    
    print(f"Training samples: {train_df.count()}")
    print(f"Test samples: {test_df.count()}")
    
    # Build and train pipeline
    pipeline = build_ml_pipeline()
    model = pipeline.fit(train_df)
    
    # Make predictions
    predictions = model.transform(test_df)
    
    print("=== Sample Predictions ===")
    predictions.select(
        "customer_id", "age", "income", "spending_score",
        "customer_segment", "prediction", "probability"
    ).show(10, truncate=False)
    
    # Evaluate model
    evaluator = MulticlassClassificationEvaluator(
        labelCol="label",
        predictionCol="prediction",
        metricName="accuracy"
    )
    
    accuracy = evaluator.evaluate(predictions)
    print(f"Model Accuracy: {accuracy:.4f}")
    
    # Additional metrics
    evaluator_f1 = MulticlassClassificationEvaluator(
        labelCol="label",
        predictionCol="prediction",
        metricName="f1"
    )
    
    f1_score = evaluator_f1.evaluate(predictions)
    print(f"F1 Score: {f1_score:.4f}")
    
    # Feature importance (for Random Forest)
    rf_model = model.stages[-1]  # Last stage is the RF classifier
    feature_importance = rf_model.featureImportances.toArray()
    feature_names = ["age", "income", "spending_score"]
    
    print("=== Feature Importance ===")
    for name, importance in zip(feature_names, feature_importance):
        print(f"{name}: {importance:.4f}")
    
    return model, predictions

def hyperparameter_tuning(spark, df):
    """Perform hyperparameter tuning with cross-validation"""
    
    print("=== Hyperparameter Tuning ===")
    
    # Split data
    train_df, test_df = df.randomSplit([0.8, 0.2], seed=42)
    
    # Build base pipeline (without the final classifier)
    feature_cols = ["age", "income", "spending_score"]
    vector_assembler = VectorAssembler(
        inputCols=feature_cols,
        outputCol="features_raw"
    )
    
    scaler = StandardScaler(
        inputCol="features_raw",
        outputCol="features",
        withStd=True,
        withMean=True
    )
    
    label_indexer = StringIndexer(
        inputCol="customer_segment",
        outputCol="label"
    )
    
    # Classifier for tuning
    lr = LogisticRegression(
        featuresCol="features",
        labelCol="label"
    )
    
    # Pipeline
    pipeline = Pipeline(stages=[
        vector_assembler,
        scaler,
        label_indexer,
        lr
    ])
    
    # Parameter grid
    param_grid = ParamGridBuilder() \
        .addGrid(lr.regParam, [0.01, 0.1, 1.0]) \
        .addGrid(lr.elasticNetParam, [0.0, 0.5, 1.0]) \
        .build()
    
    # Cross validator
    evaluator = MulticlassClassificationEvaluator(
        labelCol="label",
        predictionCol="prediction",
        metricName="accuracy"
    )
    
    cv = CrossValidator(
        estimator=pipeline,
        estimatorParamMaps=param_grid,
        evaluator=evaluator,
        numFolds=3,
        seed=42
    )
    
    # Train with cross-validation
    cv_model = cv.fit(train_df)
    
    # Best model predictions
    best_predictions = cv_model.transform(test_df)
    best_accuracy = evaluator.evaluate(best_predictions)
    
    print(f"Best Model Accuracy: {best_accuracy:.4f}")
    
    # Best parameters
    best_model = cv_model.bestModel
    best_lr = best_model.stages[-1]
    print(f"Best RegParam: {best_lr.getRegParam()}")
    print(f"Best ElasticNetParam: {best_lr.getElasticNetParam()}")
    
    return cv_model

def save_model_and_predictions(model, predictions, spark):
    """Save model and predictions"""
    
    # Save model
    model.write().overwrite().save("/opt/bitnami/spark/data/ml_model")
    print("Model saved to /opt/bitnami/spark/data/ml_model")
    
    # Save predictions
    predictions.select(
        "customer_id", "age", "income", "spending_score",
        "customer_segment", "prediction"
    ).write \
        .mode("overwrite") \
        .option("header", "true") \
        .csv("/opt/bitnami/spark/data/predictions")
    
    print("Predictions saved to /opt/bitnami/spark/data/predictions")

def main():
    spark = create_spark_session()
    
    try:
        # Create sample data
        df = create_sample_data(spark)
        
        # Train and evaluate model
        model, predictions = train_and_evaluate_model(spark, df)
        
        # Hyperparameter tuning example
        cv_model = hyperparameter_tuning(spark, df)
        
        # Save results
        save_model_and_predictions(model, predictions, spark)
        
        print("ML pipeline completed successfully!")
        
    except Exception as e:
        print(f"Error during ML pipeline: {e}")
        sys.exit(1)
    
    finally:
        spark.stop()

if __name__ == "__main__":
    main()
```

---

## Spark SQL and DataFrames

### Advanced SQL Operations

`Create spark-apps/spark_sql_demo.py:`
```python
#!/usr/bin/env python3
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
import sys

def create_spark_session():
    """Create Spark session"""
    return SparkSession.builder \
        .appName("SparkSQLDemo") \
        .config("spark.sql.adaptive.enabled", "true") \
        .getOrCreate()

def create_sample_datasets(spark):
    """Create sample datasets for demonstration"""
    
    # Orders dataset
    orders_data = [
        (1, 101, "2024-01-01", 1500.00, "completed"),
        (2, 102, "2024-01-01", 750.00, "completed"),
        (3, 103, "2024-01-02", 2200.00, "pending"),
        (4, 101, "2024-01-02", 890.00, "completed"),
        (5, 104, "2024-01-03", 1200.00, "cancelled"),
        (6, 102, "2024-01-03", 650.00, "completed"),
        (7, 105, "2024-01-04", 3200.00, "completed"),
        (8, 103, "2024-01-04", 1800.00, "completed")
    ]
    
    orders_schema = StructType([
        StructField("order_id", IntegerType(), True),
        StructField("customer_id", IntegerType(), True),
        StructField("order_date", StringType(), True),
        StructField("amount", DoubleType(), True),
        StructField("status", StringType(), True)
    ])
    
    orders_df = spark.createDataFrame(orders_data, orders_schema)
    orders_df = orders_df.withColumn("order_date", to_date(col("order_date"), "yyyy-MM-dd"))
    
    # Customers dataset
    customers_data = [
        (101, "Alice Johnson", "alice@email.com", "Premium"),
        (102, "Bob Smith", "bob@email.com", "Standard"),
        (103, "Charlie Brown", "charlie@email.com", "Premium"),
        (104, "Diana Prince", "diana@email.com", "Standard"),
        (105, "Eve Wilson", "eve@email.com", "Premium")
    ]
    
    customers_schema = StructType([
        StructField("customer_id", IntegerType(), True),
        StructField("name", StringType(), True),
        StructField("email", StringType(), True),
        StructField("tier", StringType(), True)
    ])
    
    customers_df = spark.createDataFrame(customers_data, customers_schema)
    
    # Register as temporary views for SQL queries
    orders_df.createOrReplaceTempView("orders")
    customers_df.createOrReplaceTempView("customers")
    
    return orders_df, customers_df

def demonstrate_basic_operations(spark, orders_df, customers_df):
    """Demonstrate basic DataFrame operations"""
    
    print("=== Basic DataFrame Operations ===")
    
    # Show data
    print("Orders:")
    orders_df.show()
    
    print("Customers:")
    customers_df.show()
    
    # Basic aggregations
    print("=== Order Statistics ===")
    orders_df.agg(
        count("order_id").alias("total_orders"),
        sum("amount").alias("total_revenue"),
        avg("amount").alias("avg_order_value"),
        max("amount").alias("max_order"),
        min("amount").alias("min_order")
    ).show()
    
    # Filtering and grouping
    print("=== Orders by Status ===")
    orders_df.groupBy("status") \
        .agg(
            count("order_id").alias("order_count"),
            sum("amount").alias("total_amount")
        ) \
        .orderBy(desc("total_amount")) \
        .show()

def demonstrate_joins(spark):
    """Demonstrate different types of joins"""
    
    print("=== Join Operations ===")
    
    # Inner join
    print("Customer Orders (Inner Join):")
    result = spark.sql("""
        SELECT c.name, c.tier, o.order_date, o.amount, o.status
        FROM customers c
        INNER JOIN orders o ON c.customer_id = o.customer_id
        ORDER BY o.order_date, c.name
    """)
    result.show()
    
    # Customer summary with aggregation
    print("Customer Order Summary:")
    customer_summary = spark.sql("""
        SELECT 
            c.name,
            c.tier,
            COUNT(o.order_id) as total_orders,
            COALESCE(SUM(o.amount), 0) as total_spent,
            COALESCE(AVG(o.amount), 0) as avg_order_value
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id 
            AND o.status = 'completed'
        GROUP BY c.customer_id, c.name, c.tier
        ORDER BY total_spent DESC
    """)
    customer_summary.show()

def demonstrate_window_functions(spark):
    """Demonstrate window functions"""
    
    print("=== Window Functions ===")
    
    # Running totals and rankings
    result = spark.sql("""
        SELECT 
            customer_id,
            order_date,
            amount,
            SUM(amount) OVER (
                PARTITION BY customer_id 
                ORDER BY order_date 
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) as running_total,
            ROW_NUMBER() OVER (
                PARTITION BY customer_id 
                ORDER BY order_date
            ) as order_sequence,
            RANK() OVER (
                ORDER BY amount DESC
            ) as amount_rank
        FROM orders
        WHERE status = 'completed'
        ORDER BY customer_id, order_date
    """)
    result.show()
    
    # Moving averages
    print("Moving Averages:")
    moving_avg = spark.sql("""
        SELECT 
            order_date,
            amount,
            AVG(amount) OVER (
                ORDER BY order_date 
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) as moving_avg_3day
        FROM orders
        WHERE status = 'completed'
        ORDER BY order_date
    """)
    moving_avg.show()

def demonstrate_advanced_analytics(spark):
    """Demonstrate advanced analytics functions"""
    
    print("=== Advanced Analytics ===")
    
    # Percentiles and statistical functions
    result = spark.sql("""
        SELECT 
            tier,
            COUNT(*) as customer_count,
            AVG(total_spent) as avg_spent,
            PERCENTILE_APPROX(total_spent, 0.5) as median_spent,
            PERCENTILE_APPROX(total_spent, 0.9) as p90_spent,
            STDDEV(total_spent) as stddev_spent
        FROM (
            SELECT 
                c.tier,
                COALESCE(SUM(o.amount), 0) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id 
                AND o.status = 'completed'
            GROUP BY c.customer_id, c.tier
        ) customer_spending
        GROUP BY tier
    """)
    result.show()
    
    # Cohort analysis (simplified)
    print("Customer Cohort Analysis:")
    cohort_analysis = spark.sql("""
        WITH first_orders AS (
            SELECT 
                customer_id,
                MIN(order_date) as first_order_date
            FROM orders
            WHERE status = 'completed'
            GROUP BY customer_id
        ),
        customer_months AS (
            SELECT 
                o.customer_id,
                f.first_order_date,
                o.order_date,
                DATEDIFF(o.order_date, f.first_order_date) as days_since_first
            FROM orders o
            JOIN first_orders f ON o.customer_id = f.customer_id
            WHERE o.status = 'completed'
        )
        SELECT 
            first_order_date,
            CASE 
                WHEN days_since_first = 0 THEN 'Month 0'
                WHEN days_since_first <= 30 THEN 'Month 1'
                WHEN days_since_first <= 60 THEN 'Month 2'
                ELSE 'Month 3+'
            END as cohort_month,
            COUNT(DISTINCT customer_id) as customers
        FROM customer_months
        GROUP BY first_order_date, 
                 CASE 
                     WHEN days_since_first = 0 THEN 'Month 0'
                     WHEN days_since_first <= 30 THEN 'Month 1'
                     WHEN days_since_first <= 60 THEN 'Month 2'
                     ELSE 'Month 3+'
                 END
        ORDER BY first_order_date, cohort_month
    """)
    cohort_analysis.show()

def demonstrate_data_quality_checks(spark):
    """Demonstrate data quality checks"""
    
    print("=== Data Quality Checks ===")
    
    # Null checks
    null_checks = spark.sql("""
        SELECT 
            'orders' as table_name,
            SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) as null_order_id,
            SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) as null_customer_id,
            SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) as null_amount,
            SUM(CASE WHEN amount <= 0 THEN 1 ELSE 0 END) as invalid_amount
        FROM orders
        
        UNION ALL
        
        SELECT 
            'customers' as table_name,
            SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) as null_customer_id,
            SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) as null_name,
            SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as null_email,
            SUM(CASE WHEN email NOT LIKE '%@%' THEN 1 ELSE 0 END) as invalid_email
        FROM customers
    """)
    null_checks.show()
    
    # Duplicate checks
    print("Duplicate Checks:")
    duplicate_checks = spark.sql("""
        SELECT 
            'orders' as table_name,
            COUNT(*) as total_records,
            COUNT(DISTINCT order_id) as unique_order_ids,
            COUNT(*) - COUNT(DISTINCT order_id) as duplicate_order_ids
        FROM orders
        
        UNION ALL
        
        SELECT 
            'customers' as table_name,
            COUNT(*) as total_records,
            COUNT(DISTINCT customer_id) as unique_customer_ids,
            COUNT(*) - COUNT(DISTINCT customer_id) as duplicate_customer_ids
        FROM customers
    """)
    duplicate_checks.show()

def save_results(spark):
    """Save analysis results"""
    
    # Customer summary for reporting
    customer_report = spark.sql("""
        SELECT 
            c.customer_id,
            c.name,
            c.email,
            c.tier,
            COUNT(o.order_id) as total_orders,
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.amount END), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.amount END), 0) as avg_order_value,
            MAX(o.order_date) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id, c.name, c.email, c.tier
        ORDER BY total_revenue DESC
    """)
    
    # Save to CSV
    customer_report.write \
        .mode("overwrite") \
        .option("header", "true") \
        .csv("/opt/bitnami/spark/data/customer_report")
    
    print("Customer report saved to /opt/bitnami/spark/data/customer_report")

def main():
    spark = create_spark_session()
    
    try:
        # Create sample data
        orders_df, customers_df = create_sample_datasets(spark)
        
        # Demonstrate various operations
        demonstrate_basic_operations(spark, orders_df, customers_df)
        demonstrate_joins(spark)
        demonstrate_window_functions(spark)
        demonstrate_advanced_analytics(spark)
        demonstrate_data_quality_checks(spark)
        
        # Save results
        save_results(spark)
        
        print("Spark SQL demonstration completed successfully!")
        
    except Exception as e:
        print(f"Error during Spark SQL demo: {e}")
        sys.exit(1)
    
    finally:
        spark.stop()

if __name__ == "__main__":
    main()
```

---

## Running Spark Applications

### Submit Spark Jobs

`Run the applications:`
```bash
# Submit data processing job
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --deploy-mode client \
  --executor-memory 1g \
  --executor-cores 1 \
  /opt/bitnami/spark/apps/data_processing.py

# Submit ML pipeline
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --deploy-mode client \
  --executor-memory 2g \
  --executor-cores 2 \
  --packages org.apache.spark:spark-mllib_2.12:3.5.0 \
  /opt/bitnami/spark/apps/ml_pipeline.py

# Submit Spark SQL demo
docker exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --deploy-mode client \
  /opt/bitnami/spark/apps/spark_sql_demo.py
```

### Interactive Spark Shell

`Start PySpark shell:`
```bash
docker exec -it spark-master pyspark \
  --master spark://spark-master:7077 \
  --executor-memory 1g
```

`Start Scala Spark shell:`
```bash
docker exec -it spark-master spark-shell \
  --master spark://spark-master:7077 \
  --executor-memory 1g
```

---

## Common Use Cases

- **Big Data Processing**: Large-scale data transformation and analysis
- **ETL Pipelines**: Extract, transform, and load operations on massive datasets
- **Machine Learning**: Distributed machine learning model training and inference
- **Real-time Analytics**: Stream processing for real-time insights
- **Data Lake Analytics**: Processing data stored in distributed file systems
- **Graph Processing**: Large-scale graph analytics and algorithms

✅ Apache Spark is now configured for distributed big data processing!
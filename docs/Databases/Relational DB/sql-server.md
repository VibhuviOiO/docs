---
sidebar_position: 3
title: SQL Server
description: Microsoft SQL Server is a powerful enterprise-grade relational database management system. Learn how to dockerize and run SQL Server for your applications with Docker Compose.
slug: /RelationalDB/SQLServer
keywords:
  - SQL Server
  - Microsoft SQL Server
  - relational database
  - SQL database
  - Docker SQL Server
  - database containerization
  - mssql docker
  - database setup
  - sql server tutorial
  - enterprise database
  - T-SQL
---

# 🏢 Dockerizing SQL Server for Enterprise-Grade Database Applications

**Microsoft SQL Server** is a powerful, enterprise-grade relational database management system developed by Microsoft. Known for its **robust performance**, **advanced security features**, and **comprehensive business intelligence tools**, SQL Server is ideal for mission-critical applications and large-scale enterprise solutions.

---

## Set Up SQL Server with Docker Compose

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sqlserver-db
    restart: unless-stopped
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Express"  # Express, Developer, Standard, Enterprise
    volumes:
      - sqlserver-data:/var/opt/mssql
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd -Q 'SELECT 1'"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Azure Data Studio alternative - Adminer
  adminer:
    image: adminer:latest
    container_name: adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - sqlserver

volumes:
  sqlserver-data:
```

`Start SQL Server:`
```bash
docker compose up -d
```

`Check if it's running:`
```bash
docker ps
```

---

## Connect to SQL Server

### Using sqlcmd (SQL Server CLI)

`Connect directly to the container:`
```bash
docker exec -it sqlserver-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd"
```

`Or install sqlcmd locally and connect:`
```bash
# Install SQL Server command-line tools
# Ubuntu/Debian
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
sudo apt-get update
sudo apt-get install mssql-tools unixodbc-dev

# macOS
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew install mssql-tools

# Connect to database
sqlcmd -S localhost,1433 -U sa -P "YourStrong@Passw0rd"
```

### Basic T-SQL Operations

`Create a database and table, then insert data:`
```sql
-- Create a new database
CREATE DATABASE MyApp;
GO

-- Use the database
USE MyApp;
GO

-- Create a users table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Insert sample data
INSERT INTO Users (Name, Email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com');
GO

-- Query data
SELECT * FROM Users;
GO

-- Update data
UPDATE Users SET Name = 'John Updated' WHERE Id = 1;
GO

-- Delete data
DELETE FROM Users WHERE Id = 2;
GO

-- Show table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users';
GO
```

---

## Python Integration

`Install the SQL Server driver:`
```bash
pip install pyodbc
# or alternatively
pip install pymssql
```

`Create a file sqlserver_test.py:`
```python
import pyodbc
import os

# Database connection parameters
server = 'localhost,1433'
database = 'MyApp'
username = 'sa'
password = 'YourStrong@Passw0rd'

# Connection string
conn_str = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes'

try:
    # Connect to SQL Server
    connection = pyodbc.connect(conn_str)
    cursor = connection.cursor()
    
    # Create table
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
        CREATE TABLE Products (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL,
            Price DECIMAL(10,2),
            Category NVARCHAR(50),
            CreatedAt DATETIME2 DEFAULT GETDATE()
        )
    """)
    
    # Insert data
    cursor.execute("""
        INSERT INTO Products (Name, Price, Category) 
        VALUES (?, ?, ?)
    """, 'Laptop', 999.99, 'Electronics')
    
    # Get the inserted ID
    cursor.execute("SELECT @@IDENTITY")
    product_id = cursor.fetchone()[0]
    print(f"Inserted product with ID: {product_id}")
    
    # Insert multiple records
    products_data = [
        ('Mouse', 29.99, 'Electronics'),
        ('Keyboard', 79.99, 'Electronics'),
        ('Monitor', 299.99, 'Electronics')
    ]
    
    cursor.executemany("""
        INSERT INTO Products (Name, Price, Category) 
        VALUES (?, ?, ?)
    """, products_data)
    
    # Query data
    cursor.execute("SELECT * FROM Products WHERE Category = ?", 'Electronics')
    products = cursor.fetchall()
    
    for product in products:
        print(f"Product: {product[1]}, Price: ${product[2]}")
    
    # Commit changes
    connection.commit()
    
except pyodbc.Error as e:
    print(f"Database error: {e}")
    
finally:
    if 'connection' in locals():
        cursor.close()
        connection.close()
```

`Run the script:`
```bash
python sqlserver_test.py
```

---

## Advanced Configuration

### Custom SQL Server Configuration

`Create init-scripts/01-setup.sql:`
```sql
-- Create additional databases
CREATE DATABASE Analytics;
GO
CREATE DATABASE Logs;
GO

-- Create login and users
CREATE LOGIN AppUser WITH PASSWORD = 'AppUser@Password123';
GO

USE MyApp;
GO
CREATE USER AppUser FOR LOGIN AppUser;
GO
ALTER ROLE db_datareader ADD MEMBER AppUser;
ALTER ROLE db_datawriter ADD MEMBER AppUser;
GO

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Products_Category ON Products(Category);
GO

-- Create a stored procedure
CREATE PROCEDURE GetProductsByCategory
    @Category NVARCHAR(50)
AS
BEGIN
    SELECT Id, Name, Price, CreatedAt
    FROM Products
    WHERE Category = @Category
    ORDER BY Name;
END
GO
```

### Environment Configuration

`Create a .env file:`
```env
SA_PASSWORD=YourStrong@Passw0rd
ACCEPT_EULA=Y
MSSQL_PID=Express
```

`Update docker-compose.yml:`
```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    env_file:
      - .env
    # ... rest of configuration
```

---

## Backup and Restore

### Create Backup

`Backup database using T-SQL:`
```sql
-- Full backup
BACKUP DATABASE MyApp 
TO DISK = '/var/opt/mssql/backup/MyApp_Full.bak'
WITH FORMAT, INIT;
GO

-- Differential backup
BACKUP DATABASE MyApp 
TO DISK = '/var/opt/mssql/backup/MyApp_Diff.bak'
WITH DIFFERENTIAL, FORMAT, INIT;
GO

-- Transaction log backup
BACKUP LOG MyApp 
TO DISK = '/var/opt/mssql/backup/MyApp_Log.trn';
GO
```

`Backup using Docker:`
```bash
# Create backup directory
docker exec sqlserver-db mkdir -p /var/opt/mssql/backup

# Create backup
docker exec sqlserver-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -Q "BACKUP DATABASE MyApp TO DISK = '/var/opt/mssql/backup/MyApp.bak'"

# Copy backup to host
docker cp sqlserver-db:/var/opt/mssql/backup/MyApp.bak ./MyApp.bak
```

### Restore Database

`Restore database using T-SQL:`
```sql
-- Restore full backup
RESTORE DATABASE MyApp_Restored 
FROM DISK = '/var/opt/mssql/backup/MyApp_Full.bak'
WITH MOVE 'MyApp' TO '/var/opt/mssql/data/MyApp_Restored.mdf',
     MOVE 'MyApp_Log' TO '/var/opt/mssql/data/MyApp_Restored.ldf';
GO
```

---

## Monitoring and Maintenance

### Check Database Size

```sql
SELECT 
    DB_NAME(database_id) AS DatabaseName,
    CAST(SUM(size) * 8.0 / 1024 AS DECIMAL(10,2)) AS SizeMB
FROM sys.master_files
WHERE database_id > 4  -- Exclude system databases
GROUP BY database_id
ORDER BY SizeMB DESC;
```

### Monitor Active Connections

```sql
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    cpu_time,
    memory_usage,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1;
```

### Index Maintenance

```sql
-- Check index fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10;

-- Rebuild indexes
ALTER INDEX ALL ON Users REBUILD;

-- Update statistics
UPDATE STATISTICS Users;
```

---

## High Availability Setup

### Always On Availability Groups

`docker-compose.yml for HA setup:`
```yaml
version: '3.8'

services:
  sqlserver-primary:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sqlserver-primary
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Developer"
      MSSQL_AGENT_ENABLED: "true"
    volumes:
      - sqlserver-primary-data:/var/opt/mssql
    ports:
      - "1433:1433"

  sqlserver-secondary:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sqlserver-secondary
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
      MSSQL_PID: "Developer"
      MSSQL_AGENT_ENABLED: "true"
    volumes:
      - sqlserver-secondary-data:/var/opt/mssql
    ports:
      - "1434:1433"

volumes:
  sqlserver-primary-data:
  sqlserver-secondary-data:
```

---

## Security Best Practices

### Create Dedicated Users

```sql
-- Create application-specific login
CREATE LOGIN MyAppUser WITH PASSWORD = 'SecurePassword@123';
GO

USE MyApp;
GO

-- Create user and assign minimal permissions
CREATE USER MyAppUser FOR LOGIN MyAppUser;
GO

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON Users TO MyAppUser;
GRANT SELECT, INSERT, UPDATE, DELETE ON Products TO MyAppUser;
GRANT EXECUTE ON GetProductsByCategory TO MyAppUser;
GO
```

### Enable Transparent Data Encryption (TDE)

```sql
-- Create master key
USE master;
GO
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MasterKey@Password123';
GO

-- Create certificate
CREATE CERTIFICATE TDECert WITH SUBJECT = 'TDE Certificate';
GO

-- Create database encryption key
USE MyApp;
GO
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDECert;
GO

-- Enable TDE
ALTER DATABASE MyApp SET ENCRYPTION ON;
GO
```

---

## Performance Tuning

### Key Performance Queries

```sql
-- Check wait statistics
SELECT TOP 10
    wait_type,
    wait_time_ms,
    percentage = CAST(100.0 * wait_time_ms / SUM(wait_time_ms) OVER() AS DECIMAL(5,2))
FROM sys.dm_os_wait_stats
WHERE wait_time_ms > 0
ORDER BY wait_time_ms DESC;

-- Find expensive queries
SELECT TOP 10
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
    qs.total_cpu_time / qs.execution_count AS avg_cpu_time,
    SUBSTRING(qt.text, qs.statement_start_offset/2+1,
        (CASE WHEN qs.statement_end_offset = -1
            THEN LEN(CONVERT(NVARCHAR(MAX), qt.text)) * 2
            ELSE qs.statement_end_offset END - qs.statement_start_offset)/2 + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;
```

### Memory Configuration

```sql
-- Check memory usage
SELECT 
    counter_name,
    cntr_value
FROM sys.dm_os_performance_counters
WHERE object_name = 'SQLServer:Memory Manager';

-- Configure max server memory (in MB)
EXEC sp_configure 'max server memory', 2048;
RECONFIGURE;
```

---

## Common Use Cases

- **Enterprise Applications**: ERP systems, CRM platforms, financial applications
- **Data Warehousing**: Business intelligence, analytics, reporting
- **Web Applications**: E-commerce platforms, content management systems
- **Healthcare Systems**: Patient records, medical imaging, compliance tracking
- **Financial Services**: Transaction processing, risk management, regulatory reporting

✅ SQL Server is now running in Docker and ready for your enterprise applications!
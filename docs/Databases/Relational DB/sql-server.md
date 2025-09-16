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

### Connect to SQL Server
`Connect directly to the container:`

`Microsoft repository and install tools:`
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
```
```bash
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y mssql-tools unixodbc-dev
```
`You need to add it to your PATH first:`
```bash
# Temporary for this session
export PATH="$PATH:/opt/mssql-tools/bin"

# Now try
sqlcmd -S 127.0.0.1 -U sa -P "YourStrong@Passw0rd"
```
### Basic T-SQL Operations
- Paste one block at a time (everything up to GO) and press Enter.

- GO signals the end of a batch, so SQL Server executes that block.

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

## Common Use Cases

- **Enterprise Applications**: ERP systems, CRM platforms, financial applications
- **Data Warehousing**: Business intelligence, analytics, reporting
- **Web Applications**: E-commerce platforms, content management systems
- **Healthcare Systems**: Patient records, medical imaging, compliance tracking
- **Financial Services**: Transaction processing, risk management, regulatory reporting

✅ SQL Server is now running in Docker and ready for your enterprise applications!## Ref
erences

* [ChromaDB](https://docs.trychroma.com)
* [SentenceTransformers](https://www.sbert.net/)
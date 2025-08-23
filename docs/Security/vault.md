---
sidebar_position: 1
title: HashiCorp Vault
description: HashiCorp Vault is a secrets management tool for storing and accessing sensitive data. Learn how to set up Vault with Docker for secure secrets management.
slug: /Security/Vault
keywords:
  - HashiCorp Vault
  - secrets management
  - security
  - encryption
  - authentication
  - authorization
---

# 🔐 HashiCorp Vault Secrets Management

**HashiCorp Vault** is a **secrets management** tool for securely **storing** and **accessing** sensitive data with **encryption** and **access control**.

---

## 🔧 Docker Setup

`Create docker-compose.yml:`
```yaml
version: '3.8'
services:
  vault:
    image: vault:latest
    container_name: vault
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data
    command: vault server -dev

volumes:
  vault-data:
```

`Start Vault:`
```bash
docker-compose up -d
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'
```

## 🔑 Basic Operations

`Store and retrieve secrets:`
```bash
# Store secret
vault kv put secret/myapp username=admin password=secret123

# Retrieve secret
vault kv get secret/myapp

# Get specific field
vault kv get -field=password secret/myapp

# List secrets
vault kv list secret/
```

## ▶️ Sample Output

```bash
$ vault kv put secret/myapp username=admin password=secret123
Key              Value
---              -----
created_time     2024-01-15T10:30:00.123456Z
deletion_time    n/a
destroyed        false
version          1

$ vault kv get secret/myapp
====== Metadata ======
Key              Value
---              -----
created_time     2024-01-15T10:30:00.123456Z
deletion_time    n/a
destroyed        false
version          1

====== Data ======
Key         Value
---         -----
password    secret123
username    admin
```

## 🔧 Authentication

`Enable auth methods:`
```bash
# Enable userpass auth
vault auth enable userpass

# Create user
vault write auth/userpass/users/john password=password123 policies=default

# Login as user
vault auth -method=userpass username=john password=password123
```

## 🐍 Python Integration

`Install Vault client:`
```bash
pip install hvac
```

`Create vault_client.py:`
```python
import hvac

# Initialize client
client = hvac.Client(url='http://localhost:8200')
client.token = 'myroot'

# Store secret
client.secrets.kv.v2.create_or_update_secret(
    path='myapp',
    secret={'username': 'admin', 'password': 'secret123'}
)

# Retrieve secret
response = client.secrets.kv.v2.read_secret_version(path='myapp')
secret_data = response['data']['data']
print(f"Username: {secret_data['username']}")
print(f"Password: {secret_data['password']}")

# List secrets
secrets = client.secrets.kv.v2.list_secrets(path='')
print(f"Available secrets: {secrets['data']['keys']}")
```

## 🔒 Policies

`Create policy file (policy.hcl):`
```hcl
# Read-only access to secret/myapp/*
path "secret/data/myapp/*" {
  capabilities = ["read"]
}

# Full access to secret/admin/*
path "secret/data/admin/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Deny access to secret/restricted/*
path "secret/data/restricted/*" {
  capabilities = ["deny"]
}
```

`Apply policy:`
```bash
vault policy write myapp-policy policy.hcl
vault write auth/userpass/users/john policies=myapp-policy
```

## 🔄 CI/CD Integration

`GitHub Actions example:`
```yaml
name: Deploy with Vault Secrets

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Get secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_URL }}
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/myapp username | APP_USERNAME ;
            secret/data/myapp password | APP_PASSWORD
            
      - name: Deploy application
        run: |
          echo "Deploying with username: $APP_USERNAME"
          # Deploy logic here
```

**Reference:** [Vault Documentation](https://www.vaultproject.io/docs)
---
sidebar_position: 1
title: HashiCorp Vault
description: HashiCorp Vault is a comprehensive secrets management platform for storing, accessing, and managing sensitive data with advanced security features and enterprise capabilities.
slug: /Security/Vault
keywords:
  - HashiCorp Vault
  - secrets management
  - security
  - encryption
  - authentication
  - authorization
  - enterprise security
  - secrets rotation
---

# 🔐 Enterprise Secrets Management with HashiCorp Vault

**HashiCorp Vault** is a **comprehensive secrets management platform** for securely **storing**, **accessing**, and **managing** sensitive data with **advanced encryption**, **dynamic secrets**, **access control**, and **audit capabilities**. Perfect for **enterprise security**, **compliance**, and **zero-trust** architectures.

## Key Features

- **Dynamic Secrets**: Generate secrets on-demand with automatic expiration
- **Encryption as a Service**: Encrypt/decrypt data without storing it
- **Identity-Based Access**: Fine-grained access control with policies
- **Secrets Rotation**: Automatic rotation of database credentials and API keys
- **Audit Logging**: Comprehensive audit trails for compliance

## Use Cases

- **Application Secrets**: Secure storage of API keys, passwords, and certificates
- **Database Credentials**: Dynamic database credentials with automatic rotation
- **PKI Management**: Certificate authority and certificate lifecycle management
- **Cloud Secrets**: Integration with AWS, Azure, GCP secret services

---

## 🧰 Prerequisites

- **Docker & Docker Compose** for containerized setup
- **HashiCorp Vault CLI** installed locally
- **SSL certificates** for production deployment
- **Database** (PostgreSQL, MySQL) for production storage backend
- **Load balancer** for high availability setup

---

## 🔧 Step 1: Production Vault Setup

### Comprehensive Docker Compose Configuration

```yaml
version: '3.8'

services:
  # PostgreSQL backend for Vault
  vault-postgres:
    image: postgres:15
    container_name: vault-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: vault
      POSTGRES_USER: vault
      POSTGRES_PASSWORD: vault_password
    volumes:
      - vault-postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vault"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Vault server
  vault-server:
    image: vault:1.15.2
    container_name: vault-server
    restart: unless-stopped
    ports:
      - "8200:8200"
    environment:
      VAULT_ADDR: http://0.0.0.0:8200
      VAULT_API_ADDR: http://0.0.0.0:8200
      VAULT_LOCAL_CONFIG: |
        {
          "backend": {
            "postgresql": {
              "connection_url": "postgres://vault:vault_password@vault-postgres:5432/vault?sslmode=disable"
            }
          },
          "listener": {
            "tcp": {
              "address": "0.0.0.0:8200",
              "tls_disable": true
            }
          },
          "ui": true,
          "log_level": "INFO",
          "default_lease_ttl": "168h",
          "max_lease_ttl": "720h"
        }
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data
      - vault-logs:/vault/logs
      - ./vault-config:/vault/config
    depends_on:
      vault-postgres:
        condition: service_healthy
    command: ["vault", "server", "-config=/vault/config"]

  # Vault agent for auto-auth
  vault-agent:
    image: vault:1.15.2
    container_name: vault-agent
    restart: unless-stopped
    environment:
      VAULT_ADDR: http://vault-server:8200
    volumes:
      - ./vault-agent-config:/vault/config
      - vault-agent-data:/vault/data
    depends_on:
      - vault-server
    command: ["vault", "agent", "-config=/vault/config/agent.hcl"]

  # Consul for service discovery (optional)
  consul:
    image: consul:1.16
    container_name: vault-consul
    restart: unless-stopped
    ports:
      - "8500:8500"
    environment:
      CONSUL_BIND_INTERFACE: eth0
    volumes:
      - consul-data:/consul/data
    command: ["consul", "agent", "-server", "-bootstrap", "-ui", "-client=0.0.0.0"]

volumes:
  vault-postgres-data:
  vault-data:
  vault-logs:
  vault-agent-data:
  consul-data:
```

### Production Configuration Files

Create `vault-config/vault.hcl`:

```hcl
# Vault production configuration
storage "postgresql" {
  connection_url = "postgres://vault:vault_password@vault-postgres:5432/vault?sslmode=disable"
  table          = "vault_kv_store"
  max_parallel   = 128
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/config/tls/vault.crt"
  tls_key_file  = "/vault/config/tls/vault.key"
  tls_min_version = "tls12"
}

# High availability configuration
ha_storage "consul" {
  address = "consul:8500"
  path    = "vault/"
}

# Seal configuration (auto-unseal with cloud KMS)
seal "awskms" {
  region     = "us-west-2"
  kms_key_id = "alias/vault-unseal-key"
}

# UI and API configuration
ui = true
api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault.example.com:8201"

# Logging
log_level = "INFO"
log_format = "json"

# Performance tuning
default_lease_ttl = "168h"
max_lease_ttl = "720h"
disable_mlock = false

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
```

---

## 🏗️ Step 2: Advanced Vault Configuration

### Initialize and Configure Vault

```bash
# Start Vault services
docker-compose up -d

# Initialize Vault (first time only)
export VAULT_ADDR='http://localhost:8200'
vault operator init -key-shares=5 -key-threshold=3 > vault-keys.txt

# Unseal Vault (requires 3 keys)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# Login with root token
export VAULT_TOKEN=$(grep 'Initial Root Token:' vault-keys.txt | awk '{print $NF}')
vault auth $VAULT_TOKEN

# Enable audit logging
vault audit enable file file_path=/vault/logs/audit.log

# Check Vault status
vault status
```

### Enable Authentication Methods

```bash
# Enable multiple auth methods
vault auth enable userpass
vault auth enable ldap
vault auth enable kubernetes
vault auth enable aws
vault auth enable github

# Configure userpass authentication
vault write auth/userpass/users/admin \
    password=admin123 \
    policies=admin-policy

vault write auth/userpass/users/developer \
    password=dev123 \
    policies=developer-policy

# Configure LDAP authentication
vault write auth/ldap/config \
    url="ldap://ldap.example.com" \
    userdn="ou=Users,dc=example,dc=com" \
    userattr=uid \
    groupdn="ou=Groups,dc=example,dc=com" \
    groupfilter="(&(objectClass=group)(member={{.UserDN}}))" \
    groupattr=cn \
    binddn="cn=vault,ou=Users,dc=example,dc=com" \
    bindpass=password

# Configure Kubernetes authentication
vault write auth/kubernetes/config \
    token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
    kubernetes_host="https://kubernetes.default.svc:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
```

### Create Advanced Policies

Create `policies/admin-policy.hcl`:

```hcl
# Admin policy - full access
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# System paths
path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Auth methods
path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

Create `policies/developer-policy.hcl`:

```hcl
# Developer policy - limited access
path "secret/data/{{identity.entity.name}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/data/shared/*" {
  capabilities = ["read", "list"]
}

path "database/creds/readonly" {
  capabilities = ["read"]
}

path "pki/issue/developer" {
  capabilities = ["create", "update"]
}

# Allow token self-renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow looking up own token
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

Apply policies:

```bash
vault policy write admin-policy policies/admin-policy.hcl
vault policy write developer-policy policies/developer-policy.hcl
```

---

## ▶️ Step 3: Dynamic Secrets and Engines

### Database Secrets Engine

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/postgresql \
    plugin_name=postgresql-database-plugin \
    connection_url="postgresql://{{username}}:{{password}}@postgres:5432/myapp?sslmode=disable" \
    allowed_roles="readonly,readwrite" \
    username="vault" \
    password="vault_password"

# Create database roles
vault write database/roles/readonly \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

vault write database/roles/readwrite \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Generate dynamic database credentials
vault read database/creds/readonly
vault read database/creds/readwrite
```

### PKI Secrets Engine

```bash
# Enable PKI secrets engine
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="Example.com Root CA" \
    ttl=87600h > CA_cert.crt

# Configure CA and CRL URLs
vault write pki/config/urls \
    issuing_certificates="http://vault.example.com:8200/v1/pki/ca" \
    crl_distribution_points="http://vault.example.com:8200/v1/pki/crl"

# Create intermediate CA
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=43800h pki_int

vault write -format=json pki_int/intermediate/generate/internal \
    common_name="Example.com Intermediate Authority" \
    | jq -r '.data.csr' > pki_intermediate.csr

vault write -format=json pki/root/sign-intermediate csr=@pki_intermediate.csr \
    format=pem_bundle ttl="43800h" \
    | jq -r '.data.certificate' > intermediate.cert.pem

vault write pki_int/intermediate/set-signed certificate=@intermediate.cert.pem

# Create certificate role
vault write pki_int/roles/developer \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# Issue certificate
vault write pki_int/issue/developer common_name="app.example.com" ttl="24h"
```

### AWS Secrets Engine

```bash
# Enable AWS secrets engine
vault secrets enable aws

# Configure AWS credentials
vault write aws/config/root \
    access_key=AKIAIOSFODNN7EXAMPLE \
    secret_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY \
    region=us-west-2

# Create AWS role
vault write aws/roles/s3-readonly \
    credential_type=iam_user \
    policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
EOF

# Generate AWS credentials
vault read aws/creds/s3-readonly
```

---

## 📊 Step 4: Application Integration

### Python Application with Vault Integration

```python
# vault_app.py
import hvac
import os
import time
import logging
from contextlib import contextmanager
from functools import wraps
import psycopg2
from psycopg2.extras import RealDictCursor

class VaultClient:
    """Production Vault client with advanced features"""
    
    def __init__(self, vault_url=None, auth_method='token', **auth_kwargs):
        self.vault_url = vault_url or os.getenv('VAULT_ADDR', 'http://localhost:8200')
        self.client = hvac.Client(url=self.vault_url)
        self.auth_method = auth_method
        self.logger = logging.getLogger(__name__)
        
        # Authenticate
        self._authenticate(**auth_kwargs)
        
        # Setup token renewal
        self._setup_token_renewal()
    
    def _authenticate(self, **kwargs):
        """Authenticate with Vault using specified method"""
        if self.auth_method == 'token':
            token = kwargs.get('token') or os.getenv('VAULT_TOKEN')
            self.client.token = token
            
        elif self.auth_method == 'userpass':
            username = kwargs.get('username') or os.getenv('VAULT_USERNAME')
            password = kwargs.get('password') or os.getenv('VAULT_PASSWORD')
            
            auth_response = self.client.auth.userpass.login(
                username=username,
                password=password
            )
            self.client.token = auth_response['auth']['client_token']
            
        elif self.auth_method == 'kubernetes':
            jwt_path = kwargs.get('jwt_path', '/var/run/secrets/kubernetes.io/serviceaccount/token')
            role = kwargs.get('role') or os.getenv('VAULT_ROLE')
            
            with open(jwt_path, 'r') as f:
                jwt = f.read()
            
            auth_response = self.client.auth.kubernetes.login(
                role=role,
                jwt=jwt
            )
            self.client.token = auth_response['auth']['client_token']
        
        # Verify authentication
        if not self.client.is_authenticated():
            raise Exception("Failed to authenticate with Vault")
        
        self.logger.info(f"Successfully authenticated with Vault using {self.auth_method}")
    
    def _setup_token_renewal(self):
        """Setup automatic token renewal"""
        try:
            token_info = self.client.auth.token.lookup_self()
            ttl = token_info['data'].get('ttl', 0)
            
            if ttl > 0:
                # Renew token when 75% of TTL has passed
                renewal_time = ttl * 0.75
                self.logger.info(f"Token will be renewed in {renewal_time} seconds")
                
                # In production, you'd want to use a background thread or scheduler
                # threading.Timer(renewal_time, self._renew_token).start()
        except Exception as e:
            self.logger.warning(f"Could not setup token renewal: {e}")
    
    def _renew_token(self):
        """Renew the current token"""
        try:
            self.client.auth.token.renew_self()
            self.logger.info("Token renewed successfully")
            self._setup_token_renewal()  # Setup next renewal
        except Exception as e:
            self.logger.error(f"Failed to renew token: {e}")
    
    def get_secret(self, path, version=None):
        """Get secret from KV store"""
        try:
            if version:
                response = self.client.secrets.kv.v2.read_secret_version(
                    path=path, version=version
                )
            else:
                response = self.client.secrets.kv.v2.read_secret_version(path=path)
            
            return response['data']['data']
        except Exception as e:
            self.logger.error(f"Failed to get secret {path}: {e}")
            raise
    
    def put_secret(self, path, secret_dict):
        """Store secret in KV store"""
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=secret_dict
            )
            self.logger.info(f"Secret stored at {path}")
        except Exception as e:
            self.logger.error(f"Failed to store secret {path}: {e}")
            raise
    
    def get_database_credentials(self, role):
        """Get dynamic database credentials"""
        try:
            response = self.client.read(f'database/creds/{role}')
            return {
                'username': response['data']['username'],
                'password': response['data']['password'],
                'lease_id': response['lease_id'],
                'lease_duration': response['lease_duration']
            }
        except Exception as e:
            self.logger.error(f"Failed to get database credentials for role {role}: {e}")
            raise
    
    def revoke_lease(self, lease_id):
        """Revoke a lease"""
        try:
            self.client.sys.revoke_lease(lease_id)
            self.logger.info(f"Lease {lease_id} revoked")
        except Exception as e:
            self.logger.error(f"Failed to revoke lease {lease_id}: {e}")
            raise
    
    def encrypt_data(self, plaintext, key_name='default'):
        """Encrypt data using Vault's transit engine"""
        try:
            response = self.client.secrets.transit.encrypt_data(
                name=key_name,
                plaintext=plaintext
            )
            return response['data']['ciphertext']
        except Exception as e:
            self.logger.error(f"Failed to encrypt data: {e}")
            raise
    
    def decrypt_data(self, ciphertext, key_name='default'):
        """Decrypt data using Vault's transit engine"""
        try:
            response = self.client.secrets.transit.decrypt_data(
                name=key_name,
                ciphertext=ciphertext
            )
            return response['data']['plaintext']
        except Exception as e:
            self.logger.error(f"Failed to decrypt data: {e}")
            raise

class DatabaseManager:
    """Database manager with Vault integration"""
    
    def __init__(self, vault_client, db_role='readonly'):
        self.vault_client = vault_client
        self.db_role = db_role
        self.current_creds = None
        self.connection = None
        self.logger = logging.getLogger(__name__)
    
    @contextmanager
    def get_connection(self):
        """Get database connection with dynamic credentials"""
        try:
            # Get fresh credentials
            creds = self.vault_client.get_database_credentials(self.db_role)
            
            # Create connection
            conn = psycopg2.connect(
                host='localhost',
                port=5432,
                database='myapp',
                user=creds['username'],
                password=creds['password'],
                cursor_factory=RealDictCursor
            )
            
            self.logger.info(f"Connected to database with user {creds['username']}")
            
            try:
                yield conn
            finally:
                conn.close()
                # Revoke credentials when done
                self.vault_client.revoke_lease(creds['lease_id'])
                self.logger.info("Database credentials revoked")
                
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            raise

def vault_secret(path, key=None):
    """Decorator to inject Vault secrets into function"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            vault_client = VaultClient()
            secret_data = vault_client.get_secret(path)
            
            if key:
                kwargs[key] = secret_data
            else:
                kwargs.update(secret_data)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Example usage
@vault_secret('secret/myapp', key='app_config')
def start_application(app_config):
    """Start application with secrets from Vault"""
    print(f"Starting app with config: {app_config}")
    
    # Use database manager
    vault_client = VaultClient(auth_method='userpass', 
                              username='developer', 
                              password='dev123')
    
    db_manager = DatabaseManager(vault_client, db_role='readonly')
    
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        result = cursor.fetchone()
        print(f"Database version: {result['version']}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Initialize Vault client
    vault_client = VaultClient(
        auth_method='userpass',
        username='developer',
        password='dev123'
    )
    
    # Store application secrets
    app_secrets = {
        'api_key': 'secret-api-key-12345',
        'database_url': 'postgresql://localhost:5432/myapp',
        'redis_url': 'redis://localhost:6379/0'
    }
    
    vault_client.put_secret('secret/myapp', app_secrets)
    
    # Start application
    start_application()
```

---

## 🔍 What You'll See

### Vault Initialization Output
```bash
$ vault operator init -key-shares=5 -key-threshold=3
Unseal Key 1: AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
Unseal Key 2: BcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
Unseal Key 3: CdEfGhIjKlMnOpQrStUvWxYzA1234567890
Unseal Key 4: DeFgHiJkLmNoPqRsTuVwXyZaB1234567890
Unseal Key 5: EfGhIjKlMnOpQrStUvWxYzAbC1234567890

Initial Root Token: hvs.CAESIJ1234567890abcdefghijklmnop

Vault initialized with 5 key shares and a key threshold of 3.
```

### Dynamic Database Credentials
```bash
$ vault read database/creds/readonly
Key                Value
---                -----
lease_id           database/creds/readonly/abc123def456
lease_duration     1h
lease_renewable    true
password           A1a-B2b3C4c5D6d7E8e9
username           v-userpass-readonly-abc123def456-1640995200
```

### Application Integration Results
```bash
INFO:__main__:Successfully authenticated with Vault using userpass
INFO:__main__:Secret stored at secret/myapp
INFO:__main__:Connected to database with user v-userpass-readonly-xyz789
Database version: PostgreSQL 15.1 on x86_64-pc-linux-gnu
INFO:__main__:Database credentials revoked
```

---

## Pros & Cons

### ✅ Pros
- **Enterprise Security**: Advanced encryption and access controls
- **Dynamic Secrets**: Automatic credential generation and rotation
- **Compliance**: Comprehensive audit logging and policy enforcement
- **Scalability**: High availability and multi-datacenter support
- **Integration**: Extensive API and tool ecosystem

### ❌ Cons
- **Complexity**: Steep learning curve and operational overhead
- **Single Point of Failure**: Requires careful HA setup
- **Performance**: Network latency for secret retrieval
- **Cost**: Enterprise features require paid licenses

---

## Conclusion

HashiCorp Vault is the **enterprise-grade solution** for **comprehensive secrets management**. Choose Vault when you need:

- **Advanced security** with dynamic secrets and encryption services
- **Compliance** with audit logging and policy enforcement
- **Enterprise features** like high availability and multi-tenancy
- **Extensive integrations** with cloud providers and tools

The combination of security, scalability, and enterprise features makes Vault ideal for organizations with strict security and compliance requirements.

**What You've Achieved:**
✅ Set up production-ready Vault with HA configuration  
✅ Implemented dynamic secrets for databases and cloud providers  
✅ Created comprehensive authentication and authorization policies  
✅ Built application integration with automatic credential management  
✅ Established PKI infrastructure for certificate management  
✅ Configured audit logging and compliance monitoring
# 🚀 HashiCorp Nomad - Simple and Flexible Workload Orchestrator

HashiCorp Nomad is a simple and flexible workload orchestrator that enables organizations to easily deploy, manage, and scale applications across on-premises and cloud environments. It supports containerized, non-containerized, microservice, and batch applications.

## 📋 Prerequisites

- Linux, macOS, or Windows
- Basic understanding of containerization
- Docker installed (for container workloads)
- Network connectivity between nodes
- Consul (optional, for service discovery)

## 🛠️ Installation

### Binary Installation
```bash
# Download Nomad binary
NOMAD_VERSION="1.6.2"
wget https://releases.hashicorp.com/nomad/${NOMAD_VERSION}/nomad_${NOMAD_VERSION}_linux_amd64.zip

# Extract and install
unzip nomad_${NOMAD_VERSION}_linux_amd64.zip
sudo mv nomad /usr/local/bin/
sudo chmod +x /usr/local/bin/nomad

# Verify installation
nomad version
```

### Package Manager Installation
```bash
# Ubuntu/Debian
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install nomad

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
sudo yum -y install nomad

# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/nomad
```

### Docker Installation
```bash
# Run Nomad in development mode
docker run -d --name nomad-dev \
  -p 4646:4646 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  hashicorp/nomad:latest agent -dev -bind 0.0.0.0 -log-level INFO
```

## 🏗️ Basic Configuration

### Server Configuration
```hcl
# nomad-server.hcl
datacenter = "dc1"
data_dir   = "/opt/nomad/data"
log_level  = "INFO"
node_name  = "nomad-server-1"

bind_addr = "0.0.0.0"

server {
  enabled          = true
  bootstrap_expect = 3
  
  # Server join configuration
  server_join {
    retry_join = ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
  }
}

client {
  enabled = false
}

ui_config {
  enabled = true
}

consul {
  address = "127.0.0.1:8500"
}

acl = {
  enabled = true
}

tls {
  http = true
  rpc  = true

  ca_file   = "/opt/nomad/tls/nomad-ca.pem"
  cert_file = "/opt/nomad/tls/server.pem"
  key_file  = "/opt/nomad/tls/server-key.pem"

  verify_server_hostname = true
  verify_https_client    = true
}
```

### Client Configuration
```hcl
# nomad-client.hcl
datacenter = "dc1"
data_dir   = "/opt/nomad/data"
log_level  = "INFO"
node_name  = "nomad-client-1"

bind_addr = "0.0.0.0"

server {
  enabled = false
}

client {
  enabled = true
  
  servers = ["10.0.1.10:4647", "10.0.1.11:4647", "10.0.1.12:4647"]
  
  node_class = "compute"
  
  meta {
    "type" = "worker"
    "zone" = "us-west-2a"
  }
  
  options {
    "driver.raw_exec.enable"    = "1"
    "driver.docker.enable"      = "1"
    "driver.java.enable"        = "1"
  }
}

consul {
  address = "127.0.0.1:8500"
}

plugin "docker" {
  config {
    allow_privileged = true
    volumes {
      enabled = true
    }
  }
}
```

## 🚀 Quick Start

### Start Development Mode
```bash
# Start Nomad in dev mode (single node)
sudo nomad agent -dev -bind 0.0.0.0 -log-level INFO

# Access Web UI
# http://localhost:4646
```

### Production Cluster Setup
```bash
# Start server nodes
sudo nomad agent -config=/etc/nomad.d/server.hcl

# Start client nodes
sudo nomad agent -config=/etc/nomad.d/client.hcl

# Check cluster status
nomad server members
nomad node status
```

## 📦 Job Definitions

### Simple Web Application
```hcl
# webapp.nomad
job "webapp" {
  datacenters = ["dc1"]
  type        = "service"

  group "web" {
    count = 3

    network {
      port "http" {
        static = 8080
      }
    }

    service {
      name = "webapp"
      port = "http"
      
      tags = [
        "web",
        "frontend",
        "urlprefix-/webapp"
      ]

      check {
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "3s"
      }
    }

    task "web" {
      driver = "docker"

      config {
        image = "nginx:alpine"
        ports = ["http"]
        
        volumes = [
          "local:/usr/share/nginx/html"
        ]
      }

      template {
        data = <<EOF
<!DOCTYPE html>
<html>
<head><title>Nomad Web App</title></head>
<body>
  <h1>Hello from Nomad!</h1>
  <p>Node: {{ env "node.unique.name" }}</p>
  <p>Allocation: {{ env "NOMAD_ALLOC_ID" }}</p>
</body>
</html>
EOF
        destination = "local/index.html"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
```

### Batch Processing Job
```hcl
# batch-job.nomad
job "data-processing" {
  datacenters = ["dc1"]
  type        = "batch"

  group "processors" {
    count = 5

    task "process" {
      driver = "docker"

      config {
        image = "python:3.9-slim"
        command = "python"
        args = ["/local/process.py"]
      }

      template {
        data = <<EOF
#!/usr/bin/env python3
import os
import time
import random

def process_data():
    print(f"Processing on {os.environ.get('NOMAD_ALLOC_ID')}")
    
    # Simulate data processing
    processing_time = random.randint(30, 120)
    time.sleep(processing_time)
    
    print(f"Processing completed in {processing_time} seconds")

if __name__ == "__main__":
    process_data()
EOF
        destination = "local/process.py"
        perms = "755"
      }

      resources {
        cpu    = 500
        memory = 256
      }

      restart {
        attempts = 3
        delay    = "30s"
        interval = "5m"
        mode     = "fail"
      }
    }
  }
}
```

### Multi-Task Group
```hcl
# microservice.nomad
job "microservice" {
  datacenters = ["dc1"]
  type        = "service"

  group "api" {
    count = 2

    network {
      port "api" {
        to = 3000
      }
      port "metrics" {
        to = 9090
      }
    }

    service {
      name = "api"
      port = "api"
      
      tags = ["api", "v1"]

      check {
        type     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "3s"
      }
    }

    service {
      name = "api-metrics"
      port = "metrics"
      tags = ["metrics"]
    }

    # Main API task
    task "api" {
      driver = "docker"

      config {
        image = "node:16-alpine"
        ports = ["api"]
        command = "node"
        args = ["/local/server.js"]
      }

      template {
        data = <<EOF
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  res.json({ 
    message: 'Hello from Nomad!',
    node: process.env.NOMAD_ALLOC_ID 
  });
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
EOF
        destination = "local/server.js"
      }

      resources {
        cpu    = 200
        memory = 256
      }
    }

    # Sidecar metrics task
    task "metrics" {
      driver = "docker"

      config {
        image = "prom/node-exporter:latest"
        ports = ["metrics"]
        args = [
          "--web.listen-address=:9090",
          "--path.procfs=/host/proc",
          "--path.sysfs=/host/sys"
        ]
      }

      resources {
        cpu    = 50
        memory = 64
      }
    }
  }
}
```

## 🔧 Advanced Features

### Volume Management
```hcl
# volume-job.nomad
job "database" {
  datacenters = ["dc1"]
  type        = "service"

  group "db" {
    count = 1

    volume "db-data" {
      type      = "host"
      read_only = false
      source    = "database"
    }

    task "postgres" {
      driver = "docker"

      volume_mount {
        volume      = "db-data"
        destination = "/var/lib/postgresql/data"
        read_only   = false
      }

      config {
        image = "postgres:13"
        ports = ["db"]
      }

      env {
        POSTGRES_DB       = "myapp"
        POSTGRES_USER     = "admin"
        POSTGRES_PASSWORD = "secretpassword"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }
  }
}
```

### Constraints and Affinity
```hcl
job "gpu-workload" {
  datacenters = ["dc1"]
  type        = "batch"

  constraint {
    attribute = "${attr.kernel.name}"
    value     = "linux"
  }

  constraint {
    attribute = "${meta.gpu}"
    value     = "nvidia"
  }

  affinity {
    attribute = "${node.class}"
    value     = "gpu-compute"
    weight    = 100
  }

  group "training" {
    count = 1

    task "ml-training" {
      driver = "docker"

      config {
        image = "tensorflow/tensorflow:latest-gpu"
        command = "python"
        args = ["/local/train.py"]
      }

      resources {
        cpu    = 2000
        memory = 4096
        
        device "nvidia/gpu" {
          count = 1
        }
      }
    }
  }
}
```

### Parameterized Jobs
```hcl
job "parameterized-job" {
  datacenters = ["dc1"]
  type        = "batch"

  parameterized {
    payload       = "required"
    meta_required = ["input_file", "output_dir"]
    meta_optional = ["debug_mode"]
  }

  group "worker" {
    task "process" {
      driver = "docker"

      config {
        image = "alpine:latest"
        command = "/bin/sh"
        args = ["/local/process.sh"]
      }

      template {
        data = <<EOF
#!/bin/sh
echo "Processing file: {{ env "NOMAD_META_input_file" }}"
echo "Output directory: {{ env "NOMAD_META_output_dir" }}"
echo "Debug mode: {{ env "NOMAD_META_debug_mode" }}"

# Process the payload
cat > /tmp/payload.txt << 'PAYLOAD_EOF'
{{ with $payload := env "NOMAD_PAYLOAD" }}{{ $payload }}{{ end }}
PAYLOAD_EOF

echo "Payload content:"
cat /tmp/payload.txt
EOF
        destination = "local/process.sh"
        perms = "755"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
```

## 🐳 Docker Compose Integration

### Nomad with Consul and Vault
```yaml
# docker-compose.yml
version: '3.8'

services:
  consul:
    image: consul:1.16
    ports:
      - "8500:8500"
    command: >
      consul agent -dev -ui -client=0.0.0.0
      -log-level=INFO
    volumes:
      - consul-data:/consul/data

  vault:
    image: vault:1.14
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK

  nomad-server:
    image: hashicorp/nomad:1.6
    ports:
      - "4646:4646"
      - "4647:4647"
      - "4648:4648"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./nomad-config:/etc/nomad.d
      - nomad-data:/opt/nomad/data
    command: >
      nomad agent -config=/etc/nomad.d/server.hcl
    depends_on:
      - consul
      - vault
    environment:
      NOMAD_LOCAL_CONFIG: |
        datacenter = "dc1"
        data_dir = "/opt/nomad/data"
        log_level = "INFO"
        
        server {
          enabled = true
          bootstrap_expect = 1
        }
        
        client {
          enabled = true
        }
        
        ui_config {
          enabled = true
        }
        
        consul {
          address = "consul:8500"
        }

volumes:
  consul-data:
  nomad-data:
```

## 📊 Monitoring & Observability

### Prometheus Integration
```hcl
# monitoring.nomad
job "monitoring" {
  datacenters = ["dc1"]
  type        = "service"

  group "prometheus" {
    count = 1

    network {
      port "prometheus" {
        static = 9090
      }
    }

    service {
      name = "prometheus"
      port = "prometheus"
      tags = ["monitoring"]
    }

    task "prometheus" {
      driver = "docker"

      config {
        image = "prom/prometheus:latest"
        ports = ["prometheus"]
        args = [
          "--config.file=/local/prometheus.yml",
          "--storage.tsdb.path=/prometheus",
          "--web.console.libraries=/etc/prometheus/console_libraries",
          "--web.console.templates=/etc/prometheus/consoles",
          "--web.enable-lifecycle"
        ]
      }

      template {
        data = <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nomad'
    static_configs:
      - targets: ['{{ env "NOMAD_IP_prometheus" }}:4646']
    metrics_path: /v1/metrics
    params:
      format: ['prometheus']

  - job_name: 'consul'
    static_configs:
      - targets: ['consul:8500']

  - job_name: 'node-exporter'
    consul_sd_configs:
      - server: 'consul:8500'
        services: ['node-exporter']
EOF
        destination = "local/prometheus.yml"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }
  }

  group "grafana" {
    count = 1

    network {
      port "grafana" {
        static = 3000
      }
    }

    service {
      name = "grafana"
      port = "grafana"
      tags = ["monitoring", "dashboard"]
    }

    task "grafana" {
      driver = "docker"

      config {
        image = "grafana/grafana:latest"
        ports = ["grafana"]
      }

      env {
        GF_SECURITY_ADMIN_PASSWORD = "admin"
      }

      resources {
        cpu    = 200
        memory = 256
      }
    }
  }
}
```

### Logging Configuration
```hcl
# logging.nomad
job "logging" {
  datacenters = ["dc1"]
  type        = "system"

  group "log-collector" {
    task "fluentd" {
      driver = "docker"

      config {
        image = "fluent/fluentd:v1.14-1"
        ports = ["fluentd"]
        
        volumes = [
          "/var/log:/var/log:ro",
          "local/fluent.conf:/fluentd/etc/fluent.conf"
        ]
      }

      template {
        data = <<EOF
<source>
  @type tail
  path /var/log/nomad/*.log
  pos_file /var/log/fluentd-nomad.log.pos
  tag nomad.*
  format json
</source>

<match nomad.**>
  @type elasticsearch
  host elasticsearch.service.consul
  port 9200
  index_name nomad-logs
  type_name _doc
</match>
EOF
        destination = "local/fluent.conf"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
```

## 🔒 Security Configuration

### ACL Setup
```bash
# Bootstrap ACL system
nomad acl bootstrap

# Create management policy
cat > management-policy.hcl << EOF
namespace "*" {
  policy = "write"
}
agent {
  policy = "write"
}
operator {
  policy = "write"
}
quota {
  policy = "write"
}
node {
  policy = "write"
}
host_volume "*" {
  policy = "write"
}
EOF

# Create policy
nomad acl policy apply -description "Management policy" management management-policy.hcl

# Create token
nomad acl token create -name="management-token" -policy=management
```

### TLS Configuration
```bash
# Generate CA
nomad tls ca create

# Generate server certificates
nomad tls cert create -server -region global -dc dc1

# Generate client certificates
nomad tls cert create -client -region global -dc dc1
```

### Vault Integration
```hcl
# vault-integration.nomad
job "vault-example" {
  datacenters = ["dc1"]
  type        = "service"

  vault {
    policies = ["database"]
    change_mode = "restart"
  }

  group "app" {
    task "web" {
      driver = "docker"

      config {
        image = "nginx:alpine"
      }

      template {
        data = <<EOF
{{ with secret "database/creds/readonly" }}
DB_USER="{{ .Data.username }}"
DB_PASS="{{ .Data.password }}"
{{ end }}
EOF
        destination = "secrets/db.env"
        env = true
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
```

## 🚀 Production Deployment

### Systemd Service
```ini
# /etc/systemd/system/nomad.service
[Unit]
Description=Nomad
Documentation=https://www.nomadproject.io/
Requires=network-online.target
After=network-online.target
ConditionFileNotEmpty=/etc/nomad.d/nomad.hcl

[Service]
Type=notify
User=nomad
Group=nomad
ExecStart=/usr/local/bin/nomad agent -config=/etc/nomad.d/nomad.hcl
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

### High Availability Setup
```hcl
# ha-server.hcl
datacenter = "dc1"
data_dir   = "/opt/nomad/data"
log_level  = "INFO"

server {
  enabled          = true
  bootstrap_expect = 5
  
  server_join {
    retry_join = [
      "nomad-1.internal:4648",
      "nomad-2.internal:4648",
      "nomad-3.internal:4648",
      "nomad-4.internal:4648",
      "nomad-5.internal:4648"
    ]
  }
  
  # Enable automated backups
  raft_snapshot {
    interval   = "5m"
    threshold  = 8192
    retain     = 2
  }
}

autopilot {
  cleanup_dead_servers      = true
  last_contact_threshold    = "200ms"
  max_trailing_logs         = 250
  server_stabilization_time = "10s"
  enable_redundancy_zones   = false
  disable_upgrade_migration = false
  enable_custom_upgrades    = false
}
```

## 🔍 Troubleshooting

### Common Commands
```bash
# Check cluster status
nomad server members
nomad node status

# View job status
nomad job status webapp
nomad alloc status <alloc-id>

# Debug allocation
nomad alloc logs <alloc-id>
nomad alloc fs <alloc-id>

# Drain node for maintenance
nomad node drain -enable -yes <node-id>

# Check system events
nomad system gc
nomad system reconcile summaries
```

### Log Analysis
```bash
# View Nomad logs
journalctl -u nomad -f

# Check specific allocation logs
nomad alloc logs -f <alloc-id> <task-name>

# Export job specification
nomad job inspect webapp > webapp-current.json
```

## 📈 Performance Tuning

### Resource Optimization
```hcl
# Optimized client configuration
client {
  enabled = true
  
  # Increase concurrent allocations
  max_kill_timeout = "30s"
  
  # Optimize GC
  gc_interval            = "1m"
  gc_parallel_destroys   = 2
  gc_disk_usage_threshold = 80
  gc_inode_usage_threshold = 70
  gc_max_allocs = 50
  
  # Resource reservations
  reserved {
    cpu            = 100
    memory         = 256
    disk           = 1024
    reserved_ports = "22,80,8500-8600"
  }
}
```

### Scaling Strategies
```hcl
job "autoscaling-app" {
  datacenters = ["dc1"]
  type        = "service"

  group "web" {
    count = 3

    scaling {
      enabled = true
      min     = 2
      max     = 10

      policy {
        cooldown            = "2m"
        evaluation_interval = "30s"

        check "avg_cpu" {
          source = "prometheus"
          query  = "avg_cpu_usage"

          strategy "target-value" {
            target = 70
          }
        }
      }
    }

    task "app" {
      driver = "docker"
      
      config {
        image = "myapp:latest"
      }

      resources {
        cpu    = 500
        memory = 256
      }
    }
  }
}
```

## 📚 Additional Resources

- [Nomad Documentation](https://www.nomadproject.io/docs)
- [Nomad Tutorials](https://learn.hashicorp.com/nomad)
- [Job Specification](https://www.nomadproject.io/docs/job-specification)
- [Nomad API](https://www.nomadproject.io/api-docs)
- [Community Plugins](https://github.com/hashicorp/nomad/tree/main/plugins)

HashiCorp Nomad provides a simple yet powerful orchestration platform that bridges the gap between traditional and modern application deployment patterns, offering flexibility without complexity.
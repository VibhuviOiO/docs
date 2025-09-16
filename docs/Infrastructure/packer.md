---
sidebar_position: 7
title: HashiCorp Packer
description: HashiCorp Packer is a tool for creating identical machine images for multiple platforms from a single source configuration, enabling immutable infrastructure.
slug: /Infrastructure/Packer
keywords:
  - HashiCorp Packer
  - machine images
  - immutable infrastructure
  - image automation
  - multi-platform builds
  - infrastructure as code
  - AMI
  - Docker images
---

# 📦 Automated Machine Image Creation with HashiCorp Packer

**HashiCorp Packer** is a **multi-platform** tool for creating **identical machine images** from a **single source configuration**. Perfect for **immutable infrastructure**, **consistent deployments**, and **automated image pipelines** across **cloud providers** and **virtualization platforms**.

## Key Features

- **Multi-Platform Support**: Build images for AWS, Azure, GCP, VMware, Docker, and more
- **Immutable Infrastructure**: Create consistent, reproducible machine images
- **Parallel Builds**: Build multiple images simultaneously
- **Provisioner Ecosystem**: Shell, Ansible, Chef, Puppet integration
- **Template-Based**: JSON and HCL configuration formats

## Use Cases

- **Cloud Migration**: Create consistent images across cloud providers
- **Golden Images**: Standardized base images for organizations
- **CI/CD Integration**: Automated image builds in deployment pipelines
- **Security Hardening**: Baked-in security configurations and patches

---

## 🧰 Prerequisites

- **HashiCorp Packer** installed locally
- **Cloud provider credentials** (AWS, Azure, GCP)
- **Docker** for container image builds
- **Virtualization software** (VirtualBox, VMware) for local builds
- **Configuration management tools** (Ansible, Chef, Puppet) optional

---

## 🔧 Step 1: Packer Installation and Setup

### Install Packer

```bash
# Install Packer on Linux/macOS
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install packer

# Or using Homebrew on macOS
brew install packer

# Verify installation
packer version
```### Envir
onment Setup

```bash
# Set up AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-west-2"

# Set up Azure credentials
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_TENANT_ID="your-tenant-id"

# Set up GCP credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GOOGLE_PROJECT="your-project-id"
```

---

## 🏗️ Step 2: Basic Packer Templates

### AWS AMI Template (HCL2 Format)

Create `aws-ubuntu.pkr.hcl`:

```hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "region" {
  type    = string
  default = "us-west-2"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ami_name" {
  type    = string
  default = "custom-ubuntu-{{timestamp}}"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

source "amazon-ebs" "ubuntu" {
  ami_name      = var.ami_name
  instance_type = var.instance_type
  region        = var.region
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"] # Canonical
  }
  
  ssh_username = "ubuntu"
  
  tags = {
    Name        = var.ami_name
    Environment = "production"
    OS_Version  = "Ubuntu 22.04"
    Base_AMI    = "{{ .SourceAMI }}"
    Built_By    = "Packer"
  }
}

build {
  name = "ubuntu-build"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]
  
  # Update system packages
  provisioner "shell" {
    inline = [
      "echo 'Updating system packages...'",
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y curl wget unzip jq"
    ]
  }
  
  # Install Docker
  provisioner "shell" {
    script = "scripts/install-docker.sh"
  }
  
  # Install monitoring agents
  provisioner "shell" {
    script = "scripts/install-monitoring.sh"
  }
  
  # Security hardening
  provisioner "ansible" {
    playbook_file = "ansible/security-hardening.yml"
    user          = "ubuntu"
  }
  
  # Clean up
  provisioner "shell" {
    inline = [
      "echo 'Cleaning up...'",
      "sudo apt-get autoremove -y",
      "sudo apt-get autoclean",
      "sudo rm -rf /tmp/*",
      "history -c"
    ]
  }
}
```### Mul
ti-Platform Template

Create `multi-platform.pkr.hcl`:

```hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
    azure = {
      version = ">= 1.4.0"
      source  = "github.com/hashicorp/azure"
    }
    googlecompute = {
      version = ">= 1.1.1"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

variable "application_name" {
  type    = string
  default = "webapp"
}

variable "version" {
  type    = string
  default = "1.0.0"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
  image_name = "${var.application_name}-${var.version}-${local.timestamp}"
}

# AWS Source
source "amazon-ebs" "aws" {
  ami_name      = local.image_name
  instance_type = "t3.micro"
  region        = "us-west-2"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  
  ssh_username = "ubuntu"
  
  tags = {
    Name = local.image_name
    Platform = "AWS"
  }
}

# Azure Source
source "azure-arm" "azure" {
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
  subscription_id = var.subscription_id
  
  managed_image_resource_group_name = "packer-images"
  managed_image_name                = local.image_name
  
  os_type         = "Linux"
  image_publisher = "Canonical"
  image_offer     = "0001-com-ubuntu-server-jammy"
  image_sku       = "22_04-lts-gen2"
  
  location = "East US"
  vm_size  = "Standard_B1s"
}

# GCP Source
source "googlecompute" "gcp" {
  project_id   = var.project_id
  source_image = "ubuntu-2204-jammy-v20231030"
  zone         = "us-central1-a"
  
  image_name        = local.image_name
  image_description = "Custom image built with Packer"
  
  machine_type = "e2-micro"
  ssh_username = "ubuntu"
  
  image_labels = {
    environment = "production"
    built_by    = "packer"
  }
}

build {
  sources = [
    "source.amazon-ebs.aws",
    "source.azure-arm.azure",
    "source.googlecompute.gcp"
  ]
  
  # Common provisioning steps
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y nginx",
      "sudo systemctl enable nginx"
    ]
  }
  
  # Application-specific setup
  provisioner "file" {
    source      = "app/"
    destination = "/tmp/app"
  }
  
  provisioner "shell" {
    script = "scripts/setup-application.sh"
  }
}
```

---

## ▶️ Step 3: Advanced Provisioning Scripts

### Docker Installation Script

Create `scripts/install-docker.sh`:

```bash
#!/bin/bash
set -e

echo "Installing Docker..."

# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "Docker installation completed!"
```#
## Monitoring Agent Installation

Create `scripts/install-monitoring.sh`:

```bash
#!/bin/bash
set -e

echo "Installing monitoring agents..."

# Install Node Exporter for Prometheus
NODE_EXPORTER_VERSION="1.6.1"
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar xvfz node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
sudo cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
sudo chown root:root /usr/local/bin/node_exporter

# Create node_exporter user
sudo useradd --no-create-home --shell /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Enable and start node_exporter
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Install Filebeat for log shipping
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-amd64.deb
sudo dpkg -i filebeat-8.11.0-amd64.deb

# Configure Filebeat
sudo tee /etc/filebeat/filebeat.yml > /dev/null <<EOF
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
    - /var/log/syslog
    - /var/log/auth.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
EOF

sudo systemctl enable filebeat

echo "Monitoring agents installed successfully!"
```

### Security Hardening with Ansible

Create `ansible/security-hardening.yml`:

```yaml
---
- name: Security Hardening
  hosts: all
  become: yes
  vars:
    allowed_ssh_users:
      - ubuntu
      - admin
    
  tasks:
    - name: Update all packages
      apt:
        upgrade: dist
        update_cache: yes
        cache_valid_time: 3600
    
    - name: Install security packages
      apt:
        name:
          - fail2ban
          - ufw
          - unattended-upgrades
          - aide
          - rkhunter
          - chkrootkit
        state: present
    
    - name: Configure automatic security updates
      copy:
        dest: /etc/apt/apt.conf.d/20auto-upgrades
        content: |
          APT::Periodic::Update-Package-Lists "1";
          APT::Periodic::Unattended-Upgrade "1";
    
    - name: Configure UFW firewall
      ufw:
        rule: "{{ item.rule }}"
        port: "{{ item.port }}"
        proto: "{{ item.proto | default('tcp') }}"
      loop:
        - { rule: 'allow', port: '22' }
        - { rule: 'allow', port: '80' }
        - { rule: 'allow', port: '443' }
        - { rule: 'allow', port: '9100' }  # Node Exporter
    
    - name: Enable UFW
      ufw:
        state: enabled
        policy: deny
        direction: incoming
    
    - name: Configure SSH security
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
        backup: yes
      loop:
        - { regexp: '^#?PermitRootLogin', line: 'PermitRootLogin no' }
        - { regexp: '^#?PasswordAuthentication', line: 'PasswordAuthentication no' }
        - { regexp: '^#?X11Forwarding', line: 'X11Forwarding no' }
        - { regexp: '^#?MaxAuthTries', line: 'MaxAuthTries 3' }
        - { regexp: '^#?ClientAliveInterval', line: 'ClientAliveInterval 300' }
        - { regexp: '^#?ClientAliveCountMax', line: 'ClientAliveCountMax 2' }
      notify: restart ssh
    
    - name: Set up fail2ban
      copy:
        dest: /etc/fail2ban/jail.local
        content: |
          [DEFAULT]
          bantime = 3600
          findtime = 600
          maxretry = 3
          
          [sshd]
          enabled = true
          port = ssh
          logpath = /var/log/auth.log
          maxretry = 3
      notify: restart fail2ban
    
    - name: Configure kernel parameters
      sysctl:
        name: "{{ item.name }}"
        value: "{{ item.value }}"
        state: present
        reload: yes
      loop:
        - { name: 'net.ipv4.conf.all.send_redirects', value: '0' }
        - { name: 'net.ipv4.conf.default.send_redirects', value: '0' }
        - { name: 'net.ipv4.conf.all.accept_redirects', value: '0' }
        - { name: 'net.ipv4.conf.default.accept_redirects', value: '0' }
        - { name: 'net.ipv4.ip_forward', value: '0' }
        - { name: 'net.ipv4.conf.all.log_martians', value: '1' }
    
    - name: Remove unnecessary packages
      apt:
        name:
          - telnet
          - rsh-client
          - rsh-redone-client
        state: absent
        purge: yes
  
  handlers:
    - name: restart ssh
      service:
        name: ssh
        state: restarted
    
    - name: restart fail2ban
      service:
        name: fail2ban
        state: restarted
```

---

## 📊 Step 4: CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/packer-build.yml`:

```yaml
name: Packer Image Build

on:
  push:
    branches: [ main ]
    paths: 
      - 'packer/**'
      - 'scripts/**'
      - 'ansible/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'packer/**'
      - 'scripts/**'
      - 'ansible/**'

env:
  PACKER_VERSION: "1.9.4"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Packer
        uses: hashicorp/setup-packer@main
        with:
          version: ${{ env.PACKER_VERSION }}
      
      - name: Validate Packer templates
        run: |
          packer validate packer/aws-ubuntu.pkr.hcl
          packer validate packer/multi-platform.pkr.hcl
      
      - name: Format check
        run: |
          packer fmt -check packer/

  build-aws:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Packer
        uses: hashicorp/setup-packer@main
        with:
          version: ${{ env.PACKER_VERSION }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Build AWS AMI
        run: |
          packer build \
            -var "ami_name=webapp-$(date +%Y%m%d%H%M%S)" \
            packer/aws-ubuntu.pkr.hcl
      
      - name: Get AMI ID
        id: ami
        run: |
          AMI_ID=$(aws ec2 describe-images \
            --owners self \
            --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
            --output text)
          echo "ami_id=$AMI_ID" >> $GITHUB_OUTPUT
      
      - name: Update Terraform variables
        run: |
          echo "ami_id = \"${{ steps.ami.outputs.ami_id }}\"" > terraform/ami.auto.tfvars
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add terraform/ami.auto.tfvars
          git commit -m "Update AMI ID: ${{ steps.ami.outputs.ami_id }}" || exit 0
          git push

  build-multi-platform:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        platform: [aws, azure, gcp]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Packer
        uses: hashicorp/setup-packer@main
        with:
          version: ${{ env.PACKER_VERSION }}
      
      - name: Build ${{ matrix.platform }} image
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.ARM_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.ARM_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
          GOOGLE_APPLICATION_CREDENTIALS_JSON: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}
        run: |
          if [ "${{ matrix.platform }}" = "gcp" ]; then
            echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /tmp/gcp-key.json
            export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-key.json
          fi
          
          packer build \
            -only="${{ matrix.platform }}.*" \
            -var "version=${{ github.sha }}" \
            packer/multi-platform.pkr.hcl
```---

#
# 🔍 What You'll See

### Packer Build Output
```bash
$ packer build aws-ubuntu.pkr.hcl

amazon-ebs.ubuntu: output will be in this color.

==> amazon-ebs.ubuntu: Prevalidating any provided VPC information
==> amazon-ebs.ubuntu: Prevalidating AMI Name: custom-ubuntu-20240115103000
==> amazon-ebs.ubuntu: Creating temporary keypair: packer_63f8a123-4567-8901-2345-678901234567
==> amazon-ebs.ubuntu: Creating temporary security group for this instance: packer_63f8a123
==> amazon-ebs.ubuntu: Authorizing access to port 22 from [0.0.0.0/0] in the temporary security groups...
==> amazon-ebs.ubuntu: Launching a source AWS instance...
==> amazon-ebs.ubuntu: Adding tags to source instance
    amazon-ebs.ubuntu: Adding tag: "Name": "Packer Builder"
==> amazon-ebs.ubuntu: Waiting for instance (i-0123456789abcdef0) to become ready...
==> amazon-ebs.ubuntu: Using SSH communicator to connect: 54.123.45.67
==> amazon-ebs.ubuntu: Waiting for SSH to become available...
==> amazon-ebs.ubuntu: Connected to SSH!
==> amazon-ebs.ubuntu: Provisioning with shell script: scripts/install-docker.sh
    amazon-ebs.ubuntu: Installing Docker...
    amazon-ebs.ubuntu: Docker installation completed!
==> amazon-ebs.ubuntu: Provisioning with Ansible...
    amazon-ebs.ubuntu: PLAY [Security Hardening] ******************************************************
    amazon-ebs.ubuntu: TASK [Update all packages] *****************************************************
    amazon-ebs.ubuntu: ok: [default]
    amazon-ebs.ubuntu: PLAY RECAP *********************************************************************
    amazon-ebs.ubuntu: default                    : ok=15   changed=8    unreachable=0    failed=0
==> amazon-ebs.ubuntu: Stopping the source instance...
==> amazon-ebs.ubuntu: Waiting for the instance to stop...
==> amazon-ebs.ubuntu: Creating AMI custom-ubuntu-20240115103000 from instance i-0123456789abcdef0
==> amazon-ebs.ubuntu: Waiting for AMI to become ready...
==> amazon-ebs.ubuntu: Terminating the source AWS instance...
==> amazon-ebs.ubuntu: Cleaning up any extra volumes...
==> amazon-ebs.ubuntu: No volumes to clean up, skipping
==> amazon-ebs.ubuntu: Deleting temporary security group...
==> amazon-ebs.ubuntu: Deleting temporary keypair...
Build 'amazon-ebs.ubuntu' finished after 8 minutes 34 seconds.

==> Wait completed after 8 minutes 34 seconds

==> Builds finished. The artifacts of successful builds are:
--> amazon-ebs.ubuntu: AMIs were created:
us-west-2: ami-0123456789abcdef0
```

### Multi-Platform Build Results
```bash
Build Summary:
✅ AWS AMI: ami-0123456789abcdef0 (us-west-2)
✅ Azure Image: webapp-20240115103000 (East US)
✅ GCP Image: webapp-20240115103000 (us-central1)

Total build time: 12m 45s
Images created: 3
Platforms: AWS, Azure, GCP
```

---

## Pros & Cons

### ✅ Pros
- **Multi-Platform**: Single configuration for multiple platforms
- **Immutable Infrastructure**: Consistent, reproducible images
- **Automation**: Integrates well with CI/CD pipelines
- **Provisioner Support**: Works with Ansible, Chef, Puppet, Shell
- **Parallel Builds**: Build multiple images simultaneously

### ❌ Cons
- **Build Time**: Image creation can be time-consuming
- **Storage Costs**: Multiple images across platforms increase costs
- **Complexity**: Advanced configurations can become complex
- **Debugging**: Troubleshooting failed builds can be challenging

---

## Conclusion

HashiCorp Packer is the **standard tool** for **automated machine image creation**. Choose Packer when you need:

- **Immutable infrastructure** with consistent machine images
- **Multi-cloud deployments** with identical configurations
- **Automated image pipelines** integrated with CI/CD
- **Security hardening** baked into base images

The combination of multi-platform support, automation capabilities, and immutable infrastructure principles makes Packer essential for modern infrastructure management.

**What You've Achieved:**
✅ Set up automated machine image creation across multiple platforms  
✅ Implemented security hardening and monitoring in base images  
✅ Created CI/CD integration for automated image builds  
✅ Built consistent, reproducible infrastructure images  
✅ Established image versioning and artifact management
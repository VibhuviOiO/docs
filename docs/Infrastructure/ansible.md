---
sidebar_position: 6
title: Ansible
description: Ansible is an open-source automation tool for configuration management, application deployment, and task automation. Learn how to use Ansible with Docker for infrastructure automation.
slug: /Infrastructure/Ansible
keywords:
  - Ansible
  - configuration management
  - automation
  - infrastructure automation
  - deployment automation
  - DevOps automation
  - playbooks
  - infrastructure as code
  - server configuration
  - application deployment
---

# 🤖 Ansible - Simple, Powerful Automation

**Ansible** is an open-source automation tool that enables **configuration management**, **application deployment**, **task automation**, and **orchestration**. It uses simple, human-readable YAML syntax and requires no agents on target systems.

---

## Set Up Ansible with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  ansible-control:
    image: quay.io/ansible/ansible-runner:latest
    container_name: ansible-control
    working_dir: /ansible
    volumes:
      - ./ansible:/ansible
      - ./inventory:/ansible/inventory
      - ./playbooks:/ansible/playbooks
      - ./roles:/ansible/roles
      - ~/.ssh:/root/.ssh:ro
    environment:
      - ANSIBLE_HOST_KEY_CHECKING=False
      - ANSIBLE_STDOUT_CALLBACK=yaml
      - ANSIBLE_GATHERING=smart
    command: ["sleep", "infinity"]
    networks:
      - ansible-network

  # Target servers for testing
  target-server-1:
    image: ubuntu:20.04
    container_name: target-server-1
    command: >
      bash -c "apt-get update && 
               apt-get install -y openssh-server python3 sudo &&
               mkdir -p /var/run/sshd &&
               echo 'root:password' | chpasswd &&
               sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config &&
               /usr/sbin/sshd -D"
    ports:
      - "2222:22"
    networks:
      - ansible-network

  target-server-2:
    image: ubuntu:20.04
    container_name: target-server-2
    command: >
      bash -c "apt-get update && 
               apt-get install -y openssh-server python3 sudo &&
               mkdir -p /var/run/sshd &&
               echo 'root:password' | chpasswd &&
               sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config &&
               /usr/sbin/sshd -D"
    ports:
      - "2223:22"
    networks:
      - ansible-network

networks:
  ansible-network:
    driver: bridge
```

`Start Ansible environment:`
```bash
docker compose up -d
```

`Execute Ansible commands:`
```bash
# Access Ansible control node
docker compose exec ansible-control bash

# Run ad-hoc commands
ansible all -i inventory/hosts -m ping
ansible all -i inventory/hosts -m setup
```

---

## Inventory Configuration

### Static Inventory

`Create inventory/hosts:`
```ini
[webservers]
web1 ansible_host=target-server-1 ansible_port=22 ansible_user=root
web2 ansible_host=target-server-2 ansible_port=22 ansible_user=root

[databases]
db1 ansible_host=192.168.1.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[loadbalancers]
lb1 ansible_host=192.168.1.20 ansible_user=centos

[production:children]
webservers
databases
loadbalancers

[production:vars]
ansible_python_interpreter=/usr/bin/python3
environment=production
```

### Dynamic Inventory (AWS)

`Create inventory/aws_ec2.yml:`
```yaml
plugin: amazon.aws.aws_ec2
regions:
  - us-east-1
  - us-west-2
keyed_groups:
  - key: tags
    prefix: tag
  - key: instance_type
    prefix: instance_type
  - key: placement.region
    prefix: aws_region
filters:
  instance-state-name: running
hostnames:
  - dns-name
  - private-ip-address
compose:
  ansible_host: public_dns_name
```

### Group Variables

`Create inventory/group_vars/webservers.yml:`
```yaml
# Web server specific variables
nginx_version: "1.20"
document_root: "/var/www/html"
ssl_enabled: true
ssl_cert_path: "/etc/ssl/certs/server.crt"
ssl_key_path: "/etc/ssl/private/server.key"

# Application configuration
app_name: "mywebapp"
app_version: "1.2.3"
app_port: 8080
app_user: "webapp"
app_group: "webapp"

# Database connection
db_host: "{{ hostvars[groups['databases'][0]]['ansible_default_ipv4']['address'] }}"
db_name: "webapp_db"
db_user: "webapp_user"
db_password: "{{ vault_db_password }}"
```

`Create inventory/group_vars/all.yml:`
```yaml
# Global variables
timezone: "UTC"
ntp_servers:
  - "0.pool.ntp.org"
  - "1.pool.ntp.org"

# Security settings
ssh_port: 22
allowed_ssh_users:
  - "admin"
  - "deploy"

# Monitoring
monitoring_enabled: true
log_level: "info"

# Package management
package_update: true
security_updates_only: false
```

---

## Playbooks

### Basic Server Setup Playbook

`Create playbooks/server-setup.yml:`
```yaml
---
- name: Basic Server Setup
  hosts: all
  become: yes
  gather_facts: yes
  
  vars:
    required_packages:
      - curl
      - wget
      - git
      - htop
      - vim
      - unzip
      - software-properties-common
    
  tasks:
    - name: Update package cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"
    
    - name: Install required packages
      package:
        name: "{{ required_packages }}"
        state: present
    
    - name: Create admin user
      user:
        name: admin
        groups: sudo
        shell: /bin/bash
        create_home: yes
        state: present
    
    - name: Set up SSH key for admin user
      authorized_key:
        user: admin
        key: "{{ lookup('file', '~/.ssh/id_rsa.pub') }}"
        state: present
    
    - name: Configure SSH security
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
        backup: yes
      loop:
        - { regexp: '^#?PermitRootLogin', line: 'PermitRootLogin no' }
        - { regexp: '^#?PasswordAuthentication', line: 'PasswordAuthentication no' }
        - { regexp: '^#?Port', line: 'Port {{ ssh_port }}' }
      notify: restart ssh
    
    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ ssh_port }}"
        proto: tcp
    
    - name: Enable firewall
      ufw:
        state: enabled
        policy: deny
        direction: incoming
    
    - name: Set timezone
      timezone:
        name: "{{ timezone }}"
    
    - name: Install and configure NTP
      package:
        name: ntp
        state: present
    
    - name: Configure NTP servers
      template:
        src: ntp.conf.j2
        dest: /etc/ntp.conf
        backup: yes
      notify: restart ntp
  
  handlers:
    - name: restart ssh
      service:
        name: ssh
        state: restarted
    
    - name: restart ntp
      service:
        name: ntp
        state: restarted
```

### Web Server Deployment Playbook

`Create playbooks/deploy-webapp.yml:`
```yaml
---
- name: Deploy Web Application
  hosts: webservers
  become: yes
  serial: 1  # Deploy one server at a time
  
  vars:
    app_dir: "/opt/{{ app_name }}"
    backup_dir: "/opt/backups"
    
  pre_tasks:
    - name: Check if application is running
      uri:
        url: "http://{{ ansible_default_ipv4.address }}:{{ app_port }}/health"
        method: GET
        status_code: 200
      register: app_health
      ignore_errors: yes
      
  tasks:
    - name: Create application user
      user:
        name: "{{ app_user }}"
        group: "{{ app_group }}"
        system: yes
        shell: /bin/false
        home: "{{ app_dir }}"
        create_home: no
    
    - name: Create application directories
      file:
        path: "{{ item }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        mode: '0755'
      loop:
        - "{{ app_dir }}"
        - "{{ app_dir }}/releases"
        - "{{ app_dir }}/shared"
        - "{{ backup_dir }}"
    
    - name: Create backup of current release
      archive:
        path: "{{ app_dir }}/current"
        dest: "{{ backup_dir }}/{{ app_name }}-{{ ansible_date_time.epoch }}.tar.gz"
      when: app_health.status == 200
      ignore_errors: yes
    
    - name: Download application artifact
      get_url:
        url: "https://releases.example.com/{{ app_name }}/{{ app_version }}/{{ app_name }}-{{ app_version }}.tar.gz"
        dest: "/tmp/{{ app_name }}-{{ app_version }}.tar.gz"
        mode: '0644'
    
    - name: Extract application
      unarchive:
        src: "/tmp/{{ app_name }}-{{ app_version }}.tar.gz"
        dest: "{{ app_dir }}/releases"
        remote_src: yes
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        creates: "{{ app_dir }}/releases/{{ app_version }}"
    
    - name: Install application dependencies
      pip:
        requirements: "{{ app_dir }}/releases/{{ app_version }}/requirements.txt"
        virtualenv: "{{ app_dir }}/releases/{{ app_version }}/venv"
        virtualenv_python: python3
      become_user: "{{ app_user }}"
    
    - name: Create application configuration
      template:
        src: app_config.j2
        dest: "{{ app_dir }}/releases/{{ app_version }}/config.py"
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
        mode: '0640'
    
    - name: Create systemd service file
      template:
        src: webapp.service.j2
        dest: "/etc/systemd/system/{{ app_name }}.service"
        mode: '0644'
      notify:
        - reload systemd
        - restart webapp
    
    - name: Update current symlink
      file:
        src: "{{ app_dir }}/releases/{{ app_version }}"
        dest: "{{ app_dir }}/current"
        state: link
        owner: "{{ app_user }}"
        group: "{{ app_group }}"
      notify: restart webapp
    
    - name: Start and enable application service
      systemd:
        name: "{{ app_name }}"
        state: started
        enabled: yes
        daemon_reload: yes
    
    - name: Wait for application to start
      uri:
        url: "http://{{ ansible_default_ipv4.address }}:{{ app_port }}/health"
        method: GET
        status_code: 200
      retries: 30
      delay: 2
    
    - name: Clean up old releases
      shell: |
        cd {{ app_dir }}/releases
        ls -t | tail -n +4 | xargs rm -rf
      args:
        executable: /bin/bash
  
  handlers:
    - name: reload systemd
      systemd:
        daemon_reload: yes
    
    - name: restart webapp
      systemd:
        name: "{{ app_name }}"
        state: restarted
```

---

## Ansible Roles

### Nginx Role Structure

`Create roles/nginx/tasks/main.yml:`
```yaml
---
- name: Install Nginx
  package:
    name: nginx
    state: present

- name: Create Nginx directories
  file:
    path: "{{ item }}"
    state: directory
    mode: '0755'
  loop:
    - /etc/nginx/sites-available
    - /etc/nginx/sites-enabled
    - /var/log/nginx

- name: Configure Nginx main config
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    backup: yes
  notify: restart nginx

- name: Configure virtual hosts
  template:
    src: vhost.conf.j2
    dest: "/etc/nginx/sites-available/{{ item.name }}"
  loop: "{{ nginx_vhosts }}"
  notify: restart nginx

- name: Enable virtual hosts
  file:
    src: "/etc/nginx/sites-available/{{ item.name }}"
    dest: "/etc/nginx/sites-enabled/{{ item.name }}"
    state: link
  loop: "{{ nginx_vhosts }}"
  notify: restart nginx

- name: Remove default site
  file:
    path: /etc/nginx/sites-enabled/default
    state: absent
  notify: restart nginx

- name: Start and enable Nginx
  systemd:
    name: nginx
    state: started
    enabled: yes
```

`Create roles/nginx/handlers/main.yml:`
```yaml
---
- name: restart nginx
  systemd:
    name: nginx
    state: restarted

- name: reload nginx
  systemd:
    name: nginx
    state: reloaded
```

`Create roles/nginx/templates/nginx.conf.j2:`
```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections {{ nginx_worker_connections | default(1024) }};
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout {{ nginx_keepalive_timeout | default(65) }};
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Include virtual host configs
    include /etc/nginx/sites-enabled/*;
}
```

---

## Advanced Playbooks

### Rolling Deployment with Health Checks

`Create playbooks/rolling-deployment.yml:`
```yaml
---
- name: Rolling Deployment with Health Checks
  hosts: webservers
  become: yes
  serial: "{{ batch_size | default('25%') }}"
  max_fail_percentage: 10
  
  vars:
    health_check_url: "http://{{ ansible_default_ipv4.address }}:{{ app_port }}/health"
    deployment_timeout: 300
    
  pre_tasks:
    - name: Remove server from load balancer
      uri:
        url: "http://{{ load_balancer_host }}/api/servers/{{ inventory_hostname }}/disable"
        method: POST
        headers:
          Authorization: "Bearer {{ lb_api_token }}"
      delegate_to: localhost
      when: load_balancer_host is defined
    
    - name: Wait for connections to drain
      wait_for:
        timeout: 30
      when: load_balancer_host is defined
  
  tasks:
    - name: Stop application service
      systemd:
        name: "{{ app_name }}"
        state: stopped
    
    - name: Deploy new version
      include_tasks: tasks/deploy-app.yml
    
    - name: Start application service
      systemd:
        name: "{{ app_name }}"
        state: started
    
    - name: Wait for application to be healthy
      uri:
        url: "{{ health_check_url }}"
        method: GET
        status_code: 200
      register: health_check
      retries: "{{ (deployment_timeout / 5) | int }}"
      delay: 5
      until: health_check.status == 200
  
  post_tasks:
    - name: Add server back to load balancer
      uri:
        url: "http://{{ load_balancer_host }}/api/servers/{{ inventory_hostname }}/enable"
        method: POST
        headers:
          Authorization: "Bearer {{ lb_api_token }}"
      delegate_to: localhost
      when: load_balancer_host is defined
    
    - name: Verify server is receiving traffic
      uri:
        url: "{{ health_check_url }}"
        method: GET
        status_code: 200
      retries: 10
      delay: 3
```

### Infrastructure Provisioning

`Create playbooks/provision-infrastructure.yml:`
```yaml
---
- name: Provision AWS Infrastructure
  hosts: localhost
  gather_facts: no
  
  vars:
    aws_region: us-west-2
    vpc_cidr: "10.0.0.0/16"
    
  tasks:
    - name: Create VPC
      amazon.aws.ec2_vpc_net:
        name: "{{ project_name }}-vpc"
        cidr_block: "{{ vpc_cidr }}"
        region: "{{ aws_region }}"
        tags:
          Environment: "{{ environment }}"
        state: present
      register: vpc
    
    - name: Create public subnet
      amazon.aws.ec2_vpc_subnet:
        vpc_id: "{{ vpc.vpc.id }}"
        cidr: "10.0.1.0/24"
        region: "{{ aws_region }}"
        az: "{{ aws_region }}a"
        tags:
          Name: "{{ project_name }}-public-subnet"
          Type: "Public"
        state: present
      register: public_subnet
    
    - name: Create security group
      amazon.aws.ec2_group:
        name: "{{ project_name }}-web-sg"
        description: "Security group for web servers"
        vpc_id: "{{ vpc.vpc.id }}"
        region: "{{ aws_region }}"
        rules:
          - proto: tcp
            ports:
              - 80
              - 443
            cidr_ip: 0.0.0.0/0
          - proto: tcp
            ports:
              - 22
            cidr_ip: "{{ admin_cidr }}"
        tags:
          Environment: "{{ environment }}"
      register: security_group
    
    - name: Launch EC2 instances
      amazon.aws.ec2_instance:
        name: "{{ project_name }}-web-{{ item }}"
        image_id: "{{ ami_id }}"
        instance_type: "{{ instance_type }}"
        key_name: "{{ key_pair_name }}"
        vpc_subnet_id: "{{ public_subnet.subnet.id }}"
        security_groups:
          - "{{ security_group.group_id }}"
        region: "{{ aws_region }}"
        tags:
          Environment: "{{ environment }}"
          Role: "webserver"
        state: present
        wait: yes
      loop: "{{ range(1, web_server_count + 1) | list }}"
      register: ec2_instances
    
    - name: Add instances to inventory
      add_host:
        name: "{{ item.instances[0].public_dns_name }}"
        groups: webservers
        ansible_host: "{{ item.instances[0].public_ip_address }}"
        ansible_user: ubuntu
        ansible_ssh_private_key_file: "{{ key_file_path }}"
      loop: "{{ ec2_instances.results }}"
```

---

## Ansible Vault for Secrets

### Encrypting Sensitive Data

`Create encrypted variables:`
```bash
# Create encrypted file
ansible-vault create group_vars/production/vault.yml

# Edit encrypted file
ansible-vault edit group_vars/production/vault.yml

# Encrypt existing file
ansible-vault encrypt secrets.yml

# Decrypt file
ansible-vault decrypt secrets.yml
```

`Example vault.yml content:`
```yaml
vault_db_password: "super_secret_password"
vault_api_key: "secret_api_key_here"
vault_ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
  -----END PRIVATE KEY-----
```

`Use vault variables in playbooks:`
```yaml
- name: Configure database connection
  template:
    src: database.conf.j2
    dest: /etc/app/database.conf
    mode: '0600'
  vars:
    db_password: "{{ vault_db_password }}"
```

---

## CI/CD Integration

### Jenkins Pipeline with Ansible

`Create Jenkinsfile:`
```groovy
pipeline {
    agent any
    
    environment {
        ANSIBLE_HOST_KEY_CHECKING = 'False'
        VAULT_PASSWORD_FILE = credentials('ansible-vault-password')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Lint Playbooks') {
            steps {
                sh 'ansible-lint playbooks/'
            }
        }
        
        stage('Test Syntax') {
            steps {
                sh 'ansible-playbook --syntax-check playbooks/deploy-webapp.yml'
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                sh '''
                    ansible-playbook -i inventory/staging \
                        --vault-password-file $VAULT_PASSWORD_FILE \
                        playbooks/deploy-webapp.yml \
                        --extra-vars "app_version=${BUILD_NUMBER}"
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'ansible-playbook -i inventory/staging playbooks/run-tests.yml'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    ansible-playbook -i inventory/production \
                        --vault-password-file $VAULT_PASSWORD_FILE \
                        playbooks/rolling-deployment.yml \
                        --extra-vars "app_version=${BUILD_NUMBER}"
                '''
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'logs/*.log', allowEmptyArchive: true
        }
        failure {
            emailext (
                subject: "Deployment Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Deployment failed. Check console output for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

---

## Common Use Cases

- **Configuration Management**: Server configuration, package management, service configuration
- **Application Deployment**: Zero-downtime deployments, rolling updates, blue-green deployments
- **Infrastructure Provisioning**: Cloud resource creation, network configuration
- **Security Hardening**: System security configuration, compliance enforcement
- **Orchestration**: Multi-tier application deployments, complex workflows

✅ Ansible is now configured for comprehensive automation and configuration management!
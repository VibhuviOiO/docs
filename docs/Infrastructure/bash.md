---
sidebar_position: 11
title: Bash Scripting
description: Bash is the most widely used Unix shell for automation, system administration, and DevOps workflows across Linux and macOS systems.
slug: /Infrastructure/Bash
keywords:
  - Bash
  - shell scripting
  - Linux automation
  - Unix shell
  - system administration
  - DevOps automation
  - command line
  - scripting
---

# 🚀 System Automation with Bash Scripting

**Bash (Bourne Again Shell)** is the most widely used **Unix shell** for **automation**, **system administration**, and **DevOps workflows**. Perfect for **Linux/macOS automation**, **CI/CD pipelines**, and **infrastructure management** with powerful **command-line** capabilities.

## Key Features

- **Universal**: Available on virtually all Linux/Unix systems
- **Powerful**: Rich set of built-in commands and utilities
- **Flexible**: Easy text processing and system interaction
- **Lightweight**: Minimal resource usage
- **Integration**: Works seamlessly with all Unix tools
- **Portable**: Scripts run across different Unix-like systems

## Use Cases

- **System Administration**: Server management and maintenance
- **CI/CD Pipelines**: Build and deployment automation
- **Infrastructure Automation**: Server provisioning and configuration
- **Log Processing**: Text parsing and data extraction
- **Backup Scripts**: Automated backup and recovery

---

## 🧰 Prerequisites

- **Linux/macOS** system with Bash installed
- **Basic command-line** knowledge
- **Text editor** (vim, nano, or VS Code)
- **Git** for version control (optional)

---

## 🔧 Step 1: Basic Bash Script Structure

Create a system monitoring script `system-monitor.sh`:

```bash
#!/bin/bash

# System Monitoring Script
# Description: Monitor system resources and generate reports

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
LOG_FILE="/var/log/system-monitor.log"
REPORT_DIR="./reports"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
HOSTNAME=$(hostname)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check if running as root for certain operations
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log "INFO" "Running as root"
        return 0
    else
        log "WARN" "Not running as root - some features may be limited"
        return 1
    fi
}

# System information gathering
get_system_info() {
    log "INFO" "Gathering system information..."
    
    cat << EOF
=== SYSTEM INFORMATION ===
Hostname: $HOSTNAME
Date: $(date)
Uptime: $(uptime)
Kernel: $(uname -r)
OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
Architecture: $(uname -m)
EOF
}

# Memory usage
get_memory_info() {
    log "INFO" "Checking memory usage..."
    
    echo "=== MEMORY USAGE ==="
    free -h
    echo
    
    # Memory usage percentage
    local mem_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        echo -e "${RED}WARNING: High memory usage: ${mem_usage}%${NC}"
    else
        echo -e "${GREEN}Memory usage: ${mem_usage}%${NC}"
    fi
}

# Disk usage
get_disk_info() {
    log "INFO" "Checking disk usage..."
    
    echo "=== DISK USAGE ==="
    df -h
    echo
    
    # Check for high disk usage
    while IFS= read -r line; do
        usage=$(echo "$line" | awk '{print $5}' | sed 's/%//')
        mount=$(echo "$line" | awk '{print $6}')
        
        if [[ "$usage" =~ ^[0-9]+$ ]] && [ "$usage" -gt 80 ]; then
            echo -e "${RED}WARNING: High disk usage on $mount: ${usage}%${NC}"
        fi
    done < <(df -h | tail -n +2)
}

# CPU usage
get_cpu_info() {
    log "INFO" "Checking CPU usage..."
    
    echo "=== CPU INFORMATION ==="
    lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"
    echo
    
    echo "=== CPU USAGE ==="
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo "Load Average: $load_avg"
}

# Network information
get_network_info() {
    log "INFO" "Checking network information..."
    
    echo "=== NETWORK INTERFACES ==="
    ip addr show | grep -E "inet |inet6 " | awk '{print $2}' | head -10
    echo
    
    echo "=== NETWORK CONNECTIONS ==="
    ss -tuln | head -10
}

# Service status
check_services() {
    log "INFO" "Checking service status..."
    
    local services=("nginx" "apache2" "mysql" "postgresql" "redis" "docker" "ssh")
    
    echo "=== SERVICE STATUS ==="
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "${GREEN}✓ $service: Running${NC}"
        elif systemctl list-unit-files | grep -q "^$service.service"; then
            echo -e "${RED}✗ $service: Stopped${NC}"
        else
            echo -e "${YELLOW}? $service: Not installed${NC}"
        fi
    done
}

# Generate HTML report
generate_html_report() {
    local report_file="$REPORT_DIR/system-report-$DATE.html"
    
    mkdir -p "$REPORT_DIR"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>System Report - $HOSTNAME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #2c3e50; }
        .status-ok { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>System Report - $HOSTNAME</h1>
    <p>Generated on: $(date)</p>
    
    <h2>System Information</h2>
    <pre>$(get_system_info)</pre>
    
    <h2>Memory Usage</h2>
    <pre>$(get_memory_info)</pre>
    
    <h2>Disk Usage</h2>
    <pre>$(get_disk_info)</pre>
    
    <h2>CPU Information</h2>
    <pre>$(get_cpu_info)</pre>
    
    <h2>Network Information</h2>
    <pre>$(get_network_info)</pre>
    
    <h2>Service Status</h2>
    <pre>$(check_services)</pre>
</body>
</html>
EOF

    log "INFO" "HTML report generated: $report_file"
    echo -e "${GREEN}Report saved to: $report_file${NC}"
}

# Main execution
main() {
    log "INFO" "Starting system monitoring script"
    
    echo -e "${BLUE}=== SYSTEM MONITORING REPORT ===${NC}"
    echo "Generated on: $(date)"
    echo "Hostname: $HOSTNAME"
    echo
    
    get_system_info
    echo
    get_memory_info
    echo
    get_disk_info
    echo
    get_cpu_info
    echo
    get_network_info
    echo
    check_services
    echo
    
    # Generate HTML report
    generate_html_report
    
    log "INFO" "System monitoring completed"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

---

## 🏗️ Step 2: Docker Management Script

Create a Docker management script `docker-manager.sh`:

```bash
#!/bin/bash

# Docker Management Script
set -euo pipefail

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"
LOG_FILE="./docker-manager.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# List containers
list_containers() {
    local show_all=${1:-false}
    
    echo -e "${BLUE}=== DOCKER CONTAINERS ===${NC}"
    
    if [[ "$show_all" == "true" ]]; then
        docker ps -a --format "table {{.ID}}\t{{.Image}}\t{{.Command}}\t{{.Status}}\t{{.Names}}"
    else
        docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Command}}\t{{.Status}}\t{{.Names}}"
    fi
}

# Container operations
start_container() {
    local container_name=$1
    
    if docker start "$container_name" &> /dev/null; then
        echo -e "${GREEN}✓ Container '$container_name' started${NC}"
        log "Started container: $container_name"
    else
        echo -e "${RED}✗ Failed to start container '$container_name'${NC}"
        return 1
    fi
}

stop_container() {
    local container_name=$1
    
    if docker stop "$container_name" &> /dev/null; then
        echo -e "${GREEN}✓ Container '$container_name' stopped${NC}"
        log "Stopped container: $container_name"
    else
        echo -e "${RED}✗ Failed to stop container '$container_name'${NC}"
        return 1
    fi
}

# Create and run container
create_container() {
    local image=$1
    local name=$2
    local port=${3:-""}
    local env_vars=${4:-""}
    
    local docker_cmd="docker run -d --name $name"
    
    if [[ -n "$port" ]]; then
        docker_cmd="$docker_cmd -p $port"
    fi
    
    if [[ -n "$env_vars" ]]; then
        docker_cmd="$docker_cmd $env_vars"
    fi
    
    docker_cmd="$docker_cmd $image"
    
    echo "Running: $docker_cmd"
    
    if eval "$docker_cmd" &> /dev/null; then
        echo -e "${GREEN}✓ Container '$name' created and started${NC}"
        log "Created container: $name from image: $image"
    else
        echo -e "${RED}✗ Failed to create container '$name'${NC}"
        return 1
    fi
}

# Docker Compose operations
compose_up() {
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        echo -e "${BLUE}Starting Docker Compose services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ Docker Compose services started${NC}"
    else
        echo -e "${YELLOW}Warning: $DOCKER_COMPOSE_FILE not found${NC}"
    fi
}

compose_down() {
    if [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        echo -e "${BLUE}Stopping Docker Compose services...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Docker Compose services stopped${NC}"
    else
        echo -e "${YELLOW}Warning: $DOCKER_COMPOSE_FILE not found${NC}"
    fi
}

# System cleanup
cleanup_docker() {
    echo -e "${BLUE}Cleaning up Docker system...${NC}"
    
    # Remove stopped containers
    local stopped_containers=$(docker ps -aq --filter "status=exited")
    if [[ -n "$stopped_containers" ]]; then
        docker rm $stopped_containers
        echo -e "${GREEN}✓ Removed stopped containers${NC}"
    fi
    
    # Remove unused images
    docker image prune -f
    echo -e "${GREEN}✓ Removed unused images${NC}"
    
    # Remove unused volumes
    docker volume prune -f
    echo -e "${GREEN}✓ Removed unused volumes${NC}"
    
    # Remove unused networks
    docker network prune -f
    echo -e "${GREEN}✓ Removed unused networks${NC}"
}

# Show Docker system information
show_system_info() {
    echo -e "${BLUE}=== DOCKER SYSTEM INFO ===${NC}"
    docker system df
    echo
    docker info | grep -E "Containers|Images|Server Version"
}

# Usage information
usage() {
    cat << EOF
Docker Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    list [all]              List running containers (or all with 'all')
    start <container>       Start a container
    stop <container>        Stop a container
    create <image> <name> [port] [env]  Create and run a container
    compose-up              Start Docker Compose services
    compose-down            Stop Docker Compose services
    cleanup                 Clean up unused Docker resources
    info                    Show Docker system information
    help                    Show this help message

Examples:
    $0 list
    $0 start nginx-container
    $0 create nginx:alpine my-nginx "8080:80" "-e ENV=production"
    $0 compose-up
    $0 cleanup

EOF
}

# Main function
main() {
    check_docker
    
    case "${1:-help}" in
        list)
            list_containers "${2:-false}"
            ;;
        start)
            if [[ -z "${2:-}" ]]; then
                echo -e "${RED}Error: Container name required${NC}"
                exit 1
            fi
            start_container "$2"
            ;;
        stop)
            if [[ -z "${2:-}" ]]; then
                echo -e "${RED}Error: Container name required${NC}"
                exit 1
            fi
            stop_container "$2"
            ;;
        create)
            if [[ -z "${2:-}" ]] || [[ -z "${3:-}" ]]; then
                echo -e "${RED}Error: Image name and container name required${NC}"
                exit 1
            fi
            create_container "$2" "$3" "${4:-}" "${5:-}"
            ;;
        compose-up)
            compose_up
            ;;
        compose-down)
            compose_down
            ;;
        cleanup)
            cleanup_docker
            ;;
        info)
            show_system_info
            ;;
        help|*)
            usage
            ;;
    esac
}

# Execute main function
main "$@"
```

---

## 📁 Step 3: CI/CD Pipeline Script

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash

# Deployment Script for CI/CD Pipeline
set -euo pipefail

# Configuration
APP_NAME="myapp"
DOCKER_REGISTRY="registry.example.com"
DOCKER_IMAGE="$DOCKER_REGISTRY/$APP_NAME"
DEPLOY_ENV="${DEPLOY_ENV:-staging}"
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%s)}"
HEALTH_CHECK_URL="http://localhost:8080/health"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$1] ${*:2}"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "Running pre-deployment checks..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed"
    fi
    
    # Check if required environment variables are set
    if [[ -z "${DOCKER_REGISTRY_TOKEN:-}" ]]; then
        error_exit "DOCKER_REGISTRY_TOKEN environment variable is not set"
    fi
    
    # Check if application configuration exists
    if [[ ! -f "config/$DEPLOY_ENV.yml" ]]; then
        error_exit "Configuration file for $DEPLOY_ENV environment not found"
    fi
    
    log "INFO" "Pre-deployment checks passed"
}

# Build Docker image
build_image() {
    log "INFO" "Building Docker image..."
    
    local image_tag="$DOCKER_IMAGE:$BUILD_NUMBER"
    local latest_tag="$DOCKER_IMAGE:latest"
    
    # Build image
    docker build -t "$image_tag" -t "$latest_tag" .
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "Docker image built successfully: $image_tag"
    else
        error_exit "Failed to build Docker image"
    fi
    
    # Push to registry
    log "INFO" "Pushing image to registry..."
    
    echo "$DOCKER_REGISTRY_TOKEN" | docker login "$DOCKER_REGISTRY" --username "$DOCKER_REGISTRY_USER" --password-stdin
    
    docker push "$image_tag"
    docker push "$latest_tag"
    
    log "INFO" "Image pushed to registry successfully"
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying application to $DEPLOY_ENV environment..."
    
    local image_tag="$DOCKER_IMAGE:$BUILD_NUMBER"
    
    # Stop existing container
    if docker ps -q --filter "name=$APP_NAME" | grep -q .; then
        log "INFO" "Stopping existing container..."
        docker stop "$APP_NAME" || true
        docker rm "$APP_NAME" || true
    fi
    
    # Start new container
    docker run -d \
        --name "$APP_NAME" \
        --restart unless-stopped \
        -p 8080:8080 \
        -e ENVIRONMENT="$DEPLOY_ENV" \
        -e BUILD_NUMBER="$BUILD_NUMBER" \
        -v "$(pwd)/config/$DEPLOY_ENV.yml:/app/config.yml:ro" \
        "$image_tag"
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "Application deployed successfully"
    else
        error_exit "Failed to deploy application"
    fi
}

# Health check
health_check() {
    log "INFO" "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            log "INFO" "Health check passed"
            return 0
        fi
        
        log "INFO" "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Rollback function
rollback() {
    log "WARN" "Rolling back deployment..."
    
    local previous_image="$DOCKER_IMAGE:previous"
    
    # Stop current container
    docker stop "$APP_NAME" || true
    docker rm "$APP_NAME" || true
    
    # Start previous version
    docker run -d \
        --name "$APP_NAME" \
        --restart unless-stopped \
        -p 8080:8080 \
        -e ENVIRONMENT="$DEPLOY_ENV" \
        -v "$(pwd)/config/$DEPLOY_ENV.yml:/app/config.yml:ro" \
        "$previous_image"
    
    log "INFO" "Rollback completed"
}

# Cleanup old images
cleanup() {
    log "INFO" "Cleaning up old Docker images..."
    
    # Keep only the last 5 images
    docker images "$DOCKER_IMAGE" --format "{{.Tag}}" | \
        grep -E '^[0-9]+$' | \
        sort -nr | \
        tail -n +6 | \
        xargs -I {} docker rmi "$DOCKER_IMAGE:{}" || true
    
    log "INFO" "Cleanup completed"
}

# Main deployment function
main() {
    log "INFO" "Starting deployment process for $APP_NAME (Build: $BUILD_NUMBER, Environment: $DEPLOY_ENV)"
    
    # Tag current image as previous for rollback
    if docker images -q "$DOCKER_IMAGE:latest" | grep -q .; then
        docker tag "$DOCKER_IMAGE:latest" "$DOCKER_IMAGE:previous"
    fi
    
    pre_deployment_checks
    build_image
    deploy_application
    
    # Wait a moment for the application to start
    sleep 15
    
    if health_check; then
        log "INFO" "Deployment successful!"
        cleanup
    else
        log "ERROR" "Deployment failed, initiating rollback..."
        rollback
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback
        ;;
    health-check)
        health_check
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|cleanup}"
        exit 1
        ;;
esac
```

---

## ▶️ Step 4: Run the Scripts

Make scripts executable and run them:

```bash
# Make scripts executable
chmod +x system-monitor.sh docker-manager.sh deploy.sh

# Run system monitoring
./system-monitor.sh

# Docker management examples
./docker-manager.sh list
./docker-manager.sh create nginx:alpine my-nginx "8080:80"
./docker-manager.sh info

# Deployment (in CI/CD environment)
export DOCKER_REGISTRY_TOKEN="your-token"
export DOCKER_REGISTRY_USER="your-username"
export DEPLOY_ENV="staging"
./deploy.sh
```

---

## 🔍 What You'll See

### System Monitor Output
```
=== SYSTEM MONITORING REPORT ===
Generated on: 2024-01-15 10:30:00
Hostname: web-server-01

=== SYSTEM INFORMATION ===
Hostname: web-server-01
Date: Mon Jan 15 10:30:00 UTC 2024
Uptime: 10:30:00 up 5 days, 2:15, 1 user, load average: 0.15, 0.10, 0.05
Kernel: 5.4.0-74-generic
OS: Ubuntu 20.04.3 LTS
Architecture: x86_64

=== MEMORY USAGE ===
              total        used        free      shared  buff/cache   available
Mem:           7.8G        2.1G        3.2G        180M        2.5G        5.3G
Swap:          2.0G          0B        2.0G

Memory usage: 26.92%

=== SERVICE STATUS ===
✓ nginx: Running
✓ docker: Running
✗ mysql: Stopped
? postgresql: Not installed
```

### Docker Manager
- **Container Management**: Start, stop, create containers
- **System Information**: Resource usage and statistics
- **Cleanup Operations**: Remove unused resources
- **Compose Integration**: Manage multi-container applications

### Deployment Pipeline
- **Build Process**: Docker image creation and registry push
- **Health Checks**: Automated application health verification
- **Rollback Capability**: Automatic rollback on deployment failure
- **Cleanup**: Old image and resource cleanup

---

## Pros & Cons

### ✅ Pros
- **Universal**: Available on all Unix-like systems
- **Lightweight**: Minimal resource usage
- **Powerful**: Rich ecosystem of command-line tools
- **Flexible**: Easy text processing and system interaction
- **Fast**: Direct system calls and efficient execution
- **Portable**: Scripts work across different Unix systems

### ❌ Cons
- **Platform Limited**: Primarily Unix/Linux systems
- **Error Prone**: Easy to make mistakes without proper error handling
- **Limited Data Structures**: Basic variable and array support
- **Debugging**: Can be challenging to debug complex scripts
- **Syntax**: Can be cryptic for complex operations

---

## Conclusion

Bash scripting is essential for **Linux/Unix system administration** and **DevOps automation**. Choose Bash when you need:

- **System-level** automation and administration
- **CI/CD pipeline** scripts and automation
- **Text processing** and log analysis
- **Infrastructure** provisioning and management
- **Lightweight** automation without additional dependencies

Bash remains the backbone of Unix system administration and is indispensable for DevOps workflows on Linux systems.

**What You've Achieved:**
✅ Created comprehensive system monitoring scripts  
✅ Built Docker container management automation  
✅ Implemented CI/CD deployment pipelines  
✅ Established error handling and logging practices  
✅ Developed production-ready automation scripts
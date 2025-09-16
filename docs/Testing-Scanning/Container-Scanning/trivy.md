---
sidebar_position: 1
title: Trivy
description: Trivy is a comprehensive security scanner for containers, filesystems, and infrastructure as code. Learn how to integrate Trivy into your CI/CD pipeline for automated vulnerability scanning.
slug: /TestingScanning/Trivy
keywords:
  - Trivy
  - container scanning
  - vulnerability scanner
  - Docker security
  - IaC scanning
  - DevSecOps
  - security automation
  - CVE scanning
  - Kubernetes security
  - infrastructure scanning
---

# 🛡️ Trivy Container & Infrastructure Security Scanner

**Trivy** is a comprehensive **security scanner** that detects **vulnerabilities** in **containers**, **filesystems**, and **infrastructure as code**. Perfect for **DevSecOps** workflows with support for **Docker images**, **Kubernetes manifests**, **Terraform**, and more.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Docker** installed for container scanning
- **Git** for repository scanning
- **Kubernetes** (optional, for K8s scanning)
- **Terraform** (optional, for IaC scanning)
- **CI/CD pipeline** for automation

---

## 🔧 Step 1: Install Trivy

### Option 1: Install via Package Manager

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# CentOS/RHEL/Fedora
sudo vim /etc/yum.repos.d/trivy.repo
# Add:
# [trivy]
# name=Trivy repository
# baseurl=https://aquasecurity.github.io/trivy-repo/rpm/releases/$basearch/
# gpgcheck=0
# enabled=1
sudo yum -y update
sudo yum -y install trivy

# macOS
brew install trivy
```

### Option 2: Download Binary

```bash
# Download latest release
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Verify installation
trivy --version
```

### Option 3: Use Docker

```bash
# Create alias for Docker-based usage
alias trivy='docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $HOME/Library/Caches:/root/.cache/ aquasec/trivy'
```

---

## 🏗️ Step 2: Basic Container Scanning

### Scan Docker Images

```bash
# Scan a public image
trivy image nginx:latest

# Scan with specific severity levels
trivy image --severity HIGH,CRITICAL nginx:latest

# Scan and output to JSON
trivy image --format json --output nginx-scan.json nginx:latest

# Scan local Docker image
docker build -t myapp:latest .
trivy image myapp:latest

# Scan with exit code on vulnerabilities
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
```

### Sample Output Analysis

```bash
# Example Trivy output
nginx:latest (debian 11.6)
==========================
Total: 145 (UNKNOWN: 0, LOW: 109, MEDIUM: 24, HIGH: 11, CRITICAL: 1)

┌─────────────────────────┬────────────────┬──────────┬───────────────────┬───────────────┬─────────────────────────────────────────────────────────┐
│        Library          │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │                         Title                           │
├─────────────────────────┼────────────────┼──────────┼───────────────────┼───────────────┼─────────────────────────────────────────────────────────┤
│ apt                     │ CVE-2011-3374  │ LOW      │ 2.2.4             │               │ It was found that apt-key in apt, all versions, do not │
│                         │                │          │                   │               │ correctly...                                            │
├─────────────────────────┼────────────────┼──────────┼───────────────────┼───────────────┼─────────────────────────────────────────────────────────┤
│ bash                    │ CVE-2022-3715  │ HIGH     │ 5.1-2+deb11u1     │               │ bash: a heap-buffer-overflow in valid_parameter_transform │
├─────────────────────────┼────────────────┼──────────┼───────────────────┼───────────────┼─────────────────────────────────────────────────────────┤
│ openssl                 │ CVE-2023-0286  │ CRITICAL │ 1.1.1n-0+deb11u4  │ 1.1.1n-0+deb11u5 │ openssl: X.400 address type confusion in X.509 GeneralName │
└─────────────────────────┴────────────────┴──────────┴───────────────────┴───────────────┴─────────────────────────────────────────────────────────┘
```

---

## ▶️ Step 3: Advanced Scanning Options

### Filesystem Scanning

```bash
# Scan current directory
trivy fs .

# Scan specific directory with custom patterns
trivy fs --skip-dirs node_modules,vendor --skip-files "*.test.js" ./src

# Scan for secrets and misconfigurations
trivy fs --scanners vuln,secret,config .

# Generate detailed report
trivy fs --format table --output filesystem-report.txt .
```

### Repository Scanning

```bash
# Scan remote Git repository
trivy repo https://github.com/your-org/your-repo

# Scan specific branch or commit
trivy repo --branch develop https://github.com/your-org/your-repo
trivy repo --commit abc123 https://github.com/your-org/your-repo

# Scan with authentication
trivy repo --username your-username --password your-token https://github.com/private-org/private-repo
```

### Infrastructure as Code Scanning

```bash
# Scan Terraform files
trivy config terraform/

# Scan Kubernetes manifests
trivy config k8s/

# Scan Docker Compose files
trivy config docker-compose.yml

# Scan CloudFormation templates
trivy config cloudformation/

# Custom policy scanning
trivy config --policy custom-policies/ infrastructure/
```

---

## 📊 Step 4: CI/CD Integration

### GitHub Actions Integration

`Create .github/workflows/trivy-scan.yml:`
```yaml
name: Trivy Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly scan

jobs:
  trivy-scan:
    name: Trivy Security Scan
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      security-events: write
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Build Docker image
        run: |
          docker build -t ${{ github.repository }}:${{ github.sha }} .
          
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ github.repository }}:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Run Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'table'
          output: 'trivy-fs-results.txt'
          
      - name: Run Trivy config scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: '.'
          format: 'table'
          output: 'trivy-config-results.txt'
          
      - name: Upload scan results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: trivy-scan-results
          path: |
            trivy-results.sarif
            trivy-fs-results.txt
            trivy-config-results.txt
            
      - name: Fail on high/critical vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ github.repository }}:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
```

### Jenkins Integration

`Add to Jenkinsfile:`
```groovy
pipeline {
    agent any
    
    environment {
        IMAGE_NAME = "${env.JOB_NAME}:${env.BUILD_NUMBER}"
        TRIVY_CACHE_DIR = "/tmp/trivy-cache"
    }
    
    stages {
        stage('Build') {
            steps {
                script {
                    docker.build(IMAGE_NAME)
                }
            }
        }
        
        stage('Trivy Scan') {
            parallel {
                stage('Container Scan') {
                    steps {
                        script {
                            sh """
                                mkdir -p ${TRIVY_CACHE_DIR}
                                trivy image --cache-dir ${TRIVY_CACHE_DIR} \
                                    --format json \
                                    --output trivy-container-report.json \
                                    --severity HIGH,CRITICAL \
                                    ${IMAGE_NAME}
                            """
                        }
                    }
                }
                
                stage('Filesystem Scan') {
                    steps {
                        sh """
                            trivy fs --cache-dir ${TRIVY_CACHE_DIR} \
                                --format json \
                                --output trivy-fs-report.json \
                                --severity HIGH,CRITICAL \
                                .
                        """
                    }
                }
                
                stage('Config Scan') {
                    steps {
                        sh """
                            trivy config --cache-dir ${TRIVY_CACHE_DIR} \
                                --format json \
                                --output trivy-config-report.json \
                                .
                        """
                    }
                }
            }
        }
        
        stage('Process Results') {
            steps {
                script {
                    // Parse JSON results and fail if critical vulnerabilities found
                    def containerReport = readJSON file: 'trivy-container-report.json'
                    def fsReport = readJSON file: 'trivy-fs-report.json'
                    
                    def criticalVulns = 0
                    def highVulns = 0
                    
                    // Count vulnerabilities
                    containerReport.Results?.each { result ->
                        result.Vulnerabilities?.each { vuln ->
                            if (vuln.Severity == 'CRITICAL') criticalVulns++
                            if (vuln.Severity == 'HIGH') highVulns++
                        }
                    }
                    
                    echo "Found ${criticalVulns} critical and ${highVulns} high severity vulnerabilities"
                    
                    // Fail build if critical vulnerabilities found
                    if (criticalVulns > 0) {
                        error("Build failed due to ${criticalVulns} critical vulnerabilities")
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'trivy-*.json', allowEmptyArchive: true
            
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'trivy-*.json',
                reportName: 'Trivy Security Report'
            ])
        }
        
        failure {
            emailext(
                subject: "Security Scan Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                    Security scan failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}.
                    
                    Please check the Trivy security report for details:
                    ${env.BUILD_URL}Trivy_Security_Report/
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL}, security@company.com"
            )
        }
    }
}
```

### GitLab CI Integration

`Add to .gitlab-ci.yml:`
```yaml
stages:
  - build
  - security-scan
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG

trivy-container-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy image --format template --template "@contrib/gitlab.tpl" --output gl-container-scanning-report.json $IMAGE_TAG
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json
  dependencies:
    - build

trivy-fs-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy fs --format template --template "@contrib/gitlab-sast.tpl" --output gl-sast-report.json .
  artifacts:
    reports:
      sast: gl-sast-report.json

trivy-iac-scan:
  stage: security-scan
  image: aquasec/trivy:latest
  script:
    - trivy config --format template --template "@contrib/gitlab.tpl" --output gl-iac-report.json .
  artifacts:
    reports:
      container_scanning: gl-iac-report.json
  allow_failure: true
```

---

## 🔧 Step 5: Custom Policies and Rules

### Create Custom Policies

`Create custom-policies/dockerfile.rego:`
```rego
# METADATA
# title: "Custom Dockerfile Security Policy"
# description: "Custom rules for Dockerfile security"
# scope: package
# schemas:
# - input: schema["dockerfile"]
# custom:
#   id: CUSTOM-001
#   avd_id: CUSTOM-001
#   severity: HIGH
#   short_code: no-root-user
#   recommended_action: "Use non-root user"

package dockerfile.custom.no_root_user

import rego.v1

deny contains res if {
    input.Stages[_].Commands[_].Cmd == "user"
    input.Stages[_].Commands[_].Value[_] == "root"
    
    res := {
        "msg": "Container should not run as root user",
        "startline": input.Stages[_].Commands[_].StartLine,
        "endline": input.Stages[_].Commands[_].EndLine,
    }
}
```

`Create custom-policies/kubernetes.rego:`
```rego
# METADATA
# title: "Custom Kubernetes Security Policy"
# description: "Custom rules for Kubernetes security"
# scope: package
# schemas:
# - input: schema["kubernetes"]
# custom:
#   id: CUSTOM-K8S-001
#   avd_id: CUSTOM-K8S-001
#   severity: MEDIUM
#   short_code: require-resource-limits
#   recommended_action: "Set resource limits"

package kubernetes.custom.resource_limits

import rego.v1

deny contains res if {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.limits
    
    res := {
        "msg": sprintf("Container '%s' should have resource limits defined", [container.name]),
    }
}
```

### Use Custom Policies

```bash
# Scan with custom policies
trivy config --policy custom-policies/ .

# Combine built-in and custom policies
trivy config --policy custom-policies/ --policy @builtin .
```

---

## 📊 Step 6: Advanced Reporting and Analysis

### Generate Comprehensive Reports

```bash
#!/bin/bash
# comprehensive-scan.sh

PROJECT_NAME="myapp"
IMAGE_NAME="myapp:latest"
REPORT_DIR="security-reports"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $REPORT_DIR

echo "🔍 Starting comprehensive security scan for $PROJECT_NAME..."

# Container vulnerability scan
echo "📦 Scanning container image..."
trivy image --format json --output $REPORT_DIR/container-vulns-$DATE.json $IMAGE_NAME
trivy image --format table --output $REPORT_DIR/container-vulns-$DATE.txt $IMAGE_NAME

# Filesystem scan
echo "📁 Scanning filesystem..."
trivy fs --format json --output $REPORT_DIR/fs-vulns-$DATE.json .
trivy fs --format table --output $REPORT_DIR/fs-vulns-$DATE.txt .

# Configuration scan
echo "⚙️ Scanning configurations..."
trivy config --format json --output $REPORT_DIR/config-issues-$DATE.json .
trivy config --format table --output $REPORT_DIR/config-issues-$DATE.txt .

# Secret scan
echo "🔐 Scanning for secrets..."
trivy fs --scanners secret --format json --output $REPORT_DIR/secrets-$DATE.json .
trivy fs --scanners secret --format table --output $REPORT_DIR/secrets-$DATE.txt .

# Generate summary report
echo "📊 Generating summary report..."
python3 generate_summary.py $REPORT_DIR $DATE

echo "✅ Scan complete! Reports saved in $REPORT_DIR/"
```

### Python Report Generator

`Create generate_summary.py:`
```python
#!/usr/bin/env python3
import json
import sys
import os
from datetime import datetime

def analyze_trivy_report(report_path):
    """Analyze Trivy JSON report and extract key metrics"""
    
    if not os.path.exists(report_path):
        return {"error": f"Report not found: {report_path}"}
    
    with open(report_path, 'r') as f:
        data = json.load(f)
    
    vulnerabilities = {
        'CRITICAL': 0,
        'HIGH': 0,
        'MEDIUM': 0,
        'LOW': 0,
        'UNKNOWN': 0
    }
    
    total_vulns = 0
    packages_affected = set()
    
    # Process results
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities', []):
            severity = vuln.get('Severity', 'UNKNOWN')
            vulnerabilities[severity] += 1
            total_vulns += 1
            packages_affected.add(vuln.get('PkgName', 'unknown'))
    
    return {
        'total_vulnerabilities': total_vulns,
        'by_severity': vulnerabilities,
        'packages_affected': len(packages_affected),
        'critical_and_high': vulnerabilities['CRITICAL'] + vulnerabilities['HIGH']
    }

def generate_summary_report(report_dir, date_suffix):
    """Generate comprehensive summary report"""
    
    # Analyze different scan types
    container_report = analyze_trivy_report(f"{report_dir}/container-vulns-{date_suffix}.json")
    fs_report = analyze_trivy_report(f"{report_dir}/fs-vulns-{date_suffix}.json")
    config_report = analyze_trivy_report(f"{report_dir}/config-issues-{date_suffix}.json")
    
    # Generate HTML report
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Security Scan Summary - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
            .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
            .critical {{ color: #d32f2f; font-weight: bold; }}
            .high {{ color: #f57c00; font-weight: bold; }}
            .medium {{ color: #fbc02d; font-weight: bold; }}
            .low {{ color: #388e3c; }}
            .metric {{ display: inline-block; margin: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 3px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🛡️ Security Scan Summary</h1>
            <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="section">
            <h2>📦 Container Image Scan</h2>
            <div class="metric">Total Vulnerabilities: <strong>{container_report.get('total_vulnerabilities', 0)}</strong></div>
            <div class="metric critical">Critical: {container_report.get('by_severity', {}).get('CRITICAL', 0)}</div>
            <div class="metric high">High: {container_report.get('by_severity', {}).get('HIGH', 0)}</div>
            <div class="metric medium">Medium: {container_report.get('by_severity', {}).get('MEDIUM', 0)}</div>
            <div class="metric low">Low: {container_report.get('by_severity', {}).get('LOW', 0)}</div>
            <div class="metric">Packages Affected: {container_report.get('packages_affected', 0)}</div>
        </div>
        
        <div class="section">
            <h2>📁 Filesystem Scan</h2>
            <div class="metric">Total Vulnerabilities: <strong>{fs_report.get('total_vulnerabilities', 0)}</strong></div>
            <div class="metric critical">Critical: {fs_report.get('by_severity', {}).get('CRITICAL', 0)}</div>
            <div class="metric high">High: {fs_report.get('by_severity', {}).get('HIGH', 0)}</div>
            <div class="metric medium">Medium: {fs_report.get('by_severity', {}).get('MEDIUM', 0)}</div>
            <div class="metric low">Low: {fs_report.get('by_severity', {}).get('LOW', 0)}</div>
        </div>
        
        <div class="section">
            <h2>⚙️ Configuration Issues</h2>
            <div class="metric">Total Issues: <strong>{config_report.get('total_vulnerabilities', 0)}</strong></div>
            <div class="metric critical">Critical: {config_report.get('by_severity', {}).get('CRITICAL', 0)}</div>
            <div class="metric high">High: {config_report.get('by_severity', {}).get('HIGH', 0)}</div>
            <div class="metric medium">Medium: {config_report.get('by_severity', {}).get('MEDIUM', 0)}</div>
        </div>
        
        <div class="section">
            <h2>🎯 Risk Assessment</h2>
            <p><strong>Overall Risk Level:</strong> 
            {"🔴 HIGH RISK" if (container_report.get('critical_and_high', 0) + fs_report.get('critical_and_high', 0)) > 10 
             else "🟡 MEDIUM RISK" if (container_report.get('critical_and_high', 0) + fs_report.get('critical_and_high', 0)) > 5 
             else "🟢 LOW RISK"}
            </p>
            
            <h3>📋 Recommendations:</h3>
            <ul>
                {"<li>🚨 Immediate action required: Fix critical vulnerabilities</li>" if container_report.get('by_severity', {}).get('CRITICAL', 0) > 0 else ""}
                {"<li>⚠️ Update base image to address container vulnerabilities</li>" if container_report.get('total_vulnerabilities', 0) > 0 else ""}
                {"<li>🔧 Review and fix configuration issues</li>" if config_report.get('total_vulnerabilities', 0) > 0 else ""}
                <li>📅 Schedule regular security scans</li>
                <li>🔄 Integrate security scanning into CI/CD pipeline</li>
            </ul>
        </div>
    </body>
    </html>
    """
    
    # Save HTML report
    with open(f"{report_dir}/security-summary-{date_suffix}.html", 'w') as f:
        f.write(html_content)
    
    print(f"📊 Summary report generated: {report_dir}/security-summary-{date_suffix}.html")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 generate_summary.py <report_dir> <date_suffix>")
        sys.exit(1)
    
    report_dir = sys.argv[1]
    date_suffix = sys.argv[2]
    
    generate_summary_report(report_dir, date_suffix)
```

---

## 🔍 Step 7: Kubernetes Security Scanning

### Scan Running Kubernetes Cluster

```bash
# Install trivy-operator for continuous scanning
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/trivy-operator/main/deploy/static/trivy-operator.yaml

# Scan specific namespace
trivy k8s --report summary namespace/default

# Scan entire cluster
trivy k8s --report all cluster

# Scan specific workload
trivy k8s deployment/myapp

# Generate detailed report
trivy k8s --format json --output k8s-security-report.json cluster
```

### Kubernetes Manifest Scanning

```bash
# Scan Kubernetes YAML files
trivy config k8s/

# Scan with specific policies
trivy config --policy k8s-security-policies/ k8s/

# Check for CIS Kubernetes Benchmark compliance
trivy k8s --compliance k8s-cis cluster
```

---

## 🛡️ Step 8: Security Best Practices

### Dockerfile Security Scanning

`Create secure Dockerfile:`
```dockerfile
# Use specific version tags
FROM node:18.17.0-alpine3.18

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

`Scan Dockerfile:`
```bash
# Scan Dockerfile for security issues
trivy config Dockerfile

# Scan with custom policies
trivy config --policy dockerfile-policies/ Dockerfile
```

### Ignore Files and Suppressions

`Create .trivyignore file:`
```bash
# Ignore specific CVEs
CVE-2021-12345
CVE-2021-67890

# Ignore by package
npm:lodash

# Ignore by file path
**/test/**
**/node_modules/**

# Ignore by severity
LOW
```

---

## 📈 Step 9: Monitoring and Alerting

### Automated Vulnerability Monitoring

```bash
#!/bin/bash
# vulnerability-monitor.sh

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
IMAGE_NAME="myapp:latest"
THRESHOLD_CRITICAL=0
THRESHOLD_HIGH=5

# Run scan
trivy image --format json --output scan-results.json $IMAGE_NAME

# Parse results
CRITICAL=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' scan-results.json)
HIGH=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' scan-results.json)

# Check thresholds and alert
if [ "$CRITICAL" -gt "$THRESHOLD_CRITICAL" ] || [ "$HIGH" -gt "$THRESHOLD_HIGH" ]; then
    MESSAGE="🚨 Security Alert: $IMAGE_NAME has $CRITICAL critical and $HIGH high severity vulnerabilities"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}" \
        $SLACK_WEBHOOK
        
    echo "Alert sent: $MESSAGE"
else
    echo "✅ Security scan passed: $CRITICAL critical, $HIGH high vulnerabilities"
fi
```

---

## 📋 Common Use Cases

### 1. **Container Security Pipeline**
- Automated image scanning before deployment
- Vulnerability tracking and remediation
- Compliance reporting
- Security gate enforcement

### 2. **Infrastructure Security**
- IaC security validation
- Kubernetes security posture
- Configuration drift detection
- Policy compliance checking

### 3. **Developer Security**
- IDE integration for early detection
- Pre-commit security checks
- Security training and awareness
- Vulnerability remediation guidance

### 4. **Enterprise Security**
- Centralized vulnerability management
- Risk assessment and reporting
- Compliance automation
- Security metrics and KPIs

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🔍 Comprehensive Scanning** - Container, filesystem, and IaC vulnerability detection
2. **🔄 CI/CD Integration** - Automated security scanning in your development pipeline
3. **📊 Detailed Reporting** - Comprehensive security reports and metrics
4. **🛡️ Policy Enforcement** - Custom security policies and compliance checking
5. **⚡ Real-time Monitoring** - Continuous security monitoring and alerting
6. **🎯 Risk Management** - Prioritized vulnerability remediation and risk assessment

✅ **Trivy is now configured and ready to secure your containers and infrastructure!**
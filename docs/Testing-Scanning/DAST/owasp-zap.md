---
sidebar_position: 1
title: OWASP ZAP
description: OWASP ZAP (Zed Attack Proxy) is a free, open-source web application security scanner. Learn how to dockerize and run OWASP ZAP for dynamic security testing.
slug: /Testing-Scanning/OWASP-ZAP
keywords:
  - OWASP ZAP
  - dynamic security testing
  - DAST
  - web application security
  - penetration testing
  - security scanning
  - vulnerability assessment
  - automated security testing
  - web security
  - OWASP
---

# 🛡️ OWASP ZAP - Dynamic Application Security Testing

**OWASP ZAP** (Zed Attack Proxy) is one of the world's most popular **free security tools** and is actively maintained by hundreds of international volunteers. It helps you automatically find security vulnerabilities in your web applications while developing and testing.

---

## Set Up OWASP ZAP with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  zap:
    image: owasp/zap2docker-stable:latest
    container_name: owasp-zap
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8090:8090"
    volumes:
      - zap-data:/zap/wrk
      - ./reports:/zap/wrk/reports
      - ./scripts:/zap/wrk/scripts
    environment:
      - ZAP_PORT=8080
    command: zap-webswing.sh
    networks:
      - zap-network

  # Target application for testing
  target-app:
    image: webgoat/goatandwolf:latest
    container_name: target-app
    ports:
      - "8081:8080"
    networks:
      - zap-network

volumes:
  zap-data:

networks:
  zap-network:
    driver: bridge
```

`Start OWASP ZAP:`
```bash
docker compose up -d
```

`Access ZAP Web Interface:`
```bash
# Open browser to http://localhost:8090
echo "ZAP Web Interface: http://localhost:8090"
```

---

## Command Line Usage

### Basic Scanning

`Quick baseline scan:`
```bash
docker run --rm -v $(pwd)/reports:/zap/wrk \
  owasp/zap2docker-stable:latest \
  zap-baseline.py -t https://example.com -r baseline-report.html
```

`Full scan with authentication:`
```bash
docker run --rm -v $(pwd)/reports:/zap/wrk \
  owasp/zap2docker-stable:latest \
  zap-full-scan.py -t https://example.com \
  -r full-scan-report.html \
  -a -j -x xml-report.xml
```

### API Scanning

`Scan REST API with OpenAPI spec:`
```bash
docker run --rm -v $(pwd)/reports:/zap/wrk \
  -v $(pwd)/api-spec.json:/zap/wrk/api-spec.json \
  owasp/zap2docker-stable:latest \
  zap-api-scan.py -t https://api.example.com \
  -f openapi -r api-scan-report.html \
  -d /zap/wrk/api-spec.json
```

---

## Automated Scanning Scripts

### Python Integration

`Create zap_scanner.py:`
```python
#!/usr/bin/env python3
import time
import requests
from zapv2 import ZAPv2

class ZAPScanner:
    def __init__(self, proxy_host='localhost', proxy_port=8080):
        self.zap = ZAPv2(proxies={
            'http': f'http://{proxy_host}:{proxy_port}',
            'https': f'http://{proxy_host}:{proxy_port}'
        })
        
    def start_scan(self, target_url):
        """Start a comprehensive security scan"""
        print(f"Starting scan for: {target_url}")
        
        # Spider the target
        print("Starting spider...")
        scan_id = self.zap.spider.scan(target_url)
        
        # Wait for spider to complete
        while int(self.zap.spider.status(scan_id)) < 100:
            print(f"Spider progress: {self.zap.spider.status(scan_id)}%")
            time.sleep(2)
        
        print("Spider completed")
        
        # Start active scan
        print("Starting active scan...")
        scan_id = self.zap.ascan.scan(target_url)
        
        # Wait for active scan to complete
        while int(self.zap.ascan.status(scan_id)) < 100:
            print(f"Active scan progress: {self.zap.ascan.status(scan_id)}%")
            time.sleep(5)
        
        print("Active scan completed")
        
    def get_alerts(self, risk_level='High'):
        """Get security alerts"""
        alerts = self.zap.core.alerts()
        high_risk_alerts = [alert for alert in alerts if alert['risk'] == risk_level]
        return high_risk_alerts
    
    def generate_report(self, format='HTML'):
        """Generate security report"""
        if format.upper() == 'HTML':
            return self.zap.core.htmlreport()
        elif format.upper() == 'XML':
            return self.zap.core.xmlreport()
        elif format.upper() == 'JSON':
            return self.zap.core.jsonreport()
    
    def save_report(self, report_content, filename):
        """Save report to file"""
        with open(filename, 'w') as f:
            f.write(report_content)
        print(f"Report saved to: {filename}")

# Usage example
if __name__ == "__main__":
    scanner = ZAPScanner()
    target = "http://target-app:8080"
    
    # Start comprehensive scan
    scanner.start_scan(target)
    
    # Get high-risk alerts
    alerts = scanner.get_alerts('High')
    print(f"Found {len(alerts)} high-risk vulnerabilities")
    
    # Generate and save reports
    html_report = scanner.generate_report('HTML')
    scanner.save_report(html_report, 'security-report.html')
    
    json_report = scanner.generate_report('JSON')
    scanner.save_report(json_report, 'security-report.json')
```

`Run the scanner:`
```bash
pip install python-owasp-zap-v2.4
python zap_scanner.py
```

---

## CI/CD Integration

### GitHub Actions Integration

`Create .github/workflows/security-scan.yml:`
```yaml
name: Security Scan with OWASP ZAP

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    services:
      zap:
        image: owasp/zap2docker-stable:latest
        ports:
          - 8080:8080
        options: >-
          --health-cmd "curl -f http://localhost:8080 || exit 1"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and start application
      run: |
        docker build -t test-app .
        docker run -d -p 3000:3000 --name test-app test-app
        sleep 30
    
    - name: Run ZAP Baseline Scan
      run: |
        docker run --rm --network host \
          -v ${{ github.workspace }}/reports:/zap/wrk \
          owasp/zap2docker-stable:latest \
          zap-baseline.py -t http://localhost:3000 \
          -r baseline-report.html \
          -x baseline-report.xml
    
    - name: Run ZAP Full Scan
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      run: |
        docker run --rm --network host \
          -v ${{ github.workspace }}/reports:/zap/wrk \
          owasp/zap2docker-stable:latest \
          zap-full-scan.py -t http://localhost:3000 \
          -r full-scan-report.html \
          -x full-scan-report.xml
    
    - name: Upload ZAP Reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: zap-reports
        path: reports/
    
    - name: Parse ZAP Results
      run: |
        if [ -f "reports/baseline-report.xml" ]; then
          HIGH_ALERTS=$(grep -c 'riskcode="3"' reports/baseline-report.xml || echo "0")
          MEDIUM_ALERTS=$(grep -c 'riskcode="2"' reports/baseline-report.xml || echo "0")
          
          echo "High Risk Alerts: $HIGH_ALERTS"
          echo "Medium Risk Alerts: $MEDIUM_ALERTS"
          
          if [ "$HIGH_ALERTS" -gt "0" ]; then
            echo "❌ High risk vulnerabilities found!"
            exit 1
          fi
        fi
```

### Jenkins Pipeline

`Create Jenkinsfile:`
```groovy
pipeline {
    agent any
    
    environment {
        ZAP_PORT = '8080'
        TARGET_URL = 'http://localhost:3000'
    }
    
    stages {
        stage('Build Application') {
            steps {
                script {
                    sh 'docker build -t test-app .'
                    sh 'docker run -d -p 3000:3000 --name test-app test-app'
                    sleep(30)
                }
            }
        }
        
        stage('Start ZAP') {
            steps {
                script {
                    sh '''
                        docker run -d --name zap \
                            -p 8080:8080 \
                            -v $(pwd)/reports:/zap/wrk \
                            owasp/zap2docker-stable:latest \
                            zap.sh -daemon -host 0.0.0.0 -port 8080
                    '''
                    sleep(30)
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Baseline Scan') {
                    steps {
                        sh '''
                            docker exec zap zap-baseline.py \
                                -t ${TARGET_URL} \
                                -r baseline-report.html \
                                -x baseline-report.xml
                        '''
                    }
                }
                
                stage('API Scan') {
                    when {
                        fileExists 'api-spec.json'
                    }
                    steps {
                        sh '''
                            docker cp api-spec.json zap:/zap/wrk/
                            docker exec zap zap-api-scan.py \
                                -t ${TARGET_URL} \
                                -f openapi \
                                -r api-scan-report.html \
                                -d /zap/wrk/api-spec.json
                        '''
                    }
                }
            }
        }
        
        stage('Generate Reports') {
            steps {
                sh 'docker cp zap:/zap/wrk/reports ./reports'
                
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: '*.html',
                    reportName: 'ZAP Security Report'
                ])
            }
        }
    }
    
    post {
        always {
            sh 'docker stop test-app zap || true'
            sh 'docker rm test-app zap || true'
        }
        
        failure {
            emailext (
                subject: "Security Scan Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Security vulnerabilities found. Check the ZAP report for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

---

## Advanced Configuration

### Custom ZAP Configuration

`Create zap-config.xml:`
```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<configuration>
    <scanner>
        <level>MEDIUM</level>
        <strength>MEDIUM</strength>
    </scanner>
    
    <spider>
        <maxDepth>5</maxDepth>
        <maxChildren>10</maxChildren>
        <acceptCookies>true</acceptCookies>
        <handleParameters>true</handleParameters>
    </spider>
    
    <authentication>
        <type>form</type>
        <loginUrl>http://localhost:3000/login</loginUrl>
        <usernameField>username</usernameField>
        <passwordField>password</passwordField>
        <username>testuser</username>
        <password>testpass</password>
    </authentication>
    
    <session>
        <management>cookie</management>
    </session>
</configuration>
```

### ZAP Automation Framework

`Create automation.yaml:`
```yaml
env:
  contexts:
    - name: "test-context"
      urls:
        - "http://localhost:3000"
      includePaths:
        - "http://localhost:3000/.*"
      excludePaths:
        - "http://localhost:3000/logout"
        - "http://localhost:3000/admin/.*"

jobs:
  - type: spider
    parameters:
      context: "test-context"
      maxDuration: 10
      maxDepth: 5
      
  - type: activeScan
    parameters:
      context: "test-context"
      maxDuration: 20
      
  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "/zap/wrk/reports"
      reportFile: "automation-report.html"
```

`Run with automation framework:`
```bash
docker run --rm -v $(pwd)/reports:/zap/wrk/reports \
  -v $(pwd)/automation.yaml:/zap/wrk/automation.yaml \
  owasp/zap2docker-stable:latest \
  zap.sh -cmd -autorun /zap/wrk/automation.yaml
```

---

## Security Testing Best Practices

### Comprehensive Scan Strategy

```bash
#!/bin/bash
# comprehensive-scan.sh

TARGET_URL="$1"
REPORT_DIR="./reports"

if [ -z "$TARGET_URL" ]; then
    echo "Usage: $0 <target-url>"
    exit 1
fi

mkdir -p $REPORT_DIR

echo "Starting comprehensive security scan for: $TARGET_URL"

# 1. Quick baseline scan
echo "Running baseline scan..."
docker run --rm -v $(pwd)/reports:/zap/wrk \
  owasp/zap2docker-stable:latest \
  zap-baseline.py -t $TARGET_URL \
  -r baseline-report.html \
  -x baseline-report.xml

# 2. Full active scan
echo "Running full active scan..."
docker run --rm -v $(pwd)/reports:/zap/wrk \
  owasp/zap2docker-stable:latest \
  zap-full-scan.py -t $TARGET_URL \
  -r full-scan-report.html \
  -x full-scan-report.xml

# 3. API scan if OpenAPI spec exists
if [ -f "api-spec.json" ]; then
    echo "Running API scan..."
    docker run --rm -v $(pwd)/reports:/zap/wrk \
      -v $(pwd)/api-spec.json:/zap/wrk/api-spec.json \
      owasp/zap2docker-stable:latest \
      zap-api-scan.py -t $TARGET_URL \
      -f openapi -r api-scan-report.html \
      -d /zap/wrk/api-spec.json
fi

echo "Scan completed. Reports available in: $REPORT_DIR"
```

---

## Common Use Cases

- **Web Application Security Testing**: Comprehensive vulnerability assessment
- **API Security Testing**: REST and GraphQL API security validation
- **CI/CD Integration**: Automated security testing in development pipelines
- **Penetration Testing**: Manual security testing with proxy capabilities
- **Compliance Testing**: OWASP Top 10 and security standard compliance

✅ OWASP ZAP is now configured for comprehensive dynamic security testing!
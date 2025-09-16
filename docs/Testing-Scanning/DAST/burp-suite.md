---
sidebar_position: 2
title: Burp Suite
description: Burp Suite is a comprehensive web application security testing platform. Learn how to use Burp Suite for dynamic security testing and penetration testing.
slug: /Testing-Scanning/BurpSuite
keywords:
  - Burp Suite
  - web application security
  - penetration testing
  - DAST
  - security testing
  - vulnerability scanner
  - web security
  - PortSwigger
  - security assessment
  - automated scanning
---

# 🔍 Burp Suite - Comprehensive Web Application Security Testing

**Burp Suite** is a comprehensive **web application security testing platform** developed by PortSwigger. It provides powerful tools for **manual and automated security testing**, **vulnerability scanning**, and **penetration testing** of web applications.

---

## Set Up Burp Suite with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  burp-suite:
    image: portswigger/burp-suite-professional:latest
    container_name: burp-suite
    restart: unless-stopped
    ports:
      - "8080:8080"  # Proxy port
      - "1337:1337"  # Web interface
    volumes:
      - burp-data:/home/burp/.BurpSuite
      - ./burp-config:/home/burp/config
      - ./reports:/home/burp/reports
      - ./extensions:/home/burp/extensions
    environment:
      - BURP_LICENSE_KEY=${BURP_LICENSE_KEY}
      - DISPLAY=:99
    command: ["--project-file=/home/burp/config/project.burp", "--config-file=/home/burp/config/burp-config.json"]

  # VNC server for GUI access
  burp-vnc:
    image: portswigger/burp-suite-professional:latest
    container_name: burp-vnc
    restart: unless-stopped
    ports:
      - "5900:5900"  # VNC port
      - "6080:6080"  # noVNC web interface
    volumes:
      - burp-data:/home/burp/.BurpSuite
    environment:
      - VNC_PASSWORD=burppassword
    command: ["vnc"]

  # Target application for testing
  dvwa:
    image: vulnerables/web-dvwa:latest
    container_name: dvwa-target
    restart: unless-stopped
    ports:
      - "8081:80"
    environment:
      - MYSQL_HOSTNAME=dvwa-db
      - MYSQL_DATABASE=dvwa
      - MYSQL_USERNAME=dvwa
      - MYSQL_PASSWORD=p@ssw0rd
    depends_on:
      - dvwa-db

  dvwa-db:
    image: mysql:5.7
    container_name: dvwa-db
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=dvwa
      - MYSQL_USER=dvwa
      - MYSQL_PASSWORD=p@ssw0rd
    volumes:
      - dvwa-db-data:/var/lib/mysql

volumes:
  burp-data:
  dvwa-db-data:
```

`Create .env file:`
```env
BURP_LICENSE_KEY=your_burp_license_key_here
```

`Start Burp Suite:`
```bash
docker compose up -d
```

`Access Burp Suite:`
```bash
echo "Burp Suite VNC: http://localhost:6080"
echo "Target Application: http://localhost:8081"
```

---

## Burp Suite Configuration

### Basic Configuration

`Create burp-config/burp-config.json:`
```json
{
  "proxy": {
    "request_listeners": [
      {
        "certificate_mode": "per_host",
        "listen_mode": "all_interfaces",
        "listen_port": 8080,
        "listen_specific_address": "",
        "running": true
      }
    ],
    "response_modification": {
      "enable_response_streaming": true,
      "strip_proxyserver_headers": false,
      "unhide_hidden_form_fields": false
    },
    "ssl_negotiation": {
      "disable_ssl_negotiation": false,
      "automatically_suggest_hostname_on_certificate_error": true
    }
  },
  "scanner": {
    "live_scanning": {
      "live_audit": {
        "audit_mode": "thorough",
        "consolidate_passive_issues": true,
        "make_unencrypted_requests": true,
        "scan_accuracy": "normal",
        "scan_speed": "normal"
      },
      "live_passive_crawl": {
        "max_link_depth": 5,
        "max_unique_locations_per_base_request": 500
      }
    },
    "attack_insertion_points": {
      "use_param_names": true,
      "use_param_values": true,
      "use_cookies": true,
      "use_headers": true,
      "skip_parameters_with_unbounded_values": true
    },
    "issues_reported": {
      "scan_accuracy": "normal",
      "report_false_positives": "low"
    }
  },
  "intruder": {
    "attack_results": {
      "store_requests": true,
      "store_responses": true,
      "make_unencrypted_requests": true
    },
    "payloads": {
      "maximum_concurrent_attacks": 10,
      "attack_delay": 0,
      "throttle_between_requests": 0
    }
  },
  "repeater": {
    "response_rendering": {
      "render_responses": true,
      "allow_unsafe_response_rendering": false
    }
  }
}
```

### Project Configuration

`Create burp-config/project.burp:`
```json
{
  "target": {
    "scope": {
      "advanced_mode": true,
      "exclude": [
        {
          "enabled": true,
          "file": "^/logout$",
          "host": ".*",
          "port": "^80$|^443$",
          "protocol": "any"
        }
      ],
      "include": [
        {
          "enabled": true,
          "file": ".*",
          "host": "^localhost$|^127\\.0\\.0\\.1$|^dvwa-target$",
          "port": "^80$|^8081$|^443$",
          "protocol": "any"
        }
      ]
    }
  },
  "scanner": {
    "scan_configurations": [
      {
        "name": "Comprehensive Scan",
        "type": "named_configuration",
        "built_in_configuration": "crawl_and_audit"
      }
    ]
  }
}
```

---

## Automated Scanning Scripts

### Python API Integration

`Create scripts/burp-api-scanner.py:`
```python
#!/usr/bin/env python3
import requests
import json
import time
import base64
from urllib.parse import urljoin

class BurpSuiteAPI:
    def __init__(self, burp_url="http://localhost:1337", api_key=None):
        self.burp_url = burp_url
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json'
        }
        if api_key:
            self.headers['X-API-Key'] = api_key
    
    def start_scan(self, target_url, scan_type="crawl_and_audit"):
        """Start a new scan"""
        endpoint = urljoin(self.burp_url, "/v0.1/scan")
        
        scan_config = {
            "scan_configurations": [
                {
                    "name": scan_type,
                    "type": "named_configuration"
                }
            ],
            "urls": [target_url]
        }
        
        response = requests.post(endpoint, json=scan_config, headers=self.headers)
        
        if response.status_code == 201:
            return response.headers.get('Location')
        else:
            raise Exception(f"Failed to start scan: {response.text}")
    
    def get_scan_status(self, scan_id):
        """Get scan status"""
        endpoint = urljoin(self.burp_url, f"/v0.1/scan/{scan_id}")
        response = requests.get(endpoint, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get scan status: {response.text}")
    
    def wait_for_scan_completion(self, scan_id, timeout=3600):
        """Wait for scan to complete"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.get_scan_status(scan_id)
            scan_status = status.get('scan_status')
            
            print(f"Scan status: {scan_status}")
            
            if scan_status in ['succeeded', 'failed', 'cancelled']:
                return status
            
            time.sleep(30)
        
        raise Exception("Scan timeout")
    
    def get_scan_issues(self, scan_id):
        """Get scan issues/vulnerabilities"""
        endpoint = urljoin(self.burp_url, f"/v0.1/scan/{scan_id}/issues")
        response = requests.get(endpoint, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get scan issues: {response.text}")
    
    def generate_report(self, scan_id, report_type="HTML"):
        """Generate scan report"""
        endpoint = urljoin(self.burp_url, f"/v0.1/scan/{scan_id}/report")
        
        report_config = {
            "report_type": report_type,
            "include_false_positives": False,
            "include_certain": True,
            "include_firm": True,
            "include_tentative": True
        }
        
        response = requests.post(endpoint, json=report_config, headers=self.headers)
        
        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"Failed to generate report: {response.text}")
    
    def comprehensive_scan(self, target_url, output_file="burp-report.html"):
        """Perform comprehensive scan and generate report"""
        print(f"Starting comprehensive scan of {target_url}")
        
        # Start scan
        scan_location = self.start_scan(target_url)
        scan_id = scan_location.split('/')[-1]
        
        print(f"Scan started with ID: {scan_id}")
        
        # Wait for completion
        final_status = self.wait_for_scan_completion(scan_id)
        print(f"Scan completed with status: {final_status.get('scan_status')}")
        
        # Get issues
        issues = self.get_scan_issues(scan_id)
        print(f"Found {len(issues.get('issues', []))} issues")
        
        # Generate report
        report_content = self.generate_report(scan_id)
        
        with open(output_file, 'wb') as f:
            f.write(report_content)
        
        print(f"Report saved to {output_file}")
        
        return {
            'scan_id': scan_id,
            'status': final_status,
            'issues': issues,
            'report_file': output_file
        }

# Usage example
if __name__ == "__main__":
    burp_api = BurpSuiteAPI()
    
    target_url = "http://dvwa-target"
    result = burp_api.comprehensive_scan(target_url)
    
    print(f"Scan completed successfully!")
    print(f"Issues found: {len(result['issues'].get('issues', []))}")
    print(f"Report: {result['report_file']}")
```

### Bash Automation Script

`Create scripts/burp-automated-scan.sh:`
```bash
#!/bin/bash

# Burp Suite Automated Scanning Script
set -e

BURP_URL="http://localhost:1337"
TARGET_URL="$1"
SCAN_TYPE="${2:-crawl_and_audit}"
OUTPUT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -z "$TARGET_URL" ]; then
    echo "Usage: $0 <target_url> [scan_type]"
    echo "Example: $0 http://example.com crawl_and_audit"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "=== Starting Burp Suite Automated Scan ==="
echo "Target: $TARGET_URL"
echo "Scan Type: $SCAN_TYPE"
echo "Timestamp: $TIMESTAMP"

# Start scan
echo "Starting scan..."
SCAN_RESPONSE=$(curl -s -X POST "$BURP_URL/v0.1/scan" \
    -H "Content-Type: application/json" \
    -d "{
        \"scan_configurations\": [{
            \"name\": \"$SCAN_TYPE\",
            \"type\": \"named_configuration\"
        }],
        \"urls\": [\"$TARGET_URL\"]
    }")

SCAN_LOCATION=$(echo "$SCAN_RESPONSE" | grep -o 'Location: .*' | cut -d' ' -f2)
SCAN_ID=$(basename "$SCAN_LOCATION")

echo "Scan started with ID: $SCAN_ID"

# Monitor scan progress
echo "Monitoring scan progress..."
while true; do
    STATUS_RESPONSE=$(curl -s "$BURP_URL/v0.1/scan/$SCAN_ID")
    SCAN_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.scan_status')
    
    echo "Current status: $SCAN_STATUS"
    
    if [ "$SCAN_STATUS" = "succeeded" ] || [ "$SCAN_STATUS" = "failed" ] || [ "$SCAN_STATUS" = "cancelled" ]; then
        break
    fi
    
    sleep 30
done

echo "Scan completed with status: $SCAN_STATUS"

# Get scan results
echo "Retrieving scan results..."
curl -s "$BURP_URL/v0.1/scan/$SCAN_ID/issues" > "$OUTPUT_DIR/issues_${TIMESTAMP}.json"

# Generate HTML report
echo "Generating HTML report..."
curl -s -X POST "$BURP_URL/v0.1/scan/$SCAN_ID/report" \
    -H "Content-Type: application/json" \
    -d '{
        "report_type": "HTML",
        "include_false_positives": false,
        "include_certain": true,
        "include_firm": true,
        "include_tentative": true
    }' > "$OUTPUT_DIR/report_${TIMESTAMP}.html"

# Generate XML report for CI/CD integration
echo "Generating XML report..."
curl -s -X POST "$BURP_URL/v0.1/scan/$SCAN_ID/report" \
    -H "Content-Type: application/json" \
    -d '{
        "report_type": "XML",
        "include_false_positives": false,
        "include_certain": true,
        "include_firm": true,
        "include_tentative": true
    }' > "$OUTPUT_DIR/report_${TIMESTAMP}.xml"

# Parse results for CI/CD
ISSUES_COUNT=$(jq '.issues | length' "$OUTPUT_DIR/issues_${TIMESTAMP}.json")
HIGH_SEVERITY=$(jq '[.issues[] | select(.severity == "high")] | length' "$OUTPUT_DIR/issues_${TIMESTAMP}.json")
MEDIUM_SEVERITY=$(jq '[.issues[] | select(.severity == "medium")] | length' "$OUTPUT_DIR/issues_${TIMESTAMP}.json")

echo "=== Scan Results Summary ==="
echo "Total Issues: $ISSUES_COUNT"
echo "High Severity: $HIGH_SEVERITY"
echo "Medium Severity: $MEDIUM_SEVERITY"
echo "Reports saved to: $OUTPUT_DIR"

# Exit with error code if high severity issues found
if [ "$HIGH_SEVERITY" -gt 0 ]; then
    echo "❌ High severity vulnerabilities found! Failing build."
    exit 1
else
    echo "✅ No high severity vulnerabilities found."
    exit 0
fi
```

---

## CI/CD Integration

### GitHub Actions Integration

`Create .github/workflows/security-scan.yml:`
```yaml
name: Security Scan with Burp Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    services:
      burp-suite:
        image: portswigger/burp-suite-professional:latest
        ports:
          - 1337:1337
          - 8080:8080
        env:
          BURP_LICENSE_KEY: ${{ secrets.BURP_LICENSE_KEY }}
        options: >-
          --health-cmd "curl -f http://localhost:1337/v0.1/health || exit 1"
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
    
    - name: Wait for Burp Suite to be ready
      run: |
        timeout 300 bash -c 'until curl -f http://localhost:1337/v0.1/health; do sleep 5; done'
    
    - name: Run Burp Suite Security Scan
      run: |
        chmod +x ./scripts/burp-automated-scan.sh
        ./scripts/burp-automated-scan.sh http://localhost:3000
    
    - name: Upload Burp Suite Reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: burp-reports
        path: reports/
    
    - name: Parse Security Results
      run: |
        if [ -f "reports/issues_*.json" ]; then
          LATEST_REPORT=$(ls -t reports/issues_*.json | head -1)
          HIGH_ISSUES=$(jq '[.issues[] | select(.severity == "high")] | length' "$LATEST_REPORT")
          MEDIUM_ISSUES=$(jq '[.issues[] | select(.severity == "medium")] | length' "$LATEST_REPORT")
          
          echo "High severity issues: $HIGH_ISSUES"
          echo "Medium severity issues: $MEDIUM_ISSUES"
          
          if [ "$HIGH_ISSUES" -gt "0" ]; then
            echo "❌ High severity vulnerabilities found!"
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
        BURP_LICENSE_KEY = credentials('burp-license-key')
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
        
        stage('Start Burp Suite') {
            steps {
                script {
                    sh '''
                        docker run -d --name burp-suite \
                            -p 1337:1337 -p 8080:8080 \
                            -e BURP_LICENSE_KEY=${BURP_LICENSE_KEY} \
                            portswigger/burp-suite-professional:latest
                    '''
                    
                    // Wait for Burp Suite to be ready
                    timeout(time: 5, unit: 'MINUTES') {
                        waitUntil {
                            script {
                                def response = sh(
                                    script: 'curl -f http://localhost:1337/v0.1/health',
                                    returnStatus: true
                                )
                                return response == 0
                            }
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh '''
                    chmod +x ./scripts/burp-automated-scan.sh
                    ./scripts/burp-automated-scan.sh ${TARGET_URL}
                '''
            }
        }
        
        stage('Process Results') {
            steps {
                script {
                    // Archive reports
                    archiveArtifacts artifacts: 'reports/*', allowEmptyArchive: true
                    
                    // Parse results
                    def latestReport = sh(
                        script: 'ls -t reports/issues_*.json | head -1',
                        returnStdout: true
                    ).trim()
                    
                    if (fileExists(latestReport)) {
                        def issuesJson = readJSON file: latestReport
                        def highIssues = issuesJson.issues.findAll { it.severity == 'high' }.size()
                        def mediumIssues = issuesJson.issues.findAll { it.severity == 'medium' }.size()
                        
                        echo "High severity issues: ${highIssues}"
                        echo "Medium severity issues: ${mediumIssues}"
                        
                        if (highIssues > 0) {
                            error("High severity vulnerabilities found!")
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker stop test-app burp-suite || true'
            sh 'docker rm test-app burp-suite || true'
        }
        
        failure {
            emailext (
                subject: "Security Scan Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Security vulnerabilities found. Check the Burp Suite report for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

---

## Advanced Features

### Custom Extensions

`Create extensions/custom-scanner.py:`
```python
from burp import IBurpExtender, IScannerCheck, IScanIssue
from java.io import PrintWriter
from java.util import ArrayList

class BurpExtender(IBurpExtender, IScannerCheck):
    def registerExtenderCallbacks(self, callbacks):
        self._callbacks = callbacks
        self._helpers = callbacks.getHelpers()
        
        callbacks.setExtensionName("Custom Security Scanner")
        callbacks.registerScannerCheck(self)
        
        self._stdout = PrintWriter(callbacks.getStdout(), True)
        self._stderr = PrintWriter(callbacks.getStderr(), True)
        
        self._stdout.println("Custom Security Scanner loaded")
    
    def doPassiveScan(self, baseRequestResponse):
        issues = ArrayList()
        
        # Check for sensitive information in responses
        response = baseRequestResponse.getResponse()
        if response:
            response_str = self._helpers.bytesToString(response)
            
            # Check for API keys
            if "api_key=" in response_str.lower() or "apikey=" in response_str.lower():
                issues.add(CustomScanIssue(
                    baseRequestResponse.getHttpService(),
                    self._helpers.analyzeRequest(baseRequestResponse).getUrl(),
                    [baseRequestResponse],
                    "API Key Exposure",
                    "The response contains what appears to be an API key",
                    "High"
                ))
            
            # Check for database errors
            db_errors = ["mysql_fetch_array", "ora-", "microsoft jet database", "sqlite_"]
            for error in db_errors:
                if error in response_str.lower():
                    issues.add(CustomScanIssue(
                        baseRequestResponse.getHttpService(),
                        self._helpers.analyzeRequest(baseRequestResponse).getUrl(),
                        [baseRequestResponse],
                        "Database Error Disclosure",
                        f"The response contains database error information: {error}",
                        "Medium"
                    ))
        
        return issues
    
    def doActiveScan(self, baseRequestResponse, insertionPoint):
        issues = ArrayList()
        
        # Custom active scan checks can be implemented here
        # For example, testing for custom injection points
        
        return issues

class CustomScanIssue(IScanIssue):
    def __init__(self, httpService, url, httpMessages, name, detail, severity):
        self._httpService = httpService
        self._url = url
        self._httpMessages = httpMessages
        self._name = name
        self._detail = detail
        self._severity = severity
    
    def getUrl(self):
        return self._url
    
    def getIssueName(self):
        return self._name
    
    def getIssueType(self):
        return 0
    
    def getSeverity(self):
        return self._severity
    
    def getConfidence(self):
        return "Certain"
    
    def getIssueBackground(self):
        return None
    
    def getRemediationBackground(self):
        return None
    
    def getIssueDetail(self):
        return self._detail
    
    def getRemediationDetail(self):
        return None
    
    def getHttpMessages(self):
        return self._httpMessages
    
    def getHttpService(self):
        return self._httpService
```

---

## Common Use Cases

- **Web Application Penetration Testing**: Comprehensive security assessment
- **API Security Testing**: REST and GraphQL API vulnerability scanning
- **Automated Security Testing**: CI/CD pipeline integration
- **Manual Security Testing**: Interactive testing with proxy capabilities
- **Compliance Testing**: OWASP Top 10 and security standard validation

✅ Burp Suite is now configured for comprehensive web application security testing!
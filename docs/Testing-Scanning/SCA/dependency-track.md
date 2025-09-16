# 🔍 OWASP Dependency-Track - Software Composition Analysis Platform

OWASP Dependency-Track is an intelligent Component Analysis platform that allows organizations to identify and reduce risk in the software supply chain. It provides continuous monitoring of components for known vulnerabilities and policy violations.

## 📋 Prerequisites

- Java 11+ (for running the application)
- Docker and Docker Compose (recommended deployment)
- PostgreSQL or H2 database
- 4GB+ RAM for production deployments
- Basic understanding of software composition analysis

## 🛠️ Installation & Setup

### Docker Compose Deployment (Recommended)
```yaml
# docker-compose.yml
version: '3.8'

services:
  dtrack-apiserver:
    image: dependencytrack/apiserver:4.9.1
    container_name: dtrack-apiserver
    environment:
      # Database Configuration
      - ALPINE_DATABASE_MODE=external
      - ALPINE_DATABASE_URL=jdbc:postgresql://postgres:5432/dtrack
      - ALPINE_DATABASE_DRIVER=org.postgresql.Driver
      - ALPINE_DATABASE_USERNAME=dtrack
      - ALPINE_DATABASE_PASSWORD=changeme
      
      # Security Configuration
      - ALPINE_SECRET_KEY_PATH=/var/run/secrets/secret.key
      - ALPINE_BCRYPT_ROUNDS=14
      
      # LDAP Configuration (optional)
      - ALPINE_LDAP_ENABLED=false
      
      # Metrics and Monitoring
      - ALPINE_METRICS_ENABLED=true
      - ALPINE_METRICS_AUTH_USERNAME=metrics
      - ALPINE_METRICS_AUTH_PASSWORD=changeme
      
      # Vulnerability Analysis
      - ALPINE_VULNERABILITY_ANALYZER_ENABLED=true
      - ALPINE_VULNERABILITY_ANALYZER_INTERVAL=24
      
      # Repository Analysis
      - ALPINE_REPO_META_ANALYZER_ENABLED=true
      - ALPINE_REPO_META_ANALYZER_INTERVAL=24
      
      # Internal Analysis
      - ALPINE_INTERNAL_COMPONENTS_ENABLED=true
      
      # Notification Configuration
      - ALPINE_NOTIFICATION_LEVEL=INFORMATIONAL
    ports:
      - "8081:8080"
    volumes:
      - dtrack-data:/data
      - ./secrets/secret.key:/var/run/secrets/secret.key:ro
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3

  dtrack-frontend:
    image: dependencytrack/frontend:4.9.1
    container_name: dtrack-frontend
    environment:
      - API_BASE_URL=http://localhost:8081
    ports:
      - "8080:8080"
    depends_on:
      - dtrack-apiserver
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: dtrack-postgres
    environment:
      - POSTGRES_DB=dtrack
      - POSTGRES_USER=dtrack
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dtrack"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    container_name: dtrack-redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  dtrack-data:
  postgres-data:
  redis-data:
```

### Generate Secret Key
```bash
# Generate secret key for encryption
openssl rand -base64 32 > secrets/secret.key
chmod 600 secrets/secret.key
```

### Start Services
```bash
# Create directories
mkdir -p secrets

# Generate secret key
openssl rand -base64 32 > secrets/secret.key

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f dtrack-apiserver
```

## 🚀 Initial Configuration

### Access Web Interface
```bash
# Default credentials (change immediately)
# URL: http://localhost:8080
# Username: admin
# Password: admin
```

### API Configuration
```bash
# Get API key from web interface
# Navigate to Administration -> Access Management -> Teams -> Administrators

# Test API connectivity
curl -X GET "http://localhost:8081/api/v1/project" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## 📊 Core Features

### 1. Project Management

#### Create Project via API
```bash
# Create new project
curl -X PUT "http://localhost:8081/api/v1/project" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Application",
    "version": "1.0.0",
    "description": "Production web application",
    "tags": [
      {
        "name": "production"
      },
      {
        "name": "web-app"
      }
    ],
    "properties": [
      {
        "groupName": "integrations",
        "propertyName": "defectdojo.engagementId",
        "propertyValue": "12345"
      }
    ]
  }'
```

#### Project Configuration Script
```python
#!/usr/bin/env python3
import requests
import json

class DependencyTrackAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def create_project(self, name, version, description="", tags=None):
        """Create a new project"""
        data = {
            'name': name,
            'version': version,
            'description': description,
            'tags': tags or []
        }
        
        response = requests.put(
            f"{self.base_url}/api/v1/project",
            headers=self.headers,
            json=data
        )
        
        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"Failed to create project: {response.text}")
    
    def upload_bom(self, project_uuid, bom_content, auto_create=True):
        """Upload SBOM to project"""
        data = {
            'project': project_uuid,
            'bom': bom_content,
            'autoCreate': auto_create
        }
        
        response = requests.put(
            f"{self.base_url}/api/v1/bom",
            headers=self.headers,
            json=data
        )
        
        return response.json() if response.status_code == 200 else None
    
    def get_project_metrics(self, project_uuid):
        """Get project vulnerability metrics"""
        response = requests.get(
            f"{self.base_url}/api/v1/metrics/project/{project_uuid}/current",
            headers=self.headers
        )
        
        return response.json() if response.status_code == 200 else None

# Usage example
dt_api = DependencyTrackAPI("http://localhost:8081", "YOUR_API_KEY")

# Create project
project = dt_api.create_project(
    name="Web Application",
    version="2.1.0",
    description="Main production web application",
    tags=[{"name": "production"}, {"name": "critical"}]
)

print(f"Created project: {project['uuid']}")
```

### 2. SBOM Upload and Analysis

#### Generate SBOM with CycloneDX
```bash
# Install CycloneDX tools
npm install -g @cyclonedx/cyclonedx-npm
pip install cyclonedx-bom

# Generate SBOM for Node.js project
cyclonedx-npm --output-file sbom.json

# Generate SBOM for Python project
cyclonedx-py -o sbom.json

# Generate SBOM for Java project (using Maven)
mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom
```

#### Upload SBOM via API
```bash
# Upload SBOM file
curl -X PUT "http://localhost:8081/api/v1/bom" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_UUID",
    "bom": "'$(base64 -w 0 sbom.json)'"
  }'
```

#### Automated SBOM Upload Script
```python
#!/usr/bin/env python3
import base64
import json
import requests
import sys
import time

def upload_sbom(api_url, api_key, project_uuid, sbom_file):
    """Upload SBOM file to Dependency-Track"""
    
    # Read and encode SBOM file
    with open(sbom_file, 'rb') as f:
        bom_content = base64.b64encode(f.read()).decode('utf-8')
    
    # Prepare request
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    data = {
        'project': project_uuid,
        'bom': bom_content,
        'autoCreate': True
    }
    
    # Upload SBOM
    response = requests.put(
        f"{api_url}/api/v1/bom",
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        token = response.json().get('token')
        print(f"SBOM upload initiated. Token: {token}")
        
        # Poll for completion
        while True:
            status_response = requests.get(
                f"{api_url}/api/v1/bom/token/{token}",
                headers=headers
            )
            
            if status_response.status_code == 200:
                status = status_response.json()
                if status.get('processing', True):
                    print("Processing...")
                    time.sleep(5)
                else:
                    print("SBOM processing completed!")
                    break
            else:
                print("Error checking status")
                break
    else:
        print(f"Upload failed: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python upload_sbom.py <api_url> <api_key> <project_uuid> <sbom_file>")
        sys.exit(1)
    
    upload_sbom(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
```

### 3. Vulnerability Analysis

#### Custom Vulnerability Source
```python
#!/usr/bin/env python3
import requests
import json
from datetime import datetime

class CustomVulnSource:
    def __init__(self, dt_api_url, dt_api_key):
        self.dt_api_url = dt_api_url
        self.headers = {
            'X-API-Key': dt_api_key,
            'Content-Type': 'application/json'
        }
    
    def create_vulnerability(self, vuln_data):
        """Create custom vulnerability"""
        response = requests.put(
            f"{self.dt_api_url}/api/v1/vulnerability",
            headers=self.headers,
            json=vuln_data
        )
        
        return response.json() if response.status_code == 201 else None
    
    def add_vulnerability_to_component(self, component_uuid, vuln_id, analysis_state="NOT_AFFECTED"):
        """Add vulnerability analysis to component"""
        data = {
            'component': component_uuid,
            'vulnerability': vuln_id,
            'analysisState': analysis_state,
            'analysisJustification': 'CODE_NOT_REACHABLE',
            'analysisResponse': 'UPDATE',
            'analysisDetails': 'Custom analysis performed',
            'comment': f'Analysis performed on {datetime.now().isoformat()}'
        }
        
        response = requests.put(
            f"{self.dt_api_url}/api/v1/analysis",
            headers=self.headers,
            json=data
        )
        
        return response.status_code == 201

# Example usage
vuln_source = CustomVulnSource("http://localhost:8081", "YOUR_API_KEY")

# Create custom vulnerability
custom_vuln = {
    'vulnId': 'CUSTOM-2024-001',
    'source': 'INTERNAL',
    'title': 'Custom Security Issue',
    'description': 'Internal security vulnerability found during code review',
    'severity': 'HIGH',
    'cvssV3BaseScore': 7.5,
    'cvssV3Vector': 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N'
}

result = vuln_source.create_vulnerability(custom_vuln)
print(f"Created vulnerability: {result}")
```

### 4. Policy Management

#### Create Policy via API
```bash
# Create license policy
curl -X PUT "http://localhost:8081/api/v1/policy" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "License Compliance Policy",
    "operator": "ANY",
    "violationState": "FAIL",
    "policyConditions": [
      {
        "subject": "LICENSE",
        "operator": "IS",
        "value": "GPL-3.0"
      },
      {
        "subject": "LICENSE",
        "operator": "IS",
        "value": "AGPL-3.0"
      }
    ]
  }'
```

#### Security Policy Configuration
```python
#!/usr/bin/env python3
import requests

def create_security_policies(api_url, api_key):
    """Create comprehensive security policies"""
    
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    policies = [
        {
            'name': 'Critical Vulnerability Policy',
            'operator': 'ANY',
            'violationState': 'FAIL',
            'policyConditions': [
                {
                    'subject': 'SEVERITY',
                    'operator': 'IS',
                    'value': 'CRITICAL'
                }
            ]
        },
        {
            'name': 'High Severity with EPSS Policy',
            'operator': 'ALL',
            'violationState': 'WARN',
            'policyConditions': [
                {
                    'subject': 'SEVERITY',
                    'operator': 'IS',
                    'value': 'HIGH'
                },
                {
                    'subject': 'EPSS_SCORE',
                    'operator': 'NUMERIC_GREATER_THAN',
                    'value': '0.7'
                }
            ]
        },
        {
            'name': 'Outdated Component Policy',
            'operator': 'ANY',
            'violationState': 'INFO',
            'policyConditions': [
                {
                    'subject': 'AGE',
                    'operator': 'NUMERIC_GREATER_THAN',
                    'value': '365'
                }
            ]
        }
    ]
    
    for policy in policies:
        response = requests.put(
            f"{api_url}/api/v1/policy",
            headers=headers,
            json=policy
        )
        
        if response.status_code == 201:
            print(f"Created policy: {policy['name']}")
        else:
            print(f"Failed to create policy {policy['name']}: {response.text}")

# Usage
create_security_policies("http://localhost:8081", "YOUR_API_KEY")
```

## 🔧 CI/CD Integration

### GitHub Actions Integration
```yaml
# .github/workflows/dependency-track.yml
name: Dependency Track Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  dependency-analysis:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate SBOM
      run: |
        npm install -g @cyclonedx/cyclonedx-npm
        cyclonedx-npm --output-file sbom.json
    
    - name: Upload SBOM to Dependency-Track
      env:
        DT_API_KEY: ${{ secrets.DEPENDENCY_TRACK_API_KEY }}
        DT_PROJECT_UUID: ${{ secrets.DEPENDENCY_TRACK_PROJECT_UUID }}
      run: |
        curl -X PUT "${{ vars.DEPENDENCY_TRACK_URL }}/api/v1/bom" \
          -H "X-API-Key: $DT_API_KEY" \
          -H "Content-Type: application/json" \
          -d "{
            \"project\": \"$DT_PROJECT_UUID\",
            \"bom\": \"$(base64 -w 0 sbom.json)\"
          }"
    
    - name: Wait for analysis completion
      env:
        DT_API_KEY: ${{ secrets.DEPENDENCY_TRACK_API_KEY }}
        DT_PROJECT_UUID: ${{ secrets.DEPENDENCY_TRACK_PROJECT_UUID }}
      run: |
        # Wait for analysis to complete
        sleep 60
        
        # Get vulnerability metrics
        METRICS=$(curl -s -H "X-API-Key: $DT_API_KEY" \
          "${{ vars.DEPENDENCY_TRACK_URL }}/api/v1/metrics/project/$DT_PROJECT_UUID/current")
        
        CRITICAL=$(echo $METRICS | jq -r '.critical // 0')
        HIGH=$(echo $METRICS | jq -r '.high // 0')
        
        echo "Critical vulnerabilities: $CRITICAL"
        echo "High vulnerabilities: $HIGH"
        
        # Fail if critical vulnerabilities found
        if [ "$CRITICAL" -gt 0 ]; then
          echo "❌ Critical vulnerabilities found!"
          exit 1
        fi
        
        # Warn if high vulnerabilities found
        if [ "$HIGH" -gt 5 ]; then
          echo "⚠️ High number of high-severity vulnerabilities: $HIGH"
          exit 1
        fi
        
        echo "✅ Security analysis passed!"
```

### Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DT_API_KEY = credentials('dependency-track-api-key')
        DT_PROJECT_UUID = credentials('dependency-track-project-uuid')
        DT_URL = 'http://dependency-track:8081'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Generate SBOM') {
            steps {
                sh '''
                    npm install -g @cyclonedx/cyclonedx-npm
                    cyclonedx-npm --output-file sbom.json
                '''
            }
        }
        
        stage('Upload to Dependency-Track') {
            steps {
                script {
                    def sbomContent = sh(
                        script: 'base64 -w 0 sbom.json',
                        returnStdout: true
                    ).trim()
                    
                    def response = httpRequest(
                        httpMode: 'PUT',
                        url: "${DT_URL}/api/v1/bom",
                        customHeaders: [
                            [name: 'X-API-Key', value: env.DT_API_KEY],
                            [name: 'Content-Type', value: 'application/json']
                        ],
                        requestBody: """
                        {
                            "project": "${env.DT_PROJECT_UUID}",
                            "bom": "${sbomContent}"
                        }
                        """
                    )
                    
                    def token = readJSON(text: response.content).token
                    echo "Upload token: ${token}"
                    
                    // Wait for processing
                    sleep(time: 60, unit: 'SECONDS')
                }
            }
        }
        
        stage('Security Gate') {
            steps {
                script {
                    def metricsResponse = httpRequest(
                        url: "${DT_URL}/api/v1/metrics/project/${env.DT_PROJECT_UUID}/current",
                        customHeaders: [
                            [name: 'X-API-Key', value: env.DT_API_KEY]
                        ]
                    )
                    
                    def metrics = readJSON(text: metricsResponse.content)
                    
                    echo "Vulnerability Summary:"
                    echo "Critical: ${metrics.critical ?: 0}"
                    echo "High: ${metrics.high ?: 0}"
                    echo "Medium: ${metrics.medium ?: 0}"
                    echo "Low: ${metrics.low ?: 0}"
                    
                    // Security gate logic
                    if ((metrics.critical ?: 0) > 0) {
                        error("❌ Critical vulnerabilities found! Build failed.")
                    }
                    
                    if ((metrics.high ?: 0) > 10) {
                        unstable("⚠️ High number of high-severity vulnerabilities")
                    }
                    
                    echo "✅ Security gate passed!"
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'sbom.json', fingerprint: true
        }
        
        failure {
            emailext(
                subject: "Security Analysis Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Security analysis failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}. Check Dependency-Track for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## 📊 Reporting and Notifications

### Custom Report Generation
```python
#!/usr/bin/env python3
import requests
import json
import csv
from datetime import datetime

class DependencyTrackReporter:
    def __init__(self, api_url, api_key):
        self.api_url = api_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def get_project_vulnerabilities(self, project_uuid):
        """Get all vulnerabilities for a project"""
        response = requests.get(
            f"{self.api_url}/api/v1/vulnerability/project/{project_uuid}",
            headers=self.headers
        )
        
        return response.json() if response.status_code == 200 else []
    
    def get_project_components(self, project_uuid):
        """Get all components for a project"""
        response = requests.get(
            f"{self.api_url}/api/v1/component/project/{project_uuid}",
            headers=self.headers
        )
        
        return response.json() if response.status_code == 200 else []
    
    def generate_vulnerability_report(self, project_uuid, output_file):
        """Generate comprehensive vulnerability report"""
        vulnerabilities = self.get_project_vulnerabilities(project_uuid)
        
        with open(output_file, 'w', newline='') as csvfile:
            fieldnames = [
                'Component', 'Version', 'Vulnerability ID', 'Severity', 
                'CVSS Score', 'Description', 'Published Date', 'Analysis State'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for vuln in vulnerabilities:
                component = vuln.get('component', {})
                writer.writerow({
                    'Component': component.get('name', 'Unknown'),
                    'Version': component.get('version', 'Unknown'),
                    'Vulnerability ID': vuln.get('vulnId', ''),
                    'Severity': vuln.get('severity', ''),
                    'CVSS Score': vuln.get('cvssV3BaseScore', ''),
                    'Description': vuln.get('description', '')[:100] + '...',
                    'Published Date': vuln.get('published', ''),
                    'Analysis State': vuln.get('analysisState', 'NOT_SET')
                })
        
        print(f"Vulnerability report generated: {output_file}")
    
    def generate_license_report(self, project_uuid, output_file):
        """Generate license compliance report"""
        components = self.get_project_components(project_uuid)
        
        license_summary = {}
        
        with open(output_file, 'w', newline='') as csvfile:
            fieldnames = ['Component', 'Version', 'License', 'License Risk']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for component in components:
                resolved_license = component.get('resolvedLicense', {})
                license_name = resolved_license.get('name', 'Unknown')
                
                # Count licenses
                license_summary[license_name] = license_summary.get(license_name, 0) + 1
                
                writer.writerow({
                    'Component': component.get('name', 'Unknown'),
                    'Version': component.get('version', 'Unknown'),
                    'License': license_name,
                    'License Risk': self._assess_license_risk(license_name)
                })
        
        print(f"License report generated: {output_file}")
        print("License Summary:")
        for license_name, count in sorted(license_summary.items()):
            print(f"  {license_name}: {count} components")
    
    def _assess_license_risk(self, license_name):
        """Simple license risk assessment"""
        high_risk = ['GPL-3.0', 'AGPL-3.0', 'GPL-2.0']
        medium_risk = ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0']
        
        if license_name in high_risk:
            return 'HIGH'
        elif license_name in medium_risk:
            return 'MEDIUM'
        else:
            return 'LOW'

# Usage
reporter = DependencyTrackReporter("http://localhost:8081", "YOUR_API_KEY")

# Generate reports
project_uuid = "your-project-uuid"
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

reporter.generate_vulnerability_report(
    project_uuid, 
    f"vulnerability_report_{timestamp}.csv"
)

reporter.generate_license_report(
    project_uuid, 
    f"license_report_{timestamp}.csv"
)
```

### Slack Notifications
```python
#!/usr/bin/env python3
import requests
import json
from datetime import datetime

class SlackNotifier:
    def __init__(self, webhook_url, dt_api_url, dt_api_key):
        self.webhook_url = webhook_url
        self.dt_api_url = dt_api_url
        self.dt_headers = {
            'X-API-Key': dt_api_key,
            'Content-Type': 'application/json'
        }
    
    def get_project_metrics(self, project_uuid):
        """Get current project metrics"""
        response = requests.get(
            f"{self.dt_api_url}/api/v1/metrics/project/{project_uuid}/current",
            headers=self.dt_headers
        )
        
        return response.json() if response.status_code == 200 else {}
    
    def send_vulnerability_alert(self, project_uuid, project_name):
        """Send vulnerability alert to Slack"""
        metrics = self.get_project_metrics(project_uuid)
        
        critical = metrics.get('critical', 0)
        high = metrics.get('high', 0)
        medium = metrics.get('medium', 0)
        low = metrics.get('low', 0)
        
        # Determine alert level
        if critical > 0:
            color = "danger"
            alert_level = "🚨 CRITICAL"
        elif high > 5:
            color = "warning"
            alert_level = "⚠️ HIGH"
        else:
            color = "good"
            alert_level = "✅ NORMAL"
        
        # Prepare Slack message
        message = {
            "username": "Dependency-Track",
            "icon_emoji": ":shield:",
            "attachments": [
                {
                    "color": color,
                    "title": f"{alert_level} - Security Analysis Results",
                    "title_link": f"{self.dt_api_url.replace('/api', '')}/projects/{project_uuid}",
                    "fields": [
                        {
                            "title": "Project",
                            "value": project_name,
                            "short": True
                        },
                        {
                            "title": "Timestamp",
                            "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "short": True
                        },
                        {
                            "title": "Critical",
                            "value": str(critical),
                            "short": True
                        },
                        {
                            "title": "High",
                            "value": str(high),
                            "short": True
                        },
                        {
                            "title": "Medium",
                            "value": str(medium),
                            "short": True
                        },
                        {
                            "title": "Low",
                            "value": str(low),
                            "short": True
                        }
                    ],
                    "footer": "Dependency-Track",
                    "ts": int(datetime.now().timestamp())
                }
            ]
        }
        
        # Send to Slack
        response = requests.post(self.webhook_url, json=message)
        
        if response.status_code == 200:
            print("Slack notification sent successfully")
        else:
            print(f"Failed to send Slack notification: {response.text}")

# Usage
notifier = SlackNotifier(
    webhook_url="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    dt_api_url="http://localhost:8081",
    dt_api_key="YOUR_API_KEY"
)

notifier.send_vulnerability_alert("project-uuid", "My Application")
```

## 🔒 Security Configuration

### LDAP Integration
```properties
# application.properties
alpine.ldap.enabled=true
alpine.ldap.server.url=ldap://ldap.company.com:389
alpine.ldap.basedn=dc=company,dc=com
alpine.ldap.security.auth=simple
alpine.ldap.bind.username=cn=dtrack,ou=services,dc=company,dc=com
alpine.ldap.bind.password=changeme
alpine.ldap.auth.username.format=%s@company.com
alpine.ldap.attribute.name=displayName
alpine.ldap.attribute.mail=mail
alpine.ldap.groups.filter=(&(objectClass=group)(cn=DT-*))
alpine.ldap.user.groups.filter=(member:1.2.840.113556.1.4.1941:={USER_DN})
alpine.ldap.groups.search.filter=(&(objectClass=group)(cn={SEARCH_TERM}*))
alpine.ldap.users.search.filter=(&(objectClass=user)(cn={SEARCH_TERM}*))
```

### OIDC Configuration
```properties
# OIDC Configuration
alpine.oidc.enabled=true
alpine.oidc.client.id=dependency-track
alpine.oidc.client.secret=your-client-secret
alpine.oidc.issuer=https://auth.company.com/auth/realms/company
alpine.oidc.username.claim=preferred_username
alpine.oidc.teams.claim=groups
alpine.oidc.user.provisioning=true
alpine.oidc.team.synchronization=true
```

## 📈 Performance Optimization

### Database Tuning
```sql
-- PostgreSQL optimization for Dependency-Track
-- postgresql.conf settings

# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Connection settings
max_connections = 200

# Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_component_project_id ON "COMPONENT" ("PROJECT_ID");
CREATE INDEX CONCURRENTLY idx_vulnerability_component_id ON "VULNERABILITYSCAN" ("COMPONENT_ID");
CREATE INDEX CONCURRENTLY idx_analysis_component_vuln ON "ANALYSIS" ("COMPONENT_ID", "VULNERABILITY_ID");
```

### Application Tuning
```yaml
# docker-compose.yml - Performance optimized
version: '3.8'

services:
  dtrack-apiserver:
    image: dependencytrack/apiserver:4.9.1
    environment:
      # JVM Settings
      - JAVA_OPTIONS=-Xmx4g -Xms2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200
      
      # Thread Pool Settings
      - ALPINE_WORKER_THREADS=10
      - ALPINE_WORKER_MAX_QUEUE_SIZE=500
      
      # Database Connection Pool
      - ALPINE_DATABASE_POOL_ENABLED=true
      - ALPINE_DATABASE_POOL_MAX_SIZE=20
      - ALPINE_DATABASE_POOL_MIN_IDLE=10
      - ALPINE_DATABASE_POOL_IDLE_TIMEOUT=300000
      - ALPINE_DATABASE_POOL_MAX_LIFETIME=600000
      
      # Cache Settings
      - ALPINE_HTTP_CACHE_CONTROL=max-age=3600
      
      # Analysis Settings
      - ALPINE_VULNERABILITY_ANALYZER_ENABLED=true
      - ALPINE_VULNERABILITY_ANALYZER_INTERVAL=6
      - ALPINE_REPO_META_ANALYZER_ENABLED=true
      - ALPINE_REPO_META_ANALYZER_INTERVAL=24
    
    deploy:
      resources:
        limits:
          memory: 6G
          cpus: '4'
        reservations:
          memory: 4G
          cpus: '2'
```

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **High Memory Usage**
```bash
# Check memory usage
docker stats dtrack-apiserver

# Adjust JVM settings
export JAVA_OPTIONS="-Xmx2g -Xms1g -XX:+UseG1GC"
```

2. **Slow Analysis**
```bash
# Check analysis queue
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:8081/api/v1/metrics/portfolio"

# Enable debug logging
export ALPINE_LOG_LEVEL=DEBUG
```

3. **Database Connection Issues**
```bash
# Test database connectivity
docker exec -it dtrack-postgres psql -U dtrack -d dtrack -c "SELECT version();"

# Check connection pool
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:8081/api/v1/metrics/system"
```

### Log Analysis
```bash
# View application logs
docker logs -f dtrack-apiserver

# Search for specific errors
docker logs dtrack-apiserver 2>&1 | grep -i "error\|exception\|failed"

# Monitor database logs
docker logs -f dtrack-postgres
```

## 📚 Additional Resources

- [OWASP Dependency-Track Documentation](https://docs.dependencytrack.org/)
- [CycloneDX SBOM Standard](https://cyclonedx.org/)
- [OWASP Software Component Verification Standard](https://owasp.org/www-project-software-component-verification-standard/)
- [API Documentation](https://docs.dependencytrack.org/integrations/rest-api/)
- [Community Plugins](https://github.com/DependencyTrack/community-plugins)

OWASP Dependency-Track provides comprehensive software composition analysis capabilities, enabling organizations to identify and manage risks in their software supply chain effectively.
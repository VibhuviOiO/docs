---
sidebar_position: 1
title: SonarQube
description: SonarQube is a comprehensive code quality and security analysis platform. Learn how to set up SonarQube with Docker and integrate it into your CI/CD pipeline for automated code analysis.
slug: /TestingScanning/SonarQube
keywords:
  - SonarQube
  - SAST
  - static analysis
  - code quality
  - security scanning
  - Docker SonarQube
  - code analysis
  - DevSecOps
  - quality gates
  - technical debt
---

# 🚀 SonarQube Code Quality & Security Analysis

**SonarQube** is a comprehensive **code quality** and **security analysis** platform that provides **static application security testing (SAST)**, **code smell detection**, and **technical debt management**. Perfect for maintaining **high code standards** and **identifying security vulnerabilities** early in the development cycle.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Docker & Docker Compose** installed
- **A code project** ready for analysis
- **SonarScanner CLI** or CI/CD integration
- **Basic understanding** of code quality concepts
- **Internet access** to download SonarQube and plugins

---

## 🔧 Step 1: Setup SonarQube with Docker

`Create a docker-compose.yml file:`
```yaml
version: "3.8"

services:
  sonarqube:
    image: sonarqube:community
    container_name: sonarqube
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar123
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: true
    volumes:
      - sonarqube-data:/opt/sonarqube/data
      - sonarqube-extensions:/opt/sonarqube/extensions
      - sonarqube-logs:/opt/sonarqube/logs
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/api/system/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    container_name: sonarqube-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar123
      POSTGRES_DB: sonar
    volumes:
      - postgresql-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sonar"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  sonarqube-data:
  sonarqube-extensions:
  sonarqube-logs:
  postgresql-data:
```

`Start SonarQube:`
```bash
docker-compose up -d
```

`Wait for SonarQube to start (may take 2-3 minutes):`
```bash
docker logs -f sonarqube
```

---

## 🏗️ Step 2: Initial SonarQube Setup

1. **Visit** `http://localhost:9000`
2. **Login** with default credentials:
   - Username: `admin`
   - Password: `admin`
3. **Change** the default password when prompted
4. **Create** your first project

### Create Project Token

1. Go to **Administration** → **Security** → **Users**
2. Click on **Tokens** for admin user
3. **Generate** a new token (save it securely)
4. **Copy** the token for later use

---

## 📁 Step 3: Install SonarScanner

### Option 1: Install SonarScanner CLI

```bash
# Download and install SonarScanner
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
unzip sonar-scanner-cli-4.8.0.2856-linux.zip
sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
```

### Option 2: Use Docker Scanner

```bash
# Create alias for Docker-based scanner
alias sonar-scanner='docker run --rm -v "$(pwd):/usr/src" sonarsource/sonar-scanner-cli'
```

### Option 3: Install via npm (for Node.js projects)

```bash
npm install -g sonarqube-scanner
```

---

## ▶️ Step 4: Analyze Your First Project

### JavaScript/TypeScript Project Analysis

`Create sonar-project.properties in your project root:`
```properties
# Project identification
sonar.projectKey=my-javascript-app
sonar.projectName=My JavaScript Application
sonar.projectVersion=1.0

# Source code location
sonar.sources=src
sonar.tests=tests,__tests__,src/**/*.test.js,src/**/*.spec.js

# Exclusions
sonar.exclusions=node_modules/**,dist/**,build/**,coverage/**,public/**,*.config.js

# Language and encoding
sonar.sourceEncoding=UTF-8

# Test coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=test-results.xml

# ESLint report
sonar.eslint.reportPaths=reports/eslint-report.json
```

`Run the analysis:`
```bash
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN_HERE
```

### Python Project Analysis

`Create sonar-project.properties:`
```properties
# Project identification
sonar.projectKey=my-python-app
sonar.projectName=My Python Application
sonar.projectVersion=1.0

# Source code location
sonar.sources=src,app
sonar.tests=tests

# Exclusions
sonar.exclusions=**/__pycache__/**,**/migrations/**,**/venv/**,**/env/**

# Language and encoding
sonar.sourceEncoding=UTF-8

# Python specific
sonar.python.coverage.reportPaths=coverage.xml
sonar.python.xunit.reportPath=test-results.xml

# Pylint report
sonar.python.pylint.reportPaths=reports/pylint-report.txt

# Bandit security report
sonar.python.bandit.reportPaths=reports/bandit-report.json
```

`Generate coverage and test reports:`
```bash
# Install testing dependencies
pip install pytest pytest-cov pytest-xvfb pylint bandit

# Run tests with coverage
pytest --cov=src --cov-report=xml --junitxml=test-results.xml

# Run pylint
pylint src/ --output-format=parseable --reports=no > reports/pylint-report.txt

# Run bandit security scan
bandit -r src/ -f json -o reports/bandit-report.json

# Run SonarQube analysis
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN_HERE
```

### Java/Maven Project Analysis

`Add SonarQube plugin to pom.xml:`
```xml
<properties>
    <sonar.host.url>http://localhost:9000</sonar.host.url>
    <sonar.login>YOUR_TOKEN_HERE</sonar.login>
</properties>

<build>
    <plugins>
        <plugin>
            <groupId>org.sonarsource.scanner.maven</groupId>
            <artifactId>sonar-maven-plugin</artifactId>
            <version>3.9.1.2184</version>
        </plugin>
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.8</version>
            <executions>
                <execution>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

`Run analysis:`
```bash
mvn clean verify sonar:sonar
```

---

## 📊 Step 5: Understanding SonarQube Results

### Quality Gate Overview

When you visit your project in SonarQube, you'll see:

1. **✅ Quality Gate Status**
   - **Passed**: Code meets quality standards
   - **Failed**: Code has issues that need attention

2. **📈 Key Metrics**
   - **Bugs**: Logic errors that could cause runtime issues
   - **Vulnerabilities**: Security-related issues
   - **Code Smells**: Maintainability issues
   - **Coverage**: Test coverage percentage
   - **Duplications**: Code duplication percentage

3. **🔍 Issue Categories**
   - **Blocker**: Must fix immediately
   - **Critical**: Should fix before release
   - **Major**: Should fix
   - **Minor**: Nice to fix
   - **Info**: Informational

### Sample Analysis Results

```bash
# Example output after analysis
=====================================
Quality Gate: PASSED
=====================================

Metrics:
- Bugs: 0
- Vulnerabilities: 2 (1 Critical, 1 Major)
- Code Smells: 15 (3 Major, 12 Minor)
- Coverage: 78.5%
- Duplications: 2.1%
- Lines of Code: 2,847
- Technical Debt: 2h 30min
```

---

## 🔧 Step 6: CI/CD Integration

### GitHub Actions Integration

`Create .github/workflows/sonarqube.yml:`
```yaml
name: SonarQube Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  sonarqube:
    name: SonarQube Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Shallow clones should be disabled for better analysis
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: |
          npm run test:coverage
          npm run lint -- --format json --output-file reports/eslint-report.json
          
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        with:
          scanMetadataReportFile: target/sonar/report-task.txt
          
      - name: SonarQube Quality Gate Check
        id: sonarqube-quality-gate-check
        uses: sonarqube-quality-gate-action@master
        timeout-minutes: 5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const qualityGate = '${{ steps.sonarqube-quality-gate-check.outputs.quality-gate-status }}';
            const message = qualityGate === 'PASSED' 
              ? '✅ SonarQube Quality Gate **PASSED**' 
              : '❌ SonarQube Quality Gate **FAILED**';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `${message}\n\nView detailed results: ${{ secrets.SONAR_HOST_URL }}/dashboard?id=my-project`
            });
```

### Jenkins Integration

`Add to Jenkinsfile:`
```groovy
pipeline {
    agent any
    
    environment {
        SONAR_TOKEN = credentials('sonar-token')
        SONAR_HOST_URL = 'http://localhost:9000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build & Test') {
            steps {
                sh '''
                    npm ci
                    npm run test:coverage
                    npm run lint -- --format json --output-file reports/eslint-report.json
                '''
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=my-project \
                            -Dsonar.sources=src \
                            -Dsonar.tests=tests \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.eslint.reportPaths=reports/eslint-report.json
                    '''
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
    }
}
```

### GitLab CI Integration

`Add to .gitlab-ci.yml:`
```yaml
stages:
  - test
  - sonarqube-check
  - sonarqube-vulnerability-report

variables:
  SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
  GIT_DEPTH: "0"

cache:
  key: "${CI_JOB_NAME}"
  paths:
    - .sonar/cache

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test:coverage
    - npm run lint -- --format json --output-file gl-code-quality-report.json
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      codequality: gl-code-quality-report.json
    paths:
      - coverage/

sonarqube-check:
  stage: sonarqube-check
  image: 
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  script:
    - sonar-scanner
  only:
    - merge_requests
    - master
    - develop

sonarqube-vulnerability-report:
  stage: sonarqube-vulnerability-report
  script:
    - 'curl -u "${SONAR_TOKEN}:" "${SONAR_HOST_URL}/api/issues/gitlab_sast_export?projectKey=${CI_PROJECT_PATH_SLUG}&branch=${CI_COMMIT_REF_NAME}&pullRequest=${CI_MERGE_REQUEST_IID}" -o gl-sast-sonar-report.json'
  allow_failure: true
  only:
    - merge_requests
    - master
    - develop
  artifacts:
    expire_in: 1 day
    reports:
      sast: gl-sast-sonar-report.json
```

---

## 🔍 Step 7: Advanced Configuration

### Custom Quality Gates

1. Go to **Quality Gates** in SonarQube
2. **Create** a new quality gate
3. **Add conditions** based on your requirements:

```javascript
// Example Quality Gate Conditions
{
  "conditions": [
    {
      "metric": "new_bugs",
      "operator": "GT",
      "threshold": "0"
    },
    {
      "metric": "new_vulnerabilities", 
      "operator": "GT",
      "threshold": "0"
    },
    {
      "metric": "new_code_smells",
      "operator": "GT", 
      "threshold": "5"
    },
    {
      "metric": "new_coverage",
      "operator": "LT",
      "threshold": "80"
    },
    {
      "metric": "new_duplicated_lines_density",
      "operator": "GT",
      "threshold": "3"
    }
  ]
}
```

### Custom Rules and Profiles

`Create custom rule profile:`
```xml
<!-- custom-rules.xml -->
<profile>
  <name>Company Standards</name>
  <language>js</language>
  <rules>
    <rule>
      <repositoryKey>eslint</repositoryKey>
      <key>no-console</key>
      <priority>MAJOR</priority>
    </rule>
    <rule>
      <repositoryKey>eslint</repositoryKey>
      <key>no-debugger</key>
      <priority>BLOCKER</priority>
    </rule>
  </rules>
</profile>
```

### Multi-Language Project Configuration

`sonar-project.properties for monorepo:`
```properties
# Main project
sonar.projectKey=monorepo-project
sonar.projectName=Monorepo Project
sonar.projectVersion=1.0

# Multi-module configuration
sonar.modules=frontend,backend,mobile

# Frontend module (JavaScript/TypeScript)
frontend.sonar.projectName=Frontend
frontend.sonar.sources=frontend/src
frontend.sonar.tests=frontend/tests
frontend.sonar.exclusions=frontend/node_modules/**,frontend/dist/**
frontend.sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info

# Backend module (Python)
backend.sonar.projectName=Backend
backend.sonar.sources=backend/src
backend.sonar.tests=backend/tests
backend.sonar.exclusions=backend/**/__pycache__/**,backend/venv/**
backend.sonar.python.coverage.reportPaths=backend/coverage.xml

# Mobile module (Java/Kotlin)
mobile.sonar.projectName=Mobile
mobile.sonar.sources=mobile/src
mobile.sonar.tests=mobile/src/test
mobile.sonar.java.binaries=mobile/build/classes
mobile.sonar.jacoco.reportPaths=mobile/build/jacoco/test.exec
```

---

## 🛡️ Step 8: Security-Focused Analysis

### Security Hotspots Review

```bash
# Generate security report
curl -u admin:admin \
  "http://localhost:9000/api/hotspots/search?projectKey=my-project" \
  | jq '.hotspots[] | {message, status, vulnerabilityProbability, securityCategory}'
```

### OWASP Top 10 Compliance

`Configure OWASP security rules:`
```properties
# Enable OWASP Top 10 rules
sonar.security.hotspots.enabled=true

# Security categories to focus on
sonar.security.categories=sql-injection,xss,path-traversal,ldap-injection,xpath-injection

# Custom security rules
sonar.inclusions=**/*.js,**/*.ts,**/*.py,**/*.java
sonar.exclusions=**/node_modules/**,**/vendor/**,**/third-party/**
```

### Vulnerability Management

```python
# Python script to extract vulnerabilities
import requests
import json

def get_vulnerabilities(sonar_url, project_key, token):
    """Extract vulnerabilities from SonarQube"""
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get vulnerabilities
    response = requests.get(
        f"{sonar_url}/api/issues/search",
        params={
            'componentKeys': project_key,
            'types': 'VULNERABILITY',
            'resolved': 'false'
        },
        headers=headers
    )
    
    vulnerabilities = response.json()
    
    # Process and categorize
    critical_vulns = []
    high_vulns = []
    medium_vulns = []
    
    for issue in vulnerabilities.get('issues', []):
        vuln = {
            'key': issue['key'],
            'rule': issue['rule'],
            'severity': issue['severity'],
            'message': issue['message'],
            'component': issue['component'],
            'line': issue.get('line', 'N/A'),
            'effort': issue.get('effort', 'N/A')
        }
        
        if issue['severity'] in ['BLOCKER', 'CRITICAL']:
            critical_vulns.append(vuln)
        elif issue['severity'] == 'MAJOR':
            high_vulns.append(vuln)
        else:
            medium_vulns.append(vuln)
    
    return {
        'critical': critical_vulns,
        'high': high_vulns,
        'medium': medium_vulns,
        'total': len(vulnerabilities.get('issues', []))
    }

# Usage
vulns = get_vulnerabilities(
    'http://localhost:9000',
    'my-project',
    'your-token-here'
)

print(f"Total vulnerabilities: {vulns['total']}")
print(f"Critical: {len(vulns['critical'])}")
print(f"High: {len(vulns['high'])}")
print(f"Medium: {len(vulns['medium'])}")
```

---

## 📈 Step 9: Reporting and Dashboards

### Custom Dashboard Creation

```javascript
// JavaScript to create custom widgets
const customMetrics = {
  "security": {
    "vulnerabilities": "vulnerabilities",
    "security_hotspots": "security_hotspots",
    "security_rating": "security_rating"
  },
  "reliability": {
    "bugs": "bugs", 
    "reliability_rating": "reliability_rating"
  },
  "maintainability": {
    "code_smells": "code_smells",
    "sqale_rating": "sqale_rating",
    "technical_debt": "sqale_index"
  },
  "coverage": {
    "coverage": "coverage",
    "line_coverage": "line_coverage",
    "branch_coverage": "branch_coverage"
  }
};
```

### Automated Reporting

```bash
#!/bin/bash
# generate-sonar-report.sh

PROJECT_KEY="my-project"
SONAR_URL="http://localhost:9000"
TOKEN="your-token-here"
OUTPUT_DIR="reports"

mkdir -p $OUTPUT_DIR

# Generate metrics report
curl -u $TOKEN: \
  "$SONAR_URL/api/measures/component?component=$PROJECT_KEY&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density" \
  | jq '.component.measures' > $OUTPUT_DIR/metrics.json

# Generate issues report
curl -u $TOKEN: \
  "$SONAR_URL/api/issues/search?componentKeys=$PROJECT_KEY&resolved=false" \
  | jq '.issues' > $OUTPUT_DIR/issues.json

# Generate quality gate status
curl -u $TOKEN: \
  "$SONAR_URL/api/qualitygates/project_status?projectKey=$PROJECT_KEY" \
  | jq '.projectStatus' > $OUTPUT_DIR/quality-gate.json

echo "Reports generated in $OUTPUT_DIR/"
```

---

## 🔧 Step 10: Troubleshooting Common Issues

### Memory and Performance Issues

```yaml
# docker-compose.yml optimization
services:
  sonarqube:
    image: sonarqube:community
    environment:
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - "SONAR_CE_JAVAOPTS=-Xmx2g"
      - "SONAR_WEB_JAVAOPTS=-Xmx1g"
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

### Analysis Failures

```bash
# Debug analysis issues
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=YOUR_TOKEN \
  -Dsonar.verbose=true \
  -Dsonar.log.level=DEBUG
```

### Plugin Management

```bash
# Install additional plugins via API
curl -X POST \
  -u admin:admin \
  "http://localhost:9000/api/plugins/install" \
  -d "key=python"

# Restart SonarQube after plugin installation
docker-compose restart sonarqube
```

---

## 📋 Common Use Cases

### 1. **Enterprise Code Quality**
- Organization-wide quality standards
- Technical debt management
- Security compliance
- Developer training

### 2. **DevSecOps Integration**
- Automated security scanning
- Vulnerability management
- Compliance reporting
- Risk assessment

### 3. **Continuous Improvement**
- Code quality metrics tracking
- Team performance monitoring
- Best practices enforcement
- Knowledge sharing

### 4. **Regulatory Compliance**
- OWASP compliance
- Industry standards adherence
- Audit trail maintenance
- Risk documentation

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🔍 Comprehensive Code Analysis** - Automated detection of bugs, vulnerabilities, and code smells
2. **🛡️ Security Scanning** - SAST capabilities with OWASP Top 10 coverage
3. **📊 Quality Gates** - Automated quality control with customizable thresholds
4. **🔄 CI/CD Integration** - Seamless integration with your development workflow
5. **📈 Metrics & Reporting** - Detailed insights into code quality and technical debt
6. **👥 Team Collaboration** - Shared quality standards and improvement tracking

✅ **SonarQube is now configured and ready to enhance your code quality and security!**
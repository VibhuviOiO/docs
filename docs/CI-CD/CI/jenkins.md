---
sidebar_position: 1
title: Jenkins
description: Jenkins is an open-source automation server for building CI/CD pipelines. Learn how to set up Jenkins with Docker and create automated build pipelines.
slug: /CICD/Jenkins
keywords:
  - Jenkins
  - CI/CD
  - continuous integration
  - automation server
  - Docker Jenkins
  - build pipelines
  - DevOps
  - pipeline as code
  - Jenkinsfile
  - automated testing
---

# 🚀 Setting Up Jenkins for Automated CI/CD Pipelines

**Jenkins** is the leading open-source automation server that enables **continuous integration** and **continuous deployment**. Perfect for automating **builds**, **tests**, and **deployments** across multiple environments with extensive plugin ecosystem.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Docker & Docker Compose** installed
- **Git** for version control
- **Basic understanding** of CI/CD concepts
- **Internet access** to download Jenkins and plugins

---

## 🔧 Step 1: Setup Jenkins with Docker

`Create a docker-compose.yml file:`
```yaml
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "50000:50000"
    environment:
      - JENKINS_OPTS=--httpPort=8080
      - JAVA_OPTS=-Xmx2048m -Xms1024m
    volumes:
      - jenkins-data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - ./jenkins-config:/var/jenkins_home/init.groovy.d
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/login"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Jenkins agent for distributed builds
  jenkins-agent:
    image: jenkins/inbound-agent:latest
    container_name: jenkins-agent
    restart: unless-stopped
    environment:
      - JENKINS_URL=http://jenkins:8080
      - JENKINS_SECRET=${JENKINS_AGENT_SECRET}
      - JENKINS_AGENT_NAME=docker-agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - jenkins

volumes:
  jenkins-data:
```

`Start Jenkins:`
```bash
docker-compose up -d
```

`Get the initial admin password:`
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## 🏗️ Step 2: Initial Jenkins Setup

1. **Visit** `http://localhost:8080`
2. **Enter** the initial admin password from Step 1
3. **Install suggested plugins** or select custom plugins
4. **Create** your first admin user
5. **Configure** Jenkins URL (keep default for local setup)

### Essential Plugins to Install

```bash
# Via Jenkins CLI or UI, install these plugins:
- Pipeline
- Git
- Docker Pipeline
- Blue Ocean
- SonarQube Scanner
- NodeJS
- Python
- Workspace Cleanup
- Build Timeout
- Timestamper
```

---

## 📁 Step 3: Create Your First Pipeline

### Method 1: Pipeline Script (Jenkinsfile)

`Create a Jenkinsfile in your project root:`
```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'myapp'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    // Install Node.js
                    sh '''
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        node --version
                        npm --version
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci
                    npm audit --audit-level=high
                '''
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'reports',
                                reportFiles: 'eslint-report.html',
                                reportName: 'ESLint Report'
                            ])
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh 'npm audit --json > audit-report.json || true'
                        sh 'npx audit-ci --config audit-ci.json'
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    npm run test:coverage
                    npm run test:e2e
                '''
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                    publishCoverage adapters: [
                        istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')
                    ], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
                }
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    npm run build
                    ls -la dist/
                '''
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh '''
                        kubectl config use-context staging
                        kubectl set image deployment/myapp myapp=${DOCKER_IMAGE}:${DOCKER_TAG}
                        kubectl rollout status deployment/myapp
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    sh '''
                        kubectl config use-context production
                        kubectl set image deployment/myapp myapp=${DOCKER_IMAGE}:${DOCKER_TAG}
                        kubectl rollout status deployment/myapp
                    '''
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ Build ${BUILD_NUMBER} succeeded for ${JOB_NAME}"
            )
        }
        failure {
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Build ${BUILD_NUMBER} failed for ${JOB_NAME}"
            )
        }
    }
}
```

### Method 2: Declarative Pipeline via UI

1. **Go to** Jenkins Dashboard → New Item
2. **Select** "Pipeline" and enter a name
3. **Configure** the pipeline:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your Git repository
   - **Script Path**: Jenkinsfile

---

## ▶️ Step 4: Advanced Pipeline Examples

### Python Application Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        PYTHON_VERSION = '3.9'
        VENV_PATH = 'venv'
    }
    
    stages {
        stage('Setup Python') {
            steps {
                sh '''
                    python3 -m venv ${VENV_PATH}
                    source ${VENV_PATH}/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                '''
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint with Flake8') {
                    steps {
                        sh '''
                            source ${VENV_PATH}/bin/activate
                            flake8 . --format=html --htmldir=reports/flake8
                        '''
                    }
                }
                
                stage('Security with Bandit') {
                    steps {
                        sh '''
                            source ${VENV_PATH}/bin/activate
                            bandit -r . -f json -o reports/bandit-report.json
                        '''
                    }
                }
                
                stage('Type Check with MyPy') {
                    steps {
                        sh '''
                            source ${VENV_PATH}/bin/activate
                            mypy . --html-report reports/mypy
                        '''
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    source ${VENV_PATH}/bin/activate
                    pytest --cov=. --cov-report=xml --cov-report=html --junitxml=test-results.xml
                '''
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        source ${VENV_PATH}/bin/activate
                        sonar-scanner \
                            -Dsonar.projectKey=python-app \
                            -Dsonar.sources=. \
                            -Dsonar.python.coverage.reportPaths=coverage.xml \
                            -Dsonar.python.xunit.reportPath=test-results.xml
                    '''
                }
            }
        }
    }
}
```

### Multi-Language Monorepo Pipeline

```groovy
pipeline {
    agent none
    
    stages {
        stage('Build Matrix') {
            matrix {
                axes {
                    axis {
                        name 'SERVICE'
                        values 'frontend', 'backend', 'api'
                    }
                }
                stages {
                    stage('Build Service') {
                        agent any
                        steps {
                            script {
                                dir("services/${SERVICE}") {
                                    if (SERVICE == 'frontend') {
                                        sh '''
                                            npm ci
                                            npm run build
                                            npm run test
                                        '''
                                    } else if (SERVICE == 'backend') {
                                        sh '''
                                            python -m venv venv
                                            source venv/bin/activate
                                            pip install -r requirements.txt
                                            pytest
                                        '''
                                    } else if (SERVICE == 'api') {
                                        sh '''
                                            go mod download
                                            go test ./...
                                            go build -o api
                                        '''
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

---

## 📊 Step 5: Integrating with External Tools

### SonarQube Integration

```groovy
stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQube') {
            sh '''
                sonar-scanner \
                    -Dsonar.projectKey=myapp \
                    -Dsonar.sources=src \
                    -Dsonar.tests=tests \
                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                    -Dsonar.testExecutionReportPaths=test-results.xml
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
```

### Docker Registry Integration

```groovy
stage('Push to Registry') {
    steps {
        script {
            docker.withRegistry('https://your-registry.com', 'registry-credentials') {
                def image = docker.build("myapp:${BUILD_NUMBER}")
                image.push()
                image.push('latest')
            }
        }
    }
}
```

### Kubernetes Deployment

```groovy
stage('Deploy to K8s') {
    steps {
        withKubeConfig([credentialsId: 'k8s-config']) {
            sh '''
                envsubst < k8s/deployment.yaml | kubectl apply -f -
                kubectl rollout status deployment/myapp
                kubectl get services
            '''
        }
    }
}
```

---

## 🔍 Step 6: Monitoring and Notifications

### Slack Integration

```groovy
post {
    success {
        slackSend(
            channel: '#ci-cd',
            color: 'good',
            message: """
                ✅ *Build Successful*
                Job: ${JOB_NAME}
                Build: ${BUILD_NUMBER}
                Duration: ${currentBuild.durationString}
                Changes: ${currentBuild.changeSets.collect { it.items.collect { "${it.author}: ${it.msg}" } }.flatten().join('\n')}
            """
        )
    }
    failure {
        slackSend(
            channel: '#ci-cd',
            color: 'danger',
            message: """
                ❌ *Build Failed*
                Job: ${JOB_NAME}
                Build: ${BUILD_NUMBER}
                Console: ${BUILD_URL}console
            """
        )
    }
}
```

### Email Notifications

```groovy
post {
    always {
        emailext(
            subject: "Build ${currentBuild.result}: ${JOB_NAME} - ${BUILD_NUMBER}",
            body: """
                Build ${currentBuild.result}
                
                Job: ${JOB_NAME}
                Build Number: ${BUILD_NUMBER}
                Build URL: ${BUILD_URL}
                
                Changes:
                ${currentBuild.changeSets.collect { it.items.collect { "${it.author}: ${it.msg}" } }.flatten().join('\n')}
            """,
            to: "${env.CHANGE_AUTHOR_EMAIL}, devops@company.com"
        )
    }
}
```

---

## 🛡️ Step 7: Security and Best Practices

### Credentials Management

```groovy
pipeline {
    agent any
    
    environment {
        // Use Jenkins credentials
        DB_PASSWORD = credentials('database-password')
        API_KEY = credentials('api-key')
        DOCKER_REGISTRY = credentials('docker-registry')
    }
    
    stages {
        stage('Deploy') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'aws-credentials', 
                                   usernameVariable: 'AWS_ACCESS_KEY_ID', 
                                   passwordVariable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws s3 sync dist/ s3://my-bucket/
                    '''
                }
            }
        }
    }
}
```

### Pipeline Security

```groovy
pipeline {
    agent any
    
    options {
        // Prevent concurrent builds
        disableConcurrentBuilds()
        
        // Build timeout
        timeout(time: 1, unit: 'HOURS')
        
        // Keep build logs
        buildDiscarder(logRotator(
            numToKeepStr: '50',
            daysToKeepStr: '30'
        ))
    }
    
    stages {
        stage('Security Scan') {
            steps {
                // Container security scan
                sh 'trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest'
                
                // Dependency check
                sh 'npm audit --audit-level high'
                
                // SAST scan
                sh 'semgrep --config=auto --json --output=semgrep-results.json .'
            }
        }
    }
}
```

---

## 📈 Step 8: Performance Optimization

### Parallel Execution

```groovy
stage('Parallel Tests') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
        }
        stage('E2E Tests') {
            steps {
                sh 'npm run test:e2e'
            }
        }
        stage('Security Tests') {
            steps {
                sh 'npm audit'
            }
        }
    }
}
```

### Build Caching

```groovy
stage('Build with Cache') {
    steps {
        script {
            // Use Docker layer caching
            def image = docker.build("myapp:${BUILD_NUMBER}", "--cache-from myapp:latest .")
            
            // Cache npm dependencies
            sh '''
                if [ -d "node_modules" ]; then
                    echo "Using cached node_modules"
                else
                    npm ci
                fi
            '''
        }
    }
}
```

---

## 🔧 Step 9: Jenkins Configuration as Code

### JCasC Configuration

`Create jenkins.yaml:`
```yaml
jenkins:
  systemMessage: "Jenkins configured automatically by JCasC"
  numExecutors: 2
  mode: NORMAL
  
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: "admin"
          password: "${JENKINS_ADMIN_PASSWORD}"
          
  authorizationStrategy:
    globalMatrix:
      permissions:
        - "Overall/Administer:admin"
        - "Overall/Read:authenticated"

  nodes:
    - permanent:
        name: "docker-agent"
        remoteFS: "/home/jenkins"
        launcher:
          inbound:
            webSocket: true

unclassified:
  location:
    url: "http://localhost:8080/"
    
  sonarGlobalConfiguration:
    installations:
      - name: "SonarQube"
        serverUrl: "http://sonarqube:9000"
        credentialsId: "sonarqube-token"

tool:
  nodejs:
    installations:
      - name: "NodeJS 18"
        properties:
          - installSource:
              installers:
                - nodeJSInstaller:
                    id: "18.17.0"
                    
  git:
    installations:
      - name: "Default"
        home: "/usr/bin/git"

credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              scope: GLOBAL
              id: "docker-hub"
              username: "${DOCKER_USERNAME}"
              password: "${DOCKER_PASSWORD}"
```

---

## 📋 Common Use Cases

### 1. **Web Application CI/CD**
- Automated testing and deployment
- Code quality checks
- Security scanning
- Multi-environment deployments

### 2. **Microservices Pipeline**
- Service-specific builds
- Container orchestration
- API testing
- Service mesh deployment

### 3. **Mobile App CI/CD**
- Cross-platform builds
- App store deployment
- Device testing
- Performance monitoring

### 4. **Infrastructure as Code**
- Terraform validation
- Infrastructure deployment
- Configuration management
- Compliance checking

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Automated Build Pipeline** - Automatic builds on code changes
2. **🧪 Comprehensive Testing** - Unit, integration, and E2E tests
3. **🔍 Code Quality Gates** - Automated quality and security checks
4. **🚀 Automated Deployments** - Push-button deployments to multiple environments
5. **📊 Monitoring & Alerts** - Build status notifications and metrics
6. **🛡️ Security Integration** - Automated security scanning and compliance

✅ **Jenkins is now configured and ready for your CI/CD workflows!**
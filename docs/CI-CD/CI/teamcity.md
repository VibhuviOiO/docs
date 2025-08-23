---
sidebar_position: 6
title: TeamCity
description: TeamCity is a powerful CI/CD server by JetBrains that provides comprehensive build management and deployment automation. Learn how to set up TeamCity with Docker.
slug: /CI-CD/TeamCity
keywords:
  - TeamCity
  - JetBrains TeamCity
  - CI/CD server
  - build automation
  - continuous integration
  - deployment automation
  - build agents
  - build configurations
  - DevOps automation
  - enterprise CI/CD
---

# 🏗️ TeamCity - Professional CI/CD Server by JetBrains

**TeamCity** is a powerful **continuous integration and deployment server** developed by JetBrains. It provides comprehensive **build management**, **testing automation**, and **deployment pipelines** with an intuitive web interface and extensive plugin ecosystem.

---

## Set Up TeamCity with Docker

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  teamcity-server:
    image: jetbrains/teamcity-server:2023.11
    container_name: teamcity-server
    restart: unless-stopped
    ports:
      - "8111:8111"
    volumes:
      - teamcity-server-datadir:/data/teamcity_server/datadir
      - teamcity-server-logs:/opt/teamcity/logs
    environment:
      - TEAMCITY_SERVER_MEM_OPTS=-Xmx2g -XX:ReservedCodeCacheSize=640m
    depends_on:
      - teamcity-db

  teamcity-agent:
    image: jetbrains/teamcity-agent:2023.11
    container_name: teamcity-agent-1
    restart: unless-stopped
    environment:
      - SERVER_URL=http://teamcity-server:8111
      - AGENT_NAME=docker-agent-1
    volumes:
      - teamcity-agent-conf:/data/teamcity_agent/conf
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
    depends_on:
      - teamcity-server

  teamcity-agent-2:
    image: jetbrains/teamcity-agent:2023.11
    container_name: teamcity-agent-2
    restart: unless-stopped
    environment:
      - SERVER_URL=http://teamcity-server:8111
      - AGENT_NAME=docker-agent-2
    volumes:
      - teamcity-agent-2-conf:/data/teamcity_agent/conf
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker:ro
    depends_on:
      - teamcity-server

  teamcity-db:
    image: postgres:15
    container_name: teamcity-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=teamcity
      - POSTGRES_USER=teamcity
      - POSTGRES_PASSWORD=teamcity_password
    volumes:
      - teamcity-postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  teamcity-server-datadir:
  teamcity-server-logs:
  teamcity-agent-conf:
  teamcity-agent-2-conf:
  teamcity-postgres-data:
```

`Start TeamCity:`
```bash
docker compose up -d
```

`Access TeamCity:`
```bash
echo "TeamCity Server: http://localhost:8111"
```

---

## Build Configuration Examples

### Basic Build Configuration (Kotlin DSL)

`Create .teamcity/settings.kts:`
```kotlin
import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildFeatures.dockerSupport
import jetbrains.buildServer.configs.kotlin.buildSteps.*
import jetbrains.buildServer.configs.kotlin.triggers.vcs

version = "2023.11"

project {
    buildType(Build)
    buildType(Test)
    buildType(Deploy)
    
    buildTypesOrder = arrayListOf(Build, Test, Deploy)
}

object Build : BuildType({
    name = "Build Application"
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        script {
            name = "Install Dependencies"
            scriptContent = """
                npm ci
                echo "Dependencies installed successfully"
            """.trimIndent()
        }
        
        script {
            name = "Build Application"
            scriptContent = """
                npm run build
                echo "Build completed successfully"
            """.trimIndent()
        }
        
        dockerCommand {
            name = "Build Docker Image"
            commandType = build {
                source = file {
                    path = "Dockerfile"
                }
                namesAndTags = "myapp:%build.number%"
                commandArgs = "--pull"
            }
        }
    }
    
    triggers {
        vcs {
            branchFilter = "+:*"
        }
    }
    
    features {
        dockerSupport {
            loginToRegistry = on {
                dockerRegistryId = "PROJECT_EXT_DOCKER_REGISTRY"
            }
        }
    }
    
    artifactRules = """
        dist/** => dist.zip
        Dockerfile => .
    """.trimIndent()
})

object Test : BuildType({
    name = "Run Tests"
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        script {
            name = "Unit Tests"
            scriptContent = """
                npm test -- --coverage --watchAll=false
                echo "Unit tests completed"
            """.trimIndent()
        }
        
        script {
            name = "Integration Tests"
            scriptContent = """
                npm run test:integration
                echo "Integration tests completed"
            """.trimIndent()
        }
        
        script {
            name = "Security Scan"
            scriptContent = """
                npm audit --audit-level high
                npm run security:scan
            """.trimIndent()
        }
    }
    
    dependencies {
        snapshot(Build) {
            onDependencyFailure = FailureAction.FAIL_TO_START
        }
    }
    
    features {
        feature {
            type = "xml-report-plugin"
            param("xmlReportParsing.reportType", "junit")
            param("xmlReportParsing.reportDirs", "test-results/*.xml")
        }
    }
})

object Deploy : BuildType({
    name = "Deploy to Staging"
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        dockerCommand {
            name = "Push Docker Image"
            commandType = push {
                namesAndTags = "myregistry.com/myapp:%build.number%"
            }
        }
        
        script {
            name = "Deploy to Kubernetes"
            scriptContent = """
                kubectl set image deployment/myapp myapp=myregistry.com/myapp:%build.number% -n staging
                kubectl rollout status deployment/myapp -n staging --timeout=300s
            """.trimIndent()
        }
        
        script {
            name = "Health Check"
            scriptContent = """
                sleep 30
                curl -f http://staging.myapp.com/health || exit 1
                echo "Deployment successful and healthy"
            """.trimIndent()
        }
    }
    
    dependencies {
        snapshot(Test) {
            onDependencyFailure = FailureAction.FAIL_TO_START
        }
    }
    
    params {
        param("env.KUBECONFIG", "/opt/teamcity/.kube/config")
    }
})
```

### Multi-Environment Pipeline

`Create .teamcity/pipeline.kts:`
```kotlin
import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.*
import jetbrains.buildServer.configs.kotlin.triggers.vcs

object Pipeline : BuildType({
    name = "Full Pipeline"
    type = BuildTypeSettings.Type.DEPLOYMENT
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        // Build Stage
        script {
            name = "Build and Test"
            scriptContent = """
                echo "=== Building Application ==="
                docker build -t myapp:%build.number% .
                
                echo "=== Running Tests ==="
                docker run --rm myapp:%build.number% npm test
                
                echo "=== Security Scan ==="
                docker run --rm -v $(pwd):/app clair-scanner myapp:%build.number%
            """.trimIndent()
        }
        
        // Deploy to Development
        script {
            name = "Deploy to Development"
            scriptContent = """
                echo "=== Deploying to Development ==="
                helm upgrade --install myapp-dev ./helm/myapp \
                  --namespace development \
                  --set image.tag=%build.number% \
                  --set environment=development \
                  --wait --timeout=300s
                
                echo "=== Health Check ==="
                kubectl wait --for=condition=ready pod -l app=myapp -n development --timeout=300s
            """.trimIndent()
        }
        
        // Integration Tests
        script {
            name = "Integration Tests"
            scriptContent = """
                echo "=== Running Integration Tests ==="
                newman run tests/integration/api-tests.json \
                  --environment tests/integration/dev-environment.json \
                  --reporters cli,junit \
                  --reporter-junit-export test-results/integration-results.xml
            """.trimIndent()
        }
        
        // Deploy to Staging
        script {
            name = "Deploy to Staging"
            scriptContent = """
                echo "=== Deploying to Staging ==="
                helm upgrade --install myapp-staging ./helm/myapp \
                  --namespace staging \
                  --set image.tag=%build.number% \
                  --set environment=staging \
                  --set replicas=2 \
                  --wait --timeout=300s
            """.trimIndent()
            conditions {
                equals("teamcity.build.branch", "main")
            }
        }
        
        // Production Deployment (Manual Approval)
        script {
            name = "Deploy to Production"
            scriptContent = """
                echo "=== Deploying to Production ==="
                helm upgrade --install myapp-prod ./helm/myapp \
                  --namespace production \
                  --set image.tag=%build.number% \
                  --set environment=production \
                  --set replicas=3 \
                  --set resources.requests.cpu=500m \
                  --set resources.requests.memory=512Mi \
                  --wait --timeout=600s
                
                echo "=== Production Health Check ==="
                for i in {1..10}; do
                  if curl -f https://api.myapp.com/health; then
                    echo "Production deployment successful!"
                    break
                  fi
                  echo "Waiting for production to be ready... ($i/10)"
                  sleep 30
                done
            """.trimIndent()
            conditions {
                equals("teamcity.build.branch", "main")
            }
        }
    }
    
    triggers {
        vcs {
            branchFilter = "+:*"
        }
    }
    
    features {
        feature {
            type = "commit-status-publisher"
            param("github_authentication_type", "token")
            param("github_host", "https://api.github.com")
            param("github_oauth_user", "teamcity-bot")
            param("secure:github_access_token", "credentialsJSON:github-token")
        }
    }
})
```

---

## Custom Build Agent

### Dockerfile for Custom Agent

`Create custom-agent/Dockerfile:`
```dockerfile
FROM jetbrains/teamcity-agent:2023.11

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    jq \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh && \
    rm get-docker.sh

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install AWS CLI
RUN pip3 install awscli

# Install Terraform
RUN wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip && \
    unzip terraform_1.6.0_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_1.6.0_linux_amd64.zip

# Install Newman for API testing
RUN npm install -g newman

USER buildagent

# Set up build agent configuration
COPY agent.properties /data/teamcity_agent/conf/buildAgent.properties
```

`Create custom-agent/agent.properties:`
```properties
serverUrl=http://teamcity-server:8111
name=custom-docker-agent
workDir=../work
tempDir=../temp
systemDir=../system

# Agent capabilities
system.agent.name=custom-docker-agent
system.docker.version=20.10.0
system.kubectl.version=1.28.0
system.helm.version=3.13.0
system.terraform.version=1.6.0
system.node.version=18.0.0
system.python.version=3.9.0
```

---

## Advanced Build Features

### Parallel Build Configuration

`Create parallel-builds.kts:`
```kotlin
object ParallelBuild : BuildType({
    name = "Parallel Build Pipeline"
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        // Parallel execution using build features
        script {
            name = "Frontend Build"
            scriptContent = """
                cd frontend
                npm ci
                npm run build
                npm run test
            """.trimIndent()
            executionMode = BuildStep.ExecutionMode.RUN_ON_SUCCESS
        }
        
        script {
            name = "Backend Build"
            scriptContent = """
                cd backend
                ./gradlew clean build test
            """.trimIndent()
            executionMode = BuildStep.ExecutionMode.RUN_ON_SUCCESS
        }
        
        script {
            name = "Database Migration Tests"
            scriptContent = """
                cd database
                ./run-migration-tests.sh
            """.trimIndent()
            executionMode = BuildStep.ExecutionMode.RUN_ON_SUCCESS
        }
    }
    
    // Composite build to run steps in parallel
    features {
        feature {
            type = "parallelTests"
            param("parallel.tests.excludes", "")
            param("parallel.tests.includes", "**/*Test.java")
        }
    }
})
```

### Build Templates

`Create build-template.kts:`
```kotlin
object BuildTemplate : Template({
    name = "Standard Build Template"
    
    params {
        param("docker.registry", "myregistry.com")
        param("app.name", "")
        param("app.port", "8080")
    }
    
    vcs {
        root(DslContext.settingsRoot)
    }
    
    steps {
        script {
            name = "Setup Environment"
            scriptContent = """
                echo "Building %app.name%"
                echo "Registry: %docker.registry%"
                echo "Build Number: %build.number%"
            """.trimIndent()
        }
        
        dockerCommand {
            name = "Build Docker Image"
            commandType = build {
                source = file {
                    path = "Dockerfile"
                }
                namesAndTags = "%docker.registry%/%app.name%:%build.number%"
                commandArgs = "--build-arg APP_PORT=%app.port%"
            }
        }
        
        script {
            name = "Run Tests"
            scriptContent = """
                docker run --rm %docker.registry%/%app.name%:%build.number% npm test
            """.trimIndent()
        }
        
        dockerCommand {
            name = "Push Image"
            commandType = push {
                namesAndTags = "%docker.registry%/%app.name%:%build.number%"
            }
        }
    }
    
    triggers {
        vcs {
            branchFilter = "+:*"
        }
    }
})

// Use template in specific build
object WebAppBuild : BuildType({
    name = "Web Application Build"
    
    templates(BuildTemplate)
    
    params {
        param("app.name", "webapp")
        param("app.port", "3000")
    }
})

object ApiBuild : BuildType({
    name = "API Build"
    
    templates(BuildTemplate)
    
    params {
        param("app.name", "api")
        param("app.port", "8080")
    }
})
```

---

## Integration with External Tools

### Slack Notifications

`Create notifications.kts:`
```kotlin
object NotificationBuild : BuildType({
    name = "Build with Notifications"
    
    steps {
        script {
            name = "Build Application"
            scriptContent = "echo 'Building application...'"
        }
    }
    
    features {
        feature {
            type = "notifications"
            param("notifier", "slackNotifier")
            param("buildStarted", "true")
            param("buildSuccessful", "true")
            param("buildFailed", "true")
            param("buildFailedToStart", "true")
            param("firstSuccessAfterFailure", "true")
            param("channel", "#ci-cd")
            param("addBranch", "true")
            param("addChanges", "true")
        }
    }
})
```

### SonarQube Integration

`Create sonar-integration.kts:`
```kotlin
object SonarQubeBuild : BuildType({
    name = "Build with SonarQube Analysis"
    
    steps {
        script {
            name = "Build and Test"
            scriptContent = """
                ./gradlew clean build test jacocoTestReport
            """.trimIndent()
        }
        
        sonarQubeRunner {
            name = "SonarQube Analysis"
            serverUrl = "http://sonarqube:9000"
            serverAuthToken = "credentialsJSON:sonar-token"
            projectKey = "my-project"
            projectName = "My Project"
            projectVersion = "%build.number%"
            sourcesPath = "src/main/java"
            testsPath = "src/test/java"
            coverageReportPath = "build/reports/jacoco/test/jacocoTestReport.xml"
        }
    }
    
    features {
        feature {
            type = "sonar-plugin"
            param("sonarServer", "sonarqube-server")
        }
    }
})
```

---

## Monitoring and Reporting

### Build Metrics Dashboard

`Create metrics-config.json:`
```json
{
  "dashboard": {
    "title": "TeamCity Build Metrics",
    "widgets": [
      {
        "type": "build-success-rate",
        "buildTypes": ["Build", "Test", "Deploy"],
        "timeRange": "7d"
      },
      {
        "type": "build-duration",
        "buildTypes": ["Build"],
        "timeRange": "30d"
      },
      {
        "type": "test-results",
        "buildTypes": ["Test"],
        "timeRange": "7d"
      },
      {
        "type": "deployment-frequency",
        "buildTypes": ["Deploy"],
        "timeRange": "30d"
      }
    ]
  }
}
```

### Custom Build Report

`Create build-report.py:`
```python
#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

class TeamCityReporter:
    def __init__(self, server_url, username, password):
        self.server_url = server_url
        self.auth = (username, password)
        self.headers = {'Accept': 'application/json'}
    
    def get_build_statistics(self, build_type_id, days=7):
        """Get build statistics for the last N days"""
        since_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%dT%H%M%S%z')
        
        url = f"{self.server_url}/app/rest/builds"
        params = {
            'locator': f'buildType:{build_type_id},sinceDate:{since_date}',
            'fields': 'build(id,number,status,startDate,finishDate,buildType(name))'
        }
        
        response = requests.get(url, auth=self.auth, headers=self.headers, params=params)
        return response.json()
    
    def calculate_metrics(self, builds):
        """Calculate build metrics"""
        total_builds = len(builds.get('build', []))
        successful_builds = len([b for b in builds.get('build', []) if b['status'] == 'SUCCESS'])
        failed_builds = total_builds - successful_builds
        
        success_rate = (successful_builds / total_builds * 100) if total_builds > 0 else 0
        
        # Calculate average build time
        durations = []
        for build in builds.get('build', []):
            if 'startDate' in build and 'finishDate' in build:
                start = datetime.fromisoformat(build['startDate'].replace('Z', '+00:00'))
                finish = datetime.fromisoformat(build['finishDate'].replace('Z', '+00:00'))
                durations.append((finish - start).total_seconds())
        
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        return {
            'total_builds': total_builds,
            'successful_builds': successful_builds,
            'failed_builds': failed_builds,
            'success_rate': round(success_rate, 2),
            'average_duration_seconds': round(avg_duration, 2),
            'average_duration_minutes': round(avg_duration / 60, 2)
        }
    
    def generate_report(self, build_type_ids):
        """Generate comprehensive build report"""
        report = {
            'generated_at': datetime.now().isoformat(),
            'build_types': {}
        }
        
        for build_type_id in build_type_ids:
            builds = self.get_build_statistics(build_type_id)
            metrics = self.calculate_metrics(builds)
            report['build_types'][build_type_id] = metrics
        
        return report

# Usage
if __name__ == "__main__":
    reporter = TeamCityReporter(
        server_url="http://localhost:8111",
        username="admin",
        password="admin"
    )
    
    build_types = ["Build", "Test", "Deploy"]
    report = reporter.generate_report(build_types)
    
    print(json.dumps(report, indent=2))
```

---

## Common Use Cases

- **Enterprise CI/CD**: Large-scale build automation with multiple agents
- **Multi-Technology Builds**: Java, .NET, Node.js, Python applications
- **Complex Deployment Pipelines**: Multi-environment deployments with approvals
- **Build Analytics**: Comprehensive reporting and metrics tracking
- **Integration Testing**: Automated testing across multiple services and environments

✅ TeamCity is now configured for professional CI/CD workflows!
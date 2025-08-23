---
sidebar_position: 13
title: Bitbucket Pipelines
description: Bitbucket Pipelines is an integrated CI/CD service built into Bitbucket. Learn how to create automated build, test, and deployment pipelines with YAML configuration.
slug: /CICD/BitbucketPipelines
keywords:
  - Bitbucket Pipelines
  - Atlassian CI/CD
  - integrated CI/CD
  - YAML pipelines
  - Docker containers
  - automated deployment
  - Git-based CI/CD
  - cloud CI/CD
  - pipeline as code
  - DevOps automation
---

# 🚀 Integrated CI/CD with Bitbucket Pipelines

**Bitbucket Pipelines** is an integrated **CI/CD service** built into Bitbucket that allows you to automatically **build**, **test**, and **deploy** your code based on a configuration file in your repository. Perfect for teams already using **Bitbucket** with **Docker-based** execution environments.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Bitbucket account** with repository access
- **Bitbucket Pipelines** enabled for your repository
- **Basic understanding** of YAML and Docker
- **Application code** in a Bitbucket repository
- **Deployment targets** (staging/production environments)

---

## 🔧 Step 1: Enable Bitbucket Pipelines

### Enable Pipelines in Repository

1. **Navigate** to your Bitbucket repository
2. **Go to** Repository Settings → Pipelines → Settings
3. **Enable** Pipelines
4. **Configure** build minutes and parallel builds if needed

### Repository Structure

```
your-project/
├── src/
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
├── tests/
│   ├── unit/
│   └── integration/
├── deployment/
│   ├── staging.yml
│   └── production.yml
├── bitbucket-pipelines.yml  # Main pipeline configuration
└── README.md
```

---

## 🏗️ Step 2: Create Basic Pipeline Configuration

### Simple Node.js Pipeline

`Create bitbucket-pipelines.yml:`
```yaml
# Bitbucket Pipelines configuration
image: node:18

definitions:
  caches:
    nodemodules: node_modules

pipelines:
  default:
    - step:
        name: Build and Test
        caches:
          - nodemodules
        script:
          - echo "Starting build process..."
          - npm ci
          - npm run lint
          - npm run test
          - npm run build
        artifacts:
          - dist/**
          - coverage/**
          
  branches:
    main:
      - step:
          name: Build and Test
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run lint
            - npm run test:coverage
            - npm run build
          artifacts:
            - dist/**
            - coverage/**
            
      - step:
          name: Security Scan
          script:
            - npm audit --audit-level high
            - npx snyk test
            
      - step:
          name: Deploy to Staging
          deployment: staging
          script:
            - echo "Deploying to staging..."
            - npm run deploy:staging
            
      - step:
          name: Deploy to Production
          deployment: production
          trigger: manual
          script:
            - echo "Deploying to production..."
            - npm run deploy:production

    develop:
      - step:
          name: Build and Test
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run test
            - npm run build
            
      - step:
          name: Deploy to Development
          deployment: development
          script:
            - echo "Deploying to development..."
            - npm run deploy:dev

  pull-requests:
    '**':
      - step:
          name: PR Build and Test
          caches:
            - nodemodules
          script:
            - npm ci
            - npm run lint
            - npm run test
            - npm run build
```

---

## ▶️ Step 3: Advanced Multi-Language Pipeline

### Full-Stack Application Pipeline

`Create advanced bitbucket-pipelines.yml:`
```yaml
image: atlassian/default-image:3

definitions:
  services:
    postgres:
      image: postgres:15
      variables:
        POSTGRES_DB: testdb
        POSTGRES_USER: testuser
        POSTGRES_PASSWORD: testpass
        
    redis:
      image: redis:7-alpine
      
  caches:
    nodemodules: frontend/node_modules
    pip: ~/.cache/pip
    maven: ~/.m2/repository
    
  steps:
    - step: &frontend-build
        name: Frontend Build & Test
        image: node:18
        caches:
          - nodemodules
        script:
          - cd frontend
          - npm ci
          - npm run lint
          - npm run test:unit
          - npm run build
        artifacts:
          - frontend/dist/**
          - frontend/coverage/**
          
    - step: &backend-build
        name: Backend Build & Test
        image: python:3.9
        services:
          - postgres
          - redis
        caches:
          - pip
        script:
          - cd backend
          - pip install -r requirements.txt
          - pip install -r requirements-dev.txt
          - flake8 .
          - pytest tests/ --cov=app --cov-report=xml
          - python -m pytest tests/integration/
        artifacts:
          - backend/coverage.xml
          - backend/test-results.xml
          
    - step: &api-tests
        name: API Integration Tests
        image: python:3.9
        services:
          - postgres
          - redis
        script:
          - cd backend
          - pip install -r requirements.txt
          - python -m pytest tests/api/ -v
          - newman run postman/api-tests.json
          
    - step: &security-scan
        name: Security Scanning
        script:
          # Frontend security
          - cd frontend && npm audit --audit-level high
          - cd frontend && npx snyk test
          
          # Backend security
          - cd backend && pip install safety bandit
          - cd backend && safety check
          - cd backend && bandit -r app/
          
          # Container security
          - docker build -t myapp:$BITBUCKET_BUILD_NUMBER .
          - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image myapp:$BITBUCKET_BUILD_NUMBER
            
    - step: &build-docker
        name: Build Docker Image
        services:
          - docker
        script:
          - export IMAGE_NAME=$BITBUCKET_REPO_FULL_NAME
          - export IMAGE_TAG=$BITBUCKET_BUILD_NUMBER
          - docker build -t $IMAGE_NAME:$IMAGE_TAG .
          - docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest
          
          # Push to registry
          - echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
          - docker push $IMAGE_NAME:$IMAGE_TAG
          - docker push $IMAGE_NAME:latest
          
    - step: &deploy-staging
        name: Deploy to Staging
        deployment: staging
        script:
          - echo "Deploying to staging environment..."
          - export IMAGE_TAG=$BITBUCKET_BUILD_NUMBER
          
          # Update Kubernetes deployment
          - kubectl config use-context staging
          - kubectl set image deployment/myapp myapp=$BITBUCKET_REPO_FULL_NAME:$IMAGE_TAG
          - kubectl rollout status deployment/myapp
          
          # Run smoke tests
          - sleep 30
          - curl -f https://staging.myapp.com/health
          
    - step: &e2e-tests
        name: End-to-End Tests
        image: cypress/included:13.3.0
        script:
          - cd e2e-tests
          - npm ci
          - cypress run --config baseUrl=https://staging.myapp.com
        artifacts:
          - e2e-tests/cypress/screenshots/**
          - e2e-tests/cypress/videos/**
          
    - step: &deploy-production
        name: Deploy to Production
        deployment: production
        trigger: manual
        script:
          - echo "Deploying to production environment..."
          - export IMAGE_TAG=$BITBUCKET_BUILD_NUMBER
          
          # Blue-green deployment
          - kubectl config use-context production
          - kubectl apply -f deployment/blue-green-deployment.yml
          - kubectl set image deployment/myapp-green myapp=$BITBUCKET_REPO_FULL_NAME:$IMAGE_TAG
          - kubectl rollout status deployment/myapp-green
          
          # Switch traffic
          - kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'
          
          # Verify deployment
          - sleep 60
          - curl -f https://myapp.com/health

pipelines:
  default:
    - parallel:
        - step: *frontend-build
        - step: *backend-build
    - step: *api-tests
    
  branches:
    main:
      - parallel:
          - step: *frontend-build
          - step: *backend-build
      - step: *security-scan
      - step: *build-docker
      - step: *deploy-staging
      - step: *e2e-tests
      - step: *deploy-production
      
    develop:
      - parallel:
          - step: *frontend-build
          - step: *backend-build
      - step: *api-tests
      - step:
          name: Deploy to Development
          deployment: development
          script:
            - echo "Deploying to development..."
            - kubectl config use-context development
            - kubectl set image deployment/myapp myapp=$BITBUCKET_REPO_FULL_NAME:latest
            
  pull-requests:
    '**':
      - parallel:
          - step: *frontend-build
          - step: *backend-build
      - step: *api-tests
      - step:
          name: PR Quality Check
          script:
            - echo "Running quality checks for PR..."
            - cd frontend && npm run lint:report
            - cd backend && flake8 --format=html --htmldir=reports/flake8
          artifacts:
            - frontend/lint-report.html
            - backend/reports/**
            
  custom:
    security-audit:
      - step: *security-scan
      
    performance-test:
      - step:
          name: Performance Testing
          image: loadimpact/k6:latest
          script:
            - k6 run --out json=results.json performance-tests/load-test.js
          artifacts:
            - results.json
```

---

## 📊 Step 4: Database Migrations and Testing

### Database Pipeline with Migrations

```yaml
definitions:
  services:
    postgres:
      image: postgres:15
      variables:
        POSTGRES_DB: myapp
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        
  steps:
    - step: &database-setup
        name: Database Setup & Migrations
        image: python:3.9
        services:
          - postgres
        script:
          - pip install -r requirements.txt
          - export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
          
          # Wait for database
          - apt-get update && apt-get install -y postgresql-client
          - until pg_isready -h localhost -p 5432; do sleep 1; done
          
          # Run migrations
          - python manage.py migrate
          - python manage.py loaddata fixtures/test_data.json
          
          # Verify database
          - python manage.py check --database default
          
    - step: &integration-tests
        name: Integration Tests with Database
        image: python:3.9
        services:
          - postgres
        script:
          - pip install -r requirements.txt
          - export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
          - until pg_isready -h localhost -p 5432; do sleep 1; done
          
          # Run database tests
          - python -m pytest tests/integration/ -v
          - python -m pytest tests/models/ -v
          
          # Performance tests
          - python -m pytest tests/performance/ -v --benchmark-only
        artifacts:
          - test-results.xml
          - benchmark-results.json

pipelines:
  branches:
    main:
      - step: *database-setup
      - step: *integration-tests
```

---

## 🔍 Step 5: Multi-Environment Deployments

### Environment-Specific Configurations

```yaml
definitions:
  steps:
    - step: &deploy-to-aws
        name: Deploy to AWS
        image: atlassian/pipelines-awscli:latest
        script:
          - export AWS_DEFAULT_REGION=$AWS_REGION
          - export IMAGE_TAG=$BITBUCKET_BUILD_NUMBER
          
          # Update ECS service
          - aws ecs update-service \
              --cluster $ECS_CLUSTER \
              --service $ECS_SERVICE \
              --task-definition $TASK_DEFINITION:$IMAGE_TAG
              
          # Wait for deployment
          - aws ecs wait services-stable \
              --cluster $ECS_CLUSTER \
              --services $ECS_SERVICE
              
          # Verify deployment
          - aws ecs describe-services \
              --cluster $ECS_CLUSTER \
              --services $ECS_SERVICE
              
    - step: &deploy-to-gcp
        name: Deploy to Google Cloud
        image: google/cloud-sdk:alpine
        script:
          - echo $GCLOUD_SERVICE_KEY | base64 -d > gcloud-service-key.json
          - gcloud auth activate-service-account --key-file gcloud-service-key.json
          - gcloud config set project $GCLOUD_PROJECT
          
          # Deploy to Cloud Run
          - gcloud run deploy $SERVICE_NAME \
              --image gcr.io/$GCLOUD_PROJECT/$IMAGE_NAME:$BITBUCKET_BUILD_NUMBER \
              --platform managed \
              --region $GCLOUD_REGION \
              --allow-unauthenticated
              
    - step: &deploy-to-azure
        name: Deploy to Azure
        image: mcr.microsoft.com/azure-cli:latest
        script:
          - az login --service-principal \
              -u $AZURE_CLIENT_ID \
              -p $AZURE_CLIENT_SECRET \
              --tenant $AZURE_TENANT_ID
              
          # Deploy to Container Instances
          - az container create \
              --resource-group $AZURE_RESOURCE_GROUP \
              --name $CONTAINER_NAME \
              --image $DOCKER_REGISTRY/$IMAGE_NAME:$BITBUCKET_BUILD_NUMBER \
              --dns-name-label $DNS_LABEL \
              --ports 80

pipelines:
  branches:
    main:
      - step:
          name: Build and Push
          services:
            - docker
          script:
            - docker build -t myapp:$BITBUCKET_BUILD_NUMBER .
            - echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
            - docker push myapp:$BITBUCKET_BUILD_NUMBER
            
      - parallel:
          - step:
              <<: *deploy-to-aws
              deployment: aws-production
          - step:
              <<: *deploy-to-gcp
              deployment: gcp-production
          - step:
              <<: *deploy-to-azure
              deployment: azure-production
```

---

## 📈 Step 6: Advanced Pipeline Features

### Conditional Deployments and Approvals

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Build Application
          script:
            - echo "Building application..."
            - npm run build
            
      - step:
          name: Deploy to Staging
          deployment: staging
          script:
            - echo "Deploying to staging..."
            
      - step:
          name: Run Acceptance Tests
          script:
            - echo "Running acceptance tests..."
            - npm run test:acceptance
            
      - step:
          name: Production Deployment Approval
          script:
            - echo "Waiting for production deployment approval..."
          trigger: manual
          
      - step:
          name: Deploy to Production
          deployment: production
          script:
            - echo "Deploying to production..."
            
  tags:
    'v*':
      - step:
          name: Build Release
          script:
            - echo "Building release $BITBUCKET_TAG"
            - npm run build:production
            
      - step:
          name: Create Release Package
          script:
            - tar -czf release-$BITBUCKET_TAG.tar.gz dist/
          artifacts:
            - release-*.tar.gz
            
      - step:
          name: Deploy Release
          deployment: production
          script:
            - echo "Deploying release $BITBUCKET_TAG"
```

### Pipeline Variables and Secrets

```yaml
# Using repository variables and secrets
pipelines:
  default:
    - step:
        name: Deploy with Variables
        script:
          - echo "Environment: $ENVIRONMENT"
          - echo "API URL: $API_URL"
          - echo "Database: $DATABASE_NAME"
          
          # Use secured variables (defined in repository settings)
          - curl -H "Authorization: Bearer $API_TOKEN" $API_URL/deploy
          - kubectl config set-credentials user --token=$KUBE_TOKEN
```

### Parallel and Matrix Builds

```yaml
pipelines:
  default:
    - parallel:
        - step:
            name: Test Node 16
            image: node:16
            script:
              - npm ci
              - npm test
        - step:
            name: Test Node 18
            image: node:18
            script:
              - npm ci
              - npm test
        - step:
            name: Test Node 20
            image: node:20
            script:
              - npm ci
              - npm test
              
    - step:
        name: Integration Tests
        script:
          - echo "All Node versions passed, running integration tests..."
```

---

## 🛡️ Step 7: Security and Best Practices

### Secure Pipeline Configuration

```yaml
definitions:
  steps:
    - step: &security-hardened
        name: Security Hardened Build
        image: node:18-alpine
        script:
          # Update packages
          - apk update && apk upgrade
          
          # Install dependencies
          - npm ci --only=production
          
          # Security audit
          - npm audit --audit-level high
          
          # Vulnerability scanning
          - npx snyk test --severity-threshold=high
          
          # Build with security flags
          - npm run build:secure
          
        # Resource limits
        size: 2x
        
        # Fail fast on security issues
        fail-fast: true

pipelines:
  default:
    - step: *security-hardened
```

### SAST and Dependency Scanning

```yaml
definitions:
  steps:
    - step: &sast-scan
        name: Static Application Security Testing
        script:
          # SonarQube scan
          - sonar-scanner \
              -Dsonar.projectKey=$SONAR_PROJECT_KEY \
              -Dsonar.sources=src \
              -Dsonar.host.url=$SONAR_HOST_URL \
              -Dsonar.login=$SONAR_TOKEN
              
          # Semgrep SAST
          - python -m pip install semgrep
          - semgrep --config=auto --json --output=semgrep-results.json .
          
          # CodeQL analysis
          - codeql database create codeql-db --language=javascript
          - codeql database analyze codeql-db --format=json --output=codeql-results.json
          
        artifacts:
          - semgrep-results.json
          - codeql-results.json
          - sonar-report.json

pipelines:
  pull-requests:
    '**':
      - step: *sast-scan
```

---

## 📋 Common Use Cases

### 1. **Web Application CI/CD**
- Frontend and backend builds
- Automated testing and quality checks
- Multi-environment deployments
- Performance and security testing

### 2. **Microservices Pipeline**
- Service-specific builds
- Container orchestration
- API testing and integration
- Service mesh deployment

### 3. **Mobile App CI/CD**
- Cross-platform builds
- App store deployment
- Device testing
- Performance monitoring

### 4. **Infrastructure as Code**
- Terraform validation and deployment
- Configuration management
- Compliance checking
- Multi-cloud deployments

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Integrated CI/CD Pipeline** - Seamless integration with Bitbucket repositories
2. **🧪 Comprehensive Testing** - Unit, integration, and end-to-end testing
3. **🔍 Quality Gates** - Automated code quality and security checks
4. **🚀 Multi-Environment Deployment** - Staging and production deployments
5. **📊 Pipeline Monitoring** - Build status and deployment tracking
6. **🛡️ Security Integration** - SAST, dependency scanning, and container security
7. **⚡ Parallel Execution** - Efficient parallel build and test execution
8. **🔄 GitOps Workflow** - Git-based pipeline configuration and versioning

✅ **Bitbucket Pipelines is now configured for your integrated CI/CD workflows!**
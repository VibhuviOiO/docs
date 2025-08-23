---
sidebar_position: 2
title: GitHub Actions
description: GitHub Actions provides powerful CI/CD automation directly integrated with GitHub repositories. Learn how to create workflows for automated testing and deployment.
slug: /CICD/GitHubActions
keywords:
  - GitHub Actions
  - CI/CD
  - continuous integration
  - workflow automation
  - GitHub workflows
  - YAML workflows
  - DevOps
  - automated testing
  - deployment automation
  - GitHub runners
---

# 🚀 GitHub Actions for Automated CI/CD Workflows

**GitHub Actions** is GitHub's native **CI/CD platform** that enables you to automate **builds**, **tests**, and **deployments** directly from your GitHub repository. Perfect for **seamless integration** with your development workflow and **extensive marketplace** of pre-built actions.

---

## 🧰 Prerequisites

Make sure you have the following:
- **GitHub repository** with admin access
- **Basic understanding** of YAML syntax
- **Git** for version control
- **Docker** (optional, for containerized workflows)
- **Cloud provider accounts** (optional, for deployments)

---

## 🔧 Step 1: Create Your First Workflow

### Basic Workflow Structure

`Create .github/workflows/ci.yml in your repository:`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.9'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for SonarQube
          
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Install Dependencies
        run: |
          npm ci
          npm audit --audit-level=high
          
      - name: Run Linting
        run: npm run lint
        
      - name: Run Tests
        run: |
          npm run test:coverage
          npm run test:e2e
          
      - name: Upload Coverage Reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            coverage/
            test-results.xml
```

---

## 🏗️ Step 2: Advanced Workflow Examples

### Full-Stack Application Pipeline

```yaml
name: Full-Stack CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      infrastructure: ${{ steps.changes.outputs.infrastructure }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'frontend/**'
              - 'package.json'
            backend:
              - 'backend/**'
              - 'requirements.txt'
            infrastructure:
              - 'infrastructure/**'
              - 'k8s/**'

  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
          
      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci
        
      - name: Run Linting
        working-directory: ./frontend
        run: |
          npm run lint
          npm run type-check
          
      - name: Run Unit Tests
        working-directory: ./frontend
        run: npm run test:unit -- --coverage
        
      - name: Run E2E Tests
        working-directory: ./frontend
        run: |
          npm run build
          npm run test:e2e
          
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          scanMetadataReportFile: frontend/sonar-report.json

  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          cache: 'pip'
          
      - name: Install Dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
          
      - name: Run Linting
        working-directory: ./backend
        run: |
          flake8 .
          black --check .
          mypy .
          
      - name: Run Security Scan
        working-directory: ./backend
        run: |
          bandit -r . -f json -o bandit-report.json
          safety check --json --output safety-report.json
          
      - name: Run Tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379/0
        run: |
          pytest --cov=. --cov-report=xml --cov-report=html --junitxml=test-results.xml
          
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

  build-and-push:
    name: Build and Push Images
    runs-on: ubuntu-latest
    needs: [frontend-test, backend-test, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
      
    strategy:
      matrix:
        component: [frontend, backend]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
            
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.component }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name staging-cluster
          envsubst < k8s/staging/deployment.yaml | kubectl apply -f -
          kubectl rollout status deployment/myapp-frontend
          kubectl rollout status deployment/myapp-backend
          
      - name: Run Smoke Tests
        run: |
          curl -f https://staging.myapp.com/health
          curl -f https://staging.myapp.com/api/health

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name production-cluster
          envsubst < k8s/production/deployment.yaml | kubectl apply -f -
          kubectl rollout status deployment/myapp-frontend
          kubectl rollout status deployment/myapp-backend
          
      - name: Run Health Checks
        run: |
          curl -f https://myapp.com/health
          curl -f https://myapp.com/api/health
          
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ▶️ Step 3: Language-Specific Workflows

### Python Application Workflow

```yaml
name: Python CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.8, 3.9, '3.10', 3.11]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
          
      - name: Lint with flake8
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
          
      - name: Format check with black
        run: black --check .
        
      - name: Type check with mypy
        run: mypy .
        
      - name: Security check with bandit
        run: bandit -r . -f json -o bandit-report.json
        
      - name: Test with pytest
        run: |
          pytest --cov=. --cov-report=xml --cov-report=html --junitxml=junit.xml -v
          
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          flags: unittests
          name: codecov-umbrella
          
  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest
          
      - name: Test Docker image
        run: |
          docker run --rm myapp:latest python -c "import app; print('App imported successfully')"
          
      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myapp:${{ github.sha }}
          docker push myapp:latest
```

### Go Application Workflow

```yaml
name: Go CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
          cache: true
          
      - name: Download dependencies
        run: go mod download
        
      - name: Verify dependencies
        run: go mod verify
        
      - name: Run vet
        run: go vet ./...
        
      - name: Install staticcheck
        run: go install honnef.co/go/tools/cmd/staticcheck@latest
        
      - name: Run staticcheck
        run: staticcheck ./...
        
      - name: Install golint
        run: go install golang.org/x/lint/golint@latest
        
      - name: Run golint
        run: golint ./...
        
      - name: Run tests
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb?sslmode=disable
        run: |
          go test -race -covermode atomic -coverprofile=covprofile ./...
          
      - name: Install goveralls
        run: go install github.com/mattn/goveralls@latest
        
      - name: Send coverage
        env:
          COVERALLS_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: goveralls -coverprofile=covprofile -service=github
        
      - name: Build
        run: go build -v ./...

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gosec Security Scanner
        uses: securecodewarrior/github-action-gosec@master
        with:
          args: '-fmt sarif -out results.sarif ./...'
          
      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

---

## 📊 Step 4: Advanced Features

### Matrix Builds

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [16, 18, 20]
        include:
          - os: ubuntu-latest
            node-version: 18
            coverage: true
        exclude:
          - os: windows-latest
            node-version: 16
            
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Run tests
        run: npm test
        
      - name: Upload coverage
        if: matrix.coverage
        uses: codecov/codecov-action@v3
```

### Conditional Workflows

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      docs: ${{ steps.changes.outputs.docs }}
      src: ${{ steps.changes.outputs.src }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            docs:
              - 'docs/**'
              - '*.md'
            src:
              - 'src/**'
              - 'package.json'

  test:
    needs: changes
    if: needs.changes.outputs.src == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test

  docs:
    needs: changes
    if: needs.changes.outputs.docs == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build docs
        run: npm run docs:build
```

### Reusable Workflows

`Create .github/workflows/reusable-test.yml:`
```yaml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      working-directory:
        required: false
        type: string
        default: '.'
    secrets:
      NPM_TOKEN:
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: npm ci
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          
      - name: Run tests
        run: npm test
```

`Use the reusable workflow:`
```yaml
name: Main CI

on: [push, pull_request]

jobs:
  frontend-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      working-directory: './frontend'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  backend-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '16'
      working-directory: './backend'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🔍 Step 5: Monitoring and Debugging

### Workflow Status Badges

```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
![Deploy](https://github.com/username/repo/workflows/Deploy/badge.svg?branch=main)
```

### Debug Logging

```yaml
steps:
  - name: Debug Information
    run: |
      echo "Event: ${{ github.event_name }}"
      echo "Ref: ${{ github.ref }}"
      echo "SHA: ${{ github.sha }}"
      echo "Actor: ${{ github.actor }}"
      echo "Workspace: ${{ github.workspace }}"
      
  - name: Enable Debug Logging
    run: echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV
    
  - name: List Environment Variables
    run: env | sort
```

### Artifact Management

```yaml
steps:
  - name: Upload Build Artifacts
    uses: actions/upload-artifact@v4
    with:
      name: build-artifacts
      path: |
        dist/
        build/
        *.log
      retention-days: 30
      
  - name: Download Artifacts
    uses: actions/download-artifact@v4
    with:
      name: build-artifacts
      path: ./artifacts
```

---

## 🛡️ Step 6: Security Best Practices

### Secrets Management

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ vars.AWS_REGION }}
          
      - name: Deploy with secrets
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          # Never echo secrets
          echo "Deploying with configured credentials"
          ./deploy.sh
```

### OIDC Authentication

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
          aws-region: us-east-1
          
      - name: Deploy to AWS
        run: |
          aws s3 sync ./dist s3://my-bucket/
```

---

## 📈 Step 7: Performance Optimization

### Caching Strategies

```yaml
steps:
  - name: Cache Node modules
    uses: actions/cache@v3
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-node-
        
  - name: Cache Docker layers
    uses: actions/cache@v3
    with:
      path: /tmp/.buildx-cache
      key: ${{ runner.os }}-buildx-${{ github.sha }}
      restore-keys: |
        ${{ runner.os }}-buildx-
```

### Self-Hosted Runners

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build with GPU
        run: |
          nvidia-smi
          python train_model.py --gpu
```

---

## 📋 Common Use Cases

### 1. **Web Application Deployment**
- Automated testing and building
- Multi-environment deployments
- Database migrations
- CDN cache invalidation

### 2. **Mobile App CI/CD**
- Cross-platform builds
- App store deployments
- Device testing
- Beta distribution

### 3. **Infrastructure as Code**
- Terraform validation and deployment
- Kubernetes manifest updates
- Security compliance checks
- Cost optimization

### 4. **Machine Learning Pipelines**
- Model training and validation
- Data pipeline orchestration
- Model deployment
- Performance monitoring

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🔄 Automated Workflows** - Trigger builds on code changes
2. **🧪 Comprehensive Testing** - Multi-language and multi-platform testing
3. **🔒 Security Integration** - Automated security scanning and compliance
4. **🚀 Deployment Automation** - Push-button deployments with approvals
5. **📊 Monitoring & Notifications** - Real-time status updates and alerts
6. **⚡ Performance Optimization** - Efficient builds with caching and parallelization

✅ **GitHub Actions is now configured and ready for your automated workflows!**
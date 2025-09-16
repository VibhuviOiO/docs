---
sidebar_position: 3
title: GitLab CI/CD
description: GitLab CI/CD provides integrated continuous integration and deployment with YAML-based configuration, built-in Docker support, and comprehensive DevOps features.
slug: /CICD/GitLabCI
keywords:
  - GitLab CI/CD
  - CI/CD pipeline
  - GitLab runners
  - YAML configuration
  - DevOps automation
  - continuous integration
  - continuous deployment
  - GitLab registry
---

# 🚀 Comprehensive CI/CD with GitLab Pipelines

**GitLab CI/CD** provides **integrated** continuous integration and deployment with **YAML-based** configuration, **built-in Docker registry**, and **comprehensive DevOps** features. Perfect for **end-to-end** software delivery with **security scanning**, **monitoring**, and **collaboration** tools.

## Key Features

- **Integrated Platform**: Complete DevOps platform with CI/CD, registry, and monitoring
- **YAML Configuration**: Simple `.gitlab-ci.yml` file for pipeline definition
- **Built-in Registry**: Container registry included with every project
- **Auto DevOps**: Automatic CI/CD pipeline generation
- **Security Scanning**: Built-in SAST, DAST, dependency scanning

## Use Cases

- **Full-Stack Applications**: Complete CI/CD for web applications
- **Microservices**: Multi-service pipeline orchestration
- **Infrastructure as Code**: Terraform and Kubernetes deployments
- **Security-First**: Integrated security scanning and compliance

---

## 🧰 Prerequisites

- **GitLab account** (GitLab.com or self-hosted)
- **GitLab Runner** configured (shared or dedicated)
- **Docker** for containerized builds
- **Kubernetes cluster** (optional, for deployments)
- **Cloud provider** credentials (optional, for deployments)

---

## 🔧 Step 1: Setup GitLab Runner

### Install GitLab Runner with Docker

```bash
# Create GitLab Runner container
docker run -d --name gitlab-runner --restart always \
  -v /srv/gitlab-runner/config:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitlab/gitlab-runner:latest

# Register the runner
docker exec -it gitlab-runner gitlab-runner register \
  --url "https://gitlab.com/" \
  --registration-token "YOUR_REGISTRATION_TOKEN" \
  --executor "docker" \
  --docker-image alpine:latest \
  --description "docker-runner" \
  --tag-list "docker,linux" \
  --run-untagged="true" \
  --locked="false" \
  --access-level="not_protected"
```

### Docker Compose for GitLab Runner

```yaml
version: '3.8'

services:
  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    container_name: gitlab-runner
    restart: unless-stopped
    volumes:
      - /srv/gitlab-runner/config:/etc/gitlab-runner
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
    command: >
      bash -c "
        gitlab-runner register --non-interactive \
          --url https://gitlab.com/ \
          --registration-token ${GITLAB_REGISTRATION_TOKEN} \
          --executor docker \
          --docker-image alpine:latest \
          --description 'Docker Runner' \
          --tag-list 'docker,linux' \
          --run-untagged=true \
          --locked=false &&
        gitlab-runner run --user=gitlab-runner --working-directory=/home/gitlab-runner
      "
```

---

## 🏗️ Step 2: Comprehensive Pipeline Configuration

Create a comprehensive `.gitlab-ci.yml` file:

```yaml
# GitLab CI/CD Pipeline Configuration
image: alpine:latest

# Define pipeline stages
stages:
  - validate
  - build
  - test
  - security
  - package
  - deploy
  - monitor

# Global variables
variables:
  # Docker configuration
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  DOCKER_IMAGE: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
  DOCKER_LATEST: "$CI_REGISTRY_IMAGE:latest"
  
  # Application configuration
  NODE_VERSION: "18"
  PYTHON_VERSION: "3.9"
  GO_VERSION: "1.21"
  
  # Kubernetes configuration
  KUBE_NAMESPACE: "$CI_PROJECT_NAME-$CI_ENVIRONMENT_SLUG"
  
  # Security scanning
  SAST_EXCLUDED_PATHS: "spec, test, tests, tmp"

# Cache configuration
cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - node_modules/
    - .npm/
    - vendor/
    - .cache/

# Before script - runs before each job
before_script:
  - echo "Starting CI/CD pipeline for $CI_PROJECT_NAME"
  - echo "Commit: $CI_COMMIT_SHA"
  - echo "Branch: $CI_COMMIT_REF_NAME"

# Validation stage
validate-yaml:
  stage: validate
  image: alpine:latest
  script:
    - apk add --no-cache yamllint
    - yamllint .gitlab-ci.yml
    - echo "✅ YAML validation passed"
  only:
    changes:
      - .gitlab-ci.yml

validate-dockerfile:
  stage: validate
  image: hadolint/hadolint:latest-alpine
  script:
    - hadolint Dockerfile
    - echo "✅ Dockerfile validation passed"
  only:
    changes:
      - Dockerfile

# Build stage
build-frontend:
  stage: build
  image: node:${NODE_VERSION}
  before_script:
    - npm config set cache .npm
    - npm ci --cache .npm --prefer-offline
  script:
    - echo "🏗️ Building frontend application..."
    - npm run lint
    - npm run build
    - ls -la dist/
  artifacts:
    name: "frontend-$CI_COMMIT_SHORT_SHA"
    paths:
      - dist/
      - node_modules/
    expire_in: 1 hour
    reports:
      junit: test-results.xml
  only:
    changes:
      - frontend/**/*
      - package.json
      - package-lock.json
  cache:
    key: "$CI_COMMIT_REF_SLUG-frontend"
    paths:
      - node_modules/
      - .npm/

build-backend:
  stage: build
  image: python:${PYTHON_VERSION}
  before_script:
    - pip install --upgrade pip
    - pip install --cache-dir .cache/pip -r requirements.txt
  script:
    - echo "🏗️ Building backend application..."
    - python -m py_compile app.py
    - python -m flake8 . --max-line-length=88
    - echo "✅ Backend build completed"
  artifacts:
    name: "backend-$CI_COMMIT_SHORT_SHA"
    paths:
      - "*.py"
      - requirements.txt
    expire_in: 1 hour
  only:
    changes:
      - backend/**/*
      - requirements.txt
  cache:
    key: "$CI_COMMIT_REF_SLUG-backend"
    paths:
      - .cache/pip/

# Test stage
test-unit:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:13
    - redis:6
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    DATABASE_URL: "postgresql://testuser:testpass@postgres:5432/testdb"
    REDIS_URL: "redis://redis:6379/0"
  script:
    - echo "🧪 Running unit tests..."
    - npm ci
    - npm run test:unit -- --coverage --watchAll=false
    - npm run test:integration
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    name: "test-results-$CI_COMMIT_SHORT_SHA"
    when: always
    paths:
      - coverage/
      - test-results.xml
    expire_in: 1 week
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  dependencies:
    - build-frontend

test-e2e:
  stage: test
  image: cypress/browsers:node18.12.0-chrome107
  services:
    - name: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
      alias: app
  variables:
    CYPRESS_baseUrl: "http://app:3000"
  script:
    - echo "🎭 Running E2E tests..."
    - npm ci
    - npx cypress run --browser chrome --headless
  artifacts:
    name: "e2e-results-$CI_COMMIT_SHORT_SHA"
    when: always
    paths:
      - cypress/screenshots/
      - cypress/videos/
    expire_in: 1 week
  dependencies:
    - build-frontend
  only:
    - main
    - develop

# Security stage
sast:
  stage: security
  image: registry.gitlab.com/gitlab-org/security-products/analyzers/semgrep:latest
  script:
    - echo "🔒 Running SAST scan..."
    - /analyzer run
  artifacts:
    reports:
      sast: gl-sast-report.json
  only:
    - main
    - merge_requests

dependency-scanning:
  stage: security
  image: registry.gitlab.com/gitlab-org/security-products/analyzers/gemnasium:latest
  script:
    - echo "📦 Scanning dependencies..."
    - /analyzer run
  artifacts:
    reports:
      dependency_scanning: gl-dependency-scanning-report.json
  only:
    - main
    - merge_requests

container-scanning:
  stage: security
  image: registry.gitlab.com/gitlab-org/security-products/analyzers/klar:latest
  services:
    - docker:dind
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: ""
  script:
    - echo "🐳 Scanning container image..."
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - /analyzer run
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json
  dependencies:
    - package-docker
  only:
    - main
    - merge_requests

secret-detection:
  stage: security
  image: registry.gitlab.com/gitlab-org/security-products/analyzers/secrets:latest
  script:
    - echo "🔐 Detecting secrets..."
    - /analyzer run
  artifacts:
    reports:
      secret_detection: gl-secret-detection-report.json
  only:
    - main
    - merge_requests

# Package stage
package-docker:
  stage: package
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - echo "📦 Building Docker image..."
    - |
      docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$CI_COMMIT_SHA \
        --build-arg VERSION=$CI_COMMIT_TAG \
        --tag $DOCKER_IMAGE \
        --tag $DOCKER_LATEST \
        .
    - docker push $DOCKER_IMAGE
    - docker push $DOCKER_LATEST
    - echo "✅ Docker image pushed successfully"
  dependencies:
    - build-frontend
    - build-backend
  only:
    - main
    - develop
    - tags

package-helm:
  stage: package
  image: alpine/helm:latest
  script:
    - echo "⎈ Packaging Helm chart..."
    - helm package helm/chart --version $CI_COMMIT_TAG --app-version $CI_COMMIT_SHA
    - helm push chart-*.tgz oci://$CI_REGISTRY/$CI_PROJECT_PATH/helm
  artifacts:
    name: "helm-chart-$CI_COMMIT_SHORT_SHA"
    paths:
      - "*.tgz"
    expire_in: 1 week
  only:
    - tags

# Deploy stage
deploy-review:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "🚀 Deploying to review environment..."
    - kubectl config use-context $KUBE_CONTEXT
    - |
      envsubst < k8s/review-deployment.yaml | kubectl apply -f -
      kubectl rollout status deployment/$CI_PROJECT_NAME-$CI_COMMIT_REF_SLUG
      kubectl get services
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_PROJECT_NAME-$CI_COMMIT_REF_SLUG.review.example.com
    on_stop: stop-review
  dependencies:
    - package-docker
  only:
    - merge_requests
  except:
    - main

stop-review:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "🛑 Stopping review environment..."
    - kubectl delete namespace $KUBE_NAMESPACE
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  only:
    - merge_requests
  except:
    - main

deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "🚀 Deploying to staging..."
    - kubectl config use-context $KUBE_CONTEXT_STAGING
    - |
      envsubst < k8s/staging-deployment.yaml | kubectl apply -f -
      kubectl rollout status deployment/$CI_PROJECT_NAME
      kubectl get services
    - echo "✅ Staging deployment completed"
  environment:
    name: staging
    url: https://staging.example.com
  dependencies:
    - package-docker
  only:
    - develop

deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "🚀 Deploying to production..."
    - kubectl config use-context $KUBE_CONTEXT_PRODUCTION
    - |
      envsubst < k8s/production-deployment.yaml | kubectl apply -f -
      kubectl rollout status deployment/$CI_PROJECT_NAME
      kubectl get services
    - echo "✅ Production deployment completed"
  environment:
    name: production
    url: https://example.com
  dependencies:
    - package-docker
  when: manual
  only:
    - main

# Monitor stage
performance-test:
  stage: monitor
  image: loadimpact/k6:latest
  script:
    - echo "⚡ Running performance tests..."
    - k6 run --out json=performance-results.json performance-tests.js
  artifacts:
    name: "performance-results-$CI_COMMIT_SHORT_SHA"
    paths:
      - performance-results.json
    expire_in: 1 week
    reports:
      performance: performance-results.json
  dependencies:
    - deploy-staging
  only:
    - develop
    - main

smoke-test:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - echo "💨 Running smoke tests..."
    - |
      if [ "$CI_COMMIT_REF_NAME" = "main" ]; then
        BASE_URL="https://example.com"
      else
        BASE_URL="https://staging.example.com"
      fi
    - curl -f $BASE_URL/health || exit 1
    - curl -f $BASE_URL/api/health || exit 1
    - echo "✅ Smoke tests passed"
  dependencies:
    - deploy-staging
    - deploy-production
  only:
    - develop
    - main
```

---

## ▶️ Step 3: Advanced Pipeline Features

### Multi-Project Pipelines

```yaml
# Trigger downstream pipeline
trigger-integration:
  stage: deploy
  trigger:
    project: group/integration-tests
    branch: main
    strategy: depend
  variables:
    UPSTREAM_PROJECT: $CI_PROJECT_NAME
    UPSTREAM_COMMIT: $CI_COMMIT_SHA
  only:
    - main

# Parent-child pipelines
generate-config:
  stage: build
  script:
    - echo "Generating dynamic configuration..."
    - python generate_pipeline.py > generated-pipeline.yml
  artifacts:
    paths:
      - generated-pipeline.yml

child-pipeline:
  stage: deploy
  trigger:
    include:
      - artifact: generated-pipeline.yml
        job: generate-config
    strategy: depend
```

### Matrix Builds

```yaml
test-matrix:
  stage: test
  image: node:$NODE_VERSION
  parallel:
    matrix:
      - NODE_VERSION: ["16", "18", "20"]
        TEST_SUITE: ["unit", "integration"]
  script:
    - npm ci
    - npm run test:$TEST_SUITE
  artifacts:
    reports:
      junit: test-results-$NODE_VERSION-$TEST_SUITE.xml
```

### Dynamic Environments

```yaml
deploy-dynamic:
  stage: deploy
  script:
    - echo "Deploying to dynamic environment..."
    - ./deploy.sh $CI_COMMIT_REF_SLUG
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.review.example.com
    auto_stop_in: 1 week
  rules:
    - if: $CI_MERGE_REQUEST_ID
      when: manual
```

---

## 📊 Step 4: GitLab Features Integration

### Container Registry

```yaml
variables:
  DOCKER_REGISTRY: $CI_REGISTRY
  DOCKER_IMAGE_NAME: $CI_REGISTRY_IMAGE

build-image:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE_NAME:$CI_COMMIT_SHA .
    - docker tag $DOCKER_IMAGE_NAME:$CI_COMMIT_SHA $DOCKER_IMAGE_NAME:latest
    - docker push $DOCKER_IMAGE_NAME:$CI_COMMIT_SHA
    - docker push $DOCKER_IMAGE_NAME:latest
```

### Package Registry

```yaml
publish-npm:
  stage: package
  image: node:18
  script:
    - echo "@mycompany:registry=https://gitlab.com/api/v4/projects/$CI_PROJECT_ID/packages/npm/" > .npmrc
    - echo "//gitlab.com/api/v4/projects/$CI_PROJECT_ID/packages/npm/:_authToken=$CI_JOB_TOKEN" >> .npmrc
    - npm publish
  only:
    - tags

publish-maven:
  stage: package
  image: maven:3.8-openjdk-11
  script:
    - mvn deploy -s settings.xml
  only:
    - tags
```

### GitLab Pages

```yaml
pages:
  stage: deploy
  image: node:18
  script:
    - npm ci
    - npm run build:docs
    - mv docs/dist public
  artifacts:
    paths:
      - public
  only:
    - main
```

---

## 🔍 Step 5: Monitoring and Observability

### Custom Metrics

```yaml
collect-metrics:
  stage: monitor
  image: alpine:latest
  script:
    - echo "📊 Collecting custom metrics..."
    - |
      cat > metrics.txt << EOF
      # HELP build_duration_seconds Time spent building
      # TYPE build_duration_seconds gauge
      build_duration_seconds{job="$CI_JOB_NAME",project="$CI_PROJECT_NAME"} $CI_JOB_DURATION
      EOF
  artifacts:
    reports:
      metrics: metrics.txt
```

### Notification Integration

```yaml
notify-slack:
  stage: monitor
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - |
      curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Deployment successful for $CI_PROJECT_NAME ($CI_COMMIT_REF_NAME)\"}" \
        $SLACK_WEBHOOK_URL
  when: on_success
  only:
    - main

notify-teams:
  stage: monitor
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - |
      curl -H "Content-Type: application/json" -d '{
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": "Pipeline Status",
        "themeColor": "00FF00",
        "sections": [{
          "activityTitle": "Pipeline Completed",
          "activitySubtitle": "'$CI_PROJECT_NAME'",
          "facts": [{
            "name": "Branch",
            "value": "'$CI_COMMIT_REF_NAME'"
          }, {
            "name": "Commit",
            "value": "'$CI_COMMIT_SHA'"
          }]
        }]
      }' $TEAMS_WEBHOOK_URL
  when: on_success
  only:
    - main
```

---

## 🛡️ Step 6: Security and Compliance

### Compliance Pipeline

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/DAST.gitlab-ci.yml

compliance-check:
  stage: security
  image: alpine:latest
  script:
    - echo "🛡️ Running compliance checks..."
    - |
      # Check for required files
      test -f SECURITY.md || (echo "SECURITY.md missing" && exit 1)
      test -f LICENSE || (echo "LICENSE missing" && exit 1)
      
      # Check branch protection
      if [ "$CI_COMMIT_REF_NAME" = "main" ]; then
        echo "✅ Main branch deployment"
      fi
  only:
    - main
    - merge_requests
```

### Secrets Management

```yaml
variables:
  VAULT_ADDR: "https://vault.example.com"
  VAULT_AUTH_ROLE: "gitlab-ci"

.vault-auth: &vault-auth
  - apk add --no-cache curl jq
  - export VAULT_TOKEN=$(curl -s -X POST $VAULT_ADDR/v1/auth/jwt/login -d "{\"jwt\":\"$CI_JOB_JWT\",\"role\":\"$VAULT_AUTH_ROLE\"}" | jq -r .auth.client_token)

deploy-with-secrets:
  stage: deploy
  image: alpine:latest
  before_script:
    - *vault-auth
  script:
    - export DB_PASSWORD=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/secret/data/db | jq -r .data.data.password)
    - echo "Deploying with retrieved secrets..."
    - ./deploy.sh
```

---

## 📈 Step 7: Performance Optimization

### Caching Strategies

```yaml
# Global cache
cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - node_modules/
    - .npm/
    - vendor/
    - .cache/
  policy: pull-push

# Job-specific cache
build-optimized:
  stage: build
  image: node:18
  cache:
    key: "$CI_COMMIT_REF_SLUG-node"
    paths:
      - node_modules/
      - .npm/
    policy: pull-push
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
```

### Parallel Jobs

```yaml
test-parallel:
  stage: test
  image: node:18
  parallel: 4
  script:
    - npm ci
    - npm run test -- --ci --testPathPattern=$(echo $CI_NODE_TOTAL | xargs seq 0 | awk "NR % $CI_NODE_TOTAL == $CI_NODE_INDEX")
```

---

## 🔍 What You'll See

### Pipeline Execution Output
```bash
🚀 Starting CI/CD pipeline for my-awesome-app
Commit: a1b2c3d4e5f6
Branch: main

🏗️ Building frontend application...
✅ Frontend build completed

🧪 Running unit tests...
✅ All tests passed (Coverage: 85.2%)

🔒 Running SAST scan...
✅ No security vulnerabilities found

📦 Building Docker image...
✅ Docker image pushed successfully

🚀 Deploying to production...
✅ Production deployment completed

💨 Running smoke tests...
✅ Smoke tests passed

Pipeline completed successfully in 8m 32s
```

### GitLab UI Features
- **Pipeline Graphs**: Visual representation of pipeline stages
- **Merge Request Integration**: Pipeline status in merge requests
- **Environment Tracking**: Deployment history and rollbacks
- **Security Dashboard**: Vulnerability reports and trends
- **Performance Monitoring**: Application performance metrics

---

## Pros & Cons

### ✅ Pros
- **Integrated Platform**: Complete DevOps toolchain in one place
- **Built-in Registry**: Container and package registries included
- **Security First**: Comprehensive security scanning built-in
- **Auto DevOps**: Automatic pipeline generation for common patterns
- **Flexible Configuration**: Powerful YAML-based pipeline definition

### ❌ Cons
- **Learning Curve**: Complex feature set requires time to master
- **Resource Usage**: Can be resource-intensive for large pipelines
- **Vendor Lock-in**: Tight integration with GitLab ecosystem
- **Cost**: Premium features require paid plans

---

## Conclusion

GitLab CI/CD is the **comprehensive solution** for **integrated DevOps workflows**. Choose GitLab CI/CD when you need:

- **End-to-end DevOps** platform with integrated tools
- **Security-first** approach with built-in scanning
- **Scalable pipelines** for complex multi-service applications
- **Collaboration features** for development teams

The combination of powerful pipeline features, integrated security, and comprehensive DevOps tools makes GitLab CI/CD ideal for organizations seeking a complete software delivery platform.

**What You've Achieved:**
✅ Set up comprehensive GitLab CI/CD pipelines  
✅ Implemented security scanning and compliance checks  
✅ Created multi-environment deployment workflows  
✅ Integrated monitoring and notification systems  
✅ Established performance optimization strategies  
✅ Built scalable and maintainable pipeline configurations
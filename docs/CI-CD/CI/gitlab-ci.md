---
sidebar_position: 3
title: GitLab CI/CD
description: GitLab CI/CD provides integrated continuous integration and deployment. Learn how to configure GitLab pipelines with YAML configuration.
slug: /CICD/GitLabCI
keywords:
  - GitLab CI/CD
  - CI/CD pipeline
  - GitLab runners
  - YAML configuration
  - DevOps automation
---

# 🚀 GitLab CI/CD Pipeline Configuration

**GitLab CI/CD** provides integrated **continuous integration** and **deployment** with **YAML-based** configuration and **built-in Docker** support.

---

## 🔧 Basic Configuration

`Create .gitlab-ci.yml in repository root:`
```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_IMAGE: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

deploy:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main
```

## ▶️ Sample Output

```bash
Running with gitlab-runner 15.0.0
Preparing the "docker" executor
Using Docker executor with image node:18 ...
Pulling docker image node:18 ...
Using docker image sha256:abc123...

$ npm ci
added 1234 packages in 45s

$ npm run build
> build
> webpack --mode production
Hash: abc123def456
Version: webpack 5.0.0
Time: 12345ms
Built at: 2024-01-15 10:30:00
    Asset      Size  Chunks             Chunk Names
bundle.js  123 KiB       0  [emitted]  main
✨ Done in 12.34s

Job succeeded
```

## 🐳 Docker Integration

```yaml
docker-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## 📊 Multi-Environment Deploy

```yaml
deploy-staging:
  stage: deploy
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/app app=$DOCKER_IMAGE
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy-production:
  stage: deploy
  script:
    - kubectl config use-context production
    - kubectl set image deployment/app app=$DOCKER_IMAGE
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

**Reference:** [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
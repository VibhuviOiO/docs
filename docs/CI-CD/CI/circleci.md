---
sidebar_position: 5
title: CircleCI
description: CircleCI is a modern CI/CD platform that automates the software development process. Learn how to set up CircleCI pipelines with Docker and advanced workflows.
slug: /CI-CD/CircleCI
keywords:
  - CircleCI
  - CI/CD pipeline
  - continuous integration
  - continuous deployment
  - Docker CI/CD
  - workflow automation
  - build automation
  - deployment pipeline
  - DevOps automation
  - cloud CI/CD
---

# ⭕ CircleCI - Modern CI/CD Platform for Fast Development

**CircleCI** is a modern continuous integration and continuous deployment platform that helps teams **build**, **test**, and **deploy** code quickly and reliably with powerful workflow automation and Docker-first approach.

---

## CircleCI Configuration

### Basic .circleci/config.yml

`Create .circleci/config.yml in your repository:`
```yaml
version: 2.1

# Define reusable executors
executors:
  docker-executor:
    docker:
      - image: cimg/node:18.17
    working_directory: ~/project

  python-executor:
    docker:
      - image: cimg/python:3.11
    working_directory: ~/project

# Define reusable commands
commands:
  install-dependencies:
    description: "Install project dependencies"
    steps:
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}

# Define jobs
jobs:
  build:
    executor: docker-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Build application
          command: npm run build
      - persist_to_workspace:
          root: ~/project
          paths:
            - dist
            - node_modules

  test:
    executor: docker-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Run tests
          command: npm test
      - run:
          name: Run coverage
          command: npm run coverage
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

  lint:
    executor: docker-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Run linter
          command: npm run lint

  security-scan:
    executor: docker-executor
    steps:
      - checkout
      - install-dependencies
      - run:
          name: Security audit
          command: npm audit --audit-level high

# Define workflows
workflows:
  version: 2
  build-test-deploy:
    jobs:
      - build
      - test:
          requires:
            - build
      - lint:
          requires:
            - build
      - security-scan:
          requires:
            - build
```

---

## Docker-Based Workflows

### Multi-Container Setup

```yaml
version: 2.1

jobs:
  test-with-database:
    docker:
      - image: cimg/node:18.17
        environment:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
      - image: cimg/postgres:13.11
        environment:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
    steps:
      - checkout
      - run:
          name: Wait for database
          command: dockerize -wait tcp://localhost:5432 -timeout 1m
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Run database migrations
          command: npm run migrate
      - run:
          name: Run integration tests
          command: npm run test:integration

  build-docker-image:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - setup_remote_docker:
          version: 20.10.14
          docker_layer_caching: true
      - run:
          name: Build Docker image
          command: |
            docker build -t myapp:$CIRCLE_SHA1 .
            docker tag myapp:$CIRCLE_SHA1 myapp:latest
      - run:
          name: Push to registry
          command: |
            echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
            docker push myapp:$CIRCLE_SHA1
            docker push myapp:latest
```

---

## Advanced Workflows

### Parallel Jobs with Fan-in/Fan-out

```yaml
version: 2.1

orbs:
  kubernetes: circleci/kubernetes@1.3.1
  helm: circleci/helm@2.0.1

jobs:
  build:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - run: npm ci
      - run: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist
            - node_modules

  test-unit:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: npm run test:unit

  test-integration:
    docker:
      - image: cimg/node:18.17
      - image: cimg/postgres:13.11
        environment:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: npm run test:integration

  test-e2e:
    docker:
      - image: cimg/node:18.17-browsers
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: npm run test:e2e

  security-scan:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - attach_workspace:
          at: .
      - run: npm audit
      - run: npm run security:scan

  deploy-staging:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - kubernetes/install-kubectl
      - helm/install-helm-client
      - run:
          name: Deploy to staging
          command: |
            helm upgrade --install myapp-staging ./helm \
              --namespace staging \
              --set image.tag=$CIRCLE_SHA1 \
              --set environment=staging

  deploy-production:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - kubernetes/install-kubectl
      - helm/install-helm-client
      - run:
          name: Deploy to production
          command: |
            helm upgrade --install myapp-prod ./helm \
              --namespace production \
              --set image.tag=$CIRCLE_SHA1 \
              --set environment=production

workflows:
  build-test-deploy:
    jobs:
      - build
      - test-unit:
          requires:
            - build
      - test-integration:
          requires:
            - build
      - test-e2e:
          requires:
            - build
      - security-scan:
          requires:
            - build
      - deploy-staging:
          requires:
            - test-unit
            - test-integration
            - test-e2e
            - security-scan
          filters:
            branches:
              only: develop
      - hold-for-approval:
          type: approval
          requires:
            - deploy-staging
          filters:
            branches:
              only: main
      - deploy-production:
          requires:
            - hold-for-approval
          filters:
            branches:
              only: main
```

---

## Using CircleCI Orbs

### Popular Orbs Integration

```yaml
version: 2.1

orbs:
  aws-cli: circleci/aws-cli@3.1.4
  kubernetes: circleci/kubernetes@1.3.1
  helm: circleci/helm@2.0.1
  slack: circleci/slack@4.12.1
  sonarcloud: sonarsource/sonarcloud@1.1.1

jobs:
  deploy-to-aws:
    executor: aws-cli/default
    steps:
      - checkout
      - aws-cli/setup:
          aws-access-key-id: AWS_ACCESS_KEY_ID
          aws-secret-access-key: AWS_SECRET_ACCESS_KEY
          aws-region: AWS_DEFAULT_REGION
      - run:
          name: Deploy to ECS
          command: |
            aws ecs update-service \
              --cluster production \
              --service myapp \
              --force-new-deployment

  sonar-scan:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - run: npm ci
      - run: npm test -- --coverage
      - sonarcloud/scan

  notify-slack:
    docker:
      - image: cimg/base:stable
    steps:
      - slack/notify:
          event: fail
          template: basic_fail_1
      - slack/notify:
          event: pass
          template: success_tagged_deploy_1

workflows:
  main:
    jobs:
      - build
      - test
      - sonar-scan:
          requires:
            - test
      - deploy-to-aws:
          requires:
            - sonar-scan
      - notify-slack:
          requires:
            - deploy-to-aws
```

---

## Environment-Specific Deployments

### Conditional Deployments

```yaml
version: 2.1

jobs:
  deploy:
    parameters:
      environment:
        type: string
      cluster:
        type: string
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - kubernetes/install-kubectl
      - run:
          name: Deploy to << parameters.environment >>
          command: |
            kubectl apply -f k8s/<< parameters.environment >>/
            kubectl set image deployment/myapp \
              myapp=myapp:$CIRCLE_SHA1 \
              -n << parameters.environment >>

workflows:
  deploy-pipeline:
    jobs:
      - build
      - test
      - deploy:
          name: deploy-dev
          environment: development
          cluster: dev-cluster
          requires:
            - test
          filters:
            branches:
              only: develop
      - deploy:
          name: deploy-staging
          environment: staging
          cluster: staging-cluster
          requires:
            - test
          filters:
            branches:
              only: main
      - hold-production:
          type: approval
          requires:
            - deploy-staging
          filters:
            branches:
              only: main
      - deploy:
          name: deploy-prod
          environment: production
          cluster: prod-cluster
          requires:
            - hold-production
          filters:
            branches:
              only: main
```

---

## Performance Optimization

### Caching Strategies

```yaml
version: 2.1

jobs:
  build-with-cache:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      # Restore multiple cache layers
      - restore_cache:
          keys:
            - v2-dependencies-{{ checksum "package-lock.json" }}
            - v2-dependencies-{{ checksum "package.json" }}
            - v2-dependencies-
      - restore_cache:
          keys:
            - v1-build-cache-{{ .Branch }}-{{ .Revision }}
            - v1-build-cache-{{ .Branch }}-
            - v1-build-cache-
      
      - run:
          name: Install dependencies
          command: |
            if [ ! -d "node_modules" ]; then
              npm ci
            fi
      
      - save_cache:
          key: v2-dependencies-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
            - ~/.npm
      
      - run:
          name: Build application
          command: npm run build
      
      - save_cache:
          key: v1-build-cache-{{ .Branch }}-{{ .Revision }}
          paths:
            - dist
            - .next/cache
```

### Docker Layer Caching

```yaml
version: 2.1

jobs:
  build-docker:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - setup_remote_docker:
          version: 20.10.14
          docker_layer_caching: true
      - run:
          name: Build and push Docker image
          command: |
            # Multi-stage build for optimization
            docker build \
              --cache-from myapp:latest \
              --tag myapp:$CIRCLE_SHA1 \
              --tag myapp:latest \
              .
            
            echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
            docker push myapp:$CIRCLE_SHA1
            docker push myapp:latest
```

---

## Testing and Quality Gates

### Comprehensive Testing Pipeline

```yaml
version: 2.1

jobs:
  test-matrix:
    parameters:
      node-version:
        type: string
    docker:
      - image: cimg/node:<< parameters.node-version >>
    steps:
      - checkout
      - run: npm ci
      - run: npm test

  quality-gates:
    docker:
      - image: cimg/node:18.17
    steps:
      - checkout
      - run: npm ci
      - run:
          name: Run tests with coverage
          command: npm run test:coverage
      - run:
          name: Check coverage threshold
          command: |
            COVERAGE=$(npm run coverage:check | grep -o '[0-9]*\.[0-9]*' | head -1)
            if (( $(echo "$COVERAGE < 80" | bc -l) )); then
              echo "Coverage $COVERAGE% is below threshold"
              exit 1
            fi
      - run:
          name: Security audit
          command: npm audit --audit-level high
      - run:
          name: License check
          command: npm run license:check

workflows:
  test-all-versions:
    jobs:
      - test-matrix:
          matrix:
            parameters:
              node-version: ["16.20", "18.17", "20.5"]
      - quality-gates
```

---

## Monitoring and Notifications

### Integration with External Services

```yaml
version: 2.1

orbs:
  slack: circleci/slack@4.12.1
  datadog: circleci/datadog@1.0.0

jobs:
  deploy-with-monitoring:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - run:
          name: Deploy application
          command: ./deploy.sh
      - datadog/send-event:
          api-key: DATADOG_API_KEY
          title: "Deployment completed"
          text: "Application deployed to production"
          tags: "environment:production,service:myapp"
      - slack/notify:
          event: pass
          custom: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ Deployment successful!\n*Project:* $CIRCLE_PROJECT_REPONAME\n*Branch:* $CIRCLE_BRANCH\n*Commit:* $CIRCLE_SHA1"
                  }
                }
              ]
            }

workflows:
  deploy-with-notifications:
    jobs:
      - build
      - test
      - deploy-with-monitoring:
          requires:
            - test
```

---

## Common Use Cases

- **Modern Web Applications**: React, Vue, Angular applications with Node.js backends
- **Microservices**: Container-based applications with Kubernetes deployment
- **Mobile Applications**: React Native, Flutter, and native iOS/Android apps
- **API Development**: RESTful and GraphQL API testing and deployment
- **Infrastructure as Code**: Terraform and CloudFormation deployments

✅ CircleCI is now configured for modern, efficient CI/CD workflows!
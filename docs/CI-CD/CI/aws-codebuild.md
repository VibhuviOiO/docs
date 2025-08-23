---
sidebar_position: 9
title: AWS CodeBuild
description: AWS CodeBuild is a fully managed continuous integration service that compiles source code, runs tests, and produces software packages. Learn how to set up CodeBuild for CI/CD pipelines.
slug: /CI-CD/AWSCodeBuild
keywords:
  - AWS CodeBuild
  - AWS CI/CD
  - continuous integration
  - build automation
  - AWS DevOps
  - serverless builds
  - container builds
  - deployment pipeline
  - AWS CodePipeline
  - cloud builds
---

# 🏗️ AWS CodeBuild - Fully Managed CI Service

**AWS CodeBuild** is a **fully managed continuous integration service** that compiles source code, runs tests, and produces software packages that are ready to deploy. It scales continuously and processes multiple builds concurrently.

---

## Set Up AWS CodeBuild

### Basic Build Specification

`Create buildspec.yml:`
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - npm install -g aws-cli
      - pip install --upgrade pip

  pre_build:
    commands:
      - echo "Pre-build phase started on `date`"
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}

  build:
    commands:
      - echo "Build started on `date`"
      - echo "Installing application dependencies..."
      - npm ci
      - echo "Running tests..."
      - npm test
      - echo "Building the Docker image..."
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG

  post_build:
    commands:
      - echo "Build completed on `date`"
      - echo "Pushing the Docker images..."
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo "Writing image definitions file..."
      - printf '[{"name":"myapp","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - '**/*'
  base-directory: '.'

cache:
  paths:
    - '/root/.npm/**/*'
    - 'node_modules/**/*'
```

### Multi-Stage Build

`Create buildspec-advanced.yml:`
```yaml
version: 0.2

env:
  variables:
    NODE_ENV: production
  parameter-store:
    DATABASE_URL: /myapp/database-url
    API_KEY: /myapp/api-key
  secrets-manager:
    DOCKER_HUB_PASSWORD: prod/docker:password

phases:
  install:
    runtime-versions:
      nodejs: 18
      python: 3.11
      docker: 20
    commands:
      - echo "Installing build tools..."
      - curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.21.2/2021-07-05/bin/linux/amd64/kubectl
      - chmod +x ./kubectl
      - mv ./kubectl /usr/local/bin
      - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

  pre_build:
    commands:
      - echo "Pre-build phase started on `date`"
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      
      # Set up variables
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - BUILD_NUMBER=$CODEBUILD_BUILD_NUMBER
      
      # Install dependencies
      - echo "Installing frontend dependencies..."
      - cd frontend && npm ci && cd ..
      - echo "Installing backend dependencies..."
      - cd backend && npm ci && cd ..

  build:
    commands:
      - echo "Build started on `date`"
      
      # Run linting
      - echo "Running linting..."
      - cd frontend && npm run lint && cd ..
      - cd backend && npm run lint && cd ..
      
      # Run tests
      - echo "Running unit tests..."
      - cd frontend && npm test -- --coverage --watchAll=false && cd ..
      - cd backend && npm test -- --coverage && cd ..
      
      # Security scanning
      - echo "Running security scans..."
      - npm audit --audit-level high
      
      # Build frontend
      - echo "Building frontend..."
      - cd frontend && npm run build && cd ..
      
      # Build Docker images
      - echo "Building Docker images..."
      - docker build -f frontend/Dockerfile -t $REPOSITORY_URI-frontend:$IMAGE_TAG frontend/
      - docker build -f backend/Dockerfile -t $REPOSITORY_URI-backend:$IMAGE_TAG backend/
      
      # Tag images
      - docker tag $REPOSITORY_URI-frontend:$IMAGE_TAG $REPOSITORY_URI-frontend:latest
      - docker tag $REPOSITORY_URI-backend:$IMAGE_TAG $REPOSITORY_URI-backend:latest

  post_build:
    commands:
      - echo "Post build started on `date`"
      
      # Push images
      - echo "Pushing Docker images..."
      - docker push $REPOSITORY_URI-frontend:$IMAGE_TAG
      - docker push $REPOSITORY_URI-frontend:latest
      - docker push $REPOSITORY_URI-backend:$IMAGE_TAG
      - docker push $REPOSITORY_URI-backend:latest
      
      # Update Kubernetes manifests
      - echo "Updating Kubernetes manifests..."
      - sed -i 's|IMAGE_TAG|'$IMAGE_TAG'|g' k8s/deployment.yaml
      - sed -i 's|REPOSITORY_URI|'$REPOSITORY_URI'|g' k8s/deployment.yaml
      
      # Deploy to EKS (if on main branch)
      - |
        if [ "$CODEBUILD_WEBHOOK_HEAD_REF" = "refs/heads/main" ]; then
          echo "Deploying to production EKS cluster..."
          aws eks update-kubeconfig --region $AWS_DEFAULT_REGION --name production-cluster
          kubectl apply -f k8s/
          kubectl set image deployment/myapp-frontend frontend=$REPOSITORY_URI-frontend:$IMAGE_TAG
          kubectl set image deployment/myapp-backend backend=$REPOSITORY_URI-backend:$IMAGE_TAG
          kubectl rollout status deployment/myapp-frontend
          kubectl rollout status deployment/myapp-backend
        fi

artifacts:
  files:
    - '**/*'
  name: myapp-artifacts-$BUILD_NUMBER

reports:
  jest_reports:
    files:
      - 'frontend/coverage/clover.xml'
      - 'backend/coverage/clover.xml'
    file-format: 'CLOVERXML'
  
cache:
  paths:
    - '/root/.npm/**/*'
    - 'frontend/node_modules/**/*'
    - 'backend/node_modules/**/*'
```

---

## Terraform Configuration

### CodeBuild Project

`Create terraform/codebuild.tf:`
```hcl
# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild_role" {
  name = "codebuild-myapp-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for CodeBuild
resource "aws_iam_role_policy" "codebuild_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:GetAuthorizationToken",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/myapp/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:prod/*"
      }
    ]
  })
}

# CodeBuild Project
resource "aws_codebuild_project" "myapp" {
  name          = "myapp-build"
  description   = "Build project for MyApp"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                      = "aws/codebuild/amazonlinux2-x86_64-standard:4.0"
    type                       = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode            = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = "myapp"
    }
  }

  source {
    type = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

  cache {
    type  = "S3"
    location = "${aws_s3_bucket.codebuild_cache.bucket}/cache"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/myapp"
      stream_name = "build-log"
    }

    s3_logs {
      status   = "ENABLED"
      location = "${aws_s3_bucket.codebuild_logs.bucket}/build-logs"
    }
  }

  tags = {
    Environment = var.environment
    Project     = "myapp"
  }
}

# S3 Bucket for build cache
resource "aws_s3_bucket" "codebuild_cache" {
  bucket = "myapp-codebuild-cache-${random_string.bucket_suffix.result}"
}

# S3 Bucket for build logs
resource "aws_s3_bucket" "codebuild_logs" {
  bucket = "myapp-codebuild-logs-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ECR Repository
resource "aws_ecr_repository" "myapp" {
  name                 = "myapp"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Data sources
data "aws_caller_identity" "current" {}
```

---

## CodePipeline Integration

### Complete CI/CD Pipeline

`Create terraform/codepipeline.tf:`
```hcl
# S3 Bucket for pipeline artifacts
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket = "myapp-codepipeline-artifacts-${random_string.bucket_suffix.result}"
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "codepipeline-myapp-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for CodePipeline
resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.codepipeline_artifacts.arn,
          "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodePipeline
resource "aws_codepipeline" "myapp_pipeline" {
  name     = "myapp-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        Owner      = var.github_owner
        Repo       = var.github_repo
        Branch     = "main"
        OAuthToken = var.github_token
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.myapp.name
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      input_artifacts = ["build_output"]
      version         = "1"

      configuration = {
        ClusterName = aws_ecs_cluster.main.name
        ServiceName = aws_ecs_service.myapp.name
        FileName    = "imagedefinitions.json"
      }
    }
  }
}
```

---

## Custom Build Images

### Custom Docker Image for Builds

`Create custom-build-image/Dockerfile:`
```dockerfile
FROM amazonlinux:2

# Install system dependencies
RUN yum update -y && \
    yum install -y \
    git \
    wget \
    curl \
    unzip \
    tar \
    gzip \
    python3 \
    python3-pip \
    docker

# Install Node.js
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
    yum install -y nodejs

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Install kubectl
RUN curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.21.2/2021-07-05/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Terraform
RUN wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip && \
    unzip terraform_1.6.0_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_1.6.0_linux_amd64.zip

# Install security tools
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Set working directory
WORKDIR /codebuild/output

# Install CodeBuild agent
RUN pip3 install awscli
```

### Build and Push Custom Image

`Create build-custom-image.sh:`
```bash
#!/bin/bash
set -e

AWS_REGION="us-west-2"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_NAME="custom-codebuild"
IMAGE_TAG="latest"

# Build the image
echo "Building custom CodeBuild image..."
docker build -t $IMAGE_NAME:$IMAGE_TAG custom-build-image/

# Tag for ECR
docker tag $IMAGE_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:$IMAGE_TAG

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names $IMAGE_NAME --region $AWS_REGION || \
aws ecr create-repository --repository-name $IMAGE_NAME --region $AWS_REGION

# Push the image
echo "Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:$IMAGE_TAG

echo "Custom CodeBuild image pushed successfully!"
```

---

## Monitoring and Notifications

### CloudWatch Alarms

`Create terraform/monitoring.tf:`
```hcl
# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "codebuild_logs" {
  name              = "/aws/codebuild/myapp"
  retention_in_days = 14
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "build_failures" {
  alarm_name          = "codebuild-build-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FailedBuilds"
  namespace           = "AWS/CodeBuild"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors CodeBuild build failures"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ProjectName = aws_codebuild_project.myapp.name
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "codebuild-alerts"
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

---

## Common Use Cases

- **Container Applications**: Build and deploy Docker containers to ECS or EKS
- **Serverless Applications**: Build and deploy Lambda functions
- **Multi-Environment Deployments**: Automated deployments with approval gates
- **Security Integration**: Automated security scanning and compliance checks
- **Infrastructure as Code**: Build and deploy Terraform configurations

✅ AWS CodeBuild is now configured for comprehensive CI/CD workflows!
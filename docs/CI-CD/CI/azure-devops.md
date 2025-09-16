---
sidebar_position: 4
title: Azure DevOps
description: Azure DevOps is Microsoft's comprehensive DevOps platform providing CI/CD pipelines, repositories, and project management. Learn how to set up Azure DevOps pipelines with Docker.
slug: /CI-CD/AzureDevOps
keywords:
  - Azure DevOps
  - Microsoft DevOps
  - CI/CD pipeline
  - Azure Pipelines
  - DevOps automation
  - continuous integration
  - continuous deployment
  - YAML pipelines
  - build automation
  - release management
---

# ☁️ Azure DevOps - Microsoft's Complete DevOps Platform

**Azure DevOps** is Microsoft's comprehensive cloud-based DevOps platform that provides **CI/CD pipelines**, **Git repositories**, **project management**, and **testing tools** in one integrated solution.

---

## Set Up Azure DevOps with Docker

### Azure DevOps Server (On-Premises)

`Create a file named docker-compose.yml`
```yaml
version: '3.8'

services:
  azuredevops-server:
    image: mcr.microsoft.com/azure-devops/server:2022
    container_name: azuredevops-server
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "443:443"
    environment:
      ACCEPT_EULA: "Y"
      SQL_SERVER_INSTANCE: "sqlserver"
      SQL_DATABASE: "AzureDevOps"
      SQL_USERNAME: "sa"
      SQL_PASSWORD: "YourStrong@Password"
    volumes:
      - azuredevops-data:/azuredevops/data
      - azuredevops-logs:/azuredevops/logs
    depends_on:
      - sqlserver

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    container_name: azuredevops-sql
    environment:
      SA_PASSWORD: "YourStrong@Password"
      ACCEPT_EULA: "Y"
    volumes:
      - sqlserver-data:/var/opt/mssql
    ports:
      - "1433:1433"

  # Self-hosted agent
  azuredevops-agent:
    image: mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-20.04
    container_name: azuredevops-agent
    environment:
      AZP_URL: "https://dev.azure.com/yourorganization"
      AZP_TOKEN: "your-personal-access-token"
      AZP_AGENT_NAME: "docker-agent"
      AZP_POOL: "Default"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - agent-work:/azp
    restart: unless-stopped

volumes:
  azuredevops-data:
  azuredevops-logs:
  sqlserver-data:
  agent-work:
```

`Start Azure DevOps:`
```bash
docker compose up -d
```

---

## Azure Pipelines YAML Configuration

### Basic CI Pipeline

`Create azure-pipelines.yml:`
```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  dockerRegistryServiceConnection: 'myDockerRegistry'
  imageRepository: 'myapp'
  containerRegistry: 'myregistry.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: Build
    displayName: 'Build job'
    steps:
    - task: UseDotNet@2
      displayName: 'Use .NET Core SDK'
      inputs:
        packageType: 'sdk'
        version: '8.x'

    - task: DotNetCoreCLI@2
      displayName: 'Restore packages'
      inputs:
        command: 'restore'
        projects: '**/*.csproj'

    - task: DotNetCoreCLI@2
      displayName: 'Build application'
      inputs:
        command: 'build'
        projects: '**/*.csproj'
        arguments: '--configuration $(buildConfiguration)'

    - task: DotNetCoreCLI@2
      displayName: 'Run tests'
      inputs:
        command: 'test'
        projects: '**/*Tests.csproj'
        arguments: '--configuration $(buildConfiguration) --collect "Code coverage"'

    - task: Docker@2
      displayName: 'Build Docker image'
      inputs:
        containerRegistry: '$(dockerRegistryServiceConnection)'
        repository: '$(imageRepository)'
        command: 'build'
        Dockerfile: '$(dockerfilePath)'
        tags: |
          $(tag)
          latest

    - task: Docker@2
      displayName: 'Push Docker image'
      inputs:
        containerRegistry: '$(dockerRegistryServiceConnection)'
        repository: '$(imageRepository)'
        command: 'push'
        tags: |
          $(tag)
          latest

    - task: PublishBuildArtifacts@1
      displayName: 'Publish artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'
```

### Multi-Stage Pipeline with Deployment

```yaml
trigger:
  branches:
    include:
      - main

variables:
  - group: 'production-variables'
  - name: vmImageName
    value: 'ubuntu-latest'

stages:
- stage: Build
  displayName: 'Build Stage'
  jobs:
  - job: Build
    displayName: 'Build and Test'
    pool:
      vmImage: $(vmImageName)
    steps:
    - script: |
        echo "Building application..."
        docker build -t myapp:$(Build.BuildId) .
      displayName: 'Build Docker Image'

    - script: |
        echo "Running tests..."
        docker run --rm myapp:$(Build.BuildId) npm test
      displayName: 'Run Tests'

- stage: Deploy_Dev
  displayName: 'Deploy to Development'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeployDev
    displayName: 'Deploy to Dev Environment'
    pool:
      vmImage: $(vmImageName)
    environment: 'development'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: |
              echo "Deploying to development..."
              kubectl apply -f k8s/dev/
            displayName: 'Deploy to Kubernetes'

- stage: Deploy_Prod
  displayName: 'Deploy to Production'
  dependsOn: Deploy_Dev
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployProd
    displayName: 'Deploy to Production'
    pool:
      vmImage: $(vmImageName)
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: |
              echo "Deploying to production..."
              kubectl apply -f k8s/prod/
            displayName: 'Deploy to Production Kubernetes'
```

---

## Self-Hosted Agent Setup

### Docker Agent Configuration

`Create agent-dockerfile:`
```dockerfile
FROM mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-20.04

# Install additional tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    wget \
    unzip \
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

USER vsts
```

`Build and run custom agent:`
```bash
docker build -t custom-azure-agent -f agent-dockerfile .

docker run -d \
  --name azure-agent \
  -e AZP_URL="https://dev.azure.com/yourorganization" \
  -e AZP_TOKEN="your-personal-access-token" \
  -e AZP_AGENT_NAME="custom-docker-agent" \
  -e AZP_POOL="Default" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  custom-azure-agent
```

---

## Advanced Pipeline Features

### Template Usage

`Create templates/build-template.yml:`
```yaml
parameters:
- name: buildConfiguration
  type: string
  default: 'Release'
- name: projectPath
  type: string

steps:
- task: DotNetCoreCLI@2
  displayName: 'Restore ${{ parameters.projectPath }}'
  inputs:
    command: 'restore'
    projects: '${{ parameters.projectPath }}'

- task: DotNetCoreCLI@2
  displayName: 'Build ${{ parameters.projectPath }}'
  inputs:
    command: 'build'
    projects: '${{ parameters.projectPath }}'
    arguments: '--configuration ${{ parameters.buildConfiguration }}'

- task: DotNetCoreCLI@2
  displayName: 'Test ${{ parameters.projectPath }}'
  inputs:
    command: 'test'
    projects: '${{ parameters.projectPath }}'
    arguments: '--configuration ${{ parameters.buildConfiguration }}'
```

`Use template in main pipeline:`
```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

jobs:
- job: BuildAPI
  displayName: 'Build API'
  steps:
  - template: templates/build-template.yml
    parameters:
      buildConfiguration: 'Release'
      projectPath: 'src/API/*.csproj'

- job: BuildWeb
  displayName: 'Build Web'
  steps:
  - template: templates/build-template.yml
    parameters:
      buildConfiguration: 'Release'
      projectPath: 'src/Web/*.csproj'
```

### Conditional Deployments

```yaml
stages:
- stage: Deploy
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToProduction
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Deploying to production"
            condition: eq(variables['Build.Reason'], 'Manual')
```

---

## Integration with External Tools

### Kubernetes Deployment

```yaml
- task: KubernetesManifest@0
  displayName: 'Deploy to Kubernetes'
  inputs:
    action: 'deploy'
    kubernetesServiceConnection: 'k8s-connection'
    namespace: 'production'
    manifests: |
      k8s/deployment.yaml
      k8s/service.yaml
    containers: '$(containerRegistry)/$(imageRepository):$(tag)'
```

### Helm Deployment

```yaml
- task: HelmDeploy@0
  displayName: 'Deploy with Helm'
  inputs:
    connectionType: 'Kubernetes Service Connection'
    kubernetesServiceConnection: 'k8s-connection'
    namespace: 'production'
    command: 'upgrade'
    chartType: 'FilePath'
    chartPath: 'helm/myapp'
    releaseName: 'myapp-release'
    arguments: '--set image.tag=$(tag)'
```

---

## Security and Best Practices

### Variable Groups and Secrets

```yaml
variables:
- group: 'production-secrets'
- name: 'publicVariable'
  value: 'public-value'

steps:
- script: |
    echo "Using secret: $(secret-variable)"
    echo "Public variable: $(publicVariable)"
  env:
    SECRET_VAR: $(secret-variable)
  displayName: 'Use Variables'
```

### Service Connections

```yaml
- task: AzureCLI@2
  displayName: 'Azure CLI Task'
  inputs:
    azureSubscription: 'azure-service-connection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      az group list --output table
```

---

## Monitoring and Reporting

### Test Results Publishing

```yaml
- task: PublishTestResults@2
  displayName: 'Publish Test Results'
  inputs:
    testResultsFormat: 'VSTest'
    testResultsFiles: '**/*.trx'
    mergeTestResults: true

- task: PublishCodeCoverageResults@1
  displayName: 'Publish Code Coverage'
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(Agent.TempDirectory)/**/coverage.cobertura.xml'
```

### Build Artifacts

```yaml
- task: PublishBuildArtifacts@1
  displayName: 'Publish Build Artifacts'
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)'
    ArtifactName: 'drop'
    publishLocation: 'Container'
```

---

## Common Use Cases

- **Enterprise Applications**: Large-scale .NET, Java, and Node.js applications
- **Microservices**: Container-based deployments with Kubernetes
- **Mobile Development**: iOS and Android app CI/CD
- **Infrastructure as Code**: Terraform and ARM template deployments
- **Multi-Cloud Deployments**: Azure, AWS, and GCP integrations

✅ Azure DevOps is now configured for comprehensive CI/CD workflows!
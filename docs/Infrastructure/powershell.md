---
sidebar_position: 10
title: PowerShell
description: PowerShell is a cross-platform task automation and configuration management framework for DevOps automation and infrastructure management.
slug: /Infrastructure/PowerShell
keywords:
  - PowerShell
  - automation
  - scripting
  - DevOps
  - infrastructure management
  - Windows automation
  - cross-platform
  - configuration management
---

# 🚀 DevOps Automation with PowerShell

**PowerShell** is a **cross-platform** task automation and configuration management framework from Microsoft. Perfect for **DevOps automation**, **infrastructure management**, **CI/CD pipelines**, and **system administration** with powerful **object-oriented** scripting capabilities.

## Key Features

- **Cross-Platform**: Runs on Windows, Linux, and macOS
- **Object-Oriented**: Works with .NET objects, not just text
- **Extensive Cmdlets**: Rich set of built-in commands
- **Pipeline Support**: Chain commands together efficiently
- **Remote Management**: Execute commands on remote systems
- **Integration**: Works with Azure, AWS, Docker, Kubernetes

## Use Cases

- **Infrastructure Automation**: Server provisioning and configuration
- **CI/CD Pipelines**: Build automation and deployment scripts
- **System Monitoring**: Health checks and performance monitoring
- **Cloud Management**: Azure, AWS, and GCP resource management

---

## 🧰 Prerequisites

- **PowerShell 7.0+** installed (cross-platform)
- **Administrative privileges** for system-level operations
- **Git** for version control
- **Docker** (optional, for containerized automation)

---

## 🔧 Step 1: Install PowerShell 7+

Install PowerShell on different platforms:

```bash
# Windows (using winget)
winget install Microsoft.PowerShell

# Windows (using Chocolatey)
choco install powershell

# macOS (using Homebrew)
brew install powershell

# Ubuntu/Debian
wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y powershell

# Verify installation
pwsh --version
```

---

## 🏗️ Step 2: Basic PowerShell for DevOps

Create a system monitoring script `system-monitor.ps1`:

```powershell
#!/usr/bin/env pwsh

# System Monitoring Script
param(
    [string]$OutputPath = "./system-report.html"
)

function Get-SystemInfo {
    $SystemInfo = @{
        ComputerName = $env:COMPUTERNAME
        OperatingSystem = if ($IsWindows) { 
            (Get-CimInstance Win32_OperatingSystem).Caption 
        } elseif ($IsLinux) { 
            (Get-Content /etc/os-release | Where-Object { $_ -match "PRETTY_NAME" }).Split("=")[1].Trim('"')
        } elseif ($IsMacOS) { 
            "macOS $(sw_vers -productVersion)"
        }
        PowerShellVersion = $PSVersionTable.PSVersion.ToString()
        TotalMemoryGB = [math]::Round((Get-CimInstance -ClassName CIM_PhysicalMemory | 
                                     Measure-Object -Property Capacity -Sum).Sum / 1GB, 2)
        CPUCores = (Get-CimInstance -ClassName CIM_Processor).NumberOfCores
        LastBootTime = if ($IsWindows) { 
            (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime 
        } else { 
            "N/A (Non-Windows)"
        }
    }
    
    return $SystemInfo
}

function Get-DiskUsage {
    if ($IsWindows) {
        $Disks = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        $DiskInfo = foreach ($Disk in $Disks) {
            @{
                Drive = $Disk.DeviceID
                SizeGB = [math]::Round($Disk.Size / 1GB, 2)
                FreeGB = [math]::Round($Disk.FreeSpace / 1GB, 2)
                UsedGB = [math]::Round(($Disk.Size - $Disk.FreeSpace) / 1GB, 2)
                PercentUsed = [math]::Round((($Disk.Size - $Disk.FreeSpace) / $Disk.Size) * 100, 2)
            }
        }
    } else {
        # Linux/macOS
        $DfOutput = df -h | Select-Object -Skip 1
        $DiskInfo = foreach ($Line in $DfOutput) {
            $Fields = $Line -split '\s+' | Where-Object { $_ -ne "" }
            if ($Fields.Count -ge 6) {
                @{
                    Drive = $Fields[0]
                    SizeGB = $Fields[1]
                    UsedGB = $Fields[2]
                    FreeGB = $Fields[3]
                    PercentUsed = $Fields[4].TrimEnd('%')
                }
            }
        }
    }
    
    return $DiskInfo
}

function Test-ServiceHealth {
    param(
        [string[]]$ServiceNames = @("nginx", "apache2", "mysql", "postgresql", "redis", "docker")
    )
    
    $ServiceStatus = foreach ($ServiceName in $ServiceNames) {
        try {
            $Service = Get-Service -Name $ServiceName -ErrorAction Stop
            @{
                Name = $ServiceName
                Status = $Service.Status
                StartType = $Service.StartType
                CanStop = $Service.CanStop
            }
        }
        catch {
            @{
                Name = $ServiceName
                Status = "NotInstalled"
                StartType = "N/A"
                CanStop = $false
            }
        }
    }
    
    return $ServiceStatus
}

# Generate System Report
Write-Host "Generating system report..." -ForegroundColor Green

$SystemInfo = Get-SystemInfo
$DiskUsage = Get-DiskUsage
$ServiceStatus = Test-ServiceHealth

Write-Host "System Information:" -ForegroundColor Yellow
$SystemInfo | Format-Table -AutoSize

Write-Host "Disk Usage:" -ForegroundColor Yellow
$DiskUsage | Format-Table -AutoSize

Write-Host "Service Status:" -ForegroundColor Yellow
$ServiceStatus | Format-Table -AutoSize

Write-Host "Report completed!" -ForegroundColor Green
```

---

## 📁 Step 3: Docker Management with PowerShell

Create a Docker management script `docker-manager.ps1`:

```powershell
#!/usr/bin/env pwsh

function Test-DockerInstallation {
    try {
        $DockerVersion = docker --version
        Write-Host "Docker is installed: $DockerVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Docker is not installed or not accessible"
        return $false
    }
}

function Get-DockerContainers {
    param(
        [switch]$All
    )
    
    $Command = "docker ps --format 'table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}'"
    
    if ($All) {
        $Command += " -a"
    }
    
    try {
        $Output = Invoke-Expression $Command
        return $Output
    }
    catch {
        Write-Error "Failed to get Docker containers: $($_.Exception.Message)"
        return $null
    }
}

function New-DockerContainer {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ImageName,
        
        [Parameter(Mandatory=$true)]
        [string]$ContainerName,
        
        [string[]]$Ports = @(),
        [hashtable]$Environment = @{},
        [switch]$Detached = $true
    )
    
    $DockerCommand = "docker run"
    
    if ($Detached) {
        $DockerCommand += " -d"
    }
    
    $DockerCommand += " --name $ContainerName"
    
    foreach ($Port in $Ports) {
        $DockerCommand += " -p $Port"
    }
    
    foreach ($Key in $Environment.Keys) {
        $DockerCommand += " -e $Key=$($Environment[$Key])"
    }
    
    $DockerCommand += " $ImageName"
    
    try {
        Write-Host "Running: $DockerCommand" -ForegroundColor Cyan
        Invoke-Expression $DockerCommand
        Write-Host "Container '$ContainerName' created successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to create container '$ContainerName': $($_.Exception.Message)"
    }
}

# Example usage
if (Test-DockerInstallation) {
    Write-Host "Docker Management Demo" -ForegroundColor Blue
    
    Write-Host "Running Containers:" -ForegroundColor Green
    Get-DockerContainers
    
    Write-Host "Creating test nginx container..." -ForegroundColor Yellow
    New-DockerContainer -ImageName "nginx:alpine" -ContainerName "test-nginx" -Ports @("8080:80")
    
    Start-Sleep -Seconds 5
    
    Write-Host "All Containers:" -ForegroundColor Green
    Get-DockerContainers -All
}
```

---

## ▶️ Step 4: CI/CD Pipeline Integration

Create an Azure DevOps pipeline script `azure-devops.ps1`:

```powershell
#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$Organization,
    
    [Parameter(Mandatory=$true)]
    [string]$Project,
    
    [Parameter(Mandatory=$true)]
    [string]$PersonalAccessToken,
    
    [string]$BuildDefinitionId
)

# Set up authentication
$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes(":$PersonalAccessToken"))
$Headers = @{
    Authorization = "Basic $EncodedToken"
    'Content-Type' = 'application/json'
}

$BaseUri = "https://dev.azure.com/$Organization/$Project/_apis"

function Get-BuildDefinitions {
    $Uri = "$BaseUri/build/definitions?api-version=6.0"
    
    try {
        $Response = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Get
        return $Response.value
    }
    catch {
        Write-Error "Failed to get build definitions: $($_.Exception.Message)"
        return $null
    }
}

function Start-Build {
    param(
        [Parameter(Mandatory=$true)]
        [string]$DefinitionId,
        
        [string]$SourceBranch = "refs/heads/main"
    )
    
    $Uri = "$BaseUri/build/builds?api-version=6.0"
    
    $Body = @{
        definition = @{
            id = $DefinitionId
        }
        sourceBranch = $SourceBranch
    } | ConvertTo-Json -Depth 3
    
    try {
        $Response = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Post -Body $Body
        return $Response
    }
    catch {
        Write-Error "Failed to start build: $($_.Exception.Message)"
        return $null
    }
}

function Get-BuildStatus {
    param(
        [Parameter(Mandatory=$true)]
        [string]$BuildId
    )
    
    $Uri = "$BaseUri/build/builds/$BuildId?api-version=6.0"
    
    try {
        $Response = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Get
        return $Response
    }
    catch {
        Write-Error "Failed to get build status: $($_.Exception.Message)"
        return $null
    }
}

# Main execution
Write-Host "Azure DevOps Automation" -ForegroundColor Blue

# Get build definitions
$BuildDefinitions = Get-BuildDefinitions

if ($BuildDefinitions) {
    Write-Host "Available Build Definitions:" -ForegroundColor Yellow
    $BuildDefinitions | Select-Object id, name, type | Format-Table -AutoSize
    
    # If specific build definition provided, start build
    if ($BuildDefinitionId) {
        Write-Host "Starting build for definition ID: $BuildDefinitionId" -ForegroundColor Green
        $Build = Start-Build -DefinitionId $BuildDefinitionId
        
        if ($Build) {
            Write-Host "Build started successfully. Build ID: $($Build.id)" -ForegroundColor Cyan
            Write-Host "Build URL: $($Build._links.web.href)" -ForegroundColor Cyan
        }
    }
}
```

---

## 📊 Step 5: Configuration Management

Create a configuration management script `config-manager.ps1`:

```powershell
#!/usr/bin/env pwsh

class ConfigurationManager {
    [hashtable]$Configurations
    [string]$ConfigPath
    
    ConfigurationManager([string]$ConfigPath) {
        $this.ConfigPath = $ConfigPath
        $this.Configurations = @{}
        $this.LoadConfigurations()
    }
    
    [void]LoadConfigurations() {
        if (Test-Path $this.ConfigPath) {
            try {
                $Content = Get-Content $this.ConfigPath -Raw | ConvertFrom-Json -AsHashtable
                $this.Configurations = $Content
                Write-Host "Configurations loaded from $($this.ConfigPath)" -ForegroundColor Green
            }
            catch {
                Write-Warning "Failed to load configurations: $($_.Exception.Message)"
                $this.Configurations = @{}
            }
        } else {
            Write-Host "Configuration file not found. Creating new configuration." -ForegroundColor Yellow
            $this.Configurations = @{}
        }
    }
    
    [void]SaveConfigurations() {
        try {
            $this.Configurations | ConvertTo-Json -Depth 10 | Out-File $this.ConfigPath -Encoding UTF8
            Write-Host "Configurations saved to $($this.ConfigPath)" -ForegroundColor Green
        }
        catch {
            Write-Error "Failed to save configurations: $($_.Exception.Message)"
        }
    }
    
    [object]GetConfiguration([string]$Key) {
        if ($this.Configurations.ContainsKey($Key)) {
            return $this.Configurations[$Key]
        }
        return $null
    }
    
    [void]SetConfiguration([string]$Key, [object]$Value) {
        $this.Configurations[$Key] = $Value
        Write-Host "Configuration '$Key' updated" -ForegroundColor Cyan
    }
}

# Example usage
$ConfigManager = [ConfigurationManager]::new("app-config.json")

# Set environment configuration
$ConfigManager.SetConfiguration("Environment", "Development")
$ConfigManager.SetConfiguration("DatabaseUrl", "localhost:5432")
$ConfigManager.SetConfiguration("ApiKey", "dev-api-key-123")

# Save configurations
$ConfigManager.SaveConfigurations()

# Display current configuration
Write-Host "Current Configuration:" -ForegroundColor Green
$ConfigManager.GetAllConfigurations() | ConvertTo-Json -Depth 10
```

---

## 🔍 What You'll See

### System Monitoring Output
```
System Information:
ComputerName      : DEV-MACHINE
OperatingSystem   : Ubuntu 20.04.3 LTS
PowerShellVersion : 7.3.0
TotalMemoryGB     : 16.00
CPUCores          : 8

Disk Usage:
Drive    SizeGB  FreeGB  UsedGB  PercentUsed
-----    ------  ------  ------  -----------
/dev/sda1  100.00   45.23   54.77        54.77

Service Status:
Name        Status      StartType
----        ------      ---------
nginx       Running     Automatic
docker      Running     Automatic
mysql       NotInstalled N/A
```

### Docker Management
- **Container Listing**: View running and stopped containers
- **Container Creation**: Automated container deployment
- **Health Monitoring**: Check container status and logs

### CI/CD Integration
- **Build Triggering**: Start builds programmatically
- **Status Monitoring**: Track build progress
- **Pipeline Automation**: Integrate with Azure DevOps, GitHub Actions

---

## Pros & Cons

### ✅ Pros
- **Cross-Platform**: Works on Windows, Linux, and macOS
- **Object-Oriented**: Rich object manipulation capabilities
- **Extensive Ecosystem**: Large library of modules and cmdlets
- **Integration**: Native support for cloud platforms and DevOps tools
- **Powerful Pipeline**: Efficient data processing with pipelines

### ❌ Cons
- **Learning Curve**: Different syntax from traditional shell scripting
- **Performance**: Can be slower than native shell scripts for simple tasks
- **Memory Usage**: Higher memory footprint than lightweight shells
- **Windows Heritage**: Some cmdlets still Windows-centric

---

## Conclusion

PowerShell is ideal for **DevOps automation** and **infrastructure management** across platforms. Choose PowerShell when you need:

- **Cross-platform** automation scripts
- **Object-oriented** data manipulation
- **Integration** with Microsoft and cloud ecosystems
- **Advanced** configuration management

PowerShell bridges the gap between simple shell scripting and full programming languages, making it perfect for complex automation tasks.

**What You've Achieved:**
✅ Set up cross-platform PowerShell automation  
✅ Created system monitoring and reporting scripts  
✅ Implemented Docker container management  
✅ Integrated with CI/CD pipelines  
✅ Built configuration management solutions
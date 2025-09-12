---
sidebar_position: 3
title: Checkmarx SAST
description: Checkmarx is a leading Static Application Security Testing (SAST) platform. Learn how to integrate Checkmarx for automated security code analysis in your CI/CD pipelines.
slug: /TestingScanning/Checkmarx
keywords:
  - Checkmarx
  - SAST
  - static application security testing
  - code security analysis
  - vulnerability scanning
  - secure coding
  - DevSecOps
  - security automation
  - code quality
  - security compliance
---

# 🚀 Automated Security Code Analysis with Checkmarx SAST

**Checkmarx SAST** is a leading **Static Application Security Testing** platform that identifies **security vulnerabilities** in source code without executing the application. Perfect for **DevSecOps** workflows with comprehensive **language support** and **CI/CD integration**.

---

## 🧰 Prerequisites

Make sure you have the following:
- **Checkmarx SAST** server or cloud access
- **Checkmarx CLI** or plugin installed
- **Source code repository** (Git, SVN, etc.)
- **CI/CD pipeline** (Jenkins, Azure DevOps, GitHub Actions)
- **Basic understanding** of security vulnerabilities

---

## 🔧 Step 1: Setup Checkmarx CLI

### Install Checkmarx CLI

```bash
# Download Checkmarx CLI (CxConsole)
# Windows
curl -O https://download.checkmarx.com/CxConsolePlugin/CxConsolePlugin-2023.2.7.zip
unzip CxConsolePlugin-2023.2.7.zip

# Linux/macOS
wget https://download.checkmarx.com/CxConsolePlugin/CxConsolePlugin-2023.2.7.zip
unzip CxConsolePlugin-2023.2.7.zip

# Make executable (Linux/macOS)
chmod +x runCxConsole.sh

# Verify installation
./runCxConsole.sh -v
```

### Configure Checkmarx Connection

`Create checkmarx-config.properties:`
```properties
# Checkmarx Server Configuration
cx.server.url=https://your-checkmarx-server.com
cx.username=your-username
cx.password=your-password

# Or use token authentication
cx.token=your-api-token

# Project Configuration
cx.project.name=MyApplication
cx.team.name=\\CxServer\\SP\\Company\\Development

# Scan Configuration
cx.preset=Checkmarx Default
cx.configuration=Default Configuration
cx.exclude.folders=node_modules,vendor,target,bin,obj,.git
cx.exclude.files=*.min.js,*.bundle.js,*.spec.js,*.test.js

# Report Configuration
cx.report.format=PDF,XML,CSV
cx.report.output.path=./checkmarx-reports/
```

---

## 🏗️ Step 2: Basic SAST Scanning

### Command Line Scanning

```bash
# Basic scan command
./runCxConsole.sh \
  -CxServer https://your-checkmarx-server.com \
  -CxUser your-username \
  -CxPassword your-password \
  -ProjectName "MyApplication" \
  -LocationType folder \
  -LocationPath ./src \
  -Preset "Checkmarx Default" \
  -ReportXML ./reports/checkmarx-report.xml \
  -ReportPDF ./reports/checkmarx-report.pdf \
  -v

# Scan with custom configuration
./runCxConsole.sh \
  -CxServer https://your-checkmarx-server.com \
  -CxToken your-api-token \
  -ProjectName "MyApplication" \
  -LocationType folder \
  -LocationPath ./src \
  -Preset "OWASP Top 10 - 2021" \
  -Configuration "Multi-Language Scan" \
  -ExcludeFolders "node_modules,vendor,target" \
  -ExcludeFiles "*.min.js,*.bundle.js" \
  -ReportXML ./reports/scan-results.xml \
  -Comment "Automated CI/CD scan" \
  -Incremental \
  -v
```

### PowerShell Scanning Script

`Create checkmarx-scan.ps1:`
```powershell
#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUrl = $env:CHECKMARX_SERVER_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = $env:CHECKMARX_USERNAME,
    
    [Parameter(Mandatory=$false)]
    [string]$Password = $env:CHECKMARX_PASSWORD,
    
    [Parameter(Mandatory=$false)]
    [string]$Token = $env:CHECKMARX_TOKEN,
    
    [Parameter(Mandatory=$false)]
    [string]$Preset = "Checkmarx Default",
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "./checkmarx-reports"
)

# Create reports directory
if (-not (Test-Path $ReportPath)) {
    New-Item -Path $ReportPath -ItemType Directory -Force
}

# Build Checkmarx command
$CxCommand = @(
    "./runCxConsole.sh"
    "-CxServer", $ServerUrl
    "-ProjectName", $ProjectName
    "-LocationType", "folder"
    "-LocationPath", $SourcePath
    "-Preset", $Preset
    "-ReportXML", "$ReportPath/checkmarx-results.xml"
    "-ReportPDF", "$ReportPath/checkmarx-results.pdf"
    "-ReportCSV", "$ReportPath/checkmarx-results.csv"
    "-v"
)

# Add authentication
if ($Token) {
    $CxCommand += "-CxToken", $Token
} else {
    $CxCommand += "-CxUser", $Username
    $CxCommand += "-CxPassword", $Password
}

# Add exclusions
$CxCommand += "-ExcludeFolders", "node_modules,vendor,target,bin,obj,.git,.vscode"
$CxCommand += "-ExcludeFiles", "*.min.js,*.bundle.js,*.spec.js,*.test.js"

Write-Host "Starting Checkmarx SAST scan..." -ForegroundColor Green
Write-Host "Project: $ProjectName" -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Cyan
Write-Host "Preset: $Preset" -ForegroundColor Cyan

try {
    # Execute scan
    $Result = & $CxCommand[0] $CxCommand[1..($CxCommand.Length-1)]
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Checkmarx scan completed successfully!" -ForegroundColor Green
        
        # Parse results
        if (Test-Path "$ReportPath/checkmarx-results.xml") {
            [xml]$XmlReport = Get-Content "$ReportPath/checkmarx-results.xml"
            
            $ScanSummary = @{
                ProjectName = $XmlReport.CxXMLResults.ProjectName
                ScanId = $XmlReport.CxXMLResults.ScanId
                HighSeverity = ($XmlReport.CxXMLResults.Query | Where-Object { $_.Severity -eq "High" }).Count
                MediumSeverity = ($XmlReport.CxXMLResults.Query | Where-Object { $_.Severity -eq "Medium" }).Count
                LowSeverity = ($XmlReport.CxXMLResults.Query | Where-Object { $_.Severity -eq "Low" }).Count
                InfoSeverity = ($XmlReport.CxXMLResults.Query | Where-Object { $_.Severity -eq "Information" }).Count
            }
            
            Write-Host "`nScan Summary:" -ForegroundColor Yellow
            $ScanSummary | Format-Table -AutoSize
            
            # Check for high severity issues
            if ($ScanSummary.HighSeverity -gt 0) {
                Write-Warning "Found $($ScanSummary.HighSeverity) high severity vulnerabilities!"
                exit 1
            }
        }
    } else {
        Write-Error "Checkmarx scan failed with exit code: $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}
catch {
    Write-Error "Error running Checkmarx scan: $($_.Exception.Message)"
    exit 1
}
```

---

## ▶️ Step 3: CI/CD Pipeline Integration

### Jenkins Pipeline Integration

`Create Jenkinsfile:`
```groovy
pipeline {
    agent any
    
    environment {
        CHECKMARX_SERVER_URL = credentials('checkmarx-server-url')
        CHECKMARX_USERNAME = credentials('checkmarx-username')
        CHECKMARX_PASSWORD = credentials('checkmarx-password')
        PROJECT_NAME = "MyApplication-${env.BRANCH_NAME}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    // Build your application
                    if (fileExists('package.json')) {
                        sh 'npm ci'
                        sh 'npm run build'
                    } else if (fileExists('pom.xml')) {
                        sh 'mvn clean compile'
                    } else if (fileExists('requirements.txt')) {
                        sh 'pip install -r requirements.txt'
                    }
                }
            }
        }
        
        stage('Checkmarx SAST Scan') {
            steps {
                script {
                    // Download Checkmarx CLI if not present
                    if (!fileExists('runCxConsole.sh')) {
                        sh '''
                            wget -q https://download.checkmarx.com/CxConsolePlugin/CxConsolePlugin-2023.2.7.zip
                            unzip -q CxConsolePlugin-2023.2.7.zip
                            chmod +x runCxConsole.sh
                        '''
                    }
                    
                    // Run Checkmarx scan
                    sh '''
                        ./runCxConsole.sh \
                            -CxServer ${CHECKMARX_SERVER_URL} \
                            -CxUser ${CHECKMARX_USERNAME} \
                            -CxPassword ${CHECKMARX_PASSWORD} \
                            -ProjectName "${PROJECT_NAME}" \
                            -LocationType folder \
                            -LocationPath ./src \
                            -Preset "Checkmarx Default" \
                            -Configuration "Multi-Language Scan" \
                            -ExcludeFolders "node_modules,vendor,target,bin,obj,.git" \
                            -ExcludeFiles "*.min.js,*.bundle.js,*.spec.js" \
                            -ReportXML ./checkmarx-results.xml \
                            -ReportPDF ./checkmarx-results.pdf \
                            -Comment "Jenkins Pipeline Scan - Build ${BUILD_NUMBER}" \
                            -v
                    '''
                }
            }
            
            post {
                always {
                    // Archive scan results
                    archiveArtifacts artifacts: 'checkmarx-results.*', allowEmptyArchive: true
                    
                    // Publish results
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'checkmarx-results.pdf',
                        reportName: 'Checkmarx SAST Report'
                    ])
                }
            }
        }
        
        stage('Security Gate') {
            steps {
                script {
                    // Parse XML results and apply security gates
                    if (fileExists('checkmarx-results.xml')) {
                        def xmlReport = readFile('checkmarx-results.xml')
                        def results = new XmlSlurper().parseText(xmlReport)
                        
                        def highSeverity = results.Query.findAll { it.@Severity == 'High' }.size()
                        def mediumSeverity = results.Query.findAll { it.@Severity == 'Medium' }.size()
                        
                        echo "Security Scan Results:"
                        echo "High Severity: ${highSeverity}"
                        echo "Medium Severity: ${mediumSeverity}"
                        
                        // Security gate: Fail if high severity vulnerabilities found
                        if (highSeverity > 0) {
                            error("Security gate failed: Found ${highSeverity} high severity vulnerabilities")
                        }
                        
                        // Warning for medium severity
                        if (mediumSeverity > 10) {
                            unstable("Warning: Found ${mediumSeverity} medium severity vulnerabilities")
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean up
            sh 'rm -f CxConsolePlugin-*.zip'
        }
        
        failure {
            // Send notification on failure
            emailext (
                subject: "Checkmarx SAST Scan Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The Checkmarx SAST scan failed for ${env.JOB_NAME} build #${env.BUILD_NUMBER}. Please check the console output for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### GitHub Actions Integration

`Create .github/workflows/checkmarx-sast.yml:`
```yaml
name: Checkmarx SAST Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  checkmarx-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js (if needed)
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
      if: hashFiles('package.json') != ''
      
    - name: Install dependencies
      run: |
        if [ -f "package.json" ]; then
          npm ci
        elif [ -f "requirements.txt" ]; then
          pip install -r requirements.txt
        elif [ -f "pom.xml" ]; then
          mvn dependency:resolve
        fi
      
    - name: Download Checkmarx CLI
      run: |
        wget -q https://download.checkmarx.com/CxConsolePlugin/CxConsolePlugin-2023.2.7.zip
        unzip -q CxConsolePlugin-2023.2.7.zip
        chmod +x runCxConsole.sh
        
    - name: Run Checkmarx SAST Scan
      env:
        CHECKMARX_SERVER_URL: ${{ secrets.CHECKMARX_SERVER_URL }}
        CHECKMARX_USERNAME: ${{ secrets.CHECKMARX_USERNAME }}
        CHECKMARX_PASSWORD: ${{ secrets.CHECKMARX_PASSWORD }}
      run: |
        ./runCxConsole.sh \
          -CxServer $CHECKMARX_SERVER_URL \
          -CxUser $CHECKMARX_USERNAME \
          -CxPassword $CHECKMARX_PASSWORD \
          -ProjectName "${{ github.repository }}-${{ github.ref_name }}" \
          -LocationType folder \
          -LocationPath ./src \
          -Preset "Checkmarx Default" \
          -Configuration "Multi-Language Scan" \
          -ExcludeFolders "node_modules,vendor,target,bin,obj,.git,.github" \
          -ExcludeFiles "*.min.js,*.bundle.js,*.spec.js,*.test.js" \
          -ReportXML ./checkmarx-results.xml \
          -ReportPDF ./checkmarx-results.pdf \
          -ReportCSV ./checkmarx-results.csv \
          -Comment "GitHub Actions Scan - ${{ github.sha }}" \
          -v
          
    - name: Parse Scan Results
      id: parse-results
      run: |
        if [ -f "checkmarx-results.xml" ]; then
          # Extract vulnerability counts using xmllint
          HIGH_COUNT=$(xmllint --xpath "count(//Query[@Severity='High'])" checkmarx-results.xml 2>/dev/null || echo "0")
          MEDIUM_COUNT=$(xmllint --xpath "count(//Query[@Severity='Medium'])" checkmarx-results.xml 2>/dev/null || echo "0")
          LOW_COUNT=$(xmllint --xpath "count(//Query[@Severity='Low'])" checkmarx-results.xml 2>/dev/null || echo "0")
          
          echo "high_count=$HIGH_COUNT" >> $GITHUB_OUTPUT
          echo "medium_count=$MEDIUM_COUNT" >> $GITHUB_OUTPUT
          echo "low_count=$LOW_COUNT" >> $GITHUB_OUTPUT
          
          echo "## Checkmarx SAST Results" >> $GITHUB_STEP_SUMMARY
          echo "| Severity | Count |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| High | $HIGH_COUNT |" >> $GITHUB_STEP_SUMMARY
          echo "| Medium | $MEDIUM_COUNT |" >> $GITHUB_STEP_SUMMARY
          echo "| Low | $LOW_COUNT |" >> $GITHUB_STEP_SUMMARY
        fi
        
    - name: Security Gate Check
      run: |
        HIGH_COUNT=${{ steps.parse-results.outputs.high_count }}
        MEDIUM_COUNT=${{ steps.parse-results.outputs.medium_count }}
        
        echo "High severity vulnerabilities: $HIGH_COUNT"
        echo "Medium severity vulnerabilities: $MEDIUM_COUNT"
        
        if [ "$HIGH_COUNT" -gt "0" ]; then
          echo "❌ Security gate failed: Found $HIGH_COUNT high severity vulnerabilities"
          exit 1
        fi
        
        if [ "$MEDIUM_COUNT" -gt "10" ]; then
          echo "⚠️ Warning: Found $MEDIUM_COUNT medium severity vulnerabilities"
        fi
        
        echo "✅ Security gate passed"
        
    - name: Upload Scan Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: checkmarx-results
        path: |
          checkmarx-results.xml
          checkmarx-results.pdf
          checkmarx-results.csv
        retention-days: 30
        
    - name: Comment PR with Results
      uses: actions/github-script@v6
      if: github.event_name == 'pull_request'
      with:
        script: |
          const fs = require('fs');
          
          if (fs.existsSync('checkmarx-results.xml')) {
            const highCount = '${{ steps.parse-results.outputs.high_count }}';
            const mediumCount = '${{ steps.parse-results.outputs.medium_count }}';
            const lowCount = '${{ steps.parse-results.outputs.low_count }}';
            
            const comment = `## 🔒 Checkmarx SAST Scan Results
            
            | Severity | Count |
            |----------|-------|
            | 🔴 High | ${highCount} |
            | 🟡 Medium | ${mediumCount} |
            | 🔵 Low | ${lowCount} |
            
            ${highCount > 0 ? '❌ **Security gate failed** - High severity vulnerabilities found!' : '✅ **Security gate passed**'}
            
            📊 [View detailed report in artifacts](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }
```

---

## 📊 Step 4: Advanced Configuration and Customization

### Custom Security Queries

`Create custom-queries.xml:`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CxXMLResults>
    <CustomQueries>
        <Query id="1001" name="Hardcoded API Keys" severity="High" language="JavaScript">
            <Description>Detects hardcoded API keys in JavaScript code</Description>
            <Pattern>
                <![CDATA[
                // Pattern to detect common API key patterns
                (api[_-]?key|apikey|access[_-]?token|secret[_-]?key)\s*[:=]\s*['"]\w{20,}['"]
                ]]>
            </Pattern>
        </Query>
        
        <Query id="1002" name="Insecure Random Number Generation" severity="Medium" language="Java">
            <Description>Detects use of insecure random number generators</Description>
            <Pattern>
                <![CDATA[
                new\s+Random\s*\(\s*\)|Math\.random\s*\(\s*\)
                ]]>
            </Pattern>
        </Query>
        
        <Query id="1003" name="SQL Injection in Dynamic Queries" severity="High" language="C#">
            <Description>Detects potential SQL injection vulnerabilities</Description>
            <Pattern>
                <![CDATA[
                (ExecuteNonQuery|ExecuteScalar|ExecuteReader)\s*\(\s*[^)]*\+[^)]*\)
                ]]>
            </Pattern>
        </Query>
    </CustomQueries>
</CxXMLResults>
```

### Project Configuration Template

`Create project-config.json:`
```json
{
  "projectSettings": {
    "name": "MyApplication",
    "description": "Security scanning for MyApplication",
    "team": "\\CxServer\\SP\\Company\\Development",
    "preset": "Checkmarx Default",
    "configuration": "Multi-Language Scan",
    "engineConfiguration": "Default Configuration"
  },
  "scanSettings": {
    "incremental": true,
    "forceScan": false,
    "comment": "Automated security scan",
    "excludeFolders": [
      "node_modules",
      "vendor",
      "target",
      "bin",
      "obj",
      ".git",
      ".vscode",
      "coverage",
      "dist",
      "build"
    ],
    "excludeFiles": [
      "*.min.js",
      "*.bundle.js",
      "*.spec.js",
      "*.test.js",
      "*.d.ts",
      "*.map"
    ]
  },
  "reportSettings": {
    "formats": ["XML", "PDF", "CSV"],
    "outputPath": "./checkmarx-reports/",
    "includeSourceCode": false
  },
  "securityGates": {
    "highSeverityThreshold": 0,
    "mediumSeverityThreshold": 10,
    "lowSeverityThreshold": 50,
    "failBuildOnHigh": true,
    "failBuildOnMedium": false
  }
}
```

### Results Processing Script

`Create process-results.py:`
```python
#!/usr/bin/env python3

import xml.etree.ElementTree as ET
import json
import csv
import argparse
from datetime import datetime

class CheckmarxResultsProcessor:
    def __init__(self, xml_file):
        self.xml_file = xml_file
        self.tree = ET.parse(xml_file)
        self.root = self.tree.getroot()
        
    def extract_summary(self):
        """Extract scan summary information"""
        summary = {
            'project_name': self.root.get('ProjectName', ''),
            'scan_id': self.root.get('ScanId', ''),
            'scan_date': self.root.get('ScanStart', ''),
            'total_vulnerabilities': 0,
            'by_severity': {
                'High': 0,
                'Medium': 0,
                'Low': 0,
                'Information': 0
            },
            'by_category': {},
            'by_language': {}
        }
        
        # Count vulnerabilities by severity
        for query in self.root.findall('.//Query'):
            severity = query.get('Severity', 'Unknown')
            category = query.get('name', 'Unknown')
            language = query.get('Language', 'Unknown')
            
            summary['total_vulnerabilities'] += 1
            
            if severity in summary['by_severity']:
                summary['by_severity'][severity] += 1
            
            if category not in summary['by_category']:
                summary['by_category'][category] = 0
            summary['by_category'][category] += 1
            
            if language not in summary['by_language']:
                summary['by_language'][language] = 0
            summary['by_language'][language] += 1
        
        return summary
    
    def extract_vulnerabilities(self):
        """Extract detailed vulnerability information"""
        vulnerabilities = []
        
        for query in self.root.findall('.//Query'):
            query_info = {
                'id': query.get('id', ''),
                'name': query.get('name', ''),
                'severity': query.get('Severity', ''),
                'language': query.get('Language', ''),
                'group': query.get('group', ''),
                'results': []
            }
            
            # Extract individual results
            for result in query.findall('.//Result'):
                result_info = {
                    'state': result.get('state', ''),
                    'severity': result.get('Severity', ''),
                    'file_name': result.get('FileName', ''),
                    'line': result.get('Line', ''),
                    'column': result.get('Column', ''),
                    'node_id': result.get('NodeId', ''),
                    'source': result.find('.//Source').text if result.find('.//Source') is not None else '',
                    'path': []
                }
                
                # Extract path information
                for path_node in result.findall('.//PathNode'):
                    path_info = {
                        'file_name': path_node.find('FileName').text if path_node.find('FileName') is not None else '',
                        'line': path_node.find('Line').text if path_node.find('Line') is not None else '',
                        'column': path_node.find('Column').text if path_node.find('Column') is not None else '',
                        'node_id': path_node.find('NodeId').text if path_node.find('NodeId') is not None else '',
                        'name': path_node.find('Name').text if path_node.find('Name') is not None else '',
                        'type': path_node.find('Type').text if path_node.find('Type') is not None else '',
                        'length': path_node.find('Length').text if path_node.find('Length') is not None else '',
                        'snippet': path_node.find('Snippet/Line/Code').text if path_node.find('Snippet/Line/Code') is not None else ''
                    }
                    result_info['path'].append(path_info)
                
                query_info['results'].append(result_info)
            
            vulnerabilities.append(query_info)
        
        return vulnerabilities
    
    def generate_json_report(self, output_file):
        """Generate JSON report"""
        summary = self.extract_summary()
        vulnerabilities = self.extract_vulnerabilities()
        
        report = {
            'scan_summary': summary,
            'vulnerabilities': vulnerabilities,
            'generated_at': datetime.now().isoformat()
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"JSON report generated: {output_file}")
    
    def generate_csv_report(self, output_file):
        """Generate CSV report"""
        vulnerabilities = self.extract_vulnerabilities()
        
        with open(output_file, 'w', newline='') as csvfile:
            fieldnames = [
                'query_id', 'query_name', 'severity', 'language', 'group',
                'file_name', 'line', 'column', 'state', 'source_snippet'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for vuln in vulnerabilities:
                for result in vuln['results']:
                    writer.writerow({
                        'query_id': vuln['id'],
                        'query_name': vuln['name'],
                        'severity': vuln['severity'],
                        'language': vuln['language'],
                        'group': vuln['group'],
                        'file_name': result['file_name'],
                        'line': result['line'],
                        'column': result['column'],
                        'state': result['state'],
                        'source_snippet': result['source'][:100] + '...' if len(result['source']) > 100 else result['source']
                    })
        
        print(f"CSV report generated: {output_file}")
    
    def print_summary(self):
        """Print scan summary to console"""
        summary = self.extract_summary()
        
        print("\n" + "="*50)
        print("CHECKMARX SAST SCAN SUMMARY")
        print("="*50)
        print(f"Project: {summary['project_name']}")
        print(f"Scan ID: {summary['scan_id']}")
        print(f"Scan Date: {summary['scan_date']}")
        print(f"Total Vulnerabilities: {summary['total_vulnerabilities']}")
        
        print("\nBy Severity:")
        for severity, count in summary['by_severity'].items():
            if count > 0:
                print(f"  {severity}: {count}")
        
        print("\nTop Vulnerability Categories:")
        sorted_categories = sorted(summary['by_category'].items(), key=lambda x: x[1], reverse=True)
        for category, count in sorted_categories[:10]:
            print(f"  {category}: {count}")
        
        print("\nBy Language:")
        for language, count in summary['by_language'].items():
            if count > 0:
                print(f"  {language}: {count}")
        
        print("="*50)

def main():
    parser = argparse.ArgumentParser(description='Process Checkmarx SAST scan results')
    parser.add_argument('xml_file', help='Path to Checkmarx XML results file')
    parser.add_argument('--json', help='Generate JSON report')
    parser.add_argument('--csv', help='Generate CSV report')
    parser.add_argument('--summary', action='store_true', help='Print summary to console')
    
    args = parser.parse_args()
    
    try:
        processor = CheckmarxResultsProcessor(args.xml_file)
        
        if args.summary:
            processor.print_summary()
        
        if args.json:
            processor.generate_json_report(args.json)
        
        if args.csv:
            processor.generate_csv_report(args.csv)
        
        if not any([args.json, args.csv, args.summary]):
            processor.print_summary()
            
    except Exception as e:
        print(f"Error processing results: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
```

---

## 🔍 Step 5: Security Policy and Compliance

### Security Policy Configuration

`Create security-policy.yaml:`
```yaml
# Checkmarx Security Policy Configuration
security_policy:
  name: "Corporate Security Policy"
  version: "1.0"
  
  # Vulnerability thresholds
  thresholds:
    high_severity:
      max_allowed: 0
      fail_build: true
      require_approval: true
    medium_severity:
      max_allowed: 5
      fail_build: false
      require_approval: true
    low_severity:
      max_allowed: 20
      fail_build: false
      require_approval: false
  
  # Compliance requirements
  compliance:
    standards:
      - "OWASP Top 10"
      - "CWE Top 25"
      - "PCI DSS"
      - "SOX"
    
    required_scans:
      - "SAST"
      - "Dependency Check"
      - "Container Scan"
    
    reporting:
      frequency: "weekly"
      recipients:
        - "security-team@company.com"
        - "dev-leads@company.com"
  
  # Exclusions and exceptions
  exclusions:
    files:
      - "*.test.js"
      - "*.spec.js"
      - "*.min.js"
      - "test/**/*"
      - "tests/**/*"
    
    folders:
      - "node_modules"
      - "vendor"
      - "third-party"
    
    vulnerabilities:
      # Approved exceptions (with justification)
      - id: "CWE-79"
        reason: "False positive - output is properly encoded"
        approved_by: "security-team@company.com"
        expires: "2024-12-31"
  
  # Remediation guidelines
  remediation:
    high_severity:
      sla_hours: 24
      escalation: "security-team@company.com"
    medium_severity:
      sla_hours: 168  # 1 week
      escalation: "dev-leads@company.com"
    low_severity:
      sla_hours: 720  # 30 days
      escalation: "dev-team@company.com"
```

---

## 📋 Common Use Cases

### 1. **Secure Code Development**
- Early vulnerability detection in development
- Security-focused code reviews
- Developer security training and awareness
- Secure coding standards enforcement

### 2. **DevSecOps Integration**
- Automated security testing in CI/CD
- Security gate implementation
- Continuous security monitoring
- Shift-left security practices

### 3. **Compliance and Governance**
- Regulatory compliance reporting
- Security audit preparation
- Risk assessment and management
- Security metrics and KPIs

### 4. **Enterprise Security**
- Large-scale application security
- Multi-language codebase scanning
- Custom security rule development
- Integration with security tools ecosystem

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Automated SAST Scanning** - Integrated security code analysis
2. **🔍 Vulnerability Detection** - Comprehensive security issue identification
3. **🚀 CI/CD Integration** - Seamless pipeline security integration
4. **📊 Security Reporting** - Detailed vulnerability reports and metrics
5. **🛡️ Security Gates** - Automated security quality gates
6. **📈 Compliance Monitoring** - Regulatory and standards compliance
7. **🔄 Continuous Security** - Ongoing security monitoring and improvement
8. **👥 Team Collaboration** - Security-aware development workflows

✅ **Checkmarx SAST is now configured for your automated security code analysis workflows!**
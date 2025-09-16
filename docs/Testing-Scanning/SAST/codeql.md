---
sidebar_position: 4
title: CodeQL
description: CodeQL is GitHub's semantic code analysis engine for finding security vulnerabilities. Learn how to use CodeQL for automated security scanning and custom query development.
slug: /TestingScanning/CodeQL
keywords:
  - CodeQL
  - GitHub security
  - semantic code analysis
  - SAST
  - security vulnerabilities
  - code scanning
  - GitHub Advanced Security
  - custom queries
  - security research
  - vulnerability detection
---

# 🚀 Semantic Security Analysis with GitHub CodeQL

**CodeQL** is GitHub's **semantic code analysis engine** that treats code as data to find **security vulnerabilities** and **coding errors**. Perfect for **advanced security research**, **custom vulnerability detection**, and **automated security scanning** with powerful **query language** capabilities.

---

## 🧰 Prerequisites

Make sure you have the following:
- **GitHub repository** with CodeQL enabled
- **CodeQL CLI** installed (for local analysis)
- **Visual Studio Code** with CodeQL extension (optional)
- **Basic understanding** of programming languages
- **Git** for version control

---

## 🔧 Step 1: Setup CodeQL CLI

### Install CodeQL CLI

```bash
# Download CodeQL CLI bundle
# Linux/macOS
wget https://github.com/github/codeql-cli-binaries/releases/latest/download/codeql-linux64.zip
unzip codeql-linux64.zip

# macOS (using Homebrew)
brew install codeql

# Windows
# Download from: https://github.com/github/codeql-cli-binaries/releases/latest

# Add to PATH
export PATH="$PATH:/path/to/codeql"

# Verify installation
codeql version
```

### Setup CodeQL Database

```bash
# Clone CodeQL standard library
git clone https://github.com/github/codeql.git codeql-repo

# Create CodeQL database for your project
codeql database create my-app-db \
  --language=javascript \
  --source-root=./src \
  --command="npm run build"

# For multiple languages
codeql database create my-app-db \
  --language=javascript,python,java \
  --source-root=. \
  --command="npm install && npm run build"

# List available languages
codeql resolve languages
```

---

## 🏗️ Step 2: Basic CodeQL Analysis

### Run Standard Security Queries

```bash
# Run all security queries for JavaScript
codeql database analyze my-app-db \
  codeql-repo/javascript/ql/src/Security \
  --format=sarif-latest \
  --output=results.sarif

# Run specific query suites
codeql database analyze my-app-db \
  codeql-repo/javascript/ql/src/codeql-suites/javascript-security-and-quality.qls \
  --format=sarif-latest \
  --output=security-results.sarif

# Run queries for multiple languages
codeql database analyze my-app-db \
  codeql-repo/javascript/ql/src/codeql-suites/javascript-security-extended.qls \
  codeql-repo/python/ql/src/codeql-suites/python-security-and-quality.qls \
  --format=sarif-latest \
  --output=multi-lang-results.sarif

# Generate CSV output
codeql database analyze my-app-db \
  codeql-repo/javascript/ql/src/Security \
  --format=csv \
  --output=results.csv
```

### PowerShell Analysis Script

`Create codeql-analysis.ps1:`
```powershell
#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$true)]
    [string]$Language,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "codeql-db",
    
    [Parameter(Mandatory=$false)]
    [string]$BuildCommand = "",
    
    [Parameter(Mandatory=$false)]
    [string]$QuerySuite = "security-and-quality",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "./codeql-results"
)

# Create output directory
if (-not (Test-Path $OutputPath)) {
    New-Item -Path $OutputPath -ItemType Directory -Force
}

Write-Host "Starting CodeQL analysis..." -ForegroundColor Green
Write-Host "Source: $SourcePath" -ForegroundColor Cyan
Write-Host "Language: $Language" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName" -ForegroundColor Cyan

try {
    # Step 1: Create CodeQL database
    Write-Host "`nStep 1: Creating CodeQL database..." -ForegroundColor Yellow
    
    $CreateArgs = @(
        "database", "create", $DatabaseName,
        "--language=$Language",
        "--source-root=$SourcePath"
    )
    
    if ($BuildCommand) {
        $CreateArgs += "--command=$BuildCommand"
    }
    
    & codeql @CreateArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create CodeQL database"
    }
    
    Write-Host "✅ Database created successfully" -ForegroundColor Green
    
    # Step 2: Run analysis
    Write-Host "`nStep 2: Running CodeQL analysis..." -ForegroundColor Yellow
    
    $QueryPath = switch ($Language) {
        "javascript" { "codeql-repo/javascript/ql/src/codeql-suites/javascript-$QuerySuite.qls" }
        "python" { "codeql-repo/python/ql/src/codeql-suites/python-$QuerySuite.qls" }
        "java" { "codeql-repo/java/ql/src/codeql-suites/java-$QuerySuite.qls" }
        "csharp" { "codeql-repo/csharp/ql/src/codeql-suites/csharp-$QuerySuite.qls" }
        "cpp" { "codeql-repo/cpp/ql/src/codeql-suites/cpp-$QuerySuite.qls" }
        "go" { "codeql-repo/go/ql/src/codeql-suites/go-$QuerySuite.qls" }
        default { throw "Unsupported language: $Language" }
    }
    
    # Run analysis with multiple output formats
    $AnalyzeArgs = @(
        "database", "analyze", $DatabaseName,
        $QueryPath,
        "--format=sarif-latest",
        "--output=$OutputPath/results.sarif"
    )
    
    & codeql @AnalyzeArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to run CodeQL analysis"
    }
    
    # Generate additional formats
    & codeql database analyze $DatabaseName $QueryPath --format=csv --output="$OutputPath/results.csv"
    & codeql database analyze $DatabaseName $QueryPath --format=json --output="$OutputPath/results.json"
    
    Write-Host "✅ Analysis completed successfully" -ForegroundColor Green
    
    # Step 3: Parse and display results
    Write-Host "`nStep 3: Processing results..." -ForegroundColor Yellow
    
    if (Test-Path "$OutputPath/results.sarif") {
        $SarifContent = Get-Content "$OutputPath/results.sarif" | ConvertFrom-Json
        
        $TotalResults = 0
        $ResultsBySeverity = @{
            "error" = 0
            "warning" = 0
            "note" = 0
        }
        
        foreach ($run in $SarifContent.runs) {
            foreach ($result in $run.results) {
                $TotalResults++
                $level = $result.level
                if ($ResultsBySeverity.ContainsKey($level)) {
                    $ResultsBySeverity[$level]++
                }
            }
        }
        
        Write-Host "`nCodeQL Analysis Results:" -ForegroundColor Magenta
        Write-Host "Total Issues: $TotalResults" -ForegroundColor White
        Write-Host "Errors: $($ResultsBySeverity.error)" -ForegroundColor Red
        Write-Host "Warnings: $($ResultsBySeverity.warning)" -ForegroundColor Yellow
        Write-Host "Notes: $($ResultsBySeverity.note)" -ForegroundColor Cyan
        
        # Display top issues
        Write-Host "`nTop Issues Found:" -ForegroundColor Yellow
        $IssueCount = 0
        foreach ($run in $SarifContent.runs) {
            foreach ($result in $run.results) {
                if ($IssueCount -ge 5) { break }
                
                $ruleId = $result.ruleId
                $message = $result.message.text
                $level = $result.level
                $location = $result.locations[0].physicalLocation.artifactLocation.uri
                $line = $result.locations[0].physicalLocation.region.startLine
                
                Write-Host "  [$level] $ruleId" -ForegroundColor $(if ($level -eq "error") { "Red" } elseif ($level -eq "warning") { "Yellow" } else { "Cyan" })
                Write-Host "    $message" -ForegroundColor Gray
                Write-Host "    Location: $location:$line" -ForegroundColor Gray
                Write-Host ""
                
                $IssueCount++
            }
            if ($IssueCount -ge 5) { break }
        }
        
        # Check for critical issues
        if ($ResultsBySeverity.error -gt 0) {
            Write-Warning "Found $($ResultsBySeverity.error) critical security issues!"
            exit 1
        }
    }
    
    Write-Host "✅ CodeQL analysis completed successfully!" -ForegroundColor Green
    Write-Host "Results saved to: $OutputPath" -ForegroundColor Cyan
    
} catch {
    Write-Error "CodeQL analysis failed: $($_.Exception.Message)"
    exit 1
} finally {
    # Cleanup database if needed
    if (Test-Path $DatabaseName) {
        Write-Host "Cleaning up database..." -ForegroundColor Gray
        Remove-Item -Path $DatabaseName -Recurse -Force
    }
}
```

---

## ▶️ Step 3: GitHub Actions Integration

### CodeQL Workflow

`Create .github/workflows/codeql-analysis.yml:`
```yaml
name: "CodeQL Security Analysis"

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript', 'python' ]
        # Supported languages: 'cpp', 'csharp', 'go', 'java', 'javascript', 'python'

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: ${{ matrix.language }}
        # Override default queries with custom query suite
        queries: +security-and-quality,security-extended
        # Custom configuration file
        config-file: ./.github/codeql/codeql-config.yml

    - name: Setup Node.js (for JavaScript)
      if: matrix.language == 'javascript'
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Setup Python (for Python)
      if: matrix.language == 'python'
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        cache: 'pip'

    - name: Install dependencies
      run: |
        if [ "${{ matrix.language }}" == "javascript" ]; then
          npm ci
        elif [ "${{ matrix.language }}" == "python" ]; then
          pip install -r requirements.txt
        fi

    - name: Autobuild
      uses: github/codeql-action/autobuild@v2
      # Alternative: Manual build steps
      # - name: Manual build
      #   run: |
      #     npm run build

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        category: "/language:${{matrix.language}}"
        # Upload results to GitHub Security tab
        upload: true
        # Fail the job if vulnerabilities are found
        # fail-on: error

    - name: Upload SARIF results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: codeql-results-${{ matrix.language }}
        path: /home/runner/work/_temp/codeql_databases/*/results/*.sarif
        retention-days: 30

    - name: Process Results
      if: always()
      run: |
        # Download and process SARIF results
        echo "Processing CodeQL results..."
        
        # Find SARIF files
        SARIF_FILES=$(find /home/runner/work/_temp/codeql_databases/ -name "*.sarif" 2>/dev/null || echo "")
        
        if [ -n "$SARIF_FILES" ]; then
          for sarif_file in $SARIF_FILES; do
            echo "Processing: $sarif_file"
            
            # Extract key metrics using jq
            if command -v jq >/dev/null 2>&1; then
              TOTAL_RESULTS=$(jq '[.runs[].results | length] | add // 0' "$sarif_file")
              ERROR_COUNT=$(jq '[.runs[].results[] | select(.level == "error")] | length' "$sarif_file")
              WARNING_COUNT=$(jq '[.runs[].results[] | select(.level == "warning")] | length' "$sarif_file")
              
              echo "## CodeQL Results for ${{ matrix.language }}" >> $GITHUB_STEP_SUMMARY
              echo "- Total Issues: $TOTAL_RESULTS" >> $GITHUB_STEP_SUMMARY
              echo "- Errors: $ERROR_COUNT" >> $GITHUB_STEP_SUMMARY
              echo "- Warnings: $WARNING_COUNT" >> $GITHUB_STEP_SUMMARY
              echo "" >> $GITHUB_STEP_SUMMARY
              
              # Set outputs for other jobs
              echo "total_results=$TOTAL_RESULTS" >> $GITHUB_OUTPUT
              echo "error_count=$ERROR_COUNT" >> $GITHUB_OUTPUT
              echo "warning_count=$WARNING_COUNT" >> $GITHUB_OUTPUT
            fi
          done
        else
          echo "No SARIF files found"
        fi
```

### CodeQL Configuration

`Create .github/codeql/codeql-config.yml:`
```yaml
name: "CodeQL Configuration"

# Disable default queries and specify custom ones
disable-default-queries: false

# Additional query packs to run
packs:
  - codeql/javascript-queries:AlertSuppression.ql
  - codeql/javascript-queries:Security
  - codeql/python-queries:Security

# Custom queries
queries:
  - name: Custom security queries
    uses: ./.github/codeql/custom-queries/

# Path filters
paths-ignore:
  - "node_modules/**"
  - "vendor/**"
  - "dist/**"
  - "build/**"
  - "**/*.min.js"
  - "**/*.bundle.js"
  - "test/**"
  - "tests/**"
  - "**/*.test.js"
  - "**/*.spec.js"

paths:
  - "src/**"
  - "lib/**"
  - "app/**"

# Language-specific configuration
javascript:
  # Include TypeScript files
  extensions:
    - .js
    - .jsx
    - .ts
    - .tsx
    - .vue
  
  # Exclude test files
  exclude:
    - "**/*.test.*"
    - "**/*.spec.*"
    - "**/test/**"
    - "**/tests/**"

python:
  # Python-specific settings
  extensions:
    - .py
  
  # Setup commands for Python dependencies
  setup-python-dependencies: true
```

---

## 📊 Step 4: Custom CodeQL Queries

### Custom Security Query

`Create .github/codeql/custom-queries/hardcoded-secrets.ql:`
```ql
/**
 * @name Hardcoded secrets in source code
 * @description Finds potential hardcoded secrets like API keys, passwords, and tokens
 * @kind problem
 * @problem.severity error
 * @security-severity 8.5
 * @precision high
 * @id custom/hardcoded-secrets
 * @tags security
 *       external/cwe/cwe-798
 */

import javascript

/**
 * A string literal that might contain a hardcoded secret
 */
class PotentialSecret extends StringLiteral {
  PotentialSecret() {
    // Look for common secret patterns
    this.getValue().regexpMatch("(?i).*(api[_-]?key|password|secret|token|auth|credential).*") and
    // Must be at least 8 characters long
    this.getValue().length() > 8 and
    // Exclude obvious test/example values
    not this.getValue().regexpMatch("(?i).*(test|example|demo|placeholder|your[_-]?key).*") and
    // Must contain some complexity (letters and numbers/symbols)
    this.getValue().regexpMatch(".*[a-zA-Z].*[0-9].*") or
    this.getValue().regexpMatch(".*[a-zA-Z].*[^a-zA-Z0-9].*")
  }
}

/**
 * An assignment where a potential secret is assigned to a variable
 */
class SecretAssignment extends AssignmentExpr {
  SecretAssignment() {
    this.getRhs() instanceof PotentialSecret
  }
  
  string getVariableName() {
    result = this.getLhs().(VarAccess).getName()
  }
}

/**
 * A property assignment where a potential secret is assigned
 */
class SecretPropertyAssignment extends Property {
  SecretPropertyAssignment() {
    this.getInit() instanceof PotentialSecret
  }
  
  string getPropertyName() {
    result = this.getName()
  }
}

from ASTNode secretLocation, string secretType, string message
where
  (
    secretLocation instanceof SecretAssignment and
    secretType = "Variable Assignment" and
    message = "Potential hardcoded secret in variable: " + secretLocation.(SecretAssignment).getVariableName()
  ) or
  (
    secretLocation instanceof SecretPropertyAssignment and
    secretType = "Property Assignment" and
    message = "Potential hardcoded secret in property: " + secretLocation.(SecretPropertyAssignment).getPropertyName()
  ) or
  (
    secretLocation instanceof PotentialSecret and
    not exists(SecretAssignment sa | sa.getRhs() = secretLocation) and
    not exists(SecretPropertyAssignment spa | spa.getInit() = secretLocation) and
    secretType = "String Literal" and
    message = "Potential hardcoded secret in string literal"
  )
select secretLocation, message
```

### SQL Injection Detection Query

`Create .github/codeql/custom-queries/sql-injection.ql:`
```ql
/**
 * @name SQL injection vulnerability
 * @description Finds potential SQL injection vulnerabilities in database queries
 * @kind path-problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id custom/sql-injection
 * @tags security
 *       external/cwe/cwe-89
 */

import javascript
import semmle.javascript.security.dataflow.SqlInjectionQuery
import DataFlow::PathGraph

/**
 * A taint-tracking configuration for SQL injection vulnerabilities
 */
class SqlInjectionConfig extends TaintTracking::Configuration {
  SqlInjectionConfig() { this = "SqlInjectionConfig" }

  override predicate isSource(DataFlow::Node source) {
    // User input sources
    source instanceof RemoteFlowSource or
    source instanceof ClientSideRemoteFlowSource or
    // HTTP request parameters
    exists(HTTP::RequestInputAccess req | source = req) or
    // URL parameters
    exists(UrlSearchParams usp | source = usp.getAMethodCall("get"))
  }

  override predicate isSink(DataFlow::Node sink) {
    // Database query sinks
    sink instanceof SqlInjection::Sink or
    // String concatenation that builds SQL queries
    exists(AddExpr add |
      add.getAnOperand().getStringValue().regexpMatch("(?i).*(select|insert|update|delete|drop|create|alter).*") and
      sink.asExpr() = add.getAnOperand()
    ) or
    // Template literals used in SQL contexts
    exists(TemplateLiteral tl |
      tl.getStringValue().regexpMatch("(?i).*(select|insert|update|delete|drop|create|alter).*") and
      sink.asExpr() = tl.getAnElement()
    )
  }

  override predicate isSanitizer(DataFlow::Node node) {
    // Parameterized queries are safe
    exists(MethodCallExpr call |
      call.getMethodName() = "query" and
      call.getNumArgument() >= 2 and
      node.asExpr() = call.getArgument(1)
    ) or
    // Escaped values
    exists(MethodCallExpr call |
      call.getMethodName().regexpMatch("escape|sanitize|clean") and
      node.asExpr() = call
    )
  }
}

from SqlInjectionConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink,
  "This SQL query depends on a $@, which could allow SQL injection.",
  source.getNode(), "user-provided value"
```

### Cross-Site Scripting (XSS) Query

`Create .github/codeql/custom-queries/xss-vulnerability.ql:`
```ql
/**
 * @name Cross-site scripting vulnerability
 * @description Finds potential XSS vulnerabilities in web applications
 * @kind path-problem
 * @problem.severity error
 * @security-severity 7.5
 * @precision high
 * @id custom/xss-vulnerability
 * @tags security
 *       external/cwe/cwe-79
 */

import javascript
import semmle.javascript.security.dataflow.DomBasedXssQuery
import DataFlow::PathGraph

/**
 * A taint-tracking configuration for XSS vulnerabilities
 */
class XssConfig extends TaintTracking::Configuration {
  XssConfig() { this = "XssConfig" }

  override predicate isSource(DataFlow::Node source) {
    // User input from various sources
    source instanceof RemoteFlowSource or
    // URL parameters
    exists(UrlSearchParams usp | source = usp.getAMethodCall("get")) or
    // Local storage
    exists(WebStorageWrite write | source = write.getValue()) or
    // Document location
    source.asExpr().(PropAccess).accesses(any(GlobalVarAccess gva | gva.getName() = "location"), _)
  }

  override predicate isSink(DataFlow::Node sink) {
    // DOM manipulation sinks
    sink instanceof DomBasedXss::Sink or
    // innerHTML assignments
    exists(AssignmentExpr assign |
      assign.getLhs().(PropAccess).getPropertyName() = "innerHTML" and
      sink.asExpr() = assign.getRhs()
    ) or
    // document.write calls
    exists(MethodCallExpr call |
      call.getReceiver().(GlobalVarAccess).getName() = "document" and
      call.getMethodName() = "write" and
      sink.asExpr() = call.getAnArgument()
    ) or
    // jQuery html() method
    exists(MethodCallExpr call |
      call.getMethodName() = "html" and
      call.getNumArgument() > 0 and
      sink.asExpr() = call.getArgument(0)
    )
  }

  override predicate isSanitizer(DataFlow::Node node) {
    // HTML encoding/escaping functions
    exists(MethodCallExpr call |
      call.getMethodName().regexpMatch("(?i).*escape.*|.*encode.*|.*sanitize.*") and
      node.asExpr() = call
    ) or
    // Text content assignments (safe)
    exists(AssignmentExpr assign |
      assign.getLhs().(PropAccess).getPropertyName() = "textContent" and
      node.asExpr() = assign.getRhs()
    )
  }
}

from XssConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink,
  "This DOM update depends on a $@, which could allow XSS attacks.",
  source.getNode(), "user-provided value"
```

---

## 🔍 Step 5: Advanced CodeQL Analysis

### Batch Analysis Script

`Create batch-analysis.py:`
```python
#!/usr/bin/env python3

import os
import subprocess
import json
import argparse
from pathlib import Path
import concurrent.futures
from datetime import datetime

class CodeQLBatchAnalyzer:
    def __init__(self, codeql_path="codeql", queries_path="codeql-repo"):
        self.codeql_path = codeql_path
        self.queries_path = queries_path
        self.results = []
        
    def create_database(self, source_path, language, database_name, build_command=None):
        """Create CodeQL database for a project"""
        print(f"Creating database for {source_path} ({language})")
        
        cmd = [
            self.codeql_path, "database", "create", database_name,
            f"--language={language}",
            f"--source-root={source_path}"
        ]
        
        if build_command:
            cmd.extend(["--command", build_command])
            
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"✅ Database created: {database_name}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create database: {e.stderr}")
            return False
    
    def run_analysis(self, database_name, language, query_suite="security-and-quality"):
        """Run CodeQL analysis on a database"""
        print(f"Running analysis on {database_name}")
        
        # Determine query path based on language
        query_paths = {
            "javascript": f"{self.queries_path}/javascript/ql/src/codeql-suites/javascript-{query_suite}.qls",
            "python": f"{self.queries_path}/python/ql/src/codeql-suites/python-{query_suite}.qls",
            "java": f"{self.queries_path}/java/ql/src/codeql-suites/java-{query_suite}.qls",
            "csharp": f"{self.queries_path}/csharp/ql/src/codeql-suites/csharp-{query_suite}.qls",
            "cpp": f"{self.queries_path}/cpp/ql/src/codeql-suites/cpp-{query_suite}.qls",
            "go": f"{self.queries_path}/go/ql/src/codeql-suites/go-{query_suite}.qls"
        }
        
        if language not in query_paths:
            print(f"❌ Unsupported language: {language}")
            return None
            
        query_path = query_paths[language]
        output_file = f"{database_name}-results.sarif"
        
        cmd = [
            self.codeql_path, "database", "analyze", database_name,
            query_path,
            "--format=sarif-latest",
            f"--output={output_file}"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"✅ Analysis completed: {output_file}")
            return output_file
        except subprocess.CalledProcessError as e:
            print(f"❌ Analysis failed: {e.stderr}")
            return None
    
    def parse_sarif_results(self, sarif_file):
        """Parse SARIF results and extract key information"""
        try:
            with open(sarif_file, 'r') as f:
                sarif_data = json.load(f)
            
            results_summary = {
                "file": sarif_file,
                "total_results": 0,
                "by_severity": {"error": 0, "warning": 0, "note": 0},
                "by_rule": {},
                "issues": []
            }
            
            for run in sarif_data.get("runs", []):
                for result in run.get("results", []):
                    results_summary["total_results"] += 1
                    
                    # Count by severity
                    level = result.get("level", "note")
                    if level in results_summary["by_severity"]:
                        results_summary["by_severity"][level] += 1
                    
                    # Count by rule
                    rule_id = result.get("ruleId", "unknown")
                    if rule_id not in results_summary["by_rule"]:
                        results_summary["by_rule"][rule_id] = 0
                    results_summary["by_rule"][rule_id] += 1
                    
                    # Extract issue details
                    issue = {
                        "rule_id": rule_id,
                        "level": level,
                        "message": result.get("message", {}).get("text", ""),
                        "locations": []
                    }
                    
                    for location in result.get("locations", []):
                        physical_location = location.get("physicalLocation", {})
                        artifact_location = physical_location.get("artifactLocation", {})
                        region = physical_location.get("region", {})
                        
                        issue["locations"].append({
                            "file": artifact_location.get("uri", ""),
                            "line": region.get("startLine", 0),
                            "column": region.get("startColumn", 0)
                        })
                    
                    results_summary["issues"].append(issue)
            
            return results_summary
            
        except Exception as e:
            print(f"❌ Failed to parse SARIF file {sarif_file}: {e}")
            return None
    
    def analyze_project(self, project_config):
        """Analyze a single project"""
        source_path = project_config["source_path"]
        language = project_config["language"]
        build_command = project_config.get("build_command")
        project_name = project_config.get("name", Path(source_path).name)
        
        database_name = f"{project_name}-{language}-db"
        
        print(f"\n🔍 Analyzing project: {project_name}")
        print(f"   Source: {source_path}")
        print(f"   Language: {language}")
        
        # Create database
        if not self.create_database(source_path, language, database_name, build_command):
            return None
        
        # Run analysis
        sarif_file = self.run_analysis(database_name, language)
        if not sarif_file:
            return None
        
        # Parse results
        results = self.parse_sarif_results(sarif_file)
        if results:
            results["project_name"] = project_name
            results["language"] = language
            results["source_path"] = source_path
        
        # Cleanup database
        try:
            subprocess.run(["rm", "-rf", database_name], check=True)
        except:
            pass
        
        return results
    
    def analyze_multiple_projects(self, projects_config, max_workers=4):
        """Analyze multiple projects in parallel"""
        print(f"🚀 Starting batch analysis of {len(projects_config)} projects")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_project = {
                executor.submit(self.analyze_project, project): project 
                for project in projects_config
            }
            
            for future in concurrent.futures.as_completed(future_to_project):
                project = future_to_project[future]
                try:
                    result = future.result()
                    if result:
                        self.results.append(result)
                        print(f"✅ Completed: {project.get('name', 'Unknown')}")
                    else:
                        print(f"❌ Failed: {project.get('name', 'Unknown')}")
                except Exception as e:
                    print(f"❌ Exception for {project.get('name', 'Unknown')}: {e}")
    
    def generate_report(self, output_file="codeql-batch-report.json"):
        """Generate comprehensive report"""
        report = {
            "generated_at": datetime.now().isoformat(),
            "total_projects": len(self.results),
            "summary": {
                "total_issues": sum(r["total_results"] for r in self.results),
                "by_severity": {"error": 0, "warning": 0, "note": 0},
                "by_language": {},
                "top_rules": {}
            },
            "projects": self.results
        }
        
        # Calculate summary statistics
        for result in self.results:
            # By severity
            for severity, count in result["by_severity"].items():
                report["summary"]["by_severity"][severity] += count
            
            # By language
            language = result["language"]
            if language not in report["summary"]["by_language"]:
                report["summary"]["by_language"][language] = 0
            report["summary"]["by_language"][language] += result["total_results"]
            
            # Top rules
            for rule, count in result["by_rule"].items():
                if rule not in report["summary"]["top_rules"]:
                    report["summary"]["top_rules"][rule] = 0
                report["summary"]["top_rules"][rule] += count
        
        # Sort top rules
        report["summary"]["top_rules"] = dict(
            sorted(report["summary"]["top_rules"].items(), 
                   key=lambda x: x[1], reverse=True)[:10]
        )
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Report generated: {output_file}")
        
        # Print summary
        print("\n" + "="*50)
        print("CODEQL BATCH ANALYSIS SUMMARY")
        print("="*50)
        print(f"Projects analyzed: {report['total_projects']}")
        print(f"Total issues found: {report['summary']['total_issues']}")
        print(f"Errors: {report['summary']['by_severity']['error']}")
        print(f"Warnings: {report['summary']['by_severity']['warning']}")
        print(f"Notes: {report['summary']['by_severity']['note']}")
        
        print("\nTop vulnerability types:")
        for rule, count in list(report['summary']['top_rules'].items())[:5]:
            print(f"  {rule}: {count}")
        
        print("="*50)

def main():
    parser = argparse.ArgumentParser(description='CodeQL Batch Analyzer')
    parser.add_argument('config', help='JSON configuration file with projects to analyze')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers')
    parser.add_argument('--output', default='codeql-batch-report.json', help='Output report file')
    
    args = parser.parse_args()
    
    # Load configuration
    try:
        with open(args.config, 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        return 1
    
    # Initialize analyzer
    analyzer = CodeQLBatchAnalyzer()
    
    # Run analysis
    analyzer.analyze_multiple_projects(config.get("projects", []), args.workers)
    
    # Generate report
    analyzer.generate_report(args.output)
    
    return 0

if __name__ == "__main__":
    exit(main())
```

### Batch Configuration Example

`Create batch-config.json:`
```json
{
  "projects": [
    {
      "name": "web-frontend",
      "source_path": "./frontend",
      "language": "javascript",
      "build_command": "npm install && npm run build"
    },
    {
      "name": "api-backend",
      "source_path": "./backend",
      "language": "python",
      "build_command": "pip install -r requirements.txt"
    },
    {
      "name": "mobile-app",
      "source_path": "./mobile",
      "language": "java",
      "build_command": "gradle build"
    },
    {
      "name": "microservice-auth",
      "source_path": "./services/auth",
      "language": "go",
      "build_command": "go mod download && go build"
    }
  ],
  "settings": {
    "query_suite": "security-extended",
    "max_workers": 4,
    "cleanup_databases": true
  }
}
```

---

## 📋 Common Use Cases

### 1. **Security Research**
- Custom vulnerability pattern detection
- Zero-day vulnerability discovery
- Security rule development and testing
- Advanced threat modeling

### 2. **Enterprise Security**
- Large-scale codebase analysis
- Compliance and audit preparation
- Security gate implementation
- Developer security training

### 3. **DevSecOps Integration**
- Automated security scanning in CI/CD
- Pull request security checks
- Continuous security monitoring
- Security metrics and reporting

### 4. **Code Quality Assurance**
- Bug pattern detection
- Code smell identification
- Maintainability analysis
- Technical debt assessment

---

## ✅ What You'll Achieve

After following this guide, you'll have:

1. **🏗️ Advanced Security Analysis** - Semantic code analysis with CodeQL
2. **🔍 Custom Vulnerability Detection** - Custom queries for specific security patterns
3. **🚀 CI/CD Integration** - Automated security scanning in GitHub Actions
4. **📊 Comprehensive Reporting** - Detailed security analysis reports
5. **🛡️ Security Research Capabilities** - Advanced query development and testing
6. **📈 Batch Analysis** - Large-scale multi-project security analysis
7. **🔄 Continuous Security** - Ongoing security monitoring and improvement
8. **👥 Developer Education** - Security-aware development practices

✅ **CodeQL is now configured for your advanced semantic security analysis workflows!**
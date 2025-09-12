# 🔒 Bandit - Python Security Linter

Bandit is a tool designed to find common security issues in Python code. It processes each file, builds an AST from it, and runs appropriate plugins against the AST nodes. Once Bandit has finished scanning all the files, it generates a report.

## 📋 Prerequisites

- Python 3.6+
- pip package manager
- Basic understanding of Python security concepts
- Git (for repository scanning)

## 🛠️ Installation

### Basic Installation
```bash
# Install via pip
pip install bandit

# Install with YAML support
pip install bandit[toml]

# Install development version
pip install git+https://github.com/PyCQA/bandit.git

# Verify installation
bandit --version
```

### Virtual Environment Setup
```bash
# Create virtual environment
python -m venv bandit-env
source bandit-env/bin/activate  # Linux/Mac
# bandit-env\Scripts\activate  # Windows

# Install bandit
pip install bandit

# Create requirements file
echo "bandit>=1.7.5" > requirements-security.txt
pip install -r requirements-security.txt
```

## 🚀 Quick Start

### Basic Usage
```bash
# Scan a single file
bandit example.py

# Scan a directory
bandit -r /path/to/your/code

# Scan current directory
bandit -r .

# Scan with specific format
bandit -r . -f json -o bandit-report.json
```

### Example Vulnerable Code
```python
# vulnerable_example.py
import os
import subprocess
import pickle
import yaml

# B102: Test for use of exec
def dangerous_exec():
    user_input = input("Enter code: ")
    exec(user_input)  # Dangerous!

# B601: Test for shell injection
def shell_injection():
    filename = input("Enter filename: ")
    os.system(f"cat {filename}")  # Dangerous!

# B301: Test for pickle usage
def unsafe_pickle():
    data = input("Enter pickled data: ")
    pickle.loads(data)  # Dangerous!

# B506: Test for yaml.load usage
def unsafe_yaml():
    with open('config.yaml') as f:
        config = yaml.load(f)  # Should use safe_load

# B108: Test for hardcoded tmp directory
def hardcoded_tmp():
    temp_file = "/tmp/myfile.txt"  # Potentially dangerous
    with open(temp_file, 'w') as f:
        f.write("data")

# B105: Test for hardcoded password
def hardcoded_password():
    password = "admin123"  # Dangerous!
    return password

# B324: Test for insecure hash function
import hashlib
def weak_hash():
    data = "sensitive data"
    return hashlib.md5(data.encode()).hexdigest()  # Weak hash

# B113: Test for request without timeout
import requests
def no_timeout():
    response = requests.get("http://example.com")  # Missing timeout
    return response.text
```

### Run Bandit on Example
```bash
# Scan the vulnerable example
bandit vulnerable_example.py

# Output will show various security issues found
```

## 🔧 Configuration

### Configuration File (.bandit)
```yaml
# .bandit
tests: ['B201', 'B301']
skips: ['B101', 'B601']

exclude_dirs: ['*/tests/*', '*/venv/*']

# Specify which files to scan
include: ['*.py']
exclude: ['*/migrations/*']

# Confidence levels: LOW, MEDIUM, HIGH
confidence: MEDIUM

# Severity levels: LOW, MEDIUM, HIGH  
severity: MEDIUM
```

### TOML Configuration (pyproject.toml)
```toml
# pyproject.toml
[tool.bandit]
exclude_dirs = ["tests", "venv", ".venv", "build", "dist"]
tests = ["B201", "B301"]
skips = ["B101", "B601"]

[tool.bandit.assert_used]
skips = ['*_test.py', '*/test_*.py']
```

### YAML Configuration (bandit.yaml)
```yaml
# bandit.yaml
tests:
  - B101  # assert_used
  - B102  # exec_used
  - B103  # set_bad_file_permissions
  - B104  # hardcoded_bind_all_interfaces
  - B105  # hardcoded_password_string
  - B106  # hardcoded_password_funcarg
  - B107  # hardcoded_password_default
  - B108  # hardcoded_tmp_directory
  - B110  # try_except_pass
  - B112  # try_except_continue
  - B201  # flask_debug_true
  - B301  # pickle
  - B302  # marshal
  - B303  # md5
  - B304  # des
  - B305  # cipher
  - B306  # mktemp_q
  - B307  # eval
  - B308  # mark_safe
  - B309  # httpsconnection
  - B310  # urllib_urlopen
  - B311  # random
  - B312  # telnetlib
  - B313  # xml_bad_cElementTree
  - B314  # xml_bad_ElementTree
  - B315  # xml_bad_expatreader
  - B316  # xml_bad_expatbuilder
  - B317  # xml_bad_sax
  - B318  # xml_bad_minidom
  - B319  # xml_bad_pulldom
  - B320  # xml_bad_etree
  - B321  # ftplib
  - B322  # input
  - B323  # unverified_context
  - B324  # hashlib_new_insecure_functions
  - B325  # tempnam
  - B401  # import_telnetlib
  - B402  # import_ftplib
  - B403  # import_pickle
  - B404  # import_subprocess
  - B405  # import_xml_etree
  - B406  # import_xml_sax
  - B407  # import_xml_expat
  - B408  # import_xml_minidom
  - B409  # import_xml_pulldom
  - B410  # import_lxml
  - B411  # import_xmlrpclib
  - B412  # import_httpoxy
  - B413  # import_pycrypto
  - B501  # request_with_no_cert_validation
  - B502  # ssl_with_bad_version
  - B503  # ssl_with_bad_defaults
  - B504  # ssl_with_no_version
  - B505  # weak_cryptographic_key
  - B506  # yaml_load
  - B507  # ssh_no_host_key_verification
  - B601  # paramiko_calls
  - B602  # subprocess_popen_with_shell_equals_true
  - B603  # subprocess_without_shell_equals_true
  - B604  # any_other_function_with_shell_equals_true
  - B605  # start_process_with_a_shell
  - B606  # start_process_with_no_shell
  - B607  # start_process_with_partial_path
  - B608  # hardcoded_sql_expressions
  - B609  # linux_commands_wildcard_injection
  - B610  # django_extra_used
  - B611  # django_rawsql_used
  - B701  # jinja2_autoescape_false
  - B702  # use_of_mako_templates
  - B703  # django_mark_safe

skips: []

exclude_dirs:
  - '/tests/'
  - '/test_'
  - '/venv/'
  - '/.venv/'
  - '/build/'
  - '/dist/'
```

## 🎯 Advanced Usage

### Command Line Options
```bash
# Specify confidence level
bandit -r . -i  # Show only high confidence issues
bandit -r . -ii # Show medium and high confidence issues
bandit -r . -iii # Show all confidence levels

# Specify severity level
bandit -r . -l  # Show only high severity issues
bandit -r . -ll # Show medium and high severity issues
bandit -r . -lll # Show all severity levels

# Skip specific tests
bandit -r . -s B101,B601

# Run only specific tests
bandit -r . -t B201,B301

# Exclude directories
bandit -r . -x tests/,venv/

# Generate different output formats
bandit -r . -f csv -o report.csv
bandit -r . -f html -o report.html
bandit -r . -f xml -o report.xml
bandit -r . -f txt -o report.txt

# Verbose output
bandit -r . -v

# Quiet mode (only show issues)
bandit -r . -q
```

### Custom Test Development
```python
# custom_bandit_test.py
import ast
import bandit
from bandit.core import test_properties

@test_properties.test_id('B999')
@test_properties.checks('Call')
def check_custom_function(context):
    """Check for usage of custom dangerous function"""
    if context.call_function_name_qual == 'dangerous_function':
        return bandit.Issue(
            severity=bandit.HIGH,
            confidence=bandit.HIGH,
            text="Use of dangerous_function detected",
            lineno=context.node.lineno,
        )
```

### Integration with Pre-commit
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/PyCQA/bandit
    rev: '1.7.5'
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ["bandit[toml]"]
```

## 🐳 Docker Integration

### Dockerfile for Bandit
```dockerfile
# Dockerfile.bandit
FROM python:3.11-slim

WORKDIR /app

# Install bandit
RUN pip install bandit[toml]

# Copy source code
COPY . .

# Run bandit scan
CMD ["bandit", "-r", ".", "-f", "json", "-o", "/app/bandit-report.json"]
```

### Docker Compose for CI/CD
```yaml
# docker-compose.security.yml
version: '3.8'

services:
  bandit-scan:
    build:
      context: .
      dockerfile: Dockerfile.bandit
    volumes:
      - .:/app
      - ./reports:/app/reports
    command: >
      bandit -r /app 
      -f json 
      -o /app/reports/bandit-report.json
      --exit-zero-on-skipped
    environment:
      - PYTHONPATH=/app

  security-report:
    image: python:3.11-slim
    depends_on:
      - bandit-scan
    volumes:
      - ./reports:/reports
    command: >
      python -c "
      import json
      with open('/reports/bandit-report.json') as f:
          data = json.load(f)
          print(f'Security Issues Found: {len(data.get(\"results\", []))}')
          for issue in data.get('results', []):
              print(f'- {issue[\"test_name\"]}: {issue[\"issue_text\"]}')
      "
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  bandit-security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install bandit[toml]
    
    - name: Run Bandit security scan
      run: |
        bandit -r . -f json -o bandit-report.json || true
    
    - name: Upload Bandit report
      uses: actions/upload-artifact@v3
      with:
        name: bandit-report
        path: bandit-report.json
    
    - name: Evaluate security issues
      run: |
        python -c "
        import json
        import sys
        
        with open('bandit-report.json') as f:
            data = json.load(f)
        
        high_issues = [r for r in data.get('results', []) if r['issue_severity'] == 'HIGH']
        medium_issues = [r for r in data.get('results', []) if r['issue_severity'] == 'MEDIUM']
        
        print(f'High severity issues: {len(high_issues)}')
        print(f'Medium severity issues: {len(medium_issues)}')
        
        if high_issues:
            print('❌ High severity security issues found!')
            for issue in high_issues:
                print(f'  - {issue[\"filename\"]}:{issue[\"line_number\"]} - {issue[\"issue_text\"]}')
            sys.exit(1)
        
        if len(medium_issues) > 5:
            print('⚠️ Too many medium severity issues found!')
            sys.exit(1)
        
        print('✅ Security scan passed!')
        "
    
    - name: Comment PR with security results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = JSON.parse(fs.readFileSync('bandit-report.json', 'utf8'));
          
          const highIssues = report.results.filter(r => r.issue_severity === 'HIGH');
          const mediumIssues = report.results.filter(r => r.issue_severity === 'MEDIUM');
          
          let comment = '## 🔒 Bandit Security Scan Results\n\n';
          comment += `- **High Severity**: ${highIssues.length}\n`;
          comment += `- **Medium Severity**: ${mediumIssues.length}\n`;
          comment += `- **Total Issues**: ${report.results.length}\n\n`;
          
          if (highIssues.length > 0) {
            comment += '### ❌ High Severity Issues\n';
            highIssues.forEach(issue => {
              comment += `- \`${issue.filename}:${issue.line_number}\` - ${issue.issue_text}\n`;
            });
          }
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        PYTHONPATH = "${WORKSPACE}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Python') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install bandit[toml]
                '''
            }
        }
        
        stage('Bandit Security Scan') {
            steps {
                sh '''
                    . venv/bin/activate
                    bandit -r . -f json -o bandit-report.json --exit-zero-on-skipped
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'bandit-report.json', fingerprint: true
                }
            }
        }
        
        stage('Evaluate Results') {
            steps {
                script {
                    def report = readJSON file: 'bandit-report.json'
                    def highIssues = report.results.findAll { it.issue_severity == 'HIGH' }
                    def mediumIssues = report.results.findAll { it.issue_severity == 'MEDIUM' }
                    
                    echo "High severity issues: ${highIssues.size()}"
                    echo "Medium severity issues: ${mediumIssues.size()}"
                    
                    if (highIssues.size() > 0) {
                        currentBuild.result = 'FAILURE'
                        error("High severity security issues found!")
                    }
                    
                    if (mediumIssues.size() > 10) {
                        currentBuild.result = 'UNSTABLE'
                        echo "Warning: Many medium severity issues found"
                    }
                }
            }
        }
        
        stage('Generate HTML Report') {
            steps {
                sh '''
                    . venv/bin/activate
                    bandit -r . -f html -o bandit-report.html
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'bandit-report.html',
                        reportName: 'Bandit Security Report'
                    ])
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        
        failure {
            emailext(
                subject: "Security Scan Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Security scan failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}. Check the Bandit report for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - security

bandit-sast:
  stage: security
  image: python:3.11-slim
  before_script:
    - pip install bandit[toml]
  script:
    - bandit -r . -f json -o bandit-report.json
  artifacts:
    reports:
      sast: bandit-report.json
    paths:
      - bandit-report.json
    expire_in: 1 week
  allow_failure: true

security-gate:
  stage: security
  image: python:3.11-slim
  dependencies:
    - bandit-sast
  script:
    - |
      python3 << EOF
      import json
      import sys
      
      with open('bandit-report.json') as f:
          data = json.load(f)
      
      high_issues = [r for r in data.get('results', []) if r['issue_severity'] == 'HIGH']
      
      if high_issues:
          print(f"❌ {len(high_issues)} high severity security issues found!")
          for issue in high_issues:
              print(f"  - {issue['filename']}:{issue['line_number']} - {issue['issue_text']}")
          sys.exit(1)
      
      print("✅ Security gate passed!")
      EOF
  only:
    - main
    - develop
```

## 📊 Reporting and Analysis

### Custom Report Generator
```python
#!/usr/bin/env python3
import json
import argparse
from collections import defaultdict
import matplotlib.pyplot as plt
import pandas as pd

class BanditReportAnalyzer:
    def __init__(self, report_file):
        with open(report_file, 'r') as f:
            self.report = json.load(f)
    
    def generate_summary(self):
        """Generate summary statistics"""
        results = self.report.get('results', [])
        
        severity_counts = defaultdict(int)
        confidence_counts = defaultdict(int)
        test_counts = defaultdict(int)
        
        for result in results:
            severity_counts[result['issue_severity']] += 1
            confidence_counts[result['issue_confidence']] += 1
            test_counts[result['test_name']] += 1
        
        print("=== Bandit Security Scan Summary ===")
        print(f"Total Issues: {len(results)}")
        print(f"Files Scanned: {len(self.report.get('metrics', {}).get('_totals', {}).get('loc', 0))}")
        print()
        
        print("Severity Breakdown:")
        for severity in ['HIGH', 'MEDIUM', 'LOW']:
            count = severity_counts.get(severity, 0)
            print(f"  {severity}: {count}")
        print()
        
        print("Confidence Breakdown:")
        for confidence in ['HIGH', 'MEDIUM', 'LOW']:
            count = confidence_counts.get(confidence, 0)
            print(f"  {confidence}: {count}")
        print()
        
        print("Top 10 Most Common Issues:")
        sorted_tests = sorted(test_counts.items(), key=lambda x: x[1], reverse=True)
        for test_name, count in sorted_tests[:10]:
            print(f"  {test_name}: {count}")
    
    def generate_detailed_report(self, output_file):
        """Generate detailed CSV report"""
        results = self.report.get('results', [])
        
        data = []
        for result in results:
            data.append({
                'filename': result['filename'],
                'line_number': result['line_number'],
                'test_name': result['test_name'],
                'test_id': result['test_id'],
                'issue_severity': result['issue_severity'],
                'issue_confidence': result['issue_confidence'],
                'issue_text': result['issue_text'],
                'line_range': f"{result['line_range'][0]}-{result['line_range'][1]}",
                'code': result['code'].strip()
            })
        
        df = pd.DataFrame(data)
        df.to_csv(output_file, index=False)
        print(f"Detailed report saved to: {output_file}")
    
    def generate_charts(self, output_dir):
        """Generate visualization charts"""
        results = self.report.get('results', [])
        
        # Severity distribution
        severity_counts = defaultdict(int)
        for result in results:
            severity_counts[result['issue_severity']] += 1
        
        plt.figure(figsize=(10, 6))
        plt.subplot(1, 2, 1)
        plt.pie(severity_counts.values(), labels=severity_counts.keys(), autopct='%1.1f%%')
        plt.title('Issues by Severity')
        
        # Top issues
        test_counts = defaultdict(int)
        for result in results:
            test_counts[result['test_name']] += 1
        
        top_tests = dict(sorted(test_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        
        plt.subplot(1, 2, 2)
        plt.barh(list(top_tests.keys()), list(top_tests.values()))
        plt.title('Top 10 Most Common Issues')
        plt.xlabel('Count')
        
        plt.tight_layout()
        plt.savefig(f'{output_dir}/bandit_analysis.png', dpi=300, bbox_inches='tight')
        print(f"Charts saved to: {output_dir}/bandit_analysis.png")

def main():
    parser = argparse.ArgumentParser(description='Analyze Bandit security scan results')
    parser.add_argument('report_file', help='Path to Bandit JSON report file')
    parser.add_argument('--csv-output', help='Output CSV file for detailed report')
    parser.add_argument('--chart-dir', help='Directory to save charts')
    
    args = parser.parse_args()
    
    analyzer = BanditReportAnalyzer(args.report_file)
    analyzer.generate_summary()
    
    if args.csv_output:
        analyzer.generate_detailed_report(args.csv_output)
    
    if args.chart_dir:
        analyzer.generate_charts(args.chart_dir)

if __name__ == "__main__":
    main()
```

### Usage
```bash
# Generate comprehensive analysis
python bandit_analyzer.py bandit-report.json \
  --csv-output detailed_report.csv \
  --chart-dir ./charts
```

## 🔧 Custom Plugins

### Creating Custom Bandit Plugin
```python
# bandit_custom_plugin.py
import ast
import bandit
from bandit.core import test_properties

@test_properties.test_id('B999')
@test_properties.checks('Call')
def check_deprecated_crypto(context):
    """Check for usage of deprecated cryptographic functions"""
    deprecated_functions = [
        'Crypto.Cipher.DES.new',
        'Crypto.Cipher.ARC2.new',
        'Crypto.Hash.MD2.new',
        'Crypto.Hash.MD4.new',
    ]
    
    if context.call_function_name_qual in deprecated_functions:
        return bandit.Issue(
            severity=bandit.HIGH,
            confidence=bandit.HIGH,
            text=f"Use of deprecated cryptographic function: {context.call_function_name_qual}",
            lineno=context.node.lineno,
        )

@test_properties.test_id('B998')
@test_properties.checks('Str')
def check_hardcoded_secrets(context):
    """Check for potential hardcoded secrets in strings"""
    import re
    
    # Patterns for common secret formats
    secret_patterns = [
        r'sk_live_[0-9a-zA-Z]{24}',  # Stripe secret key
        r'sk_test_[0-9a-zA-Z]{24}',  # Stripe test key
        r'AKIA[0-9A-Z]{16}',         # AWS Access Key
        r'ghp_[0-9a-zA-Z]{36}',      # GitHub Personal Access Token
    ]
    
    if isinstance(context.node, ast.Str):
        for pattern in secret_patterns:
            if re.search(pattern, context.node.s):
                return bandit.Issue(
                    severity=bandit.HIGH,
                    confidence=bandit.MEDIUM,
                    text=f"Potential hardcoded secret detected: {pattern}",
                    lineno=context.node.lineno,
                )
```

### Plugin Configuration
```yaml
# bandit_plugins.yaml
plugins:
  - bandit_custom_plugin

tests:
  - B998  # Custom hardcoded secrets check
  - B999  # Custom deprecated crypto check
```

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **False Positives**
```python
# Use # nosec comment to suppress specific issues
password = "default_password"  # nosec B105

# Use # nosec with specific test ID
exec(user_input)  # nosec B102

# Suppress multiple tests
dangerous_function()  # nosec B101,B102
```

2. **Configuration Not Loading**
```bash
# Verify configuration file location
bandit -r . --config-file bandit.yaml -v

# Check configuration syntax
python -c "import yaml; yaml.safe_load(open('bandit.yaml'))"
```

3. **Performance Issues**
```bash
# Exclude large directories
bandit -r . -x venv/,node_modules/,.git/

# Use specific file patterns
bandit -r . --include "*.py"

# Limit recursion depth
find . -name "*.py" -not -path "./venv/*" | head -100 | xargs bandit
```

### Debug Mode
```bash
# Enable debug output
bandit -r . -v --debug

# Show skipped files
bandit -r . -v | grep -i skip
```

## 📈 Best Practices

### Security-First Development
```python
# Good practices to avoid Bandit warnings

# 1. Use secure random generation
import secrets
token = secrets.token_hex(16)  # Instead of random

# 2. Use safe YAML loading
import yaml
with open('config.yaml') as f:
    config = yaml.safe_load(f)  # Instead of yaml.load

# 3. Use secure hash functions
import hashlib
data_hash = hashlib.sha256(data.encode()).hexdigest()  # Instead of MD5

# 4. Validate shell commands
import subprocess
import shlex
def safe_shell_command(user_input):
    # Validate and sanitize input
    if not user_input.isalnum():
        raise ValueError("Invalid input")
    
    # Use list form instead of shell=True
    subprocess.run(['ls', '-l', user_input], check=True)

# 5. Use environment variables for secrets
import os
api_key = os.environ.get('API_KEY')  # Instead of hardcoding

# 6. Implement proper error handling
try:
    risky_operation()
except Exception as e:
    logger.error(f"Operation failed: {e}")
    # Don't use bare except or pass
```

### Integration Strategy
```bash
# 1. Start with baseline scan
bandit -r . -f json -o baseline.json

# 2. Implement gradually
bandit -r . -ll  # Start with high/medium severity only

# 3. Use in development workflow
# Add to pre-commit hooks
# Integrate with IDE
# Run in CI/CD pipeline

# 4. Regular security reviews
# Weekly scans on main branch
# Security-focused code reviews
# Developer security training
```

## 📚 Additional Resources

- [Bandit Documentation](https://bandit.readthedocs.io/)
- [OWASP Python Security](https://owasp.org/www-project-python-security/)
- [Python Security Best Practices](https://python-security.readthedocs.io/)
- [Bandit GitHub Repository](https://github.com/PyCQA/bandit)
- [Security Code Review Guide](https://owasp.org/www-project-code-review-guide/)

Bandit provides essential security analysis for Python applications, helping developers identify and fix security vulnerabilities early in the development process.
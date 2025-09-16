---
sidebar_position: 2
title: Semgrep
description: Semgrep is a static analysis tool for finding bugs, security issues, and code patterns. Learn how to integrate Semgrep into your CI/CD pipeline.
slug: /TestingScanning/Semgrep
keywords:
  - Semgrep
  - SAST
  - static analysis
  - security scanning
  - code patterns
  - vulnerability detection
---

# 🔍 Semgrep Static Analysis Security Testing

**Semgrep** is a **static analysis tool** for finding **bugs**, **security issues**, and **code patterns** with **custom rules** and **CI/CD integration**.

---

## 🔧 Installation

`Install Semgrep:`
```bash
# Using pip
pip install semgrep

# Using Homebrew (macOS)
brew install semgrep

# Using Docker
docker pull returntocorp/semgrep
```

## 📊 Basic Scanning

`Scan with built-in rules:`
```bash
# Scan current directory
semgrep --config=auto .

# Scan specific language
semgrep --config=p/javascript .
semgrep --config=p/python .

# Security-focused scan
semgrep --config=p/security-audit .
semgrep --config=p/owasp-top-ten .

# Output to JSON
semgrep --config=auto --json --output=results.json .
```

## ▶️ Sample Output

```bash
$ semgrep --config=p/security-audit .

┌─────────────┐
│ Scan Status │
└─────────────┘
  Scanning 45 files (only git-tracked) with 423 Code rules:

  FINDINGS:

  src/auth.js
       javascript.express.security.audit.express-cookie-session-no-secure.express-cookie-session-no-secure
          Detected cookie session without 'secure' flag. This allows the cookie to be sent over HTTP.
          
          15┆ app.use(session({
          16┆   secret: 'keyboard cat',
          17┆   resave: false,
          18┆   saveUninitialized: true
          19┆ }))

  src/database.js  
       javascript.sequelize.security.audit.sequelize-injection.sequelize-injection
          Detected possible SQL injection. User input is used in a raw query.
          
          23┆ const query = `SELECT * FROM users WHERE id = ${userId}`;
          24┆ return sequelize.query(query);

  SUMMARY:
    2 findings of the following types:
      1 javascript.express.security.audit.express-cookie-session-no-secure.express-cookie-session-no-secure
      1 javascript.sequelize.security.audit.sequelize-injection.sequelize-injection
```

## 🔧 Custom Rules

`Create custom-rules.yml:`
```yaml
rules:
  - id: hardcoded-password
    pattern: |
      password = "..."
    message: Hardcoded password detected
    languages: [python, javascript]
    severity: ERROR
    
  - id: sql-injection-risk
    patterns:
      - pattern: |
          $QUERY = "SELECT * FROM users WHERE id = " + $INPUT
      - pattern: |
          $QUERY = f"SELECT * FROM users WHERE id = {$INPUT}"
    message: Potential SQL injection vulnerability
    languages: [python]
    severity: WARNING
```

`Run with custom rules:`
```bash
semgrep --config=custom-rules.yml .
```

## 🔄 CI/CD Integration

`GitHub Actions (.github/workflows/semgrep.yml):`
```yaml
name: Semgrep Security Scan

on: [push, pull_request]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

`GitLab CI (.gitlab-ci.yml):`
```yaml
semgrep:
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=gl-sast-report.json .
  artifacts:
    reports:
      sast: gl-sast-report.json
```

**Reference:** [Semgrep Documentation](https://semgrep.dev/docs/)
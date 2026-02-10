---
sidebar_position: 8
title: LDAP Manager Logs
description: Step-by-step guide to enable logging, persist logs, and inspect activity history in LDAP Manager for operational visibility and auditing.
slug: /ldap/ldap-manager/logging
keywords:
  - LDAP Manager
  - LDAP Logging
  - LDAP Activity Log
  - LDAP Auditing
---

# Logging and Activity Monitoring in LDAP Manager

Learn how to configure and enable logging in LDAP Manager, persist logs, and inspect activity history for operational visibility and auditing.

#### Verify Default Logging

Check logs:

```bash
docker logs ldap-manager
```

`You should see:`

* Application startup messages
* LDAP connection attempts
* Errors if configuration is invalid

#### Enable Persistent Log Storage

For anything beyond local testing, logs **must survive container restarts**.

#### Run LDAP Manager with a log volume
`Run:`
```bash
docker run -d \
  --name ldap-manager \
  -p 8000:8000 \
  -v $(pwd)/config.yml:/app/config.yml:ro \
  -v ldap-manager-logs:/app/logs \
  ghcr.io/vibhuvioio/ldap-manager:latest
```

`This creates a persistent Docker volume:`

```
ldap-manager-logs
```

---

#### Step 3: Configure Log Level

Edit `config.yml`:

```yaml
logging:
  level: INFO
```

Available levels:

* `ERROR` – failures only
* `INFO` – recommended default
* `DEBUG` – verbose (not for production)

Apply changes:

```bash
docker restart ldap-manager
```

---

## Step 4: Enable Debug Logging (Temporary)

Use **DEBUG only for troubleshooting**.

```yaml
logging:
  level: DEBUG
```

Restart container:

```bash
docker restart ldap-manager
```

Verify:

```bash
docker logs ldap-manager | tail -50
```

You should see:

* LDAP query execution
* Attribute validation
* Request routing details

---

## Step 5: Inspect Activity Logs from the UI

LDAP Manager exposes **activity history** through the web interface.

### Access UI

```
http://localhost:8000
```

### Navigate to Activity Logs

* Open Dashboard
* Go to **Activity / Logs**
* Review:

  * Timestamp
  * Operation type (Search / Add / Modify / Delete)
  * Target DN
  * Result (Success / Failure)

This shows **what actions were triggered via the UI**.

---

## Step 6: Identify Failed Operations

Typical failure patterns:

### Schema Violation

* Missing required attributes
* Invalid objectClass
* Syntax mismatch

UI:

```
Operation failed
```

Logs:

```
schema violation
```

---

### ACL Denial

UI:

```
Insufficient access
```

Logs:

```
LDAP_INSUFFICIENT_ACCESS
```

This means your bind DN **lacks write permissions**.

---

## Step 7: Correlate with OpenLDAP Logs

LDAP Manager logs intent.
OpenLDAP logs execution.

Always correlate:

| Source            | Purpose        |
| ----------------- | -------------- |
| LDAP Manager logs | Who did what   |
| OpenLDAP logs     | Why it failed  |
| `cn=Monitor`      | Runtime health |

This is mandatory for real incident analysis.

---

## Step 8: Validate Log Integrity

Confirm logs persist across restarts:

```bash
docker restart ldap-manager
docker logs ldap-manager
```

If logs reset:

* Volume is not mounted
* Container was recreated incorrectly

---

## Common Logging Mistakes

| Mistake               | Consequence              |
| --------------------- | ------------------------ |
| Relying only on UI    | Miss backend failures    |
| DEBUG in production   | Performance impact       |
| No persistent logs    | No audit trail           |
| Ignoring ACL failures | False assumption of bugs |

---

## What This Logging Is NOT

* ❌ Compliance-grade audit logging
* ❌ Immutable audit trail
* ❌ Replacement for OpenLDAP auditlog overlay

For compliance or security auditing, you must use:

* OpenLDAP auditlog overlay
* Centralized log storage
* Access control reviews

---

## Final Notes

LDAP Manager logging provides:

* Operational visibility
* Change traceability
* Faster debugging

It **does not replace** proper LDAP server logging or security controls.

If logging looks “broken”:

* LDAP permissions are wrong
* Or schema is invalid
* Not the UI

---

## Next Logical Steps

* Enable OpenLDAP auditlog overlay
* Ship logs to ELK / Loki
* Alert on repeated failures
* Track destructive operations

If you want, I’ll write the **auditlog overlay guide next**.

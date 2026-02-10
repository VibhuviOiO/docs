---
sidebar_position: 6
title: LDAP Manager
description: Understand what LDAP Manager is and how to deploy it as a Docker container for managing OpenLDAP directories.
slug: /ldap/ldap-manager/setup
keywords:
  - LDAP Manager
  - OpenLDAP UI
  - LDAP Admin UI
  - Docker LDAP Manager
---

# What is LDAP Manager

LDAP Manager is a web-based administrative interface for LDAP servers.

`It exists to solve real problems:`

- LDAP has no native UI

- ldapadd/ldapsearch do not scale for ops teams

- Schema-aware CRUD is painful by hand

- Multi-cluster visibility is non-trivial

`LDAP Manager provides:`

- Read/write access to directory data

- Schema-aware forms

- Cluster health visibility

- Safe pagination (RFC 2696)

- Centralized access control

This is not a replacement for LDAP.
It is a control plane.

#### Get Configuration Template
`Run:`
```bash
wget https://raw.githubusercontent.com/VibhuviOiO/ldap-manager/main/config.example.yml -O config.yml
```

#### Configure LDAP Connection

`Edit config.yml:`
```bash
clusters:
  - name: "Single Node LDAP"
    host: "openldap-vibhuvioio"
    port: 389
    bind_dn: "cn=Manager,dc=vibhuvioio,dc=com"
    base_dn: "dc=vibhuvioio,dc=com"
```

`Rules:`

- bind_dn must exist

- base_dn must match LDAP

- TLS not optional in production

#### Run LDAP Manager (Docker Run)
```bash
docker run -d \
  --name ldap-manager \
  -p 8000:8000 \
  -v $(pwd)/config.yml:/app/config.yml:ro \
  ghcr.io/vibhuvioio/ldap-manager:latest
```
#### Access UI
- http://localhost:8000




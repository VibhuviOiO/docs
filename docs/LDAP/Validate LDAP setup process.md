---
sidebar_position: 4
title: Validate OpenLDAP Setup
description: Step-by-step guide to validating a running OpenLDAP setup, including connectivity, base DN, OUs, users, groups, and custom schemas.
slug: /ldap/validate-openldap-setup
keywords:
  - OpenLDAP
  - LDAP Validation
  - LDAP Verification
  - LDAP Health Check
  - LDAP Schema Validation
  - LDAP Testing
---


# Validation OpenLDAP Setup Pocess

This guide validates:

* Container health
* LDAP service availability
* Base DN correctness
* Admin bind authentication
* Core directory structure
* Read operations
* Write operations
* Schema availability (basic)
* Data persistence



---

#### Docker Compose Configuration

`docker-compose.yml`

```yaml
services:
  openldap:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-vibhuvi
    hostname: openldap-vibhuvi
    env_file:
      - .env.vibhuvioio
    ports:
      - "390:389"
      - "637:636"
    volumes:
      - ldap-data:/var/lib/ldap
      - ldap-config:/etc/openldap/slapd.d
      - ./logs:/logs
      - ./custom-schema:/custom-schema:ro
      - ./sample/mahabharata_data.ldif:/data/mahabharata_data.ldif:ro
      - ./init/init-data.sh:/docker-entrypoint-initdb.d/init-data.sh:ro
    restart: unless-stopped
    networks:
      - ldap-shared-network

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-shared-network:
    external: true
```
#### Environment Configuration
`create a file .env.vibhuvioio`
`Paste:`
```bash
LDAP_DOMAIN=vibhuvi.com
LDAP_ORGANIZATION=Vibhuvi Corporation
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme

INCLUDE_SCHEMAS=cosine,inetorgperson,nis

ENABLE_REPLICATION=false
SERVER_ID=1

ENABLE_MONITORING=true
```

#### Network Setup (Run Once)
`Run:`
```bash
docker network create ldap-shared-network
```
`Run:`
```bash
docker compose up -d
```
#### Verify:
`Run`
```bash
docker ps
```
#### Expected:

`Container status: Up`

#### All validation commands must use these values.

`Validate LDAP Port Accessibility`
```bash
ss -lntp | grep 390
```
`Expected:`

* Port 390 listening



#### Validate Admin Bind (Authentication)
```bash
ldapwhoami -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme
```
`Expected:`

* dn:cn=Manager,dc=vibhuvi,dc=com


#### Validate Base DN Exists
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(objectClass=*)"
```
`Expected:`

Entry dc=vibhuvi,dc=com returned

#### Validate Default Organizational Units
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(objectClass=organizationalUnit)"
```
`Expected:`

* ou=People

* ou=Group

#### Validate Read Operations
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "ou=People,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(objectClass=*)"
```
`Expected:`

* At least the ou=People entry

#### Validate Write Operations
`Run:`
```bash
ldapadd -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: uid=testuser,ou=People,dc=vibhuvi,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
cn: Test User
sn: User
uid: testuser
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/testuser
userPassword: test123
EOF
```
`Expected:`

* adding new entry "uid=testuser,ou=People,dc=vibhuvi,
dc=com"

#### Validate Data Retrieval
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "ou=People,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(uid=testuser)"
```
`Expected:`

* uid=testuser entry returned

#### Validate Schema Availability (Basic)
`Run:`

```bash
ldapmodify -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: uid=testuser,ou=People,dc=vibhuvi,dc=com
changetype: modify
add: objectClass
objectClass: inetOrgPerson
EOF
```
`Expected:`

* Success

#### docker restart openldap-vibhuvi
`Run:`
```bash
docker restart openldap-vibhuvi
```

#### Re-check the user:
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "ou=People,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(uid=testuser)"
```
`Expected:`

* User still exists


This confirms **volume persistence is working**.

---



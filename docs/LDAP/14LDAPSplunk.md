---
sidebar_position: 14
title: Splunk Enterprise LDAP Authentication with OpenLDAP (Docker)
description: Step-by-step guide to integrate Splunk Enterprise with OpenLDAP using Docker. Configure LDAP authentication, group-based authorization, and secure access control.
slug: /ldap/splunk-auth
keywords:
  - Splunk LDAP Authentication
  - OpenLDAP Docker
  - Centralized Identity
  - LDAP Group Authorization
  - Splunk Role Mapping
  - Enterprise Access Control
---


# Splunk LDAP Authentication with OpenLDAP (Docker)

This guide demonstrates how to configure **Splunk Enterprise** to authenticate users against **OpenLDAP** using Docker.





#### Create docker-compose.yml

`Paste:`
```yaml
services:

  openldap:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-vibhuvioio
    hostname: openldap-vibhuvioio
    env_file:
      - .env.vibhuvioio
    ports:
      - "389:389"
    volumes:
      - ldap-data:/var/lib/ldap
      - ldap-config:/etc/openldap/slapd.d
    restart: unless-stopped
    networks:
      - ldap-net

  ldap-manager:
    image: ghcr.io/vibhuvioio/ldap-manager:latest
    container_name: ldap-manager
    depends_on:
      - openldap
    ports:
      - "8000:8000"
    networks:
      - ldap-net

  splunk:
    image: splunk/splunk:9.2
    container_name: splunk
    hostname: splunk
    environment:
      SPLUNK_START_ARGS: --accept-license
      SPLUNK_PASSWORD: Changeme123!
    ports:
      - "8001:8000"
    restart: unless-stopped
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-net:
    driver: bridge
```

---

#### Create environment file

`.env.vibhuvioio`

`Paste:`

```bash
LDAP_ORGANISATION=vibhuvioio
LDAP_DOMAIN=vibhuvioio.com
LDAP_ADMIN_PASSWORD=changeme
```

---

#### Start services

`Run:`
```bash
docker compose up -d
```

#### Verify:

`Run:`
```bash
docker ps
```

---

#### Verify LDAP Directory


`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL -b dc=vibhuvioio,dc=com
```

- Expected:

```bash
ou=People
ou=Group
```
---

#### Create LDAP Groups

`Create groups.ldif`

`Paste:`
```bash
dn: cn=splunk-users,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: splunk-users
member: cn=Manager,dc=vibhuvioio,dc=com
```

#### Import:


`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

#### Verify:


`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL -b ou=Group,dc=vibhuvioio,dc=com
```

---

#### Create LDAP User

`Create splunkuser.ldif`

`Paste:`
```bash
dn: cn=splunkuser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: splunkuser
userPassword: password
description: Splunk Test User
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < splunkuser.ldif
```

---

#### Verify LDAP Authentication

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b ou=People,dc=vibhuvioio,dc=com
```

### Verify password bind

`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "cn=splunkuser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

`Expected:`

```bash
dn:cn=splunkuser,ou=People,dc=vibhuvioio,dc=com
```

---

#### Add User to Group

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: cn=splunk-users,ou=Group,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: cn=splunkuser,ou=People,dc=vibhuvioio,dc=com
EOF
```

#### Verify:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b cn=splunk-users,ou=Group,dc=vibhuvioio,dc=com
```

---

#### Confirm Container Connectivity (Important)

`Run:`
```bash
docker exec splunk getent hosts openldap-vibhuvioio
```

#### Port access:

`Run:`
```bash
docker exec splunk bash -c "</dev/tcp/openldap-vibhuvioio/389"
```

#### Configure Splunk LDAP Authentication

`Open Splunk:`


- http://localhost:8001


`Login:`

```
admin
Changeme123!
```

#### Navigate:

```
Settings → Authentication Methods → LDAP → New
```

---

#### LDAP Connection Settings

| Field         | Value                           |
| ------------- | ------------------------------- |
| Strategy      | Active Directory                |
| Host          | openldap-vibhuvioio             |
| Port          | 389                             |
| Bind DN       | cn=Manager,dc=vibhuvioio,dc=com |
| Bind Password | changeme                        |

---

#### User Settings

| Field                   | Value                          |
| ----------------------- | ------------------------------ |
| User Base DN            | ou=People,dc=vibhuvioio,dc=com |
| User name attribute     | cn                             |
| Real name attribute     | cn                             |
| Group mapping attribute | **(leave empty)**              |

---

#### Group Settings

| Field                   | Value                         |
| ----------------------- | ----------------------------- |
| Group Base DN           | ou=Group,dc=vibhuvioio,dc=com |
| Group name attribute    | cn                            |
| Static member attribute | member                        |
| Nested groups           | OFF                           |

---

#### ⚠️ Critical Notes

**Do NOT set:**

* uid
* memberUid
* dn (mapping attribute)

`Your LDAP uses:`

```
groupOfNames + member DN
```

---

#### Map LDAP Group → Splunk Role

`Navigate:`

```
Authentication methods → LDAP strategies → LDAP Groups
```

`Click:`

```
splunk-users
```

`Assign role:`

```
user
```

Save.`

---

#### Enable LDAP Authentication

`Go to:`

```
Settings → Authentication Methods
```

`Select:`

```
LDAP
```

`Save.`

---

#### Test Login

`Logout.`

`Login:`

```
username: splunkuser
password: password
```

---

#### Verify User Recognition

`Navigate:`

```
Settings → Access Controls → Users
```

`You should see:`

```
splunkuser (LDAP)
```

---




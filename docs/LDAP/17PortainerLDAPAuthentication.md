---
sidebar_position: 17
title: Portainer LDAP Authentication
description: Deterministic guide to integrate Portainer CE with OpenLDAP using Docker. Enables centralized authentication and group-based administrator access.
slug: /ldap/portainer-auth
keywords:
  - Portainer LDAP
  - OpenLDAP Authentication
  - Docker Access Control
  - LDAP Group Authorization
  - DevOps Identity Integration
---

# Portainer LDAP Authentication with OpenLDAP (Docker)

This guide demonstrates how to configure **Portainer CE** to authenticate users against **OpenLDAP** and grant administrator access using LDAP groups.


#### Create Docker Compose Stack

`docker-compose.yml`

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

  portainer:
    image: portainer/portainer-ce:2.20.3
    container_name: portainer
    command: -H unix:///var/run/docker.sock
    ports:
      - "9000:9000"
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer-data:/data
    restart: unless-stopped
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:
  portainer-data:

networks:
  ldap-net:
    driver: bridge
```


#### Create Environment File

`Create .env.vibhuvioio`

`Paste:`
```bash
LDAP_ORGANISATION=vibhuvioio
LDAP_DOMAIN=vibhuvioio.com
LDAP_ADMIN_PASSWORD=changeme
```

#### Start Services

`Run:`
```bash
docker compose up -d
```

#### Verify containers:


`Run:`
```bash
docker ps
```

#### Verify LDAP Base Tree

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL \
-b dc=vibhuvioio,dc=com
```

`Expected:`

```bash
ou=People
ou=Group
```

---

#### Create LDAP Groups

`Create groups.ldif`

`Paste:`
```bash
dn: cn=portainer-admins,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: portainer-admins
member: cn=Manager,dc=vibhuvioio,dc=com

dn: cn=portainer-users,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: portainer-users
member: cn=Manager,dc=vibhuvioio,dc=com
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

#### Create LDAP User

`Create devuser.ldif`

`Paste:`
```bash
dn: cn=devuser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: devuser
userPassword: password
description: Portainer User
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < devuser.ldif
```

---

#### Add User to Admin Group

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: cn=portainer-admins,ou=Group,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: cn=devuser,ou=People,dc=vibhuvioio,dc=com
EOF
```

#### Verify:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL \
-b "cn=portainer-admins,ou=Group,dc=vibhuvioio,dc=com"
```

#### Access Portainer

`Open:`

- https://localhost:9443


Create the **initial local admin** (required once).

Use a strong password.

`example : VaultMeshAdmin#2026`

---

#### Configure LDAP Authentication in Portainer

Navigate:

**Settings → Authentication → LDAP**

#### Connection Settings

| Field          | Value                           |
| -------------- | ------------------------------- |
| LDAP Server    | openldap-vibhuvioio:389         |
| Anonymous mode | OFF                             |
| Reader DN      | cn=Manager,dc=vibhuvioio,dc=com |
| Password       | changeme                        |

Click **Test connectivity** → must succeed.

---

#### LDAP Security

Leave OFF (plain LDAP inside Docker):

* StartTLS → OFF
* TLS → OFF


#### User Search

| Field              | Value                              |
| ------------------ | ---------------------------------- |
| Base DN            | ou=People,dc=vibhuvioio,dc=com     |
| Username attribute | cn                                 |
| Filter             | (objectClass=simpleSecurityObject) |


#### Test LDAP Login

Logout from Portainer.

`Login:`

```
Username: devuser
Password: password
```

If group membership is correct, the user receives administrator privileges.

---



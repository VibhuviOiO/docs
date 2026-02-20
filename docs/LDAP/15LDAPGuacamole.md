---
sidebar_position: 15
title: LDAP + Apache Guacamole Authentication
description: Determistic guide to integrate Apache Guacamole with OpenLDAP using Docker. LDAP authentication, centralized identity, and secure remote access.
slug: /ldap/guacamole-auth
keywords:

Guacamole LDAP

OpenLDAP Authentication

LDAP Docker

Remote Access Gateway

LDAP Centralized Login

Guacamole Identity Management
---

# Apache Guacamole LDAP Authentication with OpenLDAP (Docker)

This guide configures **Apache Guacamole** to authenticate users using **OpenLDAP**.

---

#### Docker Compose

`Create docker-compose.yml`

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

  guacd:
    image: guacamole/guacd:1.5.5
    container_name: guacd
    restart: unless-stopped
    networks:
      - ldap-net

  guacamole:
    image: guacamole/guacamole:1.5.5
    container_name: guacamole
    depends_on:
      - guacd
      - openldap
    environment:
      GUACD_HOSTNAME: guacd
      LDAP_HOSTNAME: openldap-vibhuvioio
      LDAP_PORT: 389
      LDAP_USER_BASE_DN: ou=People,dc=vibhuvioio,dc=com
      LDAP_GROUP_BASE_DN: ou=Group,dc=vibhuvioio,dc=com
      LDAP_USERNAME_ATTRIBUTE: cn
      LDAP_SEARCH_BIND_DN: cn=Manager,dc=vibhuvioio,dc=com
      LDAP_SEARCH_BIND_PASSWORD: changeme
      LDAP_CONFIG_BASE_DN: dc=vibhuvioio,dc=com
    ports:
      - "8080:8080"
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

#### Environment File

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

#### Verify:

`Run:`
```bash
docker ps
```

---

#### Verify LDAP Base Tree

`Run:`

```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL -b dc=vibhuvioio,dc=com
```

`Expected:`

```
ou=People
ou=Group
```

---

#### Create LDAP Groups

`Create groups.ldif`

`Paste:`

```bash
dn: cn=guac-users,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: guac-users
member: cn=Manager,dc=vibhuvioio,dc=com
```

#### Import:

`Paste:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

---

#### Create LDAP User (Schema-Safe)

`Create testuser.ldif`

`Paste:`

```bash
dn: cn=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: testuser
userPassword: password
description: Guacamole Test User
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < testuser.ldif
```

---

#### Verify LDAP Authentication

`Run:`

```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b "ou=People,dc=vibhuvioio,dc=com"
```

#### Verify password bind:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "cn=testuser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

`Expected:`

```
dn:cn=testuser,ou=People,dc=vibhuvioio,dc=com
```

---

#### Add User to Group

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: cn=guac-users,ou=Group,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: cn=testuser,ou=People,dc=vibhuvioio,dc=com
EOF
```

#### Verify:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b "cn=guac-users,ou=Group,dc=vibhuvioio,dc=com"
```

---

#### Access Guacamole

`Open:`

http://localhost:8080/guacamole

`Login:`

```
Username: testuser
Password: password
```

If login succeeds → LDAP integration is working.

---


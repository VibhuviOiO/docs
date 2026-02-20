---
sidebar_position: 16
title: Redmine LDAP Authentication (Docker)
description: Step-by-step guide to configure Redmine authentication using OpenLDAP with Docker. Includes deployment, LDAP setup, Redmine configuration, and troubleshooting.
slug: /ldap/redmine-auth
keywords:
  - Redmine LDAP
  - OpenLDAP Docker
  - LDAP Authentication
  - Identity Integration
  - Redmine Docker
---

# Redmine LDAP Authentication with OpenLDAP (Docker)

This guide demonstrates how to configure **Redmine** to authenticate users against **OpenLDAP**.


#### Create docker-compose.yml`

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
      - redmine-net

  ldap-manager:
    image: ghcr.io/vibhuvioio/ldap-manager:latest
    container_name: ldap-manager
    depends_on:
      - openldap
    ports:
      - "8000:8000"
    networks:
      - redmine-net

  redmine-db:
    image: mariadb:11
    container_name: redmine-db
    environment:
      MYSQL_ROOT_PASSWORD: redmine
      MYSQL_DATABASE: redmine
      MYSQL_USER: redmine
      MYSQL_PASSWORD: redmine
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - redmine-net

  redmine:
    image: redmine:6
    container_name: redmine
    depends_on:
      - redmine-db
      - openldap
    ports:
      - "3000:3000"
    environment:
      REDMINE_DB_MYSQL: redmine-db
      REDMINE_DB_DATABASE: redmine
      REDMINE_DB_USERNAME: redmine
      REDMINE_DB_PASSWORD: redmine
    restart: unless-stopped
    networks:
      - redmine-net

volumes:
  ldap-data:
  ldap-config:
  db-data:

networks:
  redmine-net:
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

#### Verify OpenLDAP Directory

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

#### Create LDAP User (Schema Compatible)

`Create redmine-user.ldif`

`Paste:`
```bash
dn: cn=redmineuser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: redmineuser
description: Redmine LDAP User
userPassword: password
```


#### Import user

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < redmine-user.ldif
```

#### Verify user exists

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b "ou=People,dc=vibhuvioio,dc=com"
```

#### Verify authentication (bind)

`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "cn=redmineuser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

`Expected:`

```
dn:cn=redmineuser,ou=People,dc=vibhuvioio,dc=com
```


#### Access Redmine

`Open:`

- http://localhost:3000


`Default login:`

```
admin / admin
```

- Change password when prompted.

---

#### Configure LDAP Authentication in Redmine

`Go to:`

```
Administration → LDAP authentication → New authentication mode
```

---

#### Connection Settings

**Name**

```
OpenLDAP
```

**Host**

```
openldap-vibhuvioio
```

**Port**

```
389
```

---

#### Authentication

**Account**

```
cn=Manager,dc=vibhuvioio,dc=com
```

**Password**

```
changeme
```

**Base DN**

```
ou=People,dc=vibhuvioio,dc=com
```

---

#### Attributes

**Login attribute**

```
cn
```

`Leave:`

```
Firstname attribute
Lastname attribute
Email attribute
```

- EMPTY (required due to minimal schema)

---

#### Enable

☑ On-the-fly user creation

Click **Save**

---

#### Allow Automatic Account Activation

`Navigate:`

```
Administration → Settings → Authentication
```

`Change:`

```
Self-registration → Automatic account activation
```

Save.

---

#### Test LDAP Login

Logout admin.

Login with:

```
username: redmineuser
password: password
```

---

#### Expected Result

✔ LDAP password verified
✔ Redmine creates user automatically
✔ User successfully logged in

---

#### Verify User Creation

Navigate:

```
Administration → Users
```

You should see:

```
redmineuser
```

---

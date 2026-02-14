---
sidebar_position: 12
title: LDAP + Jenkins Authentication
description: Deterministic guide to integrate Jenkins with OpenLDAP using Docker. LDAP authentication, group-based authorization, and hardened CI access.
slug: /ldap/jenkins-auth
keywords:
  - Jenkins LDAP
  - OpenLDAP Authentication
  - LDAP Docker
  - Jenkins Matrix Security
  - LDAP Group Authorization
  - CI Access Hardening
---

# LDAP + Jenkins Authentication

This guide configures Jenkins to authenticate users against OpenLDAP and enforce access using LDAP groups.

---

#### Docker Compose

`create a file docker-compose.yml`

`Paste:`

```yml
services:

  openldap:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-vibhuvioio
    hostname: openldap-vibhuvioio
    env_file:
      - .env.vibhuvioio
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - ldap-data:/var/lib/ldap
      - ldap-config:/etc/openldap/slapd.d
      - ./logs:/logs
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
    volumes:
      - ./config.yml:/app/config.yml:ro
    restart: unless-stopped
    networks:
      - ldap-net

  jenkins:
    image: jenkins/jenkins:lts
    container_name: jenkins
    depends_on:
      - openldap
    ports:
      - "8080:8080"
    volumes:
      - jenkins_home:/var/jenkins_home
    restart: unless-stopped
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:
  jenkins_home:

networks:
  ldap-net:
    driver: bridge
```

---

#### Environment Configuration

`create a file .env.vibhuvioio`

`Paste:`

```bash
LDAP_DOMAIN=vibhuvioio.com
LDAP_ORGANIZATION=Vibhuvioio
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme

INCLUDE_SCHEMAS=cosine,inetorgperson,nis
ENABLE_MONITORING=true
```

#### Start Services

`Run:`

```bash
docker compose up -d
```

- Wait 60 seconds for LDAP initialization.

---

#### Create Directory Structure

`Create a file base.ldif`

`Paste:`

```bash
dn: ou=People,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: People

dn: ou=Groups,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: Groups
```

#### Import:

`Paste:`

```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < base.ldif
```

#### Create Jenkins Authorization Groups

`Create a file groups.ldif`

`Paste:`

```bash
dn: cn=ci-admins,ou=Groups,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: ci-admins
member: cn=dummy,dc=vibhuvioio,dc=com

dn: cn=ci-developers,ou=Groups,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: ci-developers
member: cn=dummy,dc=vibhuvioio,dc=com
```

#### Import:

```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

---

#### Create LDAP User (Terminal Only)

`Create testuser.ldif`

```bash
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: top
cn: Test User
sn: User
givenName: Test
uid: testuser
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/testuser
mail: testuser@vibhuvioio.com
userPassword: password
```

#### Import:

`Run:`

```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < testuser.ldif
```

---

#### Add User to Admin Group

`Create add-member.ldif`

`Paste:`

```bash
dn: cn=ci-admins,ou=Groups,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: uid=testuser,ou=People,dc=vibhuvioio,dc=com
```

#### Apply:

`Run:`

```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < add-member.ldif
```

---

#### Verify LDAP Authentication

`Run:`

```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "uid=testuser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

`Expected:`

```bash
dn:uid=testuser,ou=People,dc=vibhuvioio,dc=com
```

---

#### Jenkins Configuration

`Retrieve initial password:`

`Run:`
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
Copy the output.

`Open:`

- http://localhost:8080


- Paste the password when prompted.

`Select:`

- Install suggested plugins

#### Login Verification

```bash
username: testuser
password: password
```

`Successful login confirms:`

✔ LDAP authentication

✔ Group-based authorization

✔ CI access control

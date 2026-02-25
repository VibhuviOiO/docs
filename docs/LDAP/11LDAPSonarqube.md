---
sidebar_position: 11
title: LDAP + SonarQube Authentication
description: Deterministic guide to integrate SonarQube with OpenLDAP using Docker. LDAP-only authentication, read-only bind, and group-based authorization.
slug: /ldap/sonarqube-auth
keywords:
  - SonarQube LDAP
  - OpenLDAP Authentication
  - LDAP Docker
  - LDAP Group Authorization
  - SonarQube Integration
---

# LDAP + SonarQube Authentication

This guide configures SonarQube to authenticate users against OpenLDAP.



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
      - ./custom-schema:/custom-schema:ro
      - ./sample/mahabharata_data.ldif:/data/mahabharata_data.ldif:ro
      - ./init/init-data.sh:/docker-entrypoint-initdb.d/init-data.sh:ro
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

  postgres:
    image: postgres:15
    container_name: sonarqube-db
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - sonar-db:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - ldap-net

  sonarqube:
    image: sonarqube:community
    container_name: sonarqube
    depends_on:
      - postgres
      - openldap
    ports:
      - "9000:9000"
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar

      SONAR_SECURITY_REALM: LDAP

      LDAP_URL: ldap://openldap-vibhuvioio:389
      LDAP_BINDDN: uid=sonarbind,ou=People,dc=vibhuvioio,dc=com
      LDAP_BINDPASSWORD: bindpassword

      LDAP_USER_BASEDN: ou=People,dc=vibhuvioio,dc=com
      LDAP_USER_REQUEST: (&(objectClass=inetOrgPerson)(uid={login}))

      LDAP_GROUP_BASEDN: ou=Groups,dc=vibhuvioio,dc=com
      LDAP_GROUP_REQUEST: (&(objectClass=groupOfNames)(member={dn}))
      LDAP_GROUP_IDATTRIBUTE: cn

    volumes:
      - sonarqube-data:/opt/sonarqube/data
      - sonarqube-extensions:/opt/sonarqube/extensions
      - sonarqube-logs:/opt/sonarqube/logs

    restart: unless-stopped
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:
  sonar-db:
  sonarqube-data:
  sonarqube-extensions:
  sonarqube-logs:

networks:
  ldap-net:
    driver: bridge
```
#### Start

`Run:`
```bash
docker compose up -d
```
#### Create LDAP Groups

`Create a file groups.ldif:`

`Paste:`
```bash
dn: ou=Groups,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: Groups

dn: cn=sonarqube-admins,ou=Groups,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: sonarqube-admins

dn: cn=sonarqube-users,ou=Groups,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: sonarqube-users
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

---

#### Create Read-Only Bind Account

`Create a file readonly.ldif`

`Paste:`
```bash
dn: uid=sonarbind,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
cn: Sonar Bind
sn: Bind
uid: sonarbind
userPassword: bindpassword
```

#### Import:
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < readonly.ldif
```

---

#### Generate SSHA hash

`Run:`
```bash
docker exec -it openldap-vibhuvioio slappasswd
```
`You will see:`

New password:

Now TYPE:

password

Press Enter.

`Then:`

Re-enter password:

Type again:

password

#### Create LDAP User (Terminal Only)

`Create a file testuser.ldif:`

`Paste the SSHA hash generated above into the userPassword field.`

`Paste:`

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
userPassword: paste here
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < testuser.ldif
```

---

#### Add User to SonarQube Group

`Create a file add-member.ldif:`

`Paste:`

```bash
dn: cn=sonarqube-users,ou=Groups,dc=vibhuvioio,dc=com
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
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL \
-b "ou=People,dc=vibhuvioio,dc=com" "(uid=testuser)"
```

#### Verify password bind

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
#### Login Verification

`Open:`


- http://localhost:9000

`Login:`

```bash
username: testuser
password: password
```

- Successful login confirms LDAP authentication.




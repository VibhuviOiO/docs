---
sidebar_position: 7
title: LDAP Manager (CRUD Setup)
description: Run OpenLDAP and LDAP Manager together using Docker Compose and configure CRUD operations using config.yml.
slug: /ldap/ldap-manager/crud-setup
keywords:
  - OpenLDAP
  - LDAP Manager
  - LDAP CRUD
  - Docker Compose
---

# OpenLDAP + LDAP Manager (CRUD Operations)

This guide shows how to run **OpenLDAP and LDAP Manager together** and configure **create, read, update, and delete (CRUD)** operations using `config.yml`.

---

#### Architecture (Read This First)

```
Browser
   |
   v
LDAP Manager (UI + API)
   |
   v
OpenLDAP (slapd)
   |
   v
LDAP Data + Schema
```

---

#### Docker Compose (OpenLDAP + LDAP Manager)

`create a file docker-compose.yml`

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
      - ldap-shared-network

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
      - ldap-shared-network

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-shared-network:
    driver: bridge
```

---

#### OpenLDAP Environment Configuration

`create a file .env.vibhuvioio`
`Paste:`
```bash
LDAP_DOMAIN=vibhuvioio.com
LDAP_ORGANIZATION=Vibhuvioio
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme

INCLUDE_SCHEMAS=cosine,inetorgperson,nis

ENABLE_REPLICATION=false
SERVER_ID=1

ENABLE_MONITORING=true
```
#### LDAP Manager Configuration (CRUD Control)
`create a file config.yml:`
```yml
clusters:
  - name: "Single Node OpenLDAP"
    host: "openldap-vibhuvioio"
    port: 389
    bind_dn: "cn=Manager,dc=vibhuvioio,dc=com"
    base_dn: "dc=vibhuvioio,dc=com"

ui:
  editable_object_classes:
    - inetOrgPerson
    - posixAccount

forms:
  user:
    base_dn: "ou=People,dc=vibhuvioio,dc=com"
    rdn_attribute: "uid"
    object_classes:
      - inetOrgPerson
      - posixAccount
```
#### Start the Stack
`Run:`
```bash
docker compose up -d
```

Wait **60 seconds** for initialization.

---

#### Verify 
`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
  -x -H ldap://localhost:389 \
  -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -b "ou=People,dc=vibhuvioio,dc=com"
```

#### Expected

* `ou=People` exists
* Entries are returned
* No authentication errors

#### Manual Test (Baseline)
`Run:`
```bash
echo "dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com 
objectClass: inetOrgPerson
objectClass: posixAccount
cn: Test User
sn: User
uid: testuser
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/testuser
userPassword: test123" | docker exec -i openldap-vibhuvioio ldapadd -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme
```

#### Verify:

```bash
docker exec openldap-vibhuvioio ldapsearch -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-b "ou=People,dc=vibhuvioio,dc=com"
```

#### Access LDAP Manager UI

* http://localhost:8000

#### Perform CRUD Operations (UI)

#### READ (Verify baseline)
`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-b "ou=People,dc=vibhuvioio,dc=com"
```
`Expected:`

* ou=People

`From LDAP Manager UI`

* Select Set Password 
* Enter `changeme`

Navigate to Organization Units

`dc=vibhuvioio,dc=com → ou=People`

UI should show the same state as terminal output.

#### CREATE (Add a user)
`Run:`
```bash
cat <<EOF | docker exec -i openldap-vibhuvioio ldapadd -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
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

* adding new entry "uid=testuser,ou=People,dc=vibhuvioio,dc=com"

`Verify CREATE in UI`

- Go back to LDAP Manager UI

- Refresh the page

- Navigate again to Users

You must now see:

`testuser`

#### UPDATE (Terminal → UI)

`Create a file modify.ldif:`

`Paste:`
```bash
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
changetype: modify
replace: mail
mail: test.user.updated@vibhuvioio.com
```

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme < modify-mail.ldif

```
#### Verify UPDATE in LDAP Manager UI

`Open LDAP Manager UI:`

* http://localhost:8000

#### Navigate to:

Users Tab


#### Check the attribute:

- mail: test.user.updated@vibhuvioio.com

#### DELETE (Terminal → UI)
`Delete the entry from terminal:`

`Paste:`
```bash
docker exec openldap-vibhuvioio ldapdelete -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
"uid=testuser,ou=People,dc=vibhuvioio,dc=com"

```
`Expected output:`


- Verify DELETE in UI

- Refresh LDAP Manager UI

- Navigate to Users Tab

testuser must be gone.

---

#### Environment Reset (Clean Slate)

```bash
docker compose down -v
docker volume rm $(docker volume ls -q)
```

---

---
sidebar_position: 9
title: LDAP + Keycloak (User Federation)
description: Production-grade integration of OpenLDAP with Keycloak using User Federation. Covers READ_ONLY vs WRITABLE modes, attribute mapping, group sync, and login verification.
slug: /ldap/keycloak-user-federation
keywords:
  - LDAP
  - Keycloak
  - User Federation
  - Identity Provider
  - OpenID Connect
  - SSO
---

# LDAP + Keycloak (User Federation)
Production-grade integration of OpenLDAP with Keycloak using User Federation. 

`Create a file docker-compose.yml`

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
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: keycloak
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    depends_on:
      - openldap
    networks:
      - ldap-shared-network

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-shared-network:
    driver: bridge
```
#### OpenLDAP Environment Configuration

`Create a file .env.vibhuvioio`

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


`Create a file config.yml:`

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

#### Start Everything

```bash
docker compose up -d
sleep 60
```
#### Prepare LDAP Structure

`Create file base.ldif`

`Paste:`
```yml
dn: ou=People,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: People

dn: ou=Groups,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: Groups
```

#### Apply:
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
  -x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -f /dev/stdin < base.ldif
```
#### Create User with Proper Password

`Generate hash:`

```bash
docker exec openldap-vibhuvioio slappasswd -s password
```

- Copy the generated hash value and paste it into the userPassword field inside the user.ldif file.

`Create user.ldif`

`Paste:`
```yml
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: top
cn: Test User
sn: User
givenName: Test
uid: testuser
mail: testuser@vibhuvioio.com
uidNumber: 10000
gidNumber: 10000
homeDirectory: /home/testuser
loginShell: /bin/bash
userPassword: 


```

#### Apply:
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
  -x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -f /dev/stdin < user.ldif
```

#### Verify LDAP Authentication
`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
  -x -D "uid=testuser,ou=People,dc=vibhuvioio,dc=com" \
  -w password
```

#### Configure Keycloak
`Access Keycloak`

`Open:`
- http://localhost:8080


`Login:`

```
admin / admin
```

---

#### Create Realm

Top-left dropdown → Create 

`Name:`

```
ldap-demo
```

---

#### Add LDAP Federation

Left menu → User Federation → Add provider → ldap

`Fill exactly:`

- Vendor → Other

- Connection URL → ldap://openldap-vibhuvioio:389
- Bind DN → cn=Manager,dc=vibhuvioio,dc=com
- Bind Credential → changeme


- Edit Mode → READ_ONLY
- Users DN → ou=People,dc=vibhuvioio,dc=com
- Username LDAP attribute → uid
- RDN LDAP attribute → uid
- UUID LDAP attribute → entryUUID
- User Object Classes → inetOrgPerson

- Search Scope → Subtree
- Import Users → ON
- Sync Registrations → OFF
- Periodic Sync → OFF
- Cache Policy → NO_CACHE

#### Click:
```bash
Test connection
Test authentication
```
- Then Save.

#### Synchronize Users

`Scroll down → Click:`

```bash
Synchronize all users
```

`You must see:`

```bash
1 imported users
```

#### Search User (Important)

`Go to:`

- Users

- In search box type:

```
*
```

- Click search.

- If don't appear anything Click On Refresh Button side the Delete user

`You must see:`

```
testuser
```

- Keycloak does NOT auto-list federated users.

---

#### Verify Authentication

`Open:`

- http://localhost:8080/realms/ldap-demo/account

`Login:`

```
testuser
password
```
- If it logs in → integration complete.

---

#### What You Just Built

LDAP → identity store
Keycloak → authentication + token issuer
READ_ONLY federation
Live LDAP bind verification

This is clean, deterministic, and production-aligned.

---


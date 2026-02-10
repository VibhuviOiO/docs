---
sidebar_position: 1
title: Single Node 
description: Deterministic, standards-aligned guide for running a single-node OpenLDAP server using Docker Compose with persistent state and controlled initialization.
slug: /ldap/single-node
keywords:
  - OpenLDAP
  - LDAP
  - Docker
  - Docker Compose
  - LDAP Schema
  - Single Node LDAP
---

# Single Node OpenLDAP with Docker

This setup is designed to make LDAP **boring, predictable, and inspectable**.

---

### Docker Compose Configuration
`Create a file docker-compose.yml`

`Paste`
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

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-shared-network:
    external: true
```

---
### Environment Configuration
`create a .env.vibhuvioio`

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
Create the external Docker network **once**:

`Run`
```bash
docker network create ldap-shared-network
```
`Run`
```bash
docker compose up -d
```
`Wait for 60sec`

---
### Verify directory content
`Run`
```bash
docker exec openldap-vibhuvioio ldapsearch \
  -x -H ldap://localhost:389 \
  -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -b "ou=People,dc=vibhuvioio,dc=com"
```

`Expected:`

* `ou=People` exists
* User entries returned
* No authentication errors

---

### Manual Entry Test

`Add a test employee:`
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

`Search by employeeID`
```bash
docker exec openldap-vibhuvioio ldapsearch -x \
-H ldap://localhost:389 \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-b "ou=People,dc=vibhuvioio,dc=com"

```
---
`Expected output:`

```txt
# People, vibhuvioio.com
dn: ou=People,dc=vibhuvioio,dc=com
objectClass: organizationalUnit
ou: People

# testuser, People, vibhuvioio.com
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
cn: Test User
sn: User
uid: testuser
uidNumber: 10001
gidNumber: 10001
homeDirectory: /home/testuser
userPassword:: dGVzdDEyMw==
```



`Environment Reset`

```bash
docker compose down -v
docker network rm ldap-shared-network
docker volume rm $(docker volume ls -q)
```
---

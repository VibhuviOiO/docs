---
sidebar_position: 2
title: Three Node
description: Set up a 3-node OpenLDAP cluster using Docker with automatic replication enabled by the image.
slug: /ldap/three-node-openldap-cluster
keywords:
  - OpenLDAP
  - LDAP Cluster
  - Docker
  - LDAP Replication
  - Syncrepl
---

# Three-node OpenLDAP cluster

This guide explains how to run a **three-node OpenLDAP cluster** using Docker Compose.

The cluster consists of:
- 3 OpenLDAP nodes
- Shared base DN
- Automatic replication handled by the Docker image
- Persistent data per node

No manual `syncrepl` configuration is required **because the image configures it internally**.


### Docker Compose Configuration
`create a file docker-compose.yml`

```yaml
services:
  openldap-node1:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-oiocloud-node1
    hostname: openldap-oiocloud-node1
    env_file:
      - .env.node1
    ports:
      - "392:389"
      - "639:636"
    volumes:
      - ldap-data-node1:/var/lib/ldap
      - ldap-config-node1:/etc/openldap/slapd.d
      - ./logs/node1:/logs
      - ./custom-schema:/custom-schema:ro
      - ./sample/oiocloud_data.ldif:/data/oiocloud_data.ldif:ro
      - ./init/init-data.sh:/docker-entrypoint-initdb.d/init-data.sh:ro
    restart: unless-stopped
    networks:
      - ldap-shared-network

  openldap-node2:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-oiocloud-node2
    hostname: openldap-oiocloud-node2
    env_file:
      - .env.node2
    ports:
      - "393:389"
      - "640:636"
    volumes:
      - ldap-data-node2:/var/lib/ldap
      - ldap-config-node2:/etc/openldap/slapd.d
      - ./logs/node2:/logs
      - ./custom-schema:/custom-schema:ro
    restart: unless-stopped
    networks:
      - ldap-shared-network
    depends_on:
      - openldap-node1

  openldap-node3:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-oiocloud-node3
    hostname: openldap-oiocloud-node3
    env_file:
      - .env.node3
    ports:
      - "394:389"
      - "641:636"
    volumes:
      - ldap-data-node3:/var/lib/ldap
      - ldap-config-node3:/etc/openldap/slapd.d
      - ./logs/node3:/logs
      - ./custom-schema:/custom-schema:ro
    restart: unless-stopped
    networks:
      - ldap-shared-network
    depends_on:
      - openldap-node1

volumes:
  ldap-data-node1:
  ldap-config-node1:
  ldap-data-node2:
  ldap-config-node2:
  ldap-data-node3:
  ldap-config-node3:

networks:
  ldap-shared-network:
    external: true
```
### Environment Configurations

`create a file .env.node1`

`Paste:`

```bash                                              
LDAP_DOMAIN=oiocloud.com
LDAP_ORGANIZATION=OIO Cloud Services
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme
INCLUDE_SCHEMAS=cosine,inetorgperson,nis
ENABLE_REPLICATION=true
SERVER_ID=1
ENABLE_MONITORING=true
REPLICATION_PEERS=openldap-oiocloud-node2 openldap-oiocloud-node3
REPLICATION_RIDS=101,102
```
`create a file .env.node2`

`Paste:`

```bash
LDAP_DOMAIN=oiocloud.com
LDAP_ORGANIZATION=OIO Cloud Services
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme
INCLUDE_SCHEMAS=cosine,inetorgperson,nis
ENABLE_REPLICATION=true
SERVER_ID=2
ENABLE_MONITORING=true
REPLICATION_PEERS=openldap-oiocloud-node1 openldap-oiocloud-node3
REPLICATION_RIDS=201,203

```

`create a file .env.node3`

`Paste:`
```bash
LDAP_DOMAIN=oiocloud.com
LDAP_ORGANIZATION=OIO Cloud Services
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme
INCLUDE_SCHEMAS=cosine,inetorgperson,nis
ENABLE_REPLICATION=true
SERVER_ID=3
ENABLE_MONITORING=true
REPLICATION_PEERS=openldap-oiocloud-node1 openldap-oiocloud-node2
REPLICATION_RIDS=301,302

```
Create the external Docker network **once**:

`Run`
```bash
docker network create ldap-shared-network
```
### Start the Cluster

```bash
docker compose up -d
```

Verify all containers are running:

```bash
docker ps
```

---

### Base LDAP Configuration

The image initializes the following automatically:

* Base DN: `dc=oiocloud,dc=com`
* Admin DN: `cn=Manager,dc=oiocloud,dc=com`
* Default OUs:

  * `ou=People`
  * `ou=Group`

---

### Add a Test User (Node 1)

```bash
ldapadd -x -H ldap://localhost:392 \
-D "cn=Manager,dc=oiocloud,dc=com" -w changeme <<EOF
dn: uid=testuser,ou=People,dc=oiocloud,dc=com
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

`Expected output:`

```
adding new entry "uid=testuser,ou=People,dc=oiocloud,dc=com"
```

---

### Verify on Node 1

```bash
ldapsearch -x -H ldap://localhost:392 \
-b "ou=People,dc=oiocloud,dc=com" \
-D "cn=Manager,dc=oiocloud,dc=com" -w changeme
```
`Expected Output:`
```bash
# People, oiocloud.com
dn: ou=People,dc=oiocloud,dc=com
objectClass: organizationalUnit
ou: People

# testuser, People, oiocloud.com
dn: uid=testuser,ou=People,dc=oiocloud,dc=com
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

---

### Verify Replication (Node 2)

```bash
ldapsearch -x -H ldap://localhost:393 \
-b "ou=People,dc=oiocloud,dc=com" \
-D "cn=Manager,dc=oiocloud,dc=com" -w changeme
```

---

### Verify Replication (Node 3)

```bash
ldapsearch -x -H ldap://localhost:394 \
-b "ou=People,dc=oiocloud,dc=com" \
-D "cn=Manager,dc=oiocloud,dc=com" -w changeme
```

`Environment Reset`


```bash
docker compose down -v
docker network rm ldap-shared-network
docker volume rm $(docker volume ls -q)

```

---

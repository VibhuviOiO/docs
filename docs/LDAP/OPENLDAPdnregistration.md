---
sidebar_position: 3
title: OpenLDAP  DN Registration
description: Step-by-step guide to running a single-node OpenLDAP server with Docker and registering OUs, users, groups, and custom schemas.
slug: /ldap/single-node-dn-registration
keywords:
  - OpenLDAP
  - LDAP Single Node
  - LDAP DN
  - inetOrgPerson
  - LDAP Groups
  - Custom LDAP Schema
---

# Single-Node OpenLDAP with DN Registration

This guide walks through setting up a **single-node OpenLDAP server using Docker Compose** and then **registering directory entries (DNs)** in a correct and maintainable way.

This guide covers:
- Base DN
- Organizational Units (OU)
- Users (`inetOrgPerson`)
- Groups
- Custom schemas
- Importing schemas

### Prerequisites

- Docker
- Docker Compose
- LDAP CLI tools (`ldapadd`, `ldapsearch`, `ldapmodify`)

---
### Single-Node Docker Compose Setup

`create docker-compose.yml`
`Paste:`
```yaml
services:
  openldap:
    image: ghcr.io/vibhuvioio/openldap-docker/openldap:main
    container_name: openldap-vibhuvi
    hostname: openldap-vibhuvi
    env_file:
      - .env.vibhuvi
    ports:
      - "390:389"
      - "637:636"
    volumes:
      - ldap-data:/var/lib/ldap
      - ldap-config:/etc/openldap/slapd.d
      - ./logs:/logs
      - ./custom-schema:/custom-schema:ro
      - ./sample/employee_data_global.ldif:/data/employee_data_global.ldif:ro
      - ./init/init-data.sh:/docker-entrypoint-initdb.d/init-data.sh:ro
    restart: unless-stopped
    networks:
      - ldap-shared-network

volumes:
  ldap-data:
  ldap-config:

```
#### Environment Configuration
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

---

#### Start the LDAP Server

`Run`
```bash
docker compose up -d
```

#### Verify:
`Run`
```bash
docker ps
```

---

#### Base LDAP Configuration

The image initializes automatically:

* **Base DN**

  ```
  dc=vibhuvi,dc=com
  ```
* **Admin DN**

  ```
  cn=Manager,dc=vibhuvi,dc=com
  ```

#### Verify base DN:
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 -b "dc=vibhuvi,dc=com" -D "cn=Manager,dc=vibhuvi,dc=com" -w changeme

```

#### Create Organizational Units (OU)

`create ou=Users`

```bash
ldapadd -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: ou=Users,dc=vibhuvi,dc=com
objectClass: organizationalUnit
ou: Users
EOF

```

#### Register Users (`inetOrgPerson`)

`Add a User`

```bash
ldapadd -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: uid=jdoe,ou=Users,dc=vibhuvi,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
cn: John Doe
sn: Doe
uid: jdoe
mail: jdoe@vibhuvi.com
uidNumber: 20001
gidNumber: 20001
homeDirectory: /home/jdoe
userPassword: password123
EOF

```

#### Verify:
`Run:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "ou=Users,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme "(uid=jdoe)"

```


#### Create ou=Group
`Run`
```bash
ldapadd -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: ou=Teams,dc=vibhuvi,dc=com
objectClass: organizationalUnit
ou: Teams
EOF
```

#### Verify:
`Run`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(objectClass=organizationalUnit)"

```

#### Register Groups

`Add a POSIX Group`

```bash
ldapadd -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: cn=developers,ou=Teams,dc=vibhuvi,dc=com
objectClass: posixGroup
cn: developers
gidNumber: 10001
memberUid: testuser
EOF

```

#### Verify:

```bash
ldapsearch -x -H ldap://localhost:390 \
-b "ou=Teams,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
"(cn=developers)"

```
#### Modify the group
`Add jdoe to developers team`
```bash
ldapmodify -x -H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme <<EOF
dn: cn=developers,ou=Teams,dc=vibhuvi,dc=com
changetype: modify
add: memberUid
memberUid: jdoe
EOF
```
`Verify group membership:`
```bash
ldapsearch -x -H ldap://localhost:390 \
-b "cn=developers,ou=Teams,dc=vibhuvi,dc=com" \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme

```

` Expected output includes:`
```bash
# developers, Teams, vibhuvi.com
dn: cn=developers,ou=Teams,dc=vibhuvi,dc=com
objectClass: posixGroup
cn: developers
gidNumber: 10001
memberUid: testuser
```

✔ This is the correct and standard way to add users to POSIX groups.

---

#### Custom Schema Design

Custom schemas are used to add business-specific attributes.

`Create a directory:`
```bash
mkdir -p custom-schema
```

`Create the schema file:`
```bash
touch custom-schema/MySchema.ldif
sudo nano custom-schema/MySchema.ldif
```

`Paste:`
```bash
dn: cn=MySchema,cn=schema,cn=config
objectClass: olcSchemaConfig
cn: MySchema

olcAttributeTypes: ( 1.3.6.1.4.1.99999.1.1
  NAME 'employeeNumber'
  DESC 'Employee Number'
  EQUALITY caseIgnoreMatch
  SYNTAX 1.3.6.1.4.1.1466.115.121.1.15
  SINGLE-VALUE )

olcObjectClasses: ( 1.3.6.1.4.1.99999.2.1
  NAME 'Employee'
  DESC 'Custom Employee ObjectClass'
  SUP inetOrgPerson
  STRUCTURAL
  MAY ( employeeNumber ) )
```
#### Load the Schema
```bash
docker exec openldap-single ldapadd -Y EXTERNAL -H ldapi:/// \
-f /custom-schema/MySchema.ldif
```
`Expected output:`

adding new entry "cn=MySchema,cn=schema,cn=config"

`Verify`
```bash
docker exec openldap-vibhuvi ldapsearch -Y EXTERNAL -H ldapi:/// -b "cn=schema,cn=config" 
```
---

---
sidebar_position: 7
title: OpenLDAP Activity Logging 
description: Step-by-step practical guide to run a single-node OpenLDAP cluster with Docker, perform CRUD operations from the terminal, and inspect activity logs from the filesystem.
slug: /ldap/openldap-crud-and-logs
keywords:
  - OpenLDAP
  - LDAP CRUD
  - LDAP Logs
  - slapd.log
  - Docker OpenLDAP
---
# OpenLDAP CRUD Operations and Activity Logging 
Step-by-step practical guide to run a single-node OpenLDAP cluster with Docker, perform CRUD operations from the terminal, and inspect activity logs from the filesystem.

#### Docker Compose – Single Node OpenLDAP
`create a file docker-compose.yml`
`Paste:`

```bash
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

#### Start OpenLDAP
```bash
docker compose up -d
```
#### Verify container:
```bash
docker ps
```
`Expected:`

- openldap-single   Up

#### Verify LDAP Is Reachable
`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x \
-H ldap://localhost:389 \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-b "dc=vibhuvioio,dc=com" dn
```
#### CREATE – Add a User (ldapadd)
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
cn: Test User
sn: User
uid: testuser
uidNumber: 9001
gidNumber: 1000
homeDirectory: /home/testuser
userPassword: test123
EOF
```
`Expected output:`

- adding new entry "uid=testuser,ou=People,dc=vibhuvioio,dc=com"
#### READ – Search User (ldapsearch)
`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x \
-H ldap://localhost:389 \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-b "ou=People,dc=vibhuvioio,dc=com" "(uid=testuser)"

```
#### UPDATE – Modify (ldapmodify)

`Create modify.ldif`

`Paste:`
```bash
dn: uid=cli-test,ou=People,dc=vibhuvioio,dc=com
changetype: modify
replace: mail
mail: cli-test@vibhuvioio.com
```
#### Apply the Modification
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < modify.ldif
```
`Expected output:`

- modifying entry "uid=cli-test,ou=People,dc=vibhuvioio,dc=com"
#### DELETE – Remove an LDAP User (ldapdelete)
`Run:`
```bash
docker exec openldap-vibhuvioio ldapdelete -x \
-D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
"uid=cli-test,ou=People,dc=vibhuvioio,dc=com"
```
`Expected output:`

- deleting entry "uid=cli-test,ou=People,dc=vibhuvioio,dc=com"


#### Where LDAP Activity Logs Are Stored
LDAP server activity logs are mounted to the host filesystem.
```bash
./logs/
```
`Typical Log Files`

- slapd.log – Active log file

- slapd.log-2026-01-16.gz – Archived, rotated logs

#### View Live LDAP Logs
`Use this command to stream LDAP activity in real time:`

`Run:`
```bash
tail -f ./logs/slapd.log
```
#### You will see entries for:

- Bind operations

- Search requests

- Add operations

- Modify operations

- Delete operations

#### Search Logs for User Activity

`Find Activity for a Specific User`

`Run:`
```bash
grep "uid=cli-test" ./logs/slapd.log
```
`This helps trace:`

- When the user was accessed

- What operation was performed

#### Find Failed Login Attempts

`LDAP authentication failures return error code 49.`
```bash
grep "err=49" ./logs/slapd.log
```
`Expected:`
- (no output)
`Explanation:`

- No failed authentication attempts have occurred.


#### View Archived LDAP Logs

`Run:`
```bash
zcat ./logs/slapd.log-2026-01-16.gz | less
```
`Expected output:`
- (no output / file not found)

`Explanation:`

- Log rotation has not been configured.

#### Exit 
- Enter`:wq`


#### Use this for:

- Historical audits

- Incident investigation

- Long-term debugging

#### Stop the LDAP Cluster Cleanly
`Run:`
```bash
docker compose down -v
```


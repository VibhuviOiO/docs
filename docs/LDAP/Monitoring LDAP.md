---
sidebar_position: 5
title: Monitoring OpenLDAP
description: Step-by-step guide to enable and use OpenLDAP monitoring (cn=Monitor) for visibility into health, operations, and performance.
slug: /ldap/monitoring
keywords:
  - OpenLDAP
  - LDAP Monitoring
  - cn=Monitor
  - LDAP Operations
  - LDAP Metrics
---

# OpenLDAP Monitoring : Connections, Operations, and Health
Understand what OpenLDAP is doing in real time by inspecting connections and operations via cn=Monitor.

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
`create a file .env.vibhuvi`
`Paste:`
```bash
# OpenLDAP Configuration
LDAP_DOMAIN=vibhuvi.com
LDAP_ORGANIZATION=Vibhuvi Corporation
LDAP_ADMIN_PASSWORD=changeme
LDAP_CONFIG_PASSWORD=changeme

# Schema Configuration
INCLUDE_SCHEMAS=cosine,inetorgperson,nis

# Replication (single node: false, multi-master: true)
ENABLE_REPLICATION=false
SERVER_ID=1

# Monitoring
ENABLE_MONITORING=true

```
Create the external Docker network **once**:

`Run`
```bash
docker network create ldap-shared-network
```

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
#### Verify Monitor Backend Is Enabled

`Run:`
```bash
docker exec openldap-vibhuvi ldapsearch -x \
-D "cn=Manager,dc=vibhuvi,dc=com" -w changeme \
-b "cn=Monitor" dn
```
Expected Output
```bash
dn: cn=Monitor
dn: cn=Operations,cn=Monitor
dn: cn=Connections,cn=Monitor
dn: cn=Statistics,cn=Monitor
dn: cn=Backends,cn=Monitor
dn: cn=Databases,cn=Monitor
```

#### Enable Monitoring (If Missing)
`Check if it exists:`
`Run:`
```bash
docker exec openldap-vibhuvi ldapsearch -Y EXTERNAL \
-H ldapi:/// \
-b "cn=config" \
"(olcDatabase=monitor)"
```

* If nothing is returned, monitoring is not enabled.

#### Enable Monitor Backend

`Create a file enable-monitor.ldif:`
`Paste:`
```bash
dn: olcDatabase=monitor,cn=config
objectClass: olcDatabaseConfig
objectClass: olcMonitorConfig
olcDatabase: monitor
olcAccess: to * by dn.exact="cn=Manager,dc=vibhuvioio,dc=com" read

```

#### Apply it:
`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd -Y EXTERNAL \
-H ldapi:/// < enable-monitor.ldif

```

#### Re-check:
`Run:`

```bash
ldapsearch -x \
-H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" \
-w changeme \
-b "cn=Monitor"
```

#### Monitor Connections
`Run:`
```bash
ldapsearch -x \
-H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" \
-w changeme \
-b "cn=Connections,cn=Monitor"

```

#### Monitor Operations
`Run:`
```bash
ldapsearch -x \
-H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" \
-w changeme \
-b "cn=Operations,cn=Monitor"

```

`This shows:`

* Bind ops

* Search ops

* Modify ops

* Add/Delete ops


#### Monitor Global Statistics
```bash
ldapsearch -x \
-H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" \
-w changeme \
-b "cn=Statistics,cn=Monitor"

```

`Useful fields:`

* monitorBytesReceived

* monitorBytesSent

* monitorPDUReceived

* monitorPDUSent

#### Monitor Backend Health
`Run:`
```bash
ldapsearch -x \
-H ldap://localhost:390 \
-D "cn=Manager,dc=vibhuvi,dc=com" \
-w changeme \
-b "cn=Databases,cn=Monitor"

```
`This shows:`

* Which databases are active

* Entry counts


#### Restrict Monitor Access (Important)

Never expose cn=Monitor to applications.

`Best practice:`

* Read-only access

* Admin-only

* No anonymous binds

`Example ACL:`
```bash
olcAccess: to dn.subtree="cn=Monitor"
  by dn.exact="cn=Manager,dc=vibhuvioio,dc=com" read
  by * none

```
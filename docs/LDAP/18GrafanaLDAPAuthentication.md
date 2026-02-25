---
sidebar_position: 18
title: LDAP + Grafana Monitoring Authentication
description: Integrate Grafana with OpenLDAP using Docker. LDAP authentication and group-based authorization for controlled monitoring visibility.
slug: /ldap/grafana-auth
---

# Grafana LDAP Authentication with OpenLDAP (Docker)
Integrate Grafana with OpenLDAP using Docker. LDAP authentication and group-based authorization for controlled monitoring visibility.

#### Create Project Folder

```bash
mkdir ldap-grafana
cd ldap-grafana
```

---

#### Create Docker Compose

`Create file nano docker-compose.yml`

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
      - ldap-net

  ldap-manager:
    image: ghcr.io/vibhuvioio/ldap-manager:latest
    container_name: ldap-manager
    depends_on:
      - openldap
    ports:
      - "8000:8000"
    networks:
      - ldap-net

  grafana:
    image: grafana/grafana:10.4.2
    container_name: grafana
    depends_on:
      - openldap
    ports:
      - "3000:3000"
    volumes:
      - ./ldap.toml:/etc/grafana/ldap.toml
    environment:
      - GF_AUTH_LDAP_ENABLED=true
      - GF_AUTH_LDAP_CONFIG_FILE=/etc/grafana/ldap.toml
      - GF_AUTH_LDAP_ALLOW_SIGN_UP=true
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-net:
    driver: bridge
```

---

#### Create LDAP Environment File

`Create file .env.vibhuvioio`

`Paste:`

```bash
LDAP_ORGANISATION=vibhuvioio
LDAP_DOMAIN=vibhuvioio.com
LDAP_ADMIN_PASSWORD=changeme
```

---

#### Create Grafana LDAP Config

⚠️ MUST be a FILE (not directory)

`Create file ldap.toml`

`Paste:`

```bash
[[servers]]
host = "openldap-vibhuvioio"
port = 389
use_ssl = false
start_tls = false

bind_dn = "cn=Manager,dc=vibhuvioio,dc=com"
bind_password = "changeme"

search_filter = "(cn=%s)"
search_base_dns = ["ou=People,dc=vibhuvioio,dc=com"]

group_search_base_dns = ["ou=Group,dc=vibhuvioio,dc=com"]
group_search_filter = "(&(objectClass=groupOfNames)(member=%s))"
group_search_filter_user_attribute = "dn"

[servers.attributes]
name = "cn"
username = "cn"

[[servers.group_mappings]]
group_dn = "cn=monitor-admins,ou=Group,dc=vibhuvioio,dc=com"
org_role = "Admin"

[[servers.group_mappings]]
group_dn = "cn=monitor-viewers,ou=Group,dc=vibhuvioio,dc=com"
org_role = "Viewer"

```

---

#### Start Services

`Run:`
```bash
docker compose up -d
```

#### Verify:

```bash
docker ps
```

---

#### Verify LDAP Base Structure

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL -b dc=vibhuvioio,dc=com
```

`Expected:`

```bash
ou=People
ou=Group
```

---

#### Create LDAP Groups

`Create file groups.ldif`

`Paste:`

```bash
dn: cn=monitor-admins,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: monitor-admins
member: cn=Manager,dc=vibhuvioio,dc=com

dn: cn=monitor-viewers,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: monitor-viewers
member: cn=Manager,dc=vibhuvioio,dc=com
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

#### Create LDAP User

`Create file user.ldif`

`Paste:`

```ldif
dn: cn=monitoruser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: monitoruser
userPassword: password
description: Monitoring User
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < user.ldif
```

---

#### Add User to Viewer Group

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: cn=monitor-viewers,ou=Group,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: cn=monitoruser,ou=People,dc=vibhuvioio,dc=com
EOF
```

#### Verify:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL \
-b "cn=monitor-viewers,ou=Group,dc=vibhuvioio,dc=com"
```


#### Verify LDAP Authentication

`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "cn=monitoruser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

`Expected:`

```
dn:cn=monitoruser,ou=People,dc=vibhuvioio,dc=com
```

---

#### Login to Grafana

`Open:`

- http://localhost:3000


`Login:`

```
username: monitoruser
password: password
```

---

#### Verify Authorization

• monitor-viewers → dashboard view only
• monitor-admins → full control

-




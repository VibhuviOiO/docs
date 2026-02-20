---
sidebar_position: 13
title: LDAP + HashiCorp Vault Authentication
description: Deterministic guide to integrate HashiCorp Vault with OpenLDAP using Docker. LDAP authentication, group-based authorization, and secure secret access.
slug: /ldap/vault-auth
keywords:

Vault LDAP

OpenLDAP Authentication

LDAP Docker

Vault Policy Mapping

LDAP Group Authorization

Secrets Access Control

Vault Identity Integration
---

# HashiCorp Vault LDAP Authentication with OpenLDAP (Docker)

This guide demonstrates how to configure **HashiCorp Vault** to authenticate users against **OpenLDAP** using the LDAP auth method.



#### Docker Compose

`Create docker-compose.yml`

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

  vault:
    image: hashicorp/vault:1.15
    container_name: vault
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: root
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    command: vault server -dev
    restart: unless-stopped
    networks:
      - ldap-net

volumes:
  ldap-data:
  ldap-config:

networks:
  ldap-net:
    driver: bridge
```



#### Environment File

`Create .env.vibhuvioio`

`Paste:`
```bash
LDAP_ORGANISATION=vibhuvioio
LDAP_DOMAIN=vibhuvioio.com
LDAP_ADMIN_PASSWORD=changeme
```

---

#### Start Services

`Run:`
```bash
docker compose up -d
```

#### Verify:

`Run:`
```bash
docker ps
```

---

#### Verify LDAP Base Tree

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch -x -LLL -b dc=vibhuvioio,dc=com
```

- Expected:

```
ou=People
ou=Group
```

---

#### Create LDAP Groups

`Create groups.ldif`

`Paste:`
```bash
dn: cn=vault-users,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: vault-users
member: cn=Manager,dc=vibhuvioio,dc=com

dn: cn=vault-admins,ou=Group,dc=vibhuvioio,dc=com
objectClass: groupOfNames
cn: vault-admins
member: cn=Manager,dc=vibhuvioio,dc=com
```

#### Import:

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < groups.ldif
```

---

#### Create LDAP User (Schema-Safe)


`Create testuser.ldif`

`Paste:`
```bash
dn: cn=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: simpleSecurityObject
objectClass: organizationalRole
cn: testuser
userPassword: password
description: Vault Test User
```

#### Import:

```bash
docker exec -i openldap-vibhuvioio ldapadd \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
-f /dev/stdin < testuser.ldif
```

---

#### Verify LDAP Authentication

`Search user:`

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b "ou=People,dc=vibhuvioio,dc=com"
```

#### Verify password bind:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapwhoami \
-x \
-D "cn=testuser,ou=People,dc=vibhuvioio,dc=com" \
-w password
```

- Expected:

```
dn:cn=testuser,ou=People,dc=vibhuvioio,dc=com
```

---

#### Add User to Group

`Run:`
```bash
docker exec -i openldap-vibhuvioio ldapmodify \
-x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme <<EOF
dn: cn=vault-users,ou=Group,dc=vibhuvioio,dc=com
changetype: modify
add: member
member: cn=testuser,ou=People,dc=vibhuvioio,dc=com
EOF
```

#### Verify:

`Run:`
```bash
docker exec openldap-vibhuvioio ldapsearch \
-x -LLL -b "cn=vault-users,ou=Group,dc=vibhuvioio,dc=com"
```

---

#### Configure Vault LDAP Authentication

`Enter Vault container:`

`Run:`
```bash
docker exec -it vault sh
```

#### Set environment:

`Run:`
```sh
export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN=root
```

#### Enable LDAP auth:

`Run:`
```sh
vault auth enable ldap
```

#### Configure LDAP connection:

`Run:`
```sh
vault write auth/ldap/config \
 url="ldap://openldap-vibhuvioio:389" \
 binddn="cn=Manager,dc=vibhuvioio,dc=com" \
 bindpass="changeme" \
 userdn="ou=People,dc=vibhuvioio,dc=com" \
 groupdn="ou=Group,dc=vibhuvioio,dc=com" \
 userattr="cn" \
 groupattr="cn" \
 groupfilter="(&(objectClass=groupOfNames)(member={{.UserDN}}))"
```

---

#### Create Vault Policy

`Run:`
```sh
vault policy write vault-user - <<EOF
path "secret/data/*" {
  capabilities = ["read"]
}
EOF
```

- Map LDAP group → policy:

`Run:`
```sh
vault write auth/ldap/groups/vault-users \
 policies=vault-user
```

---

#### Store a Test Secret

`Run:`
```sh
vault kv put secret/demo message="LDAP auth working"
```

Exit container:

`Run:`

```sh
exit
```

---

#### Login via Vault UI

`Open:`

```
http://localhost:8200
```

1. Select **LDAP** auth method
2. Username: `testuser`
3. Password: `password`
4. Navigate to:

```
Secrets → secret → demo
```

You should see the stored secret.

---

This configuration demonstrates a correct, policy-driven LDAP authentication flow suitable for enterprise environments.

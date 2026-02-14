---
sidebar_position: 10
title: LDAP + Keycloak (Authentication Only)
description: Deterministic integration of OpenLDAP with Keycloak for external authentication without user import or synchronization.
slug: /ldap/keycloak-auth-only
keywords:
  - LDAP
  - Keycloak
  - External Authentication
  - Bind Authentication
  - No User Import
  - Docker Compose
---

# LDAP + Keycloak (Authentication Only)

This pattern ensures:
z# Step 1 — Start OpenLDAP

Use your existing OpenLDAP setup.

Start:

```bash
docker compose up -d
````

Wait 60 seconds.

Verify LDAP is working:

```bash
docker exec openldap-vibhuvioio ldapsearch \
  -x -H ldap://localhost:389 \
  -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -b "dc=vibhuvioio,dc=com"
```

If this fails, stop here.
Keycloak integration will fail.

---

# Step 2 — Create Test User (CLI Only)

Do NOT use UI.

Create `testuser.ldif`:

```ldif
dn: uid=testuser,ou=People,dc=vibhuvioio,dc=com
objectClass: inetOrgPerson
objectClass: posixAccount
cn: Test User
sn: User
uid: testuser
uidNumber: 10000
gidNumber: 10000
homeDirectory: /home/testuser
mail: testuser@vibhuvioio.com
userPassword: password
```

Add user:

```bash
docker exec -i openldap-vibhuvioio ldapadd \
  -x -D "cn=Manager,dc=vibhuvioio,dc=com" -w changeme \
  -f /dev/stdin < testuser.ldif
```

Verify:

```bash
docker exec openldap-vibhuvioio ldapsearch \
  -x -b "ou=People,dc=vibhuvioio,dc=com"
```

LDAP must be authoritative.

---

# Step 3 — Add Keycloak to Docker Compose

Update `docker-compose.yml`:

```yaml
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
```

Restart:

```bash
docker compose up -d
```

Access:

[http://localhost:8080](http://localhost:8080)

Login with:

admin / admin

---

# Step 4 — Configure LDAP Federation in Keycloak

In Admin Console:

1. Create new Realm (example: `ldap-realm`)
2. Go to User Federation
3. Add provider → LDAP

Configure:

Connection URL:

```
ldap://openldap-vibhuvioio:389
```

Bind DN:

```
cn=Manager,dc=vibhuvioio,dc=com
```

Bind Credential:

```
changeme
```

Users DN:

```
ou=People,dc=vibhuvioio,dc=com
```

Edit Mode:

```
READ_ONLY
```

Import Users:

```
OFF
```

Sync Registrations:

```
OFF
```

Authentication Mode:

```
LDAP_ONLY
```

Save.

If you enable import → you broke the design.

---

# Step 5 — Test Authentication

Go to:

Realm → Login page

Login with:

Username:

```
testuser
```

Password:

```
password
```

If successful:

* LDAP performed bind
* Keycloak issued token
* User NOT stored in Keycloak DB

Check Users list.

You should NOT see permanent imported users.

---

# Operational Reality

## What Happens Internally

1. Keycloak searches:

   ```
   (uid=testuser)
   ```

2. Gets DN:

   ```
   uid=testuser,ou=People,dc=vibhuvioio,dc=com
   ```

3. Attempts bind with provided password.

4. If bind succeeds → login succeeds.

No password stored in Keycloak.

---

# Production Considerations

This is incomplete if you ignore:

* LDAPS (636)
* TLS certificates
* LDAP connection pooling
* Health checks
* Network segmentation

Running on plain 389 in production is wrong.

Switch to:

```
ldaps://openldap-vibhuvioio:636
```

And configure truststore in Keycloak.

---

# Failure Modes

If login fails:

Check:

* Wrong Users DN
* Wrong attribute (uid vs cn)
* Wrong bind DN permissions
* LDAP not reachable from Keycloak container
* Firewall inside Docker network

Do NOT debug from UI.
Debug using container logs.

---

# Final State

You now have:

LDAP → Identity Source
Keycloak → Authentication Gateway
No user duplication
No sync
No hacks

Correct, minimal, production-aligned setup.

```

---

This is the correct model.

If your goal is “LDAP guidance with credibility”, this is the type of integration document you must publish:

- Strict  
- No UI-driven hacks  
- No user import  
- No vague steps  

If you want next: I can give you the **LDAPS + certificate truststore hardened version**, which is what real companies actually need.
```

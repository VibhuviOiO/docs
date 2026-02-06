---
sidebar_position: 6
title: "🐳 Enable XPack in Elasticsearch Container"
description: "Secure Elasticsearch with X-Pack and SSL — production-ready single-node setup"
slug: "/ElasticStack/EnableXPackInElasticsearchContainer"
---

# 🐳 Enable XPack in Elasticsearch Container

Lock it down. 🔒  
Let's enable **X-Pack** and set up **SSL** on a containerized Elasticsearch node, properly.

---

## 🛠️ Generate X-Pack Compatible Certificates

You’ve got 3 easy ways to generate SSL certs. All require **Docker** to be running:

- **Bash Script**:  
  👉 [Generate certs with Bash (interactive prompts)](https://vibhuvioio.com/docs/docs/ElasticStack/EnableXPackSecurityCertsGenerator)

- **Docker Run**:  
  👉 [Generate certs using `docker run`](./miscellaneous/CertsWithDockerRun.md)

- **Docker Compose**:  
  👉 [Generate certs using `docker compose`](./miscellaneous/CertsWithDockerCompose.md)

Pick **any** method you vibe with.  
Once generated, **copy the certs** to your target environment or server.

---

## ⚙️ How to Use the Certs in Your Elasticsearch Container

Add these properties to your Elasticsearch config:

```bash
xpack.security.enabled=true
xpack.security.http.ssl.enabled=true

xpack.security.http.ssl.key=certs/es01/es01.key
xpack.security.http.ssl.certificate=certs/es01/es01.crt
xpack.security.http.ssl.certificate_authorities=certs/ca/ca.crt

xpack.security.transport.ssl.enabled=true
xpack.security.transport.ssl.key=certs/es01/es01.key
xpack.security.transport.ssl.certificate=certs/es01/es01.crt
xpack.security.transport.ssl.certificate_authorities=certs/ca/ca.crt
xpack.security.transport.ssl.verification_mode=certificate
```
---
## 🐳 Example: Docker Compose with SSL-Enabled Elasticsearch
```yml
services:
  es01:
    image: docker.elastic.co/elasticsearch/elasticsearch:9.0.0
    container_name: es01
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=true
      - xpack.security.http.ssl.key=certs/es01/es01.key
      - xpack.security.http.ssl.certificate=certs/es01/es01.crt
      - xpack.security.http.ssl.certificate_authorities=certs/ca/ca.crt
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.key=certs/es01/es01.key
      - xpack.security.transport.ssl.certificate=certs/es01/es01.crt
      - xpack.security.transport.ssl.certificate_authorities=certs/ca/ca.crt
      - xpack.security.transport.ssl.verification_mode=certificate
    volumes:
      - ./certs:/usr/share/elasticsearch/config/certs
    ports:
      - "9200:9200"
      - "9300:9300"
```

✅ The volumes line ensures Elasticsearch can find your certs inside /usr/share/elasticsearch/config/certs.
---
## 📦 Download Ready-to-Use Docker Compose
You can grab a ready-to-go compose file here 👇:

```bash
wget -O docker-compose.yml https://raw.githubusercontent.com/jinnabaalu/ELKOperations/refs/heads/main/elasticsearch/single-node/xpack-docker-compose.yml
```
Create a `.env` file with the following
```bash
STACK_VERSION=9.0.0
CLUSTER_NAME=es-cluster
ELASTIC_PASSWORD=changeme
ES_PORT=9200
MEM_LIMIT=2g
```

> ⚡ Note: Make sure to place your generated certs in the same folder where you run this compose file, so that volume mount works.
---
## 🚨 Common Errors and Pitfalls
**Mismatch in CN/SAN** → SSL errors. Ensure the certs are issued for the correct hostname (like es01).

**Wrong file paths** → SSL handshake failures (PKIX path building failed).

**Missing verification mode** → Transport layer fails. Always set:
`xpack.security.transport.ssl.verification_mode=certificate`

**Volume path mistakes** → Elasticsearch won't find certs and crash early.
---
## 🎯 Pro Tip:
Want to test your SSL-secured Elasticsearch is up?

After starting your container:

```bash
curl -k --cert ./certs/es01/es01.crt -u elastic:${ELASTIC_PASSWORD} --key ./certs/es01/es01.key https://localhost:9200
```

> `-k` = ignore self-signed cert warning if needed.

If you get a JSON response, congrats, your SSL setup is 🔥.


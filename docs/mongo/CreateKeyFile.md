---
sidebar_position: 1
title: "🔐 Security Create Keyfile for MongoDB Security"
description: "Quick and clear guide to generate a secure MongoDB keyfile for containerized environments on Mac and Linux. Lock it down right."
slug: /CreateMongoSecurityKey
image: https://jinnabalu.com/oio/img/mongo/CreateKeyfileForMongoSecurity.png
keywords: [mongodb, security, keyfile, container, docker, linux, mac, mongo auth, mongo security, enable auth]
---

# 🔐 Enabling MongoDB Auth with a Keyfile

## Why Keyfile
Used to enable internal authentication between MongoDB instances — especially in secure, multi-node setups.

---

![Create security key for Mongo](../../static/img/mongo/CreateKeyfileForMongoSecurity.png)

## 🍏 MacOS (Container Setup)

```bash
# Create the keyfile
openssl rand -base64 741 >> mongoKeyFileMac

# Lock it down
chmod 600 mongoKeyFileMac
```

---

## 🐧 Linux (Container Setup)

```bash
# Generate the keyfile
openssl rand -base64 756 > mongoKeyFileLinux

# Secure the file permissions
chmod 600 mongoKeyFileLinux

# Set the file ownership to match MongoDB container user
sudo chown 999 mongoKeyFileLinux
sudo chgrp 999 mongoKeyFileLinux
```

---

## ✅ How to Use the Keyfile in Your MongoDB Container

After generating the keyfile, mount it into your container and point MongoDB to it using the --keyFile flag.
```yml
services:
  mongodb:
    image: mongo:6
    volumes:
      # 👇 Mount your generated keyfile here
      # Use this line *only* if you're on a Linux host
      - ../keyfile-linux/mongoKeyFileLinux:/opt/keyfile/mongoKeyFileLinux

      # Use this line *only* if you're on a Mac host (Docker Desktop)
      # - ../keyfile-mac/mongoKeyFileMac:/opt/keyfile/mongoKeyFileMac

    command: ["mongod", "--replSet", "mongo-rs", "--bind_ip", "localhost,mongodb", "--keyFile", "/opt/keyfile/mongoKeyFileLinux"]

```
---
## 🛡️ Pro Tips
Use the same filename inside the container as the one you reference in --keyFile.

Make sure the file has chmod 600 and is owned by UID 999 (chown 999), especially on Linux.

MongoDB will refuse to start if the keyfile permissions are too loose.

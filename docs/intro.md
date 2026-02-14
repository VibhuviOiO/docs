---
sidebar_position: 1
title: Documentation
description: VibhuviOiO documentation - production-ready guides for self-hosted infrastructure
---

# VibhuviOiO Documentation

Production-ready guides for building and operating self-hosted infrastructure. From containerization to Kubernetes, databases to observability—validated configurations you can deploy with confidence.

## What You'll Find Here

This documentation covers the complete lifecycle of infrastructure deployment:

- **Foundation** - Terraform, Ansible, and core infrastructure setup
- **Data Stores** - Databases, caches, and search engines
- **Orchestration** - Kubernetes clusters and container platforms
- **Security** - Identity, secrets management, and compliance
- **Observability** - Monitoring, logging, and alerting
- **Delivery** - CI/CD pipelines and deployment automation

## Browse by Category

### [Infrastructure](./Infrastructure/terraform.md)
Terraform modules, Ansible playbooks, and foundational infrastructure for self-hosted environments.

### [Databases](./Databases/NoSQL/mongodb.md)
Deployment guides for PostgreSQL, MongoDB, Redis, Elasticsearch, time-series databases, and more.

### [Kubernetes](./k8s-cluster/Pre-requisites.md)
Complete cluster setup including networking, storage, security, and production operations.

### [Security](./Security/vault.md)
Secrets management with Vault, LDAP integration, container scanning, and security hardening.

### [Observability](./Observability/prometheus.md)
Monitoring stack with Prometheus, Grafana, ELK, and distributed tracing.

### [CI/CD](./CI-CD/CI/github-actions.md)
Pipeline automation, container registries, and deployment strategies.

## Product Documentation

Guides for VibhuviOiO open source products:

- [Docker Registry UI](../products/docker-registry-ui) - Container registry management interface
- [LDAP Manager](./LDAP/intro.md) - Web-based directory management
- [OpenLDAP Docker](../products/openldap-docker) - Production LDAP container

## Getting Started

New to self-hosted infrastructure? Start here:

1. **[Infrastructure Prerequisites](./Infrastructure/terraform.md)** - Base setup with Terraform
2. **[Docker Fundamentals](./Databases/NoSQL/mongodb.md)** - Containerization basics
3. **[First Kubernetes Cluster](./k8s-cluster/Pre-requisites.md)** - K8s deployment guide

Each guide includes:
- Prerequisites and requirements
- Step-by-step instructions
- Configuration examples
- Production considerations
- Troubleshooting notes

## Contributing

Found an issue or have a suggestion? These docs are continuously updated based on real-world deployments. Contributions welcome at [github.com/VibhuviOiO/docs](https://github.com/VibhuviOiO/docs).

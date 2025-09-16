---
sidebar_position: 1
title: Kubernetes Cluster Setup
description: Learn how to set up a production-ready Kubernetes cluster with kubeadm, including prerequisites, control plane initialization, and worker node joining.
slug: /Infrastructure/KubernetesCluster
keywords:
  - Kubernetes cluster
  - kubeadm
  - CRI-O runtime
  - Calico networking
  - cluster setup
  - container orchestration
---

# ☸️ Kubernetes Cluster Setup with kubeadm

Learn how to set up a **production-ready Kubernetes cluster** using **kubeadm** with **CRI-O runtime** and **Calico networking**.

---

## 🔧 Prerequisites (All Nodes)

`Enable iptables bridged traffic:`
```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
overlay
EOF

sudo modprobe br_netfilter
sudo modprobe overlay

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

sudo sysctl --system
```

`Disable swap:`
```bash
sudo swapoff -a
(crontab -l 2>/dev/null; echo "@reboot /sbin/swapoff -a") | crontab - || true
```

## 🐳 Install CRI-O Runtime

`Install CRI-O container runtime:`
```bash
sudo apt-get update -y
sudo apt-get install -y software-properties-common curl apt-transport-https ca-certificates

curl -fsSL https://pkgs.k8s.io/addons:/cri-o:/prerelease:/main/deb/Release.key | \
    gpg --dearmor -o /etc/apt/keyrings/cri-o-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/cri-o-apt-keyring.gpg] https://pkgs.k8s.io/addons:/cri-o:/prerelease:/main/deb/ /" | \
    tee /etc/apt/sources.list.d/cri-o.list

sudo apt-get update -y
sudo apt-get install -y cri-o

sudo systemctl daemon-reload
sudo systemctl enable crio --now
```

## ☸️ Install Kubernetes Components

`Install kubeadm, kubelet, kubectl:`
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | \
    sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /" | \
    sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt-get install -y kubelet=1.31.1-1.1 kubectl=1.31.1-1.1 kubeadm=1.31.1-1.1
sudo apt-mark hold kubelet kubeadm kubectl
```

`Configure kubelet:`
```bash
sudo apt-get install -y jq
local_ip="$(ip --json addr show eth0 | jq -r '.[0].addr_info[] | select(.family == "inet") | .local')"
cat > /etc/default/kubelet << EOF
KUBELET_EXTRA_ARGS=--node-ip=$local_ip
EOF
```

## 🎯 Initialize Control Plane

`Initialize cluster (Control Plane Node):`
```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16 --apiserver-advertise-address=$local_ip

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 🌐 Install Calico Network Plugin

`Deploy Calico CNI:`
```bash
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Verify pods
kubectl get pods -n kube-system
```

## 👥 Join Worker Nodes

`Get join command from control plane:`
```bash
kubeadm token create --print-join-command
```

`Run on worker nodes:`
```bash
sudo kubeadm join <CONTROL_PLANE_IP>:6443 --token <TOKEN> --discovery-token-ca-cert-hash sha256:<HASH>
```

## ▶️ Sample Output

```bash
$ kubectl get nodes
NAME                   STATUS   ROLES           AGE   VERSION
control-plane          Ready    control-plane   10m   v1.31.1
worker-node-1          Ready    <none>          5m    v1.31.1
worker-node-2          Ready    <none>          5m    v1.31.1

$ kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS   AGE
calico-kube-controllers-6879d4fcdc-s8v94   1/1     Running   0          8m
calico-node-4v2v8                          1/1     Running   0          8m
coredns-7c65d6cfc9-qf5x9                   1/1     Running   0          10m
etcd-control-plane                         1/1     Running   0          10m
kube-apiserver-control-plane               1/1     Running   0          10m
```

## 📊 Install Metrics Server

`Deploy metrics server:`
```bash
kubectl apply -f https://raw.githubusercontent.com/techiescamp/kubeadm-scripts/main/manifests/metrics-server.yaml

# Verify metrics
kubectl top nodes
kubectl top pods -n kube-system
```

**Reference:** [Kubernetes Documentation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/)
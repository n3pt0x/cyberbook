# 🧅 Tor Proxying

> Useful in red teaming for anonymization, pivoting, and bypassing network restrictions.
> Covers Tor, Proxychains, Torsocks, and SSH SOCKS proxies.

## Tor - proxychains - torsocks

```bash
tor # starting
curl --socks5 127.0.0.1:9050 ifconfig.me
```

### Proxychains

```ini
# /etc/proxychains4.conf
[ProxyList]
socks5 127.0.0.1 9050

[ProxyChains]
# dynamic_chain       # try proxies in order until success
# strict_chain        # strict order
# random_chain        # pick proxies randomly
```

```bash
proxychains -f /etc/proxychains.conf curl ifconfig.me
proxychains nmap -sT -Pn target.com
```

### Torsocks

```ini
# /etc/tor/torsocks.conf
server = 127.0.0.1
server_port = 9050
local = 127.0.0.1       # DNS leaks protection
allow_inbound = 0       # prevent local listening (0=disable)
# Optional isolation:
# isolate_dest_addr = 1
# isolate_dest_port = 1
# isolate_client_addr = 1
```

```bash
torsocks curl ifconfig.me
```

### Advanced Options

| Option        | Purpose                                     | Example                                               |
| ------------- | ------------------------------------------- | ----------------------------------------------------- |
| `-a <ip>`     | Bind to specific source IP                  | `torsocks -a 10.0.0.2 curl ifconfig.me`               |
| `-P <port>`   | Use a different SOCKS port                  | `torsocks -P 9051 curl ifconfig.me`                   |
| `-L <port>`   | Local bind (for programs listening locally) | `torsocks -L 8080 python3 -m http.server`             |
| `-i`          | Interactive mode                            | `torsocks -i bash`                                    |
| `-f <config>` | Use alternative config file                 | `torsocks -f /path/to/torsocks.conf curl ifconfig.me` |

## tun2socks

```bash
# Create TUN interface
sudo ip tuntap add dev tun0 mode tun
sudo ip addr add 10.0.0.2/24 dev tun0
sudo ip link set tun0 up

# Bind traffic via Tor SOCKS5
sudo go-tun2socks -device tun0 -proxy socks5://127.0.0.1:9050

# Set default route
sudo ip route add default dev tun0
```

## Others

### SSH - SOCKS server

```bash
ssh -D 9050 -q -C -N user@jumpserver
```

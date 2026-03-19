---
title: "SSH Tunneling"
---
# 🌐 SSH Tunneling

## 📚 Resource

- [Pivoting Techniques](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Network%20Pivoting%20Techniques.md)

## 📦 Basic Tunnels

### SSH Local Forward (client -> remote)

```bash
# Forwards local port 8080 to port 8080 on the remote host
ssh -L 8080:127.0.0.1:8080 user@remote_ip

# General syntax
ssh -L [bind_address:]local_port:remote_ip:remote_port user@remote_ip
```

### SSH Remote Forward (remote -> client)

```bash
# Forwards port 8080 on the remote host to our local port 8080
ssh -R 8080:127.0.0.1:8080 user@remote_ip

# General syntax
ssh -R [bind_address:]remote_port:local_ip:local_port user@remote_ip
```

### Dynamic forward (SOCKS proxy)

```bash
# Create a SOCKS proxy on a local port (e.g. 1080)
ssh -D 1080 user@remote_ip
```

```bash
[Local Machine]
    |
    |-- HTTP request --> localhost:1080 (SOCKS proxy)
                                |
                                v
                        [SSH Tunnel Established]
                                |
                                v
                        [Remote Host (user@remote_ip)]
                                |
                                |---> Request sent to Website
                                        |
                                        v
                                <--- Response from Website
                                |
                                v
                        Response sent back through SSH tunnel
                                |
                                v
                      [Local Machine receives response]
```

## 🧰 MISC

### ⚙️ Useful options

```bash
-o UserKnownHostsFile=/dev/null     # Don't record the host key
-o StrictHostKeyChecking=no         # Automatically accept new host keys
-o BatchMode=yes                    # Disable password prompts (fail if no key)

-N   # No remote command, just forward
-f   # Background after auth
-n   # Redirects stdin (helps with -f)
```

```bash
# Example: silent tunnel in unstable reverse shell
ssh -n -i $(mktemp -d) \
    -o UserKnownHostsFile=/dev/null \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=no \
    -N -R 2049:127.0.0.1:2049 user@pivot-host
```

> Tip: These options are useful if you can’t interactively enter a password (e.g. during a reverse shell). Combine with key-based auth.

```bash
# Use password from file
sshpass -f password.txt ssh user@host
```

### 🛡️ SSH Server config reminders

**File:** `/etc/ssh/sshd_config`

```bash
GatewayPorts yes         # Allow -R to bind to all interfaces
AllowTcpForwarding yes   # Enable port forwarding
```

### Others

```bash
# Check active SSH tunnels
lsof -iTCP -sTCP:LISTEN -n -P | grep ssh
ss -tulnp
netstat -tlnp | grep ssh
```

```bash
# Persistent tunnel (auto-reconnect if dropped)
autossh -M 0 -N -f -L 8080:127.0.0.1:80 user@remote_ip

# Or keep it running in background with nohup (less robust)
nohup ssh -N -L 8080:127.0.0.1:80 user@remote_ip
```

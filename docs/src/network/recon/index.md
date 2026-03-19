# 🕵️ Recon & Evasion

## 🔍 Host Discovery

```bash
# Discover UP Host
nmap -sn -n --max-rtt-timeout 100ms --min-rate 500 --open -oG hosts_up.txt 192.168.0.0/20
cat hosts_up.txt | grep "Up" | awk '{print $2}' > live_hosts.txt
nmap -sS -p- --min-rate 1000 -sV -O -iL live_hosts.txt
```

```bash
# UDP discovery
sudo nmap -sU -p 53,123,161 --max-retries 1 --host-timeout 5s -n 192.168.0.0/20

# TCP SYN ping
nmap -sn -PS22,80,443 -n 192.168.0.0/20 | grep "Up" | cut -d' ' -f2 > hosts.txt

# Complete network enumeration
nmap -sn -T4 -PE -PM -PS80,443 -PA3389 -PU40125 -PY $TARGET/24
```

## 🕵️ Port Scanning

```bash
# Slow SYN scan + fragmentation
nmap -sS -f -p- -T2 --max-retries 2 --scan-delay 500ms $HOST

# Decoys + random hosts
nmap -sS -f -D RND:5 -p 80,443,22 --randomize-hosts --max-retry 2 --scan-delay 800ms $HOST

# Silent scan with version detection
nmap -sV -T2 --version-intensity 0 $TARGET
```

## 🔥 Firewall Rule Mapping

```bash
# ACK scan (detect stateful rules)
nmap -sA -p 1-1000 --reason $TARGET

# Window scan (ACK alternative)
nmap -sW -p 1-1000 $TARGET

# Stateful firewall detection
nmap -sS -p 80 --reason $TARGET  # SYN/ACK = open, RST = closed/filtered
```

## 🛡️ IDS/IPS Evasion

```bash
# Source port spoofing
nmap -sS -p 50000 -g 53 --reason $TARGET
nc -nv --source-port 53 $TARGET 50000  # Connect if open
```

```bash
# UDP ping from port 53
nmap -v -PU53 $HOST

# Advanced fragmentation
nmap -sS --mtu 16 --data-length 30 -p 80,443,22 $TARGET

# MAC spoofing (local network)
nmap --spoof-mac 0 -sS -PR -sn 192.168.1.0/24

# Bad checksum
nmap -sS --badsum -p 80 $TARGET

# Idle scan (zombie)
nmap -sI <zombie_ip> -p 80,443 $TARGET
```

## 🧅 Anonymization

```bash
# Tor + evasion
proxychains nmap -sT -Pn -f -T2 -p 80,443,22 --data-length 40 $TARGET

# Via SOCKS5 proxy
proxychains nmap -sT -Pn --proxies socks5://127.0.0.1:9050 $TARGET
```

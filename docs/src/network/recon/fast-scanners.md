---
title: "Fast Scanners"
---

# 🚀 Fast Scanners

> Modern port scanners that complement (not replace) [nmap](/network/recon/nmap/). Typical red team workflow: a fast scanner finds **what is open**, nmap then tells you **what runs there**.

## ⚖️ Scanner Comparison

| Tool       | Speed     | Accuracy | OPSEC   | Best for                       |
| ---------- | --------- | -------- | ------- | ------------------------------ |
| `nmap`     | Low       | High     | Tunable | Deep probe, scripts, OS detect |
| `masscan`  | Very high | Medium   | Loud    | Internet-scale sweeps          |
| `naabu`    | High      | High     | Medium  | Pipeline-friendly, chaining    |
| `rustscan` | High      | High     | Medium  | Fast + nmap handoff            |

::: tabs

=== 🔥 Masscan

> SYN scan with its own TCP/IP stack. Can hit 10M pps on a 10G NIC. **Extremely loud** - prefer `-rate 1000-5000` outside of authorized external engagements.

```bash
# Full /24 all ports, Gnmap output
sudo masscan -p1-65535 $CIDR --rate 10000 -oG masscan.gnmap

# Specific ports on a large range
sudo masscan -p22,80,443,445,3389,5985 $CIDR --rate 5000 -oL masscan.list

# Exclude a block (always exclude cloud metadata, internal mgmt, prod stuff you don't own)
sudo masscan -p- $CIDR --rate 10000 --excludefile exclude.txt

# UDP (slower, less reliable)
sudo masscan -pU:53,123,161 $CIDR --rate 2000
```

```bash
# Extract IP:port pairs
awk '/open/{print $4":"$3}' masscan.list
grep "Ports:" masscan.gnmap | awk '{print $2}'
```

> [!WARNING]
> Masscan ignores the kernel TCP stack. Add `--router-mac` or set a static ARP entry when the gateway doesn't respond to its probes. Also set `--adapter-ip` on multi-homed hosts.

=== ⚡ Naabu

> Projectdiscovery scanner, pipeline-oriented. Smaller footprint than masscan, slower than masscan, faster than nmap.

```bash
# Top 1000 ports, silent output (IP:port only)
naabu -host $TARGET -top-ports 1000 -silent

# From a host list
naabu -list hosts.txt -p 22,80,443,445,3389 -silent -o open.txt

# All ports, rate-limited (quieter)
naabu -host $TARGET -p - -rate 1000 -silent

# Chain with httpx for web assets
cat hosts.txt | naabu -silent | httpx -silent -title -tech-detect
```

=== 🦀 Rustscan

> Fast scanner that **hands off to nmap** for service detection. Best of both worlds in one command.

```bash
# Scan all ports, pass results to nmap -sV -sC
rustscan -a $TARGET -- -sV -sC

# Rate-limit batch size (lower = quieter)
rustscan -a $TARGET -b 500 -t 2000 -- -sV

# From a file
rustscan -a hosts.txt -- -sV -sC -oN rustscan.nmap
```

:::

## 🧩 Fast -> Deep Workflow

> The real value: find openings with the fast scanner, then let nmap do service/version/NSE on just those IP:port pairs.

```bash
# 1. Masscan the full range on all ports
sudo masscan -p1-65535 $CIDR --rate 10000 -oG masscan.gnmap

# 2. Build an nmap-ready target file
awk '/Ports:/{split($4,a,"/"); print $2":"a[1]}' masscan.gnmap > targets.txt

# 3. Group by unique ports, then nmap -sV -sC only on those
PORTS=$(awk -F: '{print $2}' targets.txt | sort -nu | paste -sd,)
HOSTS=$(awk -F: '{print $1}' targets.txt | sort -u)
echo "$HOSTS" | nmap -sV -sC -p $PORTS -iL - -oA nmap_deep
```

```bash
# Equivalent (naabu + nmap)
naabu -list hosts.txt -p - -silent -o open.txt
awk -F: '{a[$1]=a[$1]","$2} END{for(h in a) print h, substr(a[h],2)}' open.txt | \
  while read host ports; do nmap -sV -sC -p $ports $host -oN nmap_$host.txt; done
```

```bash
# One-shot with rustscan (simplest)
rustscan -a $CIDR --ulimit 5000 -- -sV -sC -oA full_scan
```

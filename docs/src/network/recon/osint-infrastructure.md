---
title: "OSINT Infrastructure"
---

# 🌐 OSINT Infrastructure

> Infrastructure-side OSINT: IP ranges, ASN, exposed services, favicon pivots. Pairs with [Subdomain Enumeration](/network/recon/subdomain-enumeration) which covers the DNS/name side.

## 📚 Resources

- [bgp.he.net](https://bgp.he.net) - ASN, prefixes, peerings
- [Shodan](https://www.shodan.io/) / [Censys](https://search.censys.io/) / [FOFA](https://en.fofa.info/) / [ZoomEye](https://www.zoomeye.org/)
- [ASN Lookup (hackertarget)](https://hackertarget.com/as-ip-lookup/)

## 🏷️ ASN & IP Range Discovery

> Pivot: organization name -> ASN -> allocated CIDR blocks -> everything the org exposes on the Internet beyond the obvious domain.

```bash
# ASN from org name (bgp.he.net UI is often faster)
curl -s "https://api.hackertarget.com/aslookup/?q=$ORG"

# Prefixes announced by an ASN
whois -h whois.radb.net -- "-i origin AS$ASN" | grep -i "route:"

# Amass intel (ASN + related orgs)
amass intel -org "$ORG"
amass intel -asn $ASN
amass intel -cidr $CIDR -whois

# IP ranges from a known IP
whois $IP | grep -iE "cidr|netrange|origin"
```

## 🖼️ Favicon Hashing

> Many admin panels, dev tools, EDR consoles and SaaS portals keep the vendor's favicon. One hash pivots to every public instance of that product worldwide.

```bash
# Compute mmh3 hash of a favicon
curl -s $URL/favicon.ico | base64 | python3 -c \
  "import mmh3,sys,codecs; print(mmh3.hash(codecs.decode(sys.stdin.read(),'base64')))"

# One-liner with Python only
python3 -c "import mmh3,requests,codecs; print(mmh3.hash(codecs.encode(requests.get('$URL/favicon.ico').content,'base64')))"
```

```bash
# Pivot on Shodan
http.favicon.hash:$HASH
http.favicon.hash:$HASH org:"$ORG"              # Narrow to one org
```

> [!TIP]
> [FavFreak](https://github.com/devanshbatham/FavFreak) automates the hash + Shodan dork generation from a URL list.

## 🔁 Reverse DNS Sweeps

> Blocks of IPs usually have PTR records exposing hostnames, which leak internal naming conventions (`vpn-paris-02`, `jenkins-prod-01`...).

```bash
# Expand CIDR + resolve PTR
prips $CIDR | hakrevdns -r $DNS_SERVER

# dnsx (projectdiscovery)
echo $CIDR | mapcidr | dnsx -ptr -resp-only -silent

# Nmap list scan (no probes sent to targets, DNS only)
nmap -sL -n $CIDR | grep "(" | awk '{print $5, $6}'
nmap -sL $CIDR -oG - | awk '/\\(1\\)/{print $2, $3}'
```

## 🧭 FOFA / ZoomEye

```bash
# FOFA (base64 of query required in URL, but UI is simpler)
title="admin" && country="FR"
cert="$ORG"
icon_hash="$HASH"

# ZoomEye
app:"Jenkins" +country:"FR"
ssl:"$ORG"
```

## ⚡ External Recon Workflow

```bash
# 1. Org -> ASN -> CIDRs
amass intel -org "$ORG" | tee asns.txt
whois -h whois.radb.net -- "-i origin AS$ASN" | awk '/^route:/{print $2}' > cidrs.txt

# 2. Expand + reverse DNS
cat cidrs.txt | mapcidr | dnsx -ptr -resp-only -silent > hostnames.txt

# 3. Correlate with Shodan
shodan download results.json.gz "net:$(paste -sd, cidrs.txt)"
shodan parse --fields ip_str,port,product results.json.gz | sort -u

# 4. Favicon pivot on anything interesting
# -> feed Shodan `http.favicon.hash:$HASH` back into step 3
```

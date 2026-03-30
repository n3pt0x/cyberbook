# Subdomain Enumeration

## 📚 Wordlists

- [commonspeak2-wordlists](https://github.com/assetnote/commonspeak2-wordlists)
- [jhaddix/all.txt](https://gist.github.com/jhaddix/86a06c5dc309d08580a018c66354a056)

## 🔍 Passive Sources (OSINT)

### Certificate Transparency

```bash
# crt.sh
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u

# Certspotter
curl -s "https://api.certspotter.com/v1/issuances?domain=example.com&include_subdomains=true&expand=dns_names" | jq -r '.[].dns_names[]' | sort -u
```

### DNS over HTTPS (bypass local resolvers)

```bash
# Google API
curl 'https://dns.google/resolve?name=example.com&type=A' | jq

# Cloudflare API
curl 'https://cloudflare-dns.com/dns-query?name=example.com&type=A' \
     -H 'accept: application/dns-json' | jq
```

## ⚡ Active Enumeration

### Dig brute-force (basic)

```bash
# Simple loop with wordlist
for sub in $(cat wordlist.txt); do
    dig $sub.example.com @$IP +short | grep -v '^$' && echo "$sub.example.com"
done

# Multi threading (faster)
cat wordlist.txt | xargs -P10 -I{} dig {}.example.com +short | grep -v '^$'
```

### MassDNS (high-speed)

```bash
# Format: subdomain.example.com
awk '{print $".example.com"}' subdomains.txt > targets.txt

# Run massdns
./bin/massdns -r resolvers.txt -t A -o S -w results.txt targets.txt

# Extract live hosts
grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}' results.txt | cut -d' ' -f1 | sort -u
```

## 🛠️ Tools (quick examples)

### Amass (OSINT + brute)

```bash
# Passive
amass enum -passive -d example.com

# Active + brute
amass enum -active -d example.com -brute -w wordlist.txt

# Output to file
amass enum -d example.com -o subs.txt
```

### Subfinder

```bash
subfinder -d example.com -o subs.txt

# With all sources
subfinder -d example.com -sources alienvault,securitytrails,crt.sh -o subs.txt
```

### DNSRecon

```bash
# Brute force
dnsrecon -d example.com -D wordlist.txt -t brt

# Google scraping
dnsrecon -d example.com -t goo
```

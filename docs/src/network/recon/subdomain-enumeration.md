# Subdomain Enumeration

## 📚 Resources

- [Subdomain Enumeration Guide](https://sidxparab.gitbook.io/subdomain-enumeration-guide)

## Wordlists

- [commonspeak2-wordlists](https://github.com/assetnote/commonspeak2-wordlists)
- [jhaddix/all.txt](https://gist.github.com/jhaddix/86a06c5dc309d08580a018c66354a056)

## 🔍 Passive Sources (OSINT)

### Dorking

```bash
site:"site.com"
site:"*.site.com"
site:"*.*.site.com"
site:"*.site.com" -$DNS
```

### Certificate Transparency

```bash
# crt.sh
curl -s "https://crt.sh/?q=%.$DNS&output=json" | jq -r '.[].name_value' | sort -u

# Certspotter
curl -s "https://api.certspotter.com/v1/issuances?domain=$DNS&include_subdomains=true&expand=dns_names" | jq -r '.[].dns_names[]' | sort -u
```

### DNS over HTTPS (bypass local resolvers)

```bash
# Google API
curl 'https://dns.google/resolve?name=$DNS&type=A' | jq

# Cloudflare API
curl 'https://cloudflare-dns.com/dns-query?name=$DNS&type=A' \
     -H 'accept: application/dns-json' | jq
```

## ⚡ Active Enumeration

### Dig brute-force (basic)

```bash
# Simple loop with wordlist
for sub in $(cat wordlist.txt); do
    dig $sub.$DNS @$IP +short | grep -v '^$' && echo "$sub.$DNS"
done

# Multi threading (faster)
cat wordlist.txt | xargs -P10 -I{} dig {}.$DNS +short | grep -v '^$'
```

### MassDNS (high-speed)

```bash
# Format: subdomain.$DNS
awk '{print $".$DNS"}' subdomains.txt > targets.txt

# Run massdns
./bin/massdns -r resolvers.txt -t A -o S -w results.txt targets.txt

# Extract live hosts
grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}' results.txt | cut -d' ' -f1 | sort -u
```

## 🛠️ Tools (quick examples)

### Amass (OSINT + brute)

```bash
# Passive
amass enum -passive -d $DNS

# Active + brute
amass enum -active -d $DNS -brute -w wordlist.txt

# Output to file
amass enum -d $DNS -o subs.txt
```

### Subfinder

```bash
subfinder -d $DNS -o subs.txt

# With all sources
subfinder -d $DNS -sources alienvault,securitytrails,crt.sh -o subs.txt
```

### DNSRecon

```bash
# Brute force
dnsrecon -d $DNS -D wordlist.txt -t brt

# Google scraping
dnsrecon -d $DNS -t goo
```

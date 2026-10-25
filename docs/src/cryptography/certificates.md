# Certificates

### Self-Signed

```bash
# Generate Certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# For socat
cat key.pem cert.pem > shell.pem
```

> **OPSEC**: self-signed certs are detectable by EDR/NDR (identical issuer/subject DN, short validity). Use only in lab or when encryption is a convenience, not an evasion requirement.

### Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

sudo certbot certonly --nginx -d $DOMAIN
```

Certbot installs a systemd timer that renews the certificate every 60 days.

> **OPSEC**: a domain-validated cert (Let's Encrypt) blends into normal HTTPS traffic. Use a wildcard to avoid leaking internal subdomains.

## Redirector (Nginx)

A redirector protects the Team Server: it only forwards requests matching the C2 profile (exact URI, User-Agent), and returns a decoy for everything else. The Team Server only accepts connections from the redirector IP.

### Nginx configuration

::: details

```nginx
server {
    listen 443 ssl http2;
    server_name cdn-telemetry.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/cdn-telemetry.$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn-telemetry.$DOMAIN/privkey.pem;

    # OPSEC: minimal logs
    access_log /dev/null;
    error_log /dev/null crit;

    # Default decoy
    location / {
        root /var/www/decoy;
        index index.html;
    }

    # C2 URI: only the payload knows this path
    location = /v1/telemetry/collect {
        # Filter by User-Agent (optional but recommended)
        if ($http_user_agent !~* "Mozilla/5.0.*Chrome/12[0-9]") {
            return 302 https://www.google.com;
        }

        # Proxy to the Team Server (backend)
        proxy_pass https://$TEAM_SERVER_IP:$TEAM_SERVER_PORT;

        # OPSEC: strip headers
        proxy_set_header X-Forwarded-For "";
        proxy_set_header X-Real-IP "";
        proxy_set_header Host $host;

        # Shared auth between redirector and backend
        proxy_set_header X-Redirector-Auth "$SHARED_SECRET";
    }
}
```

:::

### Backend (Team Server) lockdown

```bash
# Only accept the redirector IP on the C2 port
iptables -A INPUT -p tcp --dport $TEAM_SERVER_PORT -s $REDIRECTOR_IP -j ACCEPT
iptables -A INPUT -p tcp --dport $TEAM_SERVER_PORT -j DROP
```

### Test the redirector

```bash
# Should return the decoy (302 or default page)
curl -I https://cdn-telemetry.$DOMAIN/

# Should return the decoy (bad User-Agent)
curl -I -A "curl/7.68" https://cdn-telemetry.$DOMAIN/v1/telemetry/collect

# Should forward to the backend (correct URI + UA)
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0" \
  https://cdn-telemetry.$DOMAIN/v1/telemetry/collect
```

> **OPSEC**: never expose the Team Server directly. The redirector is the only public IP. Use a generic domain name. Let's Encrypt is the standard; a self-signed cert on the redirector is a detection signal.

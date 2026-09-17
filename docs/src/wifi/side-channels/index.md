---
title: "Side Channels"
---

# 🩹 Side Channels

> This page covers attacks that exploit **implementation flaws**, **misconfigurations**, or **user behavior**, rather than breaking the core cryptographic protocols (WPA2/3).

## 🔀 Man-in-the-Middle (MITM) & Traffic Interception

Once connected (or acting as a rogue AP), an attacker can intercept or manipulate traffic.

### Tools

- **Bettercap**: Powerful MITM framework. ([GitHub](https://github.com/bettercap/bettercap))
- **Responder**: LLMNR/NBT-NS/mDNS poisoner to capture hashes. ([GitHub](https://github.com/SpiderLabs/Responder))
- **Ettercap**: Classic suite for MITM attacks on LAN.
- **Kismet**: Passive sniffer for network discovery and visualization. ([attacks.md](../attacks.md#kismet))

### Attacks

| Attack                     | Description                                                           | Tool Example                                |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| **ARP Spoofing**           | Poison ARP tables to redirect traffic.                                | `bettercap` (`arp.spoof on`)                |
| **DNS Spoofing**           | Redirect DNS queries to malicious sites.                              | `bettercap` (`dns.spoof on`)                |
| **LLMNR/NBT-NS Poisoning** | Respond to broadcast name resolution requests to capture NTLM hashes. | `Responder` (`-I wlan0`)                    |
| **SSL Stripping**          | Downgrade HTTPS to HTTP to intercept credentials.                     | `bettercap` (`https.proxy` with `sslstrip`) |

## 🛡️ Client Isolation Bypass (e.g., AirSnitch)

These attacks exploit weaknesses in the **interaction between Wi-Fi and network infrastructure** to bypass client isolation.

### AirSnitch (NDSS 2026)

| Variant              | Description                                                                              | Vector                     |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------------------- |
| **GTK Abuse**        | Use the Group Temporal Key to encapsulate unicast traffic as broadcast, tricking the AP. | Network layer manipulation |
| **Gateway Bouncing** | Send packets with a fake destination MAC (gateway) but real destination IP (victim).     | Routing logic              |
| **Port Stealing**    | Spoof the victim's MAC to redirect traffic to the attacker.                              | MAC address spoofing       |

> **Impact**: These attacks can re-enable MITM positions even on networks with client isolation enabled.

## 🕵️ KRACK (Key Reinstallation Attack)

**KRACK** (CVE-2017-13077) is a serious vulnerability in WPA2's 4-way handshake. It forces **nonce reuse**, enabling packet decryption and injection. While largely patched, it remains a key case study.

- [🔗 Official KRACK website](https://www.krackattacks.com/)
- [📄 Research Paper by Mathy Vanhoef](https://papers.mathyvanhoef.com/ccs2017.pdf)

**Resources**:

- `krackattacks-scripts` - PoC scripts by the researcher.

## 🔀 Downgrade Attacks

Downgrade attacks exploit **backward compatibility** to force a weaker protocol version.

| Attack               | Description                                                    | Tool Example                    |
| -------------------- | -------------------------------------------------------------- | ------------------------------- |
| **RSN IE Downgrade** | Modify RSN Information Element to negotiate a weaker cipher.   | Custom scripts                  |
| **PMF Downgrade**    | Force clients to connect without PMF, enabling deauth attacks. | `mdk4`                          |
| **SAE Downgrade**    | Force WPA3 to use weaker hunting-and-pecking instead of H2E.   | Advanced tools (under research) |

**Mitigation**:

- **Transition Disable** on WPA3 (client-side).
- **PMF Required** (`ieee80211w=2`).
- Firmware updates.

## 📚 Resources

- [airgeddon - Multi-use Bash Script](https://github.com/v1s1t0r1sh3r3/airgeddon)
- [Bettercap - MITM Framework](https://github.com/bettercap/bettercap)
- [Responder - LLMNR/NBT-NS Poisoner](https://github.com/SpiderLabs/Responder)
- [hostapd-mana - Rogue AP Tool](https://github.com/sensepost/hostapd-mana)
- [EAPHammer - Enterprise Evil Twin](https://github.com/s0lst1c3/eaphammer)

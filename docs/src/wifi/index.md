---
title: WIFI
---

# WIFI

## Terminologies fundamentals

::: details

| Term       | Definition                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SSID**   | Service Set Identifier. The Wi-Fi network name visible to users.                                                                                 |
| **BSSID**  | Basic Service Set Identifier. The MAC address of the access point.                                                                               |
| **ESSID**  | Extended Service Set Identifier. Usually identical to SSID; used for extended networks (roaming).                                                |
| **Beacon** | Management frame sent periodically by the AP to announce its presence (SSID, BSSID, channel, security).                                          |
| **IV**     | Initialization Vector. Sent in cleartext with each encrypted packet. Combined with the key to generate the keystream. Essential for WEP attacks. |

:::

## Interface Management

### Check State

```bash
iwconfig  # Show interfaces and status
iw list   # Show driver capabilities
```

### Interface Configuration

::: code-group

```bash [Unix]
# Bring interface up/down
ip link set wlan0 up
ip link set wlan0 down

# Delete a virtual monitor interface
iw dev wlan0mon del

# Create a monitor interface manually
iw dev wlan0 interface add mon0 type monitor
```

```bash [airmon-ng]
airmon-ng                 # List interfaces and chipsets
airmon-ng check           # Show interfering processes
airmon-ng check kill      # Kill NetworkManager, wpa_supplicant, etc.

airmon-ng start wlan0     # Create wlan0mon (monitor mode)
airmon-ng start wlan0 6   # Start on specific channel
airmon-ng stop wlan0mon   # Stop monitor mode
```

:::

```bash
# Test Injection
aireplay-ng -9 wlan0mon
```

### ⚡ TX Power

```bash
# View current region and TX power limits
iw reg get

# Change region
iw reg set US

# Set TX power (interface must be down)
iwconfig wlan0 txpower 30
```

## Scan

```bash
iwlist wlan0 scan | grep -E 'Cell|Quality|ESSID|IEEE'
```

### Channel & Frequency

```bash
# List available channels
iwlist wlan0 channel

# Set channel (interface must be down)
iw dev wlan0mon set channel 6
iwconfig wlan0mon channel 11

# Set frequency
iwconfig wlan0 freq "5.52G"

# Show current frequency
iwlist wlan0 frequency | grep Current
```

### airodump-ng

```bash
airodump-ng $INTERFACE            # Start capture
airodump-ng -c 6,11 $INTERFACE    # channel 6 and 11
airodump-ng --band a              # a: 5GHz
airodump-ng --band bg             # b: 2,4GHz (11 Mbps) | g: 2,4GHz (54 Mbps)
airodump-ng -w capture $INTERFACE # Save to file
```

### Hidden SSID Discovery

When ESSID = `<length: 0>` in airodump-ng, the SSID is hidden.

- **Passive method** - wait for a client to connect:

```bash
airodump-ng $INTERFACE -c $CHANNEL --bssid $BSSID -w capture
```

- **Active method** - Deauth attack, force a client to reconnect:

```bash
aireplay-ng -0 2 -a $BSSID -c $CLIENT_MAC $INTERFACE
```

#### Brute-force SSID:

```bash
# Full brute-force (short SSIDs only)
mdk3 $INTERFACE p -b u -c 1 -t $BSSID

# Wordlist attack
mdk3 $INTERFACE p -f /opt/wordlist.txt -t $BSSID

# Character sets: u (uppercase), n (digits), a (all), c (mixed case), m (mixed+numbers)
```

## Aircrack-ng Suite

::: code-group

```bash [aireplay-ng]
# Deauthentication (transverse attack)
aireplay-ng -0 <packets> -a $BSSID -c $CLIENT_MAC $INTERFACE
```

```bash [airgraph-ng]
# Generate graph from airodump-ng CSV
airgraph-ng -i capture-01.csv -g CAPR -o out.png

# Graph types:
# - CAPR: Client-to-AP relationship
# - CPG: Client-to-client association
```

:::

## wpa_spplicant

::: details wep.conf

```bash
network={
    ssid="SSID"
    key_mgmt=NONE
    wep_key0=WEP_KEY
    wep_tx_keyidx=0
}
```

:::

::: details wpa.conf

```bash
network={
    ssid="SSID"
    psk="password"
}
```

:::

::: details wpa-eap.conf

```bash
network={
  ssid="SSID"
  key_mgmt=WPA-EAP
  identity="DOMAIN\User"
  password="password"
}
```

:::

```bash
wpa_supplicant -i $INTERFACE -c conf
sudo dhclient $INTERFACE
```

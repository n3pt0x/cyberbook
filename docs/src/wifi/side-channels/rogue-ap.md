# 🔌 Rogue AP (Physical Backdoor)

> A Rogue AP is an unauthorized access point **physically connected** to a legitimate network (via an Ethernet port). Its goal is to create a **backdoor** into the internal infrastructure, allowing an attacker to access the network remotely.

## 🎯 Objective

- **Access the internal network** from outside (via Wi-Fi)
- **Perform lateral movement** (exploit internal services, servers, printers)
- **Exfiltrate data** without crossing the firewall
- **Maintain persistence** (hidden AP)

## 🛠️ Hardware Options

:::details

| Device                                    | Advantages                                       | Disadvantages                                  |
| ----------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| **Raspberry Pi (3B+/4/Zero 2W)**          | Small, low power, Linux ready, GPIO for battery  | Requires external power, visible if not hidden |
| **GL.iNet routers (AR300M, Mango, etc.)** | Portable, built-in battery, OpenWrt preinstalled | Limited processing power                       |
| **Alfa AWUS036ACH**                       | High power, external antenna for long range      | Needs a host PC (not standalone)               |
| **ESP8266/ESP32**                         | Very small, cheap, low power                     | Limited to open networks (no WPA2)             |
| **Travel router (TP-Link, etc.)**         | Cheap, easy to configure                         | Bulky, less stealthy                           |

:::

## 🔧 Setup

### 1. Physical Connection

```bash
# Plug the device into an available Ethernet port on the target network.
# This can be in:
# - A network closet
# - An exposed wall jack in a meeting room
# - Behind a printer or other device
# - Under a desk

# Once connected, the device gets an IP via DHCP (or you can set a static one).
```

### 2. Configure the Access Point

```bash
# Set interface to AP (master) mode
sudo iw dev wlan0 set type ap

# Create hostapd config file
sudo cat > /etc/hostapd/hostapd.conf << EOF
interface=wlan0
driver=nl80211
ssid=Internal-Guest     # Use an inconspicuous name
channel=6
hw_mode=g
auth_algs=1             # Open network (no encryption)
# OR for WPA2 (more stealthy, but requires a password)
# wpa=2
# wpa_key_mgmt=WPA-PSK
# wpa_passphrase=your_password
# rsn_pairwise=CCMP
EOF

# Start hostapd
sudo systemctl start hostapd
sudo systemctl enable hostapd
```

### 3. Configure DHCP (dnsmasq)

```bash
sudo cat > /etc/dnsmasq.conf << EOF
interface=wlan0
dhcp-range=192.168.100.10,192.168.100.100,255.255.255.0,12h
EOF

sudo systemctl start dnsmasq
sudo systemctl enable dnsmasq
```

### 4. Enable NAT (Optional)

```bash
# Allow the AP to forward traffic to the internal network (eth0)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo sysctl net.ipv4.ip_forward=1

# Make persistent
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

## 🕵️ Stealth Techniques

### Hide the SSID

```ini
# Add to hostapd.conf
ignore_broadcast_ssid=1
```

### Use a Common SSID (Blend In)

```ini
# Use a name that won't attract attention
ssid=Free_WiFi
ssid=Guest_Network
ssid=linksys
ssid=NETGEAR
```

### Lower Transmit Power

```bash
# Reduce physical discovery range
sudo iw dev wlan0 set txpower fixed 5dBm
```

### Use a Fake MAC Address (Spoof)

```bash
# Change the BSSID to avoid detection
sudo ip link set wlan0 down
sudo macchanger -m AA:BB:CC:DD:EE:FF wlan0
sudo ip link set wlan0 up
```

### Physical Concealment

- Use a **USB power bank** for battery power (no visible power cable)
- Hide the device inside a **PC case**, behind a monitor, or in a ceiling tile
- Use a **small form factor device** (Raspberry Pi Zero, ESP8266)
- Paint the device or use a **3D-printed case** that looks like something else (e.g., a power adapter)

## 🛡️ Detection & Mitigation

- **Port Security**: 802.1X, MAC filtering -> you'll need a different entry point
- **WIDS/WIPS**: Continuous monitoring -> use low power, hidden SSID, MAC spoofing
- **Network Segmentation**: VLANs limit your lateral movement
- **DHCP Snooping**: Prevents rogue DHCP servers -> your AP must be stealthy

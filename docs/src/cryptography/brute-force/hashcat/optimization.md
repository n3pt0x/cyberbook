# ⚡ Hashcat Optimization

## 🔍 Hardware

```bash
-I                    # List devices
-d <ID>               # Select GPU device
hashcat -b -m <type>  # Benchmark specific hash
```

## ⚙️ Core Flags

```bash
# Workload profiles (-w)
-w 1 (low) | -w 2 (default) | -w 3 (high) | -w 4 (nightmare)
--workload-profile <0-4>  # Fine-tune workload (0=light,4=max)

# Kernel optimization
-O                        # Optimize kernel (max 32 chars per password)
--threads                 # Strong CPU, complex rules | CPU helps generate candidates while GPU cracks

# GPU optimization
-n 16-256                 # --gpu-accel (GPU parallelism)
-u 8-128                  # --gpu-loops (how many hashes per GPU call)
```

::: details ⚡ Advanced Optimization

```bash
# Thread optimization
--spin-damp <N>           # Reduce thread contention (0-100)
--cpu-affinity <str>      # Set CPU core affinity (e.g., 1,2,3)

# Hardware monitoring
--hwmon-disable           # Disable hardware temperature monitoring
--gpu-watchdog <N>        # GPU watchdog timer (seconds)
--gpu-malloc-threshold 	  # Set GPU memory allocation threshold

# Kernel specific
--kernel-accel <N>        # Kernel acceleration factor (legacy)
--kernel-loops <N>        # Kernel loops (legacy)
--scrypt-tmto <N>         # scrypt TMTO factor (expert only)
```

:::

## 📊 When to use some option

| Option               | Use when...                         | Avoid when...                          | Notes                                                                 |
| -------------------- | ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| **`-O`**             | Passwords ≤ 32 chars (99% of cases) | Slow hashes (bcrypt) or long passwords | **Always use** - huge speed boost                                     |
| **`-w`**             | PC dedicated to cracking            | You need your computer responsive      | Higher = more power, less usability                                   |
| **`-n` / `-u`**      | You really know what you're doing   | Autotune works fine (99% of cases)     | **Rarely needed** - let hashcat decide                                |
| **`-S`**             | Slow hashes with rules (WPA/bcrypt) | Fast hashes                            | Slow candidates mode                                                  |
| **`--threads`**      | Strong CPU, hybrid attacks          | GPU-only cracking                      | CPU helps generate candidates while GPU cracks - useful for WPA/rules |
| **`--gpu-watchdog`** | Laptop, overheating GPU             | Max speed priority                     | Safety first                                                          |

## 🎯 Quick Reference

### Fast hashes

```bash
# RTX 4090 (max power)
hashcat -m 1000 ntlm.txt rockyou.txt -w 4 -O -n 256 -u 128 --hwmon-disable

# Rules
hashcat -m 1000 hashes.txt wordlist.txt -r best64.rule -w 4 -O
```

### Slow hashes

```bash
# GTX 1060 (safe)
hashcat -m 3200 bcrypt.txt wordlist.txt -w 2 -n 24 -u 12 --gpu-watchdog 30
```

### WPA handshake

```bash
# Desktop
hashcat -m 2500 handshake.hccapx wordlist.txt -w 3 -n 64 -u 16 --threads 4

# Laptop (balanced)
hashcat -m 2500 handshake.hccapx wordlist.txt -w 2 -n 32 -u 16
```

### Mask attacks

```bash
# 8 chars, max speed
hashcat -a 3 -m 0 hash.txt ?a?a?a?a?a?a?a?a -w 4 -O -n 256 --spin-damp 20

# With CPU affinity (multi cores)
hashcat -a 3 -m 0 hash.txt ?a?a?a?a?a?a?a?a -w 4 -O -n 256 --cpu-affinity 0-11
```

### Large wordlists

```bash
# Process in chunks
hashcat -m 0 hash.txt rockyou.txt --skip=1000000 --limit=1000000
```

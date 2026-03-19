# ♟️ Hashcat

## 📚 Resource

- [Hashcat documentation](https://hashcat.net/hashcat/)
- [Hashcat hash types](https://hashcat.net/wiki/doku.php?id=example_hashes)
- [Hashcat utils](https://github.com/hashcat/hashcat-utils.git)

## 🔍 Hash Types

- [haiti](https://github.com/noraj/haiti)
- [hashID](https://github.com/psypanda/hashID)

```bash
hashcat --example-hashes | less
```

## 🔧 Methods

```bash
hashcat -a <0-7>

0 = Straight          # Dictionary attack (wordlist)
1 = Combination       # Combine two words from two wordlists
3 = Brute-force       # Mask attack (e.g. ?a?a?a)
6 = Hybrid dict+mask  # Append mask to wordlist (e.g. password + 123)
7 = Hybrid mask+dict  # Prepend mask to wordlist (e.g. 123 + password)
```

### 🎭 List Mask

- [Hashcat Mask Attack](https://hashcat.net/wiki/doku.php?id=mask_attack)

```bash
?l = abcdefghijklmnopqrstuvwxyz
?u = ABCDEFGHIJKLMNOPQRSTUVWXYZ
?d = 0123456789
?h = 0123456789abcdef
?H = 0123456789ABCDEF
?s = «space»!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
?a = ?l?u?d?s
?b = 0x00 - 0xff

# custom charset (-1 to -4)
-1 ?l?u?d    # (lower, upper, digit) only
-2 abcd01234 # just some chars
```

```bash
# Incremental mode
--increment                # Enable incremental length
--increment-min 4          # Start at 4 chars
--increment-max 8          # End at 8 chars
```

## ⚙️ Command

```bash
# Session management
--session <name>           # Set a session name to resume later
--restore                  # Resume a session
--restore-file-path <file> # Custom restore file path

# Results display
--show                     # Display cracked passwords from potfile
--left                     # Show remaining hashes
--potfile-disable          # Disable potfile cache
--potfile-path <file>      # Custom potfile location

# Output files
--outfile <file>           # Save cracked hashes to a file
--outfile-format <N>       # Output format (2 = hash:password)
```

## 🧠 Examples

```bash
# Mask
hashcat -a 3 -m 0 hash.txt '?a?a?a?a?a'

## Based password + guessing 5 chars
hashcat -a 3 -m 0 -1 012 hash.txt 'password?a?a?1?1?a'
```

```bash
# Incremental mask (4-8 chars)
hashcat -a 3 -m 0 hash.txt --increment --increment-min=4 --increment-max=8 -1 '?l?u?d' '?1?1?1?1?1?1?1?1'

# Hybrid (wordlist + 00-99)
hashcat -a 6 -m 0 hash.txt wordlist.txt '?d?d'
hashcat -a 7 -m 0 hash.txt '?d?d' wordlist.txt
```

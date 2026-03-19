# 🎭 Hashcat Rules

## 📚 Resources

- [Rule-Based Attack (official)](https://hashcat.net/wiki/doku.php?id=rule_based_attack)
- [OneRuleToRuleThemAll](https://github.com/NotSoSecure/password_cracking_rules/blob/master/OneRuleToRuleThemAll.rule)
- [Hashcat Rules Collection](https://github.com/n0kovo/hashcat-rules-collection)
- [nsa-rules](https://github.com/NSAKEY/nsa-rules)
- [Hob0Rules](https://github.com/praetorian-code/Hob0Rules)

## 🔧 Core Functions

::: details Basic Rules

```bash
# Case
l                    # lowercase
u                    # UPPERCASE
c                    # Capitalize (first letter)
C                    # lowercase first, UPPERCASE rest
t                    # Toggle case (Test -> tEsT)
T<N>                 # Toggle at position N (T3 = pasSword)

# Modify
$<X>                 # Append char X (password$1 = password1)
^<X>                 # Prepend char X (^1password = 1password)
s<X><Y>              # Replace X with Y (sa@ = p@ssword)
@<X>                 # Delete all X (password@a = pssword)
!<X>                 # Keep only X (password!aeiou = aio)

# Duplicate/Reverse
d                    # Duplicate (pass -> passpass)
p                    # Append reversed (pass -> passssap)
q                    # Duplicate every character? wait no — q<N> block dup
r                    # Reverse (password -> drowssap)

# Rotate
{                    # Rotate left (password -> asswordp)
}                    # Rotate right (password -> dpasswor)
```

:::

::: details Advanced Rules

```bash
# Positional
i<N><X>              # Insert X at pos N
o<N>                 # Delete char at pos N
x<N><M>              # Extract substring (pos N, length M)
'<N>                 # Keep left N chars (truncate)
"<N>                 # Keep right N chars

# Memory
4                    # Save current position
6                    # Go to saved position

# Rejection rules (only with -j/-k)
>N                   # Reject if word length > N
<N                   # Reject if word length < N
_N                   # Reject if word contains non-existent char? no — check doc
```

:::

## ⚙️ Advanced Options

::: details ⚙️ Advanced Options

```bash
# Markov models (for mask attacks -a 3)
--markov-hcstat2 <file>   # Use custom Markov stats file
--markov-classic          # Use legacy Markov model
--markov-threshold <N>    # Min hits (def=50). Lower = more candidates (slower), higher = faster (less coverage)

# Rule generation (with -g)
-g 10000                  # Generate 10,000 random rules
--generate-rules-func-min <N> # Min functions per rule (1-3). Low = simple/fast, high = complex/thorough
--generate-rules-func-max <N> # Max functions per rule (3-5). Same as above

# Loopback - reuse cracked passwords
--loopback                    # Auto-feed cracked passwords as new candidates (chains patterns)
--loopback-min <N>            # Ignore cracked shorter than N (filter weak/short)
--loopback-max <N>            # Ignore cracked longer than N (stay in target length)

# Toggle - case variations
--toggle-min <N>              # Min case toggles per word (avoid pAsSwOrD)
--toggle-max <N>              # Max case toggles per word (limit combinatorial explosion)
```

:::

## 🎯 Rule Examples

```bash
# L33t + year + special (leet + append)
c so0 si1 se3 ss5 sa@ $2 $0 $2 $4 $!
# password -> P@55w0rd2024!

# Corporate + toggle (prepend + case toggle + append)
^C$o$r$p$2$0$2$4_ c t $1 $2 $3
# password -> Corp2024_Password123

# Reverse chain (reverse + leet + capitalize)
r c so0 si1 se3 ss5 sa@ $2 $0 $2 $4
# password -> P@55w0rd2024 (from "drowssap")

# Double prepend + toggle (multiple prepend + case)
^2^0^2^4_ ^A$c$m$e_ c t $1 $2 $3 $!
# password -> 2024_Acme_Password123!
```

## 🚀 Usage

- `/usr/share/hashcat/rules/` - Hashcat default rules

### Basic rule attacks

```bash
# Multiple rule files
hashcat -a 0 -m 1000 hashes.txt wordlist.txt -r OneRuleToRuleThemAll.rule -r best64.rule

# Generated rules (random)
hashcat -a 0 -m 1000 hashes.txt wordlist.txt -g 10000
```

## ⚡ Advanced Rule Techniques

### Rule generation tuning

```bash
# Control rule complexity
hashcat --generate-rules-func-min 1 --generate-rules-func-max 2   # simple rules only
hashcat --generate-rules-func-min 4 --generate-rules-func-max 6   # complex rules only
```

```bash
# Filter by length
hashcat -a 0 -m 1000 hashes.txt rockyou.txt -r best64.rule --loopback --loopback-min 8

# Two-stage attack
hashcat -a 0 -m 1000 hashes.txt rockyou.txt --outfile cracked.txt
hashcat -a 0 -m 1000 hashes.txt cracked.txt -r OneRuleToRuleThemAll.rule
```

```bash
# Toggle attack tuning
hashcat -a 0 -m 1000 hashes.txt wordlist.txt --toggle-min 2 --toggle-max 4
```

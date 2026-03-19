# 📚 Custom Wordlist Generation

## Tools

- [Target Profiling (CUPP)](https://github.com/Mebus/cupp)
- [CeWL](https://github.com/digininja/CeWL)
- [kwprocessor](https://github.com/hashcat/kwprocessor)
- [Princeprocessor](https://github.com/hashcat/princeprocessor)

## 🔗 Combination Attacks

```bash
hashcat -a 1 --stdout wordlist1.txt wordlist2.txt
awk '(NR==FNR) { a[NR]=$0 } (NR != FNR) { for (i in a) { print $0 a[i] } }' file2.txt file1.txt
```

## 🎭 Mask-Based (Crunch)

```bash
# Basic syntax
crunch <min> <max> [charset] -t <pattern> -o wordlist.txt

# Patterns
@  # lowercase
,  # uppercase
%  # digits
^  # special chars
```

```bash
# Generate all 4-8 chars (bruteforce style)
crunch 4 8 -o wordlist.txt

# Corporate pattern: CORP + 2 digits + 4 lowercase
crunch 17 17 -t CORP%%@@@@ -o wordlist.txt

# Birthdate pattern: 12052020 + 4 random chars
crunch 12 12 -t 12052020@@@@ -d 1 -o wordlist.txt
```

## 🕷️ Website Spidering (CeWL)

```bash
# Basic crawl
cewl -d 2 -m 5 -w website_words.txt https://example.com

# Options
-d <depth>          # How deep to spider
-m <min>            # Minimum word length
-w <file>           # Output file
-e                  # Extract emails
--email_file <file> # Save emails separately
```

```bash
# Real example
cewl -d 5 -m 8 -e http://inlanefreight.com/blog -w wordlist.txt --email_file emails.txt
```

## ⌨️ Keyboard Walks (kwprocessor)

```bash
# Basic keyboard walk
kwprocessor -s 1 basechars/full.base keymaps/en-us.keymap routes/2-to-10-max-3-direction-changes.route

# With shift enabled
kwprocessor -s 1 --shift-toggled 1 basechars/full.base keymaps/en-us.keymap routes/2-to-10-max-3-direction-changes.route
```

## 🔀 Combinators (Princeprocessor)

```bash
# Basic usage
./pp64.bin -o wordlist.txt < words.txt

# Length constraints
./pp64.bin --pw-min=10 --pw-max=25 -o wordlist.txt < words.txt

# Minimum elements per word
./pp64.bin --elem-cnt-min=3 -o wordlist.txt < words.txt
```

## 🎭 Apply Rules to Wordlists

### Hashcat

```bash
# Test a rule on a single word
echo "password" | hashcat -r best64.rule --stdout

# Apply rules to whole wordlist
hashcat -r best64.rule rockyou.txt --stdout | sort -u > mutated.txt

# Multiple rule files
hashcat -r best64.rule -r leetspeak.rule rockyou.txt --stdout > mutated.txt

# Default rules location
ls /usr/share/hashcat/rules/
```

### John the Ripper

```bash
# Apply built-in rules
john --wordlist=rockyou.txt --rules --stdout > mutated.txt
john --wordlist=rockyou.txt --rules=best64 --stdout > mutated.txt

# Incremental (bruteforce) wordlists
john --incremental=ASCII --stdout > ascii.txt
john --incremental=Digits --stdout > digits.txt
```

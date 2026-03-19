# John The Ripper

## 📚 Resource

- [John documentation](https://www.openwall.com/john/)
- [Common hash formats](https://pentestmonkey.net/cheat-sheet/john-the-ripper-hash-formats)

## 🔧 Essentials

```bash
john --format=<hash_type> --wordlist=rockyou.txt hash.txt
john --show hash.txt
john --show=left hash.txt
john --restore                    # Resume session
john --session=mysession hash.txt # Custom session
john --single hash.txt            # Single mode (uses login info)
```

## 🔍 Format handling

```bash
john --list=formats
john --list=formats | grep -i ntlm
john --test-formats --format=nt
john --format=nt hash.txt --force   # Force format if auto fails
```

## ⚡ Performance

```bash
john --fork=4 hash.txt        # Multi-core
john --status                 # Show running job status
john --pot=/dev/null hash.txt # Disable potfile (fresh start)
```

## 🎭 Mask Attack

```bash
john --mask='?u?l?l?d?d' hash.txt
john --mask='?a?a?a?a' --min-length=4 --max-length=8     # Increment
john --mask='?1?1?1?1' --custom-charset1='?l?d' hash.txt # Custom charset
```

> `?l` = lowercase, `?u` = uppercase, `?d` = digits, `?s` = special, `?a` = all


## 🎯 Incremental Mode (Markov)

```bash
# Built-in modes
john --incremental hash.txt                    # Auto (ASCII full)
john --incremental=ASCII hash.txt              # All printable (95 chars)
john --incremental=Digits hash.txt             # Only numbers (0-9)
john --incremental=Alnum hash.txt              # Letters + numbers (62 chars)
john --incremental=Alpha hash.txt              # Only letters (52 chars)
john --incremental=LowerNum hash.txt           # Lowercase + numbers (36 chars)

# With length constraints
john --incremental=ASCII --min-length=6 --max-length=8 hash.txt
```

::: details Custom Incremental Mode
In `/etc/john/john.conf` or `~/.john/john.conf`:

```bash
[Incremental:MyMode]
File = $JOHN/ascii.chr    # Stats file (generate with john --make-charset)
MinLen = 4                 # Minimum length
MaxLen = 8                 # Maximum length
CharCount = 62             # Alnum = 62, ASCII = 95, Digits = 10

# Use it
john --incremental=MyMode hash.txt
```

:::

## 📝 Rules

```bash
# best64 (most effective), leetspeak (1337), dive (aggressive)

john --wordlist=rockyou.txt --rules hash.txt                          # Default rules
john --wordlist=rockyou.txt --rules=best64 hash.txt                   # Specific ruleset
john --wordlist=rockyou.txt --rules=best64 --rules=leetspeak hash.txt # Multiple
john --stdout --rules=best64 < wordlist.txt | head -20                # Test rules
```

## Utils

```bash
ssh2john id_rsa > ssh.hash
zip2john secret.zip > zip.hash
rar2john secret.rar > rar.hash
keepass2john database.kdbx > keepass.hash
pdf2john document.pdf > pdf.hash
office2john document.docx > office.hash
unshadow /etc/passwd /etc/shadow > unix.hash
```

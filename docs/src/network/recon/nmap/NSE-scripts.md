# 👁️ Nmap NSE Scripts

## 📚 Resources

- [NSE Documentation](https://nmap.org/book/nse.html)
- [NSE Scripts](https://nmap.org/nsedoc/scripts/)
- [NSE Libraries](https://nmap.org/nsedoc/lib/)

## 🧠 Common Script Categories

| Category    | Description                                      |
| ----------- | ------------------------------------------------ |
| `auth`      | Authentication-related brute force, bypass, info |
| `broadcast` | Network discovery via LAN broadcast              |
| `brute`     | Brute Forcing                                    |
| `default`   | Default scripts used with `-sC`                  |
| `discovery` | Target enumeration and asset discovery           |
| `dos`       | Denial-of-Service vulnerability checks (⚠️)      |
| `exploit`   | Actual exploit attempts (⚠️ intrusive)           |
| `external`  | Uses third-party external resources              |
| `fuzzer`    | Input fuzzing for service stability tests        |
| `intrusive` | Potentially disruptive scripts                   |
| `malware`   | Checks for known malware behavior/backdoors      |
| `safe`      | Safe to use without authorization concerns       |
| `version`   | Detailed version detection                       |
| `vuln`      | CVE/exploit/vulnerability detection              |

## 🔍 Script Discovery & Information

```bash
# Search by service
ls /usr/share/nmap/scripts/ | grep -iE "ftp|ssh|http"

# Search by protocol & category
grep 'categories' /usr/share/nmap/scripts/*.nse | sort | uniq | grep -i '<protocol>' | grep '<category>'

# Display script help
nmap --script-help=<category-name>|<script-name>
```

```bash
--script=<name>              # Single script
--script=<cat1,cat2>         # Multiple categories
--script="<pattern>"         # Wildcards (http-*, smb-*)
--script-args <args>         # Script arguments
--script-args-file <file>    # Args from file
--script-trace               # Debug script execution
--script-updatedb            # Update script DB
```

::: details Advanced Examples

```bash
# Common examples
--script-args userdb=users.txt,passdb=pass.txt
--script-args http-enum.fingerprintfile=./custom.txt
--script-args smbuser=admin,smbpass=1234

# Pass to all scripts
--script-args 'unsafe=1'
--script-args 'http.useragent="Mozilla/5.0"'
```

:::

## 🚀 Advanced Script Execution

```bash
# Enumerate all well-known CVEs
nmap --script discovery,vuln $TARGET

# Save vulnerability scan
nmap --script=vuln -oN vuln_scan.txt $TARGET

# SMB (safe only)
nmap -p 445 --script="smb-* and not brute and not intrusive" $TARGET

# HTTP (safe only)
nmap -p 80,443 --script="http-* and not intrusive,http-* and not brute" $TARGET

# With credentials
nmap --script=smb* --script-args smbuser=username,smbpass=password $TARGET
```
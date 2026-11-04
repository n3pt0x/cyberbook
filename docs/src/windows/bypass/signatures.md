---
title: "Static Signatures"
---

# 🧬 Static Signature Bypass

> _Pre-execution scan dodging: alter the artifact on disk so hash, YARA and
> string signatures don't fire. Once the file is in memory, you're in AMSI /
> behavioural territory (-> [amsi](./amsi.md), future `evasion/`)._

## 📚 Resources

- [Rasta-mouse - ThreatCheck repo](https://github.com/rasta-mouse/ThreatCheck) - the byte-split workflow
- [SpecterOps - Finding malware signatures](https://posts.specterops.io/)
- [Nick Landers - Dechaining obfuscation](https://posts.specterops.io/)
- [Microsoft - YARA rules in Defender](https://learn.microsoft.com/en-us/microsoft-365/security/defender-endpoint/)

## 🛠️ Tools

- [ThreatCheck](https://github.com/rasta-mouse/ThreatCheck) - binary / script signature locator (wraps `MpCmdRun`)
- [DefenderCheck](https://github.com/matterpreter/DefenderCheck) - C# alternative
- [Chameleon](https://github.com/klezVirus/chameleon) - PowerShell obfuscator
- [Invoke-Obfuscation](https://github.com/danielbohannon/Invoke-Obfuscation) - classic but heavily signatured today
- [ConfuserEx](https://github.com/mkaring/ConfuserEx) - .NET obfuscator (control-flow, strings, resources)

## 🎯 Signature identification

ThreatCheck does a binary split: cut the file in halves, scan each, recurse on the half that triggers. Final output is the offset + bytes of the matched signature.

::: code-group

```powershell [ThreatCheck]
# Full binary scan
.\ThreatCheck.exe -f .\payload.exe

# Script scan (PS1, HTA, VBS)
.\ThreatCheck.exe -f .\loader.ps1

# After patching: rescan
.\ThreatCheck.exe -f .\payload_v2.exe
```

```bash [DefenderCheck]
# Build from source, same idea
DefenderCheck.exe .\payload.exe

# Output: signature offset + hex dump of the matched bytes
```

:::

**Loop**: scan -> read hex at the offset -> rename / re-encode / strip the matching string or import -> rescan -> repeat. Expect 2-5 rounds on a modern Defender build for a public tool.

> [!tip]
> Point `ThreatCheck` at a known-clean file first (`notepad.exe`) to confirm it reports
> "clean" - rules out a broken `MpCmdRun` path.

## ✂️ String obfuscation

Defender YARA matches on readable ASCII/UTF-16 in `.text` and `.data`. Any string split, XOR or runtime-concat kills a basic signature.

::: code-group

```csharp [.NET]
// Split + concat at runtime
string s = "Inv" + "oke-Mi" + "mikatz";

// XOR with a single-byte key, decode on use
byte[] enc = { 0x2a, 0x3d, 0x2e, 0x2f };
string payload = Encoding.ASCII.GetString(
    enc.Select(b => (byte)(b ^ 0x7a)).ToArray());

// Base64 at build time, decode at runtime
string api = Encoding.ASCII.GetString(
    Convert.FromBase64String("VmlydHVhbEFsbG9j"));  // "VirtualAlloc"
```

```powershell [PowerShell]
# Char-code join
$cmd = ([char]73+[char]69+[char]88)  # "IEX"
& $cmd $payload

# Reflection on hidden members via obfuscated string
$t = [Ref].Assembly.GetType(('System.Management.Automation.AmsiUtils' -replace 'A','A'))

# -f format operator + reorder
$s = "{2}{0}{1}" -f 'oke-Mimikatz','','Inv'
```

```c [C / Nim / Rust]
/* Stack strings - never land in .data */
char s[] = { 'm','i','m','i','k','a','t','z', 0 };

/* XOR at build time */
#define XOR(x) ((x) ^ 0x42)
static char key[] = { XOR('N'), XOR('T'), XOR('L'), XOR('M'), 0 };
```

:::

## 🔗 API hashing & dynamic resolution

Named imports (`CreateRemoteThread`, `VirtualAllocEx`, ...) sit in the IAT and YARA on them. Resolving by hash leaves the IAT empty and the string absent from the binary.

```c
/* DJB2 of the API name, computed at build time */
DWORD h = djb2("VirtualAlloc");  // = 0x382c0f97

/* Walk the export table of kernel32, match the hash */
FARPROC p = ResolveByHash(GetModuleHandleA("kernel32.dll"), h);
LPVOID mem = ((PFN_VirtualAlloc)p)(NULL, size,
    MEM_COMMIT, PAGE_EXECUTE_READWRITE);
```

Common hashes shipped in loader kits: DJB2, ROR13, FNV-1a. All equivalent - pick one not yet catalogued by Defender's YARA.

> [!tip]
> Hashed imports kill the static IAT signal, but a behavioural engine still sees
> `VirtualAlloc -> WriteProcessMemory -> CreateRemoteThread`. For that flow, go
> indirect / direct syscalls (-> future `evasion/`).

## 📏 Entropy reduction

Packed / encrypted payloads hit entropy ≈ 8.0 bits/byte, which is itself a signal (`sigcheck -a`, VirusTotal "high entropy" tag). Pad with low-entropy data:

- Append large text resources (open-source licenses, Wikipedia dumps)
- Embed a benign DLL / PNG / ICO as a resource
- Steal `.rdata` from a legit binary (strings pulled from `notepad.exe`)

```powershell
# Inspect entropy per section
sigcheck.exe -a payload.exe | findstr Entropy

# Or quick overall average
$b = [IO.File]::ReadAllBytes("payload.exe")
$b | Measure-Object -Average -Maximum
```

Target: < 6.5 bits/byte for the whole file, and especially for `.text` and `.rdata` sections.

## 📦 Packers & crypters (Windows-specific)

Generic packers (UPX, Themida, VMProtect) and MSFvenom encoders are covered upstream in [pentest-basics/payloads/obfuscation](../../pentest-basics/payloads/obfuscation.md). Windows-specific tooling worth adding here:

- **ConfuserEx** (.NET) - control-flow flattening, string encryption, resource protection. Successor to Dotfuscator. The ConfuserEx version marker is now flagged itself - patch or rebuild from source.
- **Resource Hacker** - edit PE resources (icons, version info, manifest) to match a legit app. Changes the file hash + helps reputation scoring.
- **Compiler hygiene** - build with `/GUARD:CF`, `/DYNAMICBASE`, randomized linker timestamp. A payload built "like malware" (no symbols, high entropy, no manifest) stands out in PE-level ML models.

## ✍️ Authenticode hint

Signed binaries get a lower scan priority and better SmartScreen rating. Signing an obfuscated payload often turns a yellow verdict green. See [signing](./signing.md).

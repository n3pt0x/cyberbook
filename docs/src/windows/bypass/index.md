---
title: "AV Bypass"
---

# 🛡️ AV Bypass

> _Getting an artifact past the Windows AV product's own checks: signature scans,
> AMSI runtime hook, tamper protection, reputation gating. This chapter stops
> where EDR behavioural evasion (ETW, syscalls, API unhooking) and loader
> internals (process injection, reflective loading)._

## 📚 Resources

- [SpecterOps blog](https://posts.specterops.io/) - foundational AV/EDR write-ups
- [Outflank Red Team Blog](https://outflank.nl/blog/) - practical bypass research
- [Maldev Academy](https://maldevacademy.com/) - paid cert, free preview covers AMSI/signatures well
- [MITRE ATT&CK T1562 - Impair Defenses](https://attack.mitre.org/techniques/T1562/)
- [Kyle Avery - offensive tradecraft talks](https://www.youtube.com/@kyleavery_)

## 🛠️ Tools

| Tool                                                                          | Purpose                                                 | Sheet                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- |
| [ThreatCheck](https://github.com/rasta-mouse/ThreatCheck)                     | Byte-split: find the exact Defender signature in a file | [signatures](./signatures.md) |
| [DefenderCheck](https://github.com/matterpreter/DefenderCheck)                | C# equivalent, older but still handy                    | [signatures](./signatures.md) |
| [Chameleon](https://github.com/klezVirus/chameleon)                           | PowerShell obfuscation (strings, vars, cmdlets)         | [signatures](./signatures.md) |
| [amsi.fail](https://amsi.fail/)                                               | Fresh randomized AMSI bypass per request                | [amsi](./amsi.md)             |
| [Invoke-AMSIBypass](https://github.com/S3cur3Th1sSh1t/Amsi-Bypass-Powershell) | Collection of AMSI patches                              | [amsi](./amsi.md)             |
| [AMSITrigger](https://github.com/RythmStick/AMSITrigger)                      | Signature hunter for your own PS scripts                | [amsi](./amsi.md)             |
| [Seatbelt](https://github.com/GhostPack/Seatbelt)                             | AV / EDR presence recon from the host                   | [defender](./defender.md)     |
| [SigThief](https://github.com/secretsquirrel/SigThief)                        | Copy an Authenticode signature across binaries          | [signing](./signing.md)       |
| [CarbonCopy](https://github.com/paranoidninja/CarbonCopy)                     | Clone a cert chain, build a code-signing cert           | [signing](./signing.md)       |

## 🧭 Workflow

```text
   Drop / pipe payload  ─────────► scanned?
                                     │ yes
                                     ▼
                           ┌─────────────────────┐
                           │ Static (file/YARA)? │──► signatures.md (ThreatCheck → strip → rebuild)
                           └─────────┬───────────┘
                                     │ passes
                                     ▼
                           ┌─────────────────────┐
                           │ AMSI (script/.NET)? │──► amsi.md (patch / provider / HWBP)
                           └─────────┬───────────┘
                                     │ passes
                                     ▼
                           ┌─────────────────────┐
                           │ Cloud reputation?   │──► signing.md (sign / carpet-bomb cert)
                           └─────────┬───────────┘
                                     │ still blocked
                                     ▼
                           ┌─────────────────────┐
                           │ Elevated & stuck?   │──► defender.md (tamper / exclude / uninstall)
                           └─────────────────────┘
```

Pick the lightest intervention that works. Tampering with Defender is loud and logged (Event IDs 5001/5007); [signatures](./signatures.md) + [amsi](./amsi.md) are usually enough on a low-maturity target.

## 🎯 Detection layers

| Layer                                       | When                      | Covered by                       |
| ------------------------------------------- | ------------------------- | -------------------------------- |
| File signature (hash / YARA / strings)      | Before execution, on disk | [signatures](./signatures.md) |
| AMSI (scripts, macros, .NET loads)          | At interpretation time    | [amsi](./amsi.md)             |
| Reputation / SmartScreen / ASR              | On launch, cloud-backed   | [signing](./signing.md)       |
| Behavioural (ETW, callbacks, API telemetry) | At runtime                | _→ future `evasion/`_            |
| Memory scan / in-mem YARA                   | Mid-run                   | _→ future `evasion/`_            |

## 🧪 AV landscape (quick)

Defender is the default target (shipped everywhere, enabled by default). Other vendors reuse the same primitives but with product-specific quirks:

- **Microsoft Defender** - `MsMpEng.exe` + `MpCmdRun.exe`; cloud-delivered via MAPS. Full coverage in [defender](./defender.md).
- **Kaspersky** - `avp.exe`, PPL self-defense; GUI password-protected, taskkill-proof. Needs the admin password or offline reg patch.
- **ESET** - `egui.exe` / `ekrn.exe`; HIPS behavioural layer, very PowerShell-signatured.
- **Sophos** - `SophosFS.exe` + central cloud policy; local uninstall needs a one-time token.
- **CrowdStrike Falcon / SentinelOne** - sensor-only (no on-disk scan engine); behavioural + ML. Treat as EDR → future `evasion/`.

For non-Defender targets, [signatures](./signatures.md) and [amsi](./amsi.md) still apply as-is; [defender](./defender.md) is Defender-specific tampering with short notes for others.

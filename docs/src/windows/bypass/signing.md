---
title: "Authenticode Signing"
---

# ✍️ Authenticode Spoofing

> _Signed binaries carry reputation weight: SmartScreen, Defender cloud and ASR
> all score signed code less harshly. Stealing, faking or carpet-bombing that
> trust lowers detection enough to matter on borderline samples._

## 📚 Resources

- [SpecterOps - Code Signing Certificate Cloning](https://posts.specterops.io/)
- [Chris Nevin - Signed, Sealed, Delivered](https://posts.specterops.io/)
- [Microsoft - signtool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool)
- [SigThief README](https://github.com/secretsquirrel/SigThief) - the canonical "copy a signature over" primer

## 🛠️ Tools

- [SigThief](https://github.com/secretsquirrel/SigThief) - copy a Certificate Table from one PE to another
- [osslsigncode](https://github.com/mtrojnar/osslsigncode) - cross-platform Authenticode signer
- `signtool.exe` - Microsoft SDK signer (ships with Visual Studio build tools)
- [CarbonCopy](https://github.com/paranoidninja/CarbonCopy) - clone a cert subject, build a code-signing cert
- [Limelighter](https://github.com/Tylous/Limelighter) - domain-fronted cert generation (self-signed + cloned subject)
- `sigcheck.exe` (Sysinternals) - verify what's actually on a file

## 💡 Why signing matters

- **SmartScreen** gates downloaded executables: unsigned -> "unknown publisher" prompt + reputation scoring. Signed -> prompt gone after a few hundred runs on the internet.
- **Defender ASR rules** (e.g. _Block executable content from email client and webmail_) have signer-based whitelists.
- **WDAC / AppLocker** publisher rules trust by certificate, not by hash.
- **Cloud lookup** (MAPS) de-prioritises signed binaries from established CAs; most samples with a valid Sectigo / DigiCert signature need stronger behavioural evidence before a cloud block.

Signing doesn't make the payload invisible - it shifts you from "default-suspicious" to "default-fine".

## 🪄 Cert-less tricks

### SigThief - borrowed signature

Not a _valid_ signature, but Explorer / lazy `WTGetSignatureInfo` consumers flag the file as "signed". Enough to fool reputation scoring and crude allow-lists (not SmartScreen).

```bash
# Pull the Certificate Table from a signed, benign binary
python sigthief.py -i C:\Windows\System32\notepad.exe -t stolen.cert

# Append it to your payload
python sigthief.py -i payload.exe -s stolen.cert -o payload_signed.exe

# Check the result
signtool verify /pa /v payload_signed.exe
# -> chain error (untrusted root), but IMAGE_DIRECTORY_ENTRY_SECURITY is present
```

### Invalid-but-present signature

Sign with any cert, then flip a byte in `.text`. Signature is now invalid, but tools that only check for a signature's _presence_ still mark it as signed:

```powershell
signtool sign /f cert.pfx /p $PASSWORD payload.exe

# Flip a byte in .text (not inside the Certificate Table itself)
$b = [IO.File]::ReadAllBytes("payload.exe")
$b[0x1000] = $b[0x1000] -bxor 0x01
[IO.File]::WriteAllBytes("payload.exe",$b)
```

## 🧾 Disposable / carpet-bomb certs

Get a legitimately-issued code-signing cert, use once, burn. CAs revoke on abuse report but you often get 24-72 hours of validity.

- **Sectigo**, **Certum**, **Comodo** - OV certs, €200-500, 1-day issue if you hand them a shell LLC.
- **EV certs** - €500+, token-bound keys, higher trust (immediate SmartScreen reputation) but far harder to walk off with.
- Pay via prepaid card tied to a disposable business identity - CAs don't deeply validate billing.

```powershell
# One-shot OV cert, sign on a disposable VM with a scrubbed hostname
signtool sign /f burner.pfx /p $PASSWORD /tr http://timestamp.sectigo.com `
  /td sha256 /fd sha256 /v payload.exe
```

> [!warning]
> Obtaining a code-signing cert by identity fraud is a criminal act in most
> jurisdictions - covered here for tradecraft awareness. A real engagement uses
> an **engagement-owned** cert, not an abused one.

## 🏴 Stolen / leaked certificates

Occasionally code-signing certs leak (malware campaigns, misconfigured S3 buckets, `.pfx` files pushed to GitHub). Operating one:

- **Timing** - revocation often takes weeks after a leak; usable windows are long.
- **Storage** - keep the `.pfx` + password offline; CAs monitor VT for private keys.
- **Timestamp** - timestamp the signature so it stays valid past revocation (see below).

Treat stolen certs like one-shot weapons: use on the binary that most needs the trust, not on every iteration.

## ⏳ Timestamp spoofing

Authenticode can embed an RFC 3161 timestamp proving the signature existed _at that time_. Even after cert revocation, signatures timestamped before revocation stay valid. Useful for long-lived implants.

```powershell
# Timestamped sign
signtool sign /f cert.pfx /p $PASSWORD `
  /tr http://timestamp.digicert.com /td sha256 /fd sha256 `
  payload.exe

# Verify timestamp is present
signtool verify /pa /v /tw payload.exe
```

Backdating (making a cert look like it signed _before_ its own creation) is possible with a compliant private TSA you control - niche, usually not worth the setup.

## ✅ Validation checks

Different checkers disagree, and that's part of the trick. Verify on multiple tools before shipping.

::: code-group

```powershell [Get-AuthenticodeSignature]
# Native, strict - says what Windows thinks
Get-AuthenticodeSignature .\payload.exe | Format-List *
# Status: Valid / NotSigned / HashMismatch / NotTrusted
```

```bash [signtool]
signtool verify /pa /v payload.exe
# /pa uses the default auth policy
# /v  verbose
# /tw warns on timestamp issues
```

```bash [sigcheck]
# Sysinternals - also pulls VT + extra metadata
sigcheck.exe -a -h payload.exe
```

```python [SigThief check]
# Signature table present at all?
python sigthief.py -i payload.exe -c
```

:::

## 🛡️ OPSEC

- **CT logs are public** - certs issued by trusted CAs show up in Certificate Transparency within ~1 hour. Publishing a shell LLC name + burner domain to CT is a strong attribution link if the company is a thin front.
- **VirusTotal** auto-extracts and tracks certificate subjects. Reusing a burner cert across unrelated samples builds a cluster against you.
- **Cert revocation** - once revoked, `signtool verify /pa` fails. Watch revocation feeds; rotate when yours lights up.
- **Stolen-cert clusters** - reusing a leaked cert that malware families have used inherits their reputation. Sometimes helpful (hiding in a known family's noise), usually harmful.
- **Public TSAs** log timestamp requests server-side. For high-stakes ops, run your own RFC 3161 server.

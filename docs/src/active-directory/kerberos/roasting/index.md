---
title: "Roasting"
---

# Kerberos Roasting

> _Request Kerberos material that is encrypted with an account's key, then crack it **offline**. No password is tried against the target, so there is no account lockout and nothing noisy on the service itself - the only on-wire event is a normal ticket request._

## AS-REP Roasting vs Kerberoasting

| Aspect             | [AS-REP Roasting](./asrep-roast.md)        | [Kerberoasting](./kerberoasting.md)             |
| ------------------ | ------------------------------------------ | ----------------------------------------------- |
| Targets            | Users with `DONT_REQ_PREAUTH` set          | Accounts with an SPN (service accounts)         |
| Prerequisite       | Often **unauthenticated** (just a user list) | **Any** valid domain account                  |
| Material requested | AS-REP (pre-auth disabled)                 | TGS for the SPN                                 |
| Crackable secret   | The **user's** NT hash                     | The **service account's** key                   |
| hashcat mode       | `18200`                                    | `13100` (RC4) / `19700` (AES)                   |

Both yield a crackable hash from the KDC - weak passwords fall to an offline wordlist.
AS-REP roasting depends on a **misconfiguration** (pre-auth disabled), while Kerberoasting
works against **any** SPN, so it is the more reliable of the two in a real domain.

## This section

- [AS-REP Roasting](./asrep-roast.md) - no-preauth accounts, often reachable unauthenticated.
- [Kerberoasting](./kerberoasting.md) - service accounts with an SPN, needs a valid account.

---
title: "Delegation"
---

# Kerberos Delegation

> _Delegation lets a service act **on behalf of a user** toward another service (e.g. a web front-end reaching a database as the logged-in user). Misconfigured delegation lets an attacker impersonate **arbitrary users** - often a Domain Admin - to a target service. The underlying primitives (S4U2Self, S4U2Proxy, U2U) are defined in the [Kerberos theory](../index.md)._

## The three types

| Type                                | AD marker                                                                 | What you need                                                     | Impersonation scope                          |
| ----------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| [Unconstrained](./unconstrained.md) | `TRUSTED_FOR_DELEGATION` (UAC flag)                                       | control of the host + a user (ideally a DC) authenticating to it  | **any** principal's full TGT                 |
| [Constrained](./constrained.md)     | `msDS-AllowedToDelegateTo` (+ `TRUSTED_TO_AUTH_FOR_DELEGATION` for protocol transition) | the delegating account's secret (password / hash / AES key)       | the listed SPN(s) only, as **any** user      |
| [RBCD](./rbcd.md)                   | `msDS-AllowedToActOnBehalfOfOtherIdentity` on the target                  | **write** over the target + a controlled account with an SPN      | **any** user -> that target's services       |

All three end the same way: you obtain a Kerberos service ticket **as a privileged user**
(usually `Administrator`) for a service that grants you code execution or secrets.

## Enumeration

```bash
# Impacket - lists unconstrained, constrained and RBCD in one shot
impacket-findDelegation $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP

# netexec
nxc ldap $DC_IP -u $USER -p $PASSWORD --trusted-for-delegation      # unconstrained
nxc ldap $DC_IP -u $USER -p $PASSWORD --find-delegation             # all types

# bloodyAD
bloodyAD -u $USER -p $PASSWORD -d $DOMAIN --host $DC_IP get search \
  --filter '(userAccountControl:1.2.840.113556.1.4.803:=524288)'   # TRUSTED_FOR_DELEGATION
```

```powershell
# PowerView (Windows)
Get-DomainComputer -Unconstrained | Select-Object dnshostname
Get-DomainUser -TrustedToAuth; Get-DomainComputer -TrustedToAuth
```

[BloodHound](/active-directory/enumeration/bloodhound.md) surfaces delegation as graph
edges (`AllowedToDelegate`, `AllowedToAct`), which is the fastest way to spot a path.

## This section

- [Unconstrained](./unconstrained.md) - capture any TGT cached on a compromised host, coerce a DC.
- [Constrained](./constrained.md) - S4U impersonation toward the account's allowed SPNs.
- [RBCD](./rbcd.md) - write the delegation attribute on a target you control the ACL of.

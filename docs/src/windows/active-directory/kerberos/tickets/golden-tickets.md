# 🟡 Golden Ticket

## Theory

A **Golden Ticket** is a forged **TGT** signed with the **`krbtgt` key**. Because
the KDC trusts anything signed with that key, a valid Golden Ticket grants access
to **any service in the domain**, as **any user**, with **any group membership**.

::: details

| Aspect         | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| **Scope**      | Entire domain - every service, every host                               |
| **Key**        | `krbtgt` key (AES256 preferred, NTLM as fallback)                       |
| **Lifetime**   | Forgeable up to 10 years; survives user password changes and re-joins   |
| **Stealth**    | Low - well-known detection signatures (4769, 4768 anomalies)            |
| **Use when**   | You have the krbtgt key and need persistent, domain-wide access         |
| **Avoid when** | You only have a service key (→ Silver), or you need stealth (→ Diamond) |

:::

**Why it works** - the krbtgt key is the root of trust for every TGT in the
domain. The KDC accepts any TGT signed with it, so having the key lets you mint
tickets for **any principal, any group, at any time**.

> [!warning] Invalidation
> Only a **double krbtgt password rotation** invalidates a Golden Ticket.
> A single rotation is not enough - the previous key stays valid for the
> ticket's lifetime.

## Practice

### Requirements

::: details

| Requirement       | How to get it                                     |
| ----------------- | ------------------------------------------------- |
| krbtgt AES256 key | `secretsdump` on NTDS (`aes256-cts-hmac-sha1-96`) |
| Domain SID        | `lookupsid`, `whoami /user`, or BloodHound        |
| Domain FQDN       | Recon (`DOMAIN.LOCAL`)                            |
| Username to forge | Any existing account, or a fake one               |

:::

### Forge the TGT

```bash
# domain SID
impacket-lookupsid -hashes "$LM_HASH:$NT_HASH" "$DOMAIN/$USER@$DC_HOST" 0

# RC4 key (NT hash)
impacket-ticketer -nthash "$KRBTGT_NT_HASH" \
  -domain-sid $DOMAIN_SID -domain $DOMAIN \
  -spn krbtgt/$DOMAIN \
  $TARGET_USER

# AES 128/256 bits key
impacket-ticketer -aesKey "$KRBTGT_AES_HASH" \
  -domain-sid $DOMAIN_SID -domain $DOMAIN \
  -spn krbtgt/$DOMAIN \
  $TARGET_USER
```

### Impersonate a privileged user

By default, `ticketer` embeds the forged user in the PAC. To impersonate a Domain
Admin while using a non-privileged username, pass the RID:

`-user-id 500` forces the RID of **Administrator** in the PAC. Common RIDs:

| RID   | Principal         |
| ----- | ----------------- |
| `500` | Administrator     |
| `512` | Domain Admins     |
| `519` | Enterprise Admins |

### Extensions

Golden Tickets can be combined with Kerberos extensions for specific goals:

| Extension    | Effect                                                       |
| ------------ | ------------------------------------------------------------ |
| **S4U2Self** | Allows the forged ticket to be used in delegation scenarios. |
| **U2U**      | Used in Sapphire Tickets as a variant of Golden.             |

For standard domain access, none of them are needed.

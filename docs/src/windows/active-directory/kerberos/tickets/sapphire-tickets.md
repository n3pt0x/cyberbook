# ♦️ Sapphire Tickets

## Theory

A **Sapphire Ticket** is a **legitimate TGT** where the PAC has been **replaced with the real PAC of a privileged user**, obtained via an **S4U2Self + U2U** trick. It combines legitimate elements (real TGT, real PAC) with a krbtgt signature, making it the **hardest ticket variant to detect**.

::: details

| Aspect         | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **Scope**      | Entire domain - same access as Golden/Diamond                      |
| **Key**        | `krbtgt` key (to sign) + a valid low-priv account (for `S4U2Self`) |
| **Lifetime**   | As per domain policy (looks legitimate)                            |
| **Stealth**    | Highest - no PAC discrepancy, real TGT flow                        |
| **Use when**   | You have the krbtgt key, a valid account, and need maximum stealth |
| **Avoid when** | You only have a service key (→ Silver)                             |

:::

**Why it works** - instead of modifying a PAC (Diamond) or forging one (Golden), you request a legitimate TGT for a controlled user, then use S4U2Self + U2U to obtain the **real PAC** of a privileged user (e.g. Administrator). You replace the original PAC with this one, re-sign with the krbtgt key, and inject. The ticket looks completely legitimate.

## Practice

### Requirements

::: details

| Requirement          | How to get it                                |
| -------------------- | -------------------------------------------- |
| krbtgt AES key       | `secretsdump` on NTDS                        |
| Valid domain account | Any compromised user                         |
| Target RID           | `500` (Administrator), `512` (Domain Admins) |
| Domain SID           | `lookupsid`, `whoami /user`                  |
| Domain FQDN          | Recon, DNS, LDAP                             |

:::

### Forge the Sapphire Ticket (Impacket)

```bash
# -impersonate is the privileged user whose PAC will be stolen
impacket-ticketer -request \
  -impersonate "$ADMIN_USER" \
  -domain "$DOMAIN" \
  -user "$LOW_PRIV_USER" -password "$LOW_PRIV_PASS" \
  -nthash "$KRBTGT_NT_HASH" -aesKey "$KRBTGT_AES_KEY" \
  -user-id "$TARGET_RID" \
  -domain-sid "$DOMAIN_SID" \
  "$TARGET_USER"
```

> [!warning] Patch KB5008380 (CVE-2021-42287)
> Microsoft patched this in 2022 (enforcement Oct 11, 2022). The patch added **`PAC_REQUESTOR`** and **`PAC_ATTRIBUTES_INFO`** structures required in TGT PACs. Since Sapphire uses a **service ticket's PAC** (from S4U2Self), those structures may be missing, causing `KDC_ERR_TGT_REVOKED` in patched environments.
>
> Impacket has been updated to handle this. Ensure you use the latest version.

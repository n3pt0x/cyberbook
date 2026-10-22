# ⚪ Silver Ticket

## Theory

A **Silver Ticket** is a forged **TGS** signed with the **service account's key**.
Unlike a Golden Ticket, the KDC is **not involved** - the ticket is presented
directly to the target service, which decrypts it with its own key and trusts
the embedded PAC.

::: details

| Aspect         | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **Scope**      | One SPN on one host (`CIFS/host`, `HOST/host`, `krbtgt/domain`) |
| **Key**        | Service or machine account key                                  |
| **Lifetime**   | Forgeable up to 10 years with `-duration`                       |
| **Stealth**    | High - no KDC interaction, only the target service logs it      |
| **Use when**   | You have a service/machine key and need one specific service    |
| **Avoid when** | You have the krbtgt key (→ Golden), or need multiple services   |

:::

**Why it works** - services sign their tickets with their own key. If you have
that key, you can mint a TGS the service will accept. The PAC carries two
signatures, but only the **server signature** is checked by default, so the
krbtgt key is not required.

## Practice

### Requirements

::: details

| Requirement         | How to get it                                        |
| ------------------- | ---------------------------------------------------- |
| Service/machine key | `secretsdump` on NTDS or LSA, or cracked Kerberoast  |
| Target SPN          | Recon - `CIFS/host`, `HOST/host`, or `krbtgt/domain` |
| Domain SID          | `lookupsid`, `whoami /user`, or BloodHound           |
| Domain FQDN         | Recon, DNS, or LDAP                                  |
| Username to forge   | Any existing account, or a fake one                  |

:::

### Choosing the SPN

The SPN determines **which service** the ticket is valid for. Three useful
targets:

| SPN               | Grants access to                                   |
| ----------------- | -------------------------------------------------- |
| `CIFS/<host>`     | SMB shares (`psexec`, `smbclient`, file access).   |
| `HOST/<host>`     | WMI, RPC, scheduled tasks, services (`wmiexec`).   |
| `krbtgt/<DOMAIN>` | A TGT-equivalent, domain-wide (a "Silver Golden"). |

> [!warning] SPN must exist
> The forged TGS must reference a **real SPN** in the domain, otherwise the
> target service will reject it. Enumerate SPNs with `GetUserSPNs` or LDAP.

### Forge the TGS

```bash
# Using the AES256 key of the service or machine account
impacket-ticketer -aesKey "$SERVICE_AES_KEY" \
  -domain-sid "$DOMAIN_SID" -domain "$DOMAIN" \
  -spn "CIFS/$TARGET_HOST" \
  "$TARGET_USER"

# Using the NTLM hash (RC4) instead
impacket-ticketer -nthash "$SERVICE_NT_HASH" \
  -domain-sid "$DOMAIN_SID" -domain "$DOMAIN" \
  -spn "HOST/$TARGET_HOST" \
  "$TARGET_USER"
```

This produces `<username>.ccache` in the current directory.

> [!tip] Machine account key
> For a machine account, the key is the **`$MACHINE.ACC`** secret. Extract it
> with:
>
> ```bash
> impacket-secretsdump -just-dc-user '<MACHINE>$' \
>   "$DOMAIN/$USER:$PASS@$DC_HOST"
> ```

### Impersonate a privileged user

By default, `ticketer` embeds the forged user in the PAC. To make the ticket
carry a privileged identity, pass the RID:

```bash
impacket-ticketer -aesKey "$SERVICE_AES_KEY" \
  -domain-sid "$DOMAIN_SID" -domain "$DOMAIN" \
  -spn "CIFS/$TARGET_HOST" \
  -user-id 500 \
  "$TARGET_USER"
```

Common RIDs:

| RID   | Principal         |
| ----- | ----------------- |
| `500` | Administrator     |
| `512` | Domain Admins     |
| `519` | Enterprise Admins |

### Why no krbtgt key is needed

The PAC inside the ticket has two signatures:

- **Server signature** - computed with the **service key**.
- **KDC signature** - computed with the **krbtgt key**.

The service only verifies the **server signature**. Since the Silver Ticket is
signed with the service key, the server signature is valid, and the ticket is
accepted. The KDC signature is **not checked** in the default configuration -
which is why you don't need the krbtgt key.

> [!warning] PAC validation
> Some hardened environments enable **full PAC validation**, forcing the service
> to ask the KDC to verify the KDC signature. In that case, a Silver Ticket
> **will be rejected**, and only a Golden Ticket works.

### Extensions

Silver Tickets can be combined with Kerberos extensions for specific goals:

| Extension    | Effect                                                       |
| ------------ | ------------------------------------------------------------ |
| **S4U2Self** | Allows the forged ticket to be used in delegation scenarios. |

For standard service access, no extension is needed.

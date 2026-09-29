---
title: Kerberos
---

# Kerberos

> [!info] Scope of this page
> This page covers the **theory and concepts** behind Kerberos in an Active Directory
> environment: actors, message exchanges, ticket structure, cryptography, PAC, and
> identifiers. Attack-specific pages (roasting, pass-the-ticket, golden/silver tickets,
> delegation abuse, etc.) live in their own files and are linked at the bottom.

## Overview

**Kerberos** is the default authentication protocol in Active Directory since Windows 2000.
It replaces NTLM for domain authentication by providing:

- **Mutual authentication** between client and service (both sides prove their identity).
- **Delegation** - a service can act on behalf of a user toward another service.
- **Single Sign-On (SSO)** - one authentication gives access to multiple services.
- **Time-bounded credentials** - tickets expire, unlike NTLM hashes.

Kerberos relies on a **trusted third party**, the **KDC** (Key Distribution Center),
which runs on every Domain Controller. The client proves its identity to the KDC once,
receives a **TGT**, and then uses that TGT to obtain **service tickets** on demand -
it never sends its password to a service.

```
  ┌────────┐         ┌───────────────┐         ┌──────────┐
  │ Client │ ──────► │      KDC      │ ◄────── │ Service  │
  │        │ ◄────── │  (AS + TGS)   │ ──────► │ (SPN)    │
  └────────┘         └───────────────┘         └──────────┘
       ▲                                             ▲
       │                                             │
       └──────────── AP-REQ / AP-REP ────────────────┘
```

> [!tip] Why this matters for offense
> Because the KDC is the single source of trust, **compromising the KDC's signing key
> (the `krbtgt` account key) means you can forge tickets for anyone**. This is the
> foundation of Golden Tickets, Diamond Tickets, and other ticket-forging attacks.

## Actors & Components

::: details

| Component                         | Role                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------ |
| **KDC** (Key Distribution Center) | Trusted third party. Runs on every DC. Composed of the AS and the TGS.         |
| **AS** (Authentication Service)   | Verifies the client's identity and issues the **TGT**.                         |
| **TGS** (Ticket Granting Service) | Issues **service tickets** (TGS) based on a valid TGT.                         |
| **Client / Principal**            | A user, computer, or service account requesting authentication.                |
| **Service**                       | A resource identified by an **SPN** (SMB, HTTP, LDAP, MSSQL, …).               |
| **Realm**                         | The Kerberos equivalent of a domain. Uppercase by convention (`domain.local`). |
| **krbtgt**                        | Special AD account whose key signs every TGT in the realm.                     |

:::

> [!warning] Naming trap
> **TGS** is overloaded: it refers to _both_ the **Ticket Granting Service** (the KDC
> component) _and_ the **Ticket Granting Service ticket** (the service ticket). Context
> usually disambiguates, but be careful when reading docs.

## The Three Exchanges

Kerberos authentication happens in **three logical phases**. In practice, phases 1 and 2
are often combined by the client, and phase 3 happens each time a new service is accessed.

### AS Exchange - obtain a TGT

```
  Client                                              KDC (AS)
    │                                                    │
    │  AS-REQ  (cname, realm, pre-auth, timestamp)       │
    │ ─────────────────────────────────────────────────► │
    │                                                    │
    │  AS-REP  (TGT encrypted with krbtgt key,           │
    │           session key encrypted with user key)     │
    │ ◄───────────────────────────────────────────────── │
    │                                                    │
```

The client sends its identity and, if **pre-authentication** is required, a timestamp
encrypted with its own key. The KDC verifies the timestamp and returns two things:

- A **TGT** - encrypted with the **krbtgt key**. The client cannot read it.
- A **session key** - encrypted with the **client's key**, used to talk to the TGS
  in the next phase.

> [!info] Pre-authentication
> Pre-auth prevents an attacker from requesting a TGT for any user and cracking it
> offline. When pre-auth is **disabled** on an account, the KDC returns an AS-REP
> encrypted with the user's key without verifying the requester - this is
> **AS-REP Roasting**. See `as-rep-roasting.md`.

### TGS Exchange - obtain a service ticket

```
  Client                                              KDC (TGS)
    │                                                    │
    │  TGS-REQ  (TGT, SPN, authenticator)                │
    │ ─────────────────────────────────────────────────► │
    │                                                    │
    │  TGS-REP  (service ticket encrypted with           │
    │            service key, new session key)           │
    │ ◄───────────────────────────────────────────────── │
    │                                                    │
```

- The client presents its **TGT** and the **SPN** of the target service.
- The TGS decrypts the TGT with the krbtgt key, checks it, and returns a **TGS
  (service ticket)** encrypted with the **service account's key**.
- If the SPN does not exist, the KDC returns `KDC_ERR_S_PRINCIPAL_UNKNOWN`. Enumerating
  which SPNs exist is a classic recon step.

> [!tip] Kerberoasting
> Anyone with a valid TGT can request a service ticket for **any SPN**. The returned
> ticket is encrypted with the **service account's key**, which can be cracked offline.
> This is **Kerberoasting**. The "password" being cracked is the service account's,
> not the user's.

### AP Exchange - present the ticket to the service

```
  Client                                             Service
    │                                                   │
    │  AP-REQ  (service ticket, authenticator)          │
    │ ────────────────────────────────────────────────► │
    │                                                   │
    │  AP-REP  (optional, mutual auth)                  │
    │ ◄──────────────────────────────────────────────── │
    │                                                   │
```

- The client sends the **service ticket** to the service.
- The service decrypts it with **its own key**, reads the **PAC** (see §6) to learn the
  user's identity and group memberships, and grants or denies access.

> [!warning] No KDC involved
> Once the client holds a service ticket, **the KDC is not contacted again**. This is
> why a stolen or forged ticket is directly usable against the service - there is no
> online validation. The only protection is **ticket lifetime** and **PAC signature
> validation** by the service.

## Ticket Structure

A Kerberos ticket is an ASN.1 DER-encoded structure (`Ticket` in [RFC 4120](https://www.rfc-editor.org/info/rfc4120/)).

### TGT vs TGS - the key differences

::: details

| Aspect            | TGT                  | TGS (service ticket)        |
| ----------------- | -------------------- | --------------------------- |
| Issued by         | **AS**               | **TGS**                     |
| Encrypted with    | **krbtgt key**       | **Service account key**     |
| `sname`           | `krbtgt/REALM`       | `CIFS/host`, `HTTP/host`, … |
| Usable to request | Any TGS in the realm | Only the targeted service   |
| Lifetime          | ~10h (renewable ~7d) | Same as TGT                 |
| Stored as         | `ccache` / `kirbi`   | `ccache` / `kirbi`          |

:::

> [!tip] Ticket flags worth knowing
>
> - `forwardable` - can be forwarded to another host (delegation).
> - `renewable` - can be renewed before `renew-till`.
> - `pre-authent` - the client authenticated with pre-auth.
> - `ok-as-delegate` - the service is trusted for delegation.
> - `enc-pa-rep` - encrypted pre-auth in the reply (FAST).

## PAC - Privilege Attribute Certificate

The **PAC** is Microsoft's addition to the standard Kerberos ticket. It lives inside
the `authorization-data` field of the `EncTicketPart` and carries **authorization
information** - who the user is, what groups they belong to, what their SID is, etc.

### What the PAC contains

::: details

| Field                                       | Purpose                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| **Logon info**                              | User SID, group SIDs, logon hours, password age, etc. |
| **Client info**                             | Client ID, name, full name.                           |
| **Server signature**                        | Signature with the **service's key**.                 |
| **KDC signature**                           | Signature with the **krbtgt key**.                    |
| **Privilege server signature** _(optional)_ | Used for RBCD and resource SIDs.                      |
| **UPN / DNS info**                          | UPN, DNS domain name.                                 |

:::

### Why the PAC matters for offense

- The **PAC is the source of truth for group membership**. A service reads the PAC to
  decide whether to grant access, not a live LDAP query.
- Both signatures must be valid. If you forge a ticket but cannot sign the PAC
  correctly, the service will reject the request (in modern, patched environments).
- **Golden Tickets** require the krbtgt key to sign the KDC signature.
- **Silver Tickets** require the service key to sign the server signature.
- **Diamond Tickets** modify a **legitimate TGT**'s PAC and re-sign it with the krbtgt
  key, avoiding some detection heuristics that look for fully forged tickets.

> [!info] PAC validation
> By default, services **do not contact the KDC** to validate the PAC on every request.
> This is why Silver Tickets work: the service trusts the PAC signed with its own key.
> Some hardened environments enable **PAC validation** (via `KrbtgtFullPacSignature`
> and related registry settings), which invalidates forged PACs.

## Identifiers - SPN, UPN, DN, SID

### SPN - Service Principal Name

An **SPN** uniquely identifies a service instance in the domain. Format:

```
<service-class>/<host>[:<port>][/<instance>][@REALM]
```

Examples:

::: details

| SPN                         | Service                                |
| --------------------------- | -------------------------------------- |
| `krbtgt/$DOMAIN`            | The KDC itself (used for TGTs).        |
| `CIFS/DC01.$DOMAIN`         | SMB share access.                      |
| `HOST/DC01.$DOMAIN`         | WMI, RPC, scheduled tasks, services.   |
| `LDAP/DC01.$DOMAIN`         | LDAP directory access.                 |
| `HTTP/web.$DOMAIN`          | Web service (IIS, etc.).               |
| `MSSQLSvc/sql.$DOMAIN:1433` | SQL Server.                            |
| `RestrictedKrbHost/DC01`    | Restricts Kerberos to a specific host. |

:::

- SPNs are stored on the AD object as the `servicePrincipalName` attribute.
- A **service account** can have multiple SPNs (e.g. `HTTP/web` and `HTTP/web.$DOMAIN`).
- SPNs must be **unique** in the forest; duplicates cause authentication failures.
- When a client requests a TGS, it provides the SPN - the KDC looks up the account
  owning that SPN and encrypts the ticket with **that account's key**.

### UPN - User Principal Name

The **UPN** is the "login" form of an AD user: `user@realm` (e.g. `Administrator@$DOMAIN`).
Stored as the `userPrincipalName` attribute. It is the closest thing to an email-style
identifier and is often used for Kerberos authentication when the user logs in with
`user@domain` rather than `DOMAIN\user`.

### DN - Distinguished Name

The full LDAP path of an object: `CN=Administrator,CN=Users,DC=ROOTME,DC=LOCAL`.
Used in LDAP queries, ACLs, GPOs.

### SID - Security Identifier

A **SID** uniquely identifies a security principal (user, group, computer). Format:

```
S-1-5-21-<domain>-<domain>-<domain>-<RID>
```

- The first part (`S-1-5-21-...`) is the **domain SID**.
- The last part (**RID**) identifies the principal:
  - `500` = Administrator
  - `502` = krbtgt
  - `512` = Domain Admins
  - `513` = Domain Users
  - `515` = Domain Computers
  - `516` = Domain Controllers
  - `519` = Enterprise Admins

The **domain SID** is required to forge Golden Tickets (it is embedded in the PAC).

## Lexicon

### Encryption types

| Etype | Name       | Key derivation  | Notes                             |
| ----- | ---------- | --------------- | --------------------------------- |
| `23`  | RC4-HMAC   | NTLM hash (MD4) | Legacy, still enabled by default. |
| `17`  | AES128-CTS | string2key      | Modern, recommended.              |
| `18`  | AES256-CTS | string2key      | Modern, recommended.              |

RC4 uses the account's NTLM hash directly, which is why Pass-the-Hash works with
RC4 tickets. AES keys are derived from the plaintext password (via salted string2key)
and cannot be recovered from the NTLM hash — you need either the password or the AES
keys themselves (extracted from NTDS).

> [!warning] Why AES matters for ticket forging
> Forging with **RC4** only needs the NTLM hash. Forging with **AES** needs the AES
> keys, but produces tickets that are less likely to trip detections or fail PAC
> signature checks. Many hardened environments reject RC4-forged tickets outright.

### Kerberos extensions

::: details

| Term          | Meaning                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **S4U2Self**  | Service-for-User-to-Self. A service requests a ticket _to itself_ on behalf of a user.              |
| **S4U2Proxy** | Service-for-User-to-Proxy. A service uses an S4U2Self ticket to access another service as the user. |
| **U2U**       | User-to-User. A user requests a ticket to another user. Used by Sapphire.                           |
| **RBCD**      | Resource-Based Constrained Delegation. Delegation controlled by the target's ACL.                   |
| **PKINIT**    | Public Key Cryptography for Initial Authentication. Certificate-based Kerberos.                     |
| **FAST**      | Flexible Authentication Secure Tunneling. Protects pre-auth against offline cracking.               |

:::

## Resources

- [Many cheatsheets based on kerberos attacks](https://www.thehacker.recipes/ad/movement/kerberos/)
- [Kerberoas Overview](https://adsecurity.org/?p=3458)
- [Kerberoasting Explanation](https://www.vaadata.com/blog/fr/kerberoasting-comprendre-lattaque-et-les-mesures-de-protection/)
- [ASRep + ASReq + Rubeus](https://labs.lares.com/fear-kerberos-pt2/)
- [Kerberos Attack](https://medium.com/@tinopreter/attacking-kerberos-1e75a8ea4f66)
- [Rubeus exploit](https://trustedsec.com/blog/i-wanna-go-fast-really-fast-like-kerberos-fast)

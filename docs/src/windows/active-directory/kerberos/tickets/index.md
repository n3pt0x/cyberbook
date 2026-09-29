---
title: "Tickets"
---

# Kerberos Tickets

Kerberos uses tickets to authenticate and authorize actions across a domain.

> [!info] Reminder
> A **TGT** is issued by the AS and encrypted with the krbtgt key. A **TGS** is
> issued by the TGS and encrypted with a service's key. See
> [`kerberos`](/windows/active-directory/kerberos/index.md) for the theory.

## Choosing the Right Ticket

```
Do I have the krbtgt key?
├── Yes
│   ├── Do I also have a valid TGT?  ->  Diamond Ticket
│   └── No                           ->  Golden Ticket
│
└── No
    ├── Do I have a service account key?
    │   └── Yes                      ->  Silver Ticket
    │
    └── Do I have any valid domain account?
        └── Yes                      ->  Sapphire Ticket
```

> [!tip] Quick reference
>
> - [**Golden**](/windows/active-directory/kerberos/tickets/golden-tickets.md) - forges a TGT for any user, needs the krbtgt key.
> - [**Silver**](/windows/active-directory/kerberos/tickets/silver-tickets.md) - forges a TGS for one service, needs that service's key.
> - [**Diamond**](/windows/active-directory/kerberos/tickets/diamond-tickets.md) - modifies a legitimate TGT and re-signs it, needs the krbtgt key.
> - [**Sapphire**](/windows/active-directory/kerberos/tickets/sapphire-tickets.md) - abuses S4U2Self + U2U, needs only a valid account.

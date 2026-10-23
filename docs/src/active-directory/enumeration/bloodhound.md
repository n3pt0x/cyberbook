# BloodHound

## 🧰 Tools

- [SharpHound](https://github.com/SpecterOps/SharpHound)

## Usage

:::tabs

=== Windows

```powershell
SharpHound.exe --collectionmethods All
```

SharpHound cheatsheet [here](https://bloodhound.specterops.io/collect-data/ce-collection/sharphound-flags)

=== Unix

::: code-group

```bash [bloodhound.py]
bloodhound.py --zip -c All -d "$DOMAIN" -u "$USER" -p "$PASSWORD" -dc "$DC_HOST" -ns "$DC_IP" --dns-tcp
```

```bash [nxc]
nxc ldap "$DC_HOST" -d "$DOMAIN" -u "$USER" -p "$PASSWORD" --bloodhound -c All --dns-server "$DC_IP"
```

```bash [rusthound]
rusthound --zip -d "$DOMAIN" -i "$DC_IP" -u "$USER@$DOMAIN" -p "$PASSWORD" -o "$OUTDIR"
```

:::

![SharpHound Cheatsheet](/assets/SharpHound_cheatsheet.png){width=500}

## Privesc

- [aclpwn.py](https://github.com/fox-it/aclpwn.py) - Identify and exploit ACL based PrivEsc.
- [bloodhound-quickwin](https://github.com/kaluche/bloodhound-quickwin) - Extract useful informations.

## References

- [TheHackerRecipes](https://www.thehacker.recipes/)

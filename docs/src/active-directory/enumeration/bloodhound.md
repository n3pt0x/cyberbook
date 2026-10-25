# BloodHound

## 🧰 Tools

- [SharpHound](https://github.com/SpecterOps/SharpHound)

## Usage

### Gathering

:::tabs

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

# BloodHound CE
rusthound-ce -d "$DOMAIN" -u "$USER@$DOMAIN" -p "$PASSWORD" -f "$DC_HOST" -i "$DC_IP" -n "$DC_IP" --dns-tcp --ldaps -c All -z
```

=== Windows

```powershell
SharpHound.exe --collectionmethods All
```

SharpHound cheatsheet [here](https://bloodhound.specterops.io/collect-data/ce-collection/sharphound-flags)

:::

![SharpHound Cheatsheet](/assets/images/SharpHound_cheatsheet.png){width=500}

### GUI

::: code-group

```bash [BloodHound]
sudo neo4j start
bloodhound
```

```bash [BloodHound CE (Exegol)]
bloodhound-ce          # start (default user: admin)
bloodhound-ce reset    # reset admin password
```

:::

## Privesc

- [aclpwn.py](https://github.com/fox-it/aclpwn.py) - Identify and exploit ACL based PrivEsc.
- [bloodhound-quickwin](https://github.com/kaluche/bloodhound-quickwin) - Extract useful informations.
- [GPOHound](https://github.com/cogiceo/GPOHound) - GPO dumping and analysis from BloodHound.

## References

- [TheHackerRecipes](https://www.thehacker.recipes/)

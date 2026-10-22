# AD - Recon

## Resources

### Tools

- [ADRecon - Github tool](https://github.com/sense-of-security/ADRecon)

## Basic Recon

::: code-group

```bash [enum4linux]
enum4linux-ng -a $IP

enum4linux-ng -A -u "$DOMAIN"/"$USER" -p "$PASSWORD" "$DC_HOST"
```

```bash [nbtscan]
nbtscan -r $DC_HOST
```

:::

### DNS

::: code-group

```bash [bloodyAD]
bloodyAD --host "$DC_IP" -d "$DOMAIN" -u "$USER" -p "$PASSWORD" get dnsDump
```

```bash [nxc]
netexec smb "$DC_IP" -u "$USER" -p "$PASSWORD" -d "$DOMAIN" -M enum_dns
```

:::

## MS-RPC

- [TheHackerRecipes](https://www.thehacker.recipes/ad/recon/ms-rpc)
- [hacktricks](https://hacktricks.wiki/network-services-pentesting/135-pentesting-msrpc.html)

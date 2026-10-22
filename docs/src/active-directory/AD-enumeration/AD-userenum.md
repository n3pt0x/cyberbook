# AD Users Enumeration

## UserEnum

### Enum - kerbrute

```bash
# Validate users against Kerberos
kerbrute userenum -d domain.lan users.txt --dc $TARGET

# Password spraying via kerbrute
kerbrute bruteuser -d domain.lan -u username -p passlist.txt --dc $TARGET
```

### Enum - rpcclient

```bash
# No Auth
rpcclient -U "" $TARGET

# List users from SAMR interface
rpcclient -U 'domain\\user%password' $TARGET -c 'enumdomusers'

# Query specific user info
rpcclient -U 'domain\\user%password' $TARGET -c 'queryuser username'
```

### Impacket

```bash
impacket-lookupsid -no-pass -users $TARGET
impacket-samrdump -no-pass $TARGET
```
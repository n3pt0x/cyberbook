---
title: "Privilege Escalation"
---

# 🧗 Privilege escalation

## 📚 Resources

- [HackTricks](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html)
- [GTFOBins](https://gtfobins.org/)
- [Bypass restricted shell](https://fireshellsecurity.team/restricted-linux-shell-escaping-techniques/)

### Scripts Enumeration

- [linpeas.sh](https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh)
- [lse.sh (Linux Smart Enumeration)](https://github.com/diego-treitos/linux-smart-enumeration)
- [les.sh (Linux Exploit Suggester)](https://github.com/The-Z-Labs/linux-exploit-suggester)
- [Search for Kernel exploits](https://github.com/The-Z-Labs/linux-exploit-suggester)
- [pspy](https://github.com/DominicBreuker/pspy)
- [sudo-killer](https://github.com/TH3xACE/SUDO_KILLER)

## ⭐ Basic

### Stable shell

- [pwncat](https://pwncat.org/)
- [penelope](https://github.com/brightio/penelope)

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
```

```bash
(ctrl + z)
stty raw -echo; fg
```

## 🔍 Recon

### Basics

```bash
# OS
uname -a
cat /etc/os-release
```

```bash
# Network
ss -tulnp
netstat -tulnp
```

```bash
# Process
ps fauxwww
```

```bash
# capabilities
getcap -r / 2>/dev/null
capsh --print
```

```bash
# SUID
find / -perm -4000 2>/dev/null
find / -perm -u=s -type f 2>/dev/null
find / -type f -a \( -perm -u+s -o -perm -g+s \) -exec ls -l {} \; 2> /dev/null

# user & group
find / -type f -user "user" -exec ls -l {} + 2>/dev/null
find / -group <group> 2>/dev/null

# Search for specific symbol link
find / -type l -exec readlink -f {} \; 2>/dev/null  | grep "/path/to/folder"
```

## sudo

```bash
sudo -l

# sudo -u to exec command with specific user
sudo -u <user> <command> [option]

# use many command with sudo -u
echo '<COMMAND>' | sudo -u <user> tee -a file
```

## 📌 Tips

```bash
last # display last auth
lastb # display bad attempts auth with <user>:<password>
```

```bash
ln -s / link
cd link/etc # its like /etc, can be used for privesc (like bypass "../")
```

### Unshare

To use `chroot` or `mount` with unprivileged user, used `unshare`.

```bash
unshare -r
unshare -r -n -m /bin/sh
```

### Searching Pass / Creds

```bash
# To Check
- logfile
- command history : # .mysql_history, .bash_history ....
- db file
- crontab file # /proc/contrab
- /backup /var/backup /var/log /var/mail
```

```bash
grep -R /path -iE 'api|key|pass|user|DB_USER|DB_PASS|DB_NAME'
```

### Restriction

```bash
# TOCTOU check
find / -type d -perm -0002 -perm -1000 2>/dev/null
```

## Vulnerability research

### Vulnerable Binary

Search vulnerable version of binary in python repository.

```bash
pip freeze
```

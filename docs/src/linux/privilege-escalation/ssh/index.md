---
title: "SSH"
---

# 🔑 SSH Privilege Escalation & Hardening

## 🔐 Privilege Escalation

### Key reuse

```bash
# Check for re-used keys across hosts
for host in $(cat hosts.txt); do
  ssh -o BatchMode=yes $host "hostname" 2>/dev/null && echo "Key works on $host"
done
```

### SSH agent forwarding

```bash
# Check processes
ps aux | grep ssh

# Check if local SSH agent is running
env | grep SSH_AUTH_SOCK

# Forward local agent to target
ssh -A $USER@$TARGET
```

## 🔓 SSH CA Attack

When CA is trusted for root/admin access

::: details Vulnerable `sshd_config`

```bash
# SSH configuration (vulnerable)
PubkeyAuthentication yes
PasswordAuthentication yes
PermitRootLogin prohibit-password
TrustedUserCAKeys /path/to/ca.pub # HERE
```

:::

```bash
# Generate key
ssh-keygen -t ed25519 -f /tmp/key -N ""

# Sign key as root
ssh-keygen -s /path/to/ca -I "session_id" -n root -V +1h /tmp/key.pub

# Login as root
ssh -i /tmp/key root@localhost
```

```bash
# Sign key with multiple principals and 10min validity
ssh-keygen -s ca -I "backup-server" -n root,admin,deployer -V +10m user.pub
```

## 🛡️ Hardening

### Server configuration (/etc/ssh/sshd_config)

```bash
# Disable root login
PermitRootLogin no

# Use keys only
PasswordAuthentication no
PubkeyAuthentication yes

# Limit agent forwarding
AllowAgentForwarding no

# Disable user RC files
PermitUserRC no

# Restrict users/groups
AllowUsers user1 user2
AllowGroups ssh-users
```

### Client configuration (~/.ssh/config)

```bash
# Disable agent forwarding per host
Host untrusted
    ForwardAgent no

# Use confirmation for keys
    AddKeysToAgent confirm
```

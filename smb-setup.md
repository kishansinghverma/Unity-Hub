# Exatorrent SMB Setup on OCI Ubuntu

This guide documents the complete setup for exposing Exatorrent downloads over SMB from an Oracle Cloud Infrastructure (OCI) Ubuntu VM.

---

# 1. Make Exatorrent Files Accessible

Exatorrent data was stored under:

```text
/root/exadir
```

Since `/root` has restrictive permissions:

```bash
drwx------ /root
```

Samba cannot access files directly from this location.

Create a bind mount:

```bash
sudo mkdir -p /srv/exatorrent
sudo mount --bind /root/exadir /srv/exatorrent
```

Verify:

```bash
ls -lah /srv/exatorrent
```

Persist across reboots:

```bash
sudo nano /etc/fstab
```

Add:

```text
/root/exadir /srv/exatorrent none bind 0 0
```

Test:

```bash
sudo mount -a
```

---

# 2. Install Samba

```bash
sudo apt update
sudo apt install samba smbclient -y
```

Verify:

```bash
smbd --version
```

---

# 3. Create Samba Credentials

SSH key authentication does not work for SMB.

Create an SMB password:

```bash
sudo smbpasswd -a ubuntu
sudo smbpasswd -e ubuntu
```

Verify:

```bash
sudo pdbedit -L
```

---

# 4. Configure Samba Share

Edit Samba configuration:

```bash
sudo nano /etc/samba/smb.conf
```

Append:

```ini
[Downloads]
path = /srv/exatorrent
browseable = yes
read only = no
writable = yes

valid users = ubuntu

create mask = 0664
directory mask = 0775
```

Validate:

```bash
testparm
```

---

# 5. Start Samba

```bash
sudo systemctl enable smbd
sudo systemctl restart smbd
```

Verify:

```bash
sudo systemctl status smbd
```

---

# 6. Verify SMB Port

Confirm Samba is listening:

```bash
sudo ss -tlnp | grep 445
```

Expected:

```text
0.0.0.0:445
[::]:445
```

---

# 7. Configure OCI Security Rules

Create an Ingress Rule:

| Setting          | Value                                 |
| ---------------- | ------------------------------------- |
| Direction        | Ingress                               |
| Stateful         | Yes                                   |
| Protocol         | TCP                                   |
| Source CIDR      | Your IP/32 (or 0.0.0.0/0 for testing) |
| Source Port      | All                                   |
| Destination Port | 445                                   |

Apply to the Security List or NSG attached to the VM.

---

# 8. Configure Linux Firewall

Check existing rules:

```bash
sudo iptables -L INPUT --line-numbers -n
```

A REJECT rule may block SMB traffic:

```text
REJECT all -- 0.0.0.0/0 0.0.0.0/0 reject-with icmp-host-prohibited
```

Insert SMB allow rule before REJECT:

```bash
sudo iptables -I INPUT 7 -p tcp --dport 445 -j ACCEPT
```

Verify:

```bash
sudo iptables -L INPUT --line-numbers -n
```

Expected:

```text
ACCEPT tcp dpt:445
REJECT all
```

Persist rules:

```bash
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

---

# 9. Test Locally

List shares:

```bash
smbclient -L localhost -U ubuntu
```

Expected:

```text
Downloads
```

Access the share:

```bash
smbclient //localhost/Downloads -U ubuntu
```

---

# 10. Test Externally

Determine public IP:

```bash
curl -4 ifconfig.me
```

Test SMB port:

```bash
nc -vz <PUBLIC_IP> 445
```

Expected:

```text
Connection to <PUBLIC_IP> port 445 [tcp/microsoft-ds] succeeded!
```

---

# 11. Connect from macOS

Open:

```text
Finder → Go → Connect to Server
```

Connect using:

```text
smb://<PUBLIC_IP>/Downloads
```

Credentials:

```text
Username: ubuntu
Password: <SMB password>
```

---

# 12. Security Hardening

Instead of:

```text
0.0.0.0/0 → TCP 445
```

Restrict access to your public IP:

OCI Security Rule:

```text
Source CIDR:
YOUR_PUBLIC_IP/32
```

iptables:

```bash
sudo iptables -R INPUT 7 \
  -p tcp \
  -s YOUR_PUBLIC_IP \
  --dport 445 \
  -j ACCEPT
```

---

# 13. Recommended Alternative

For better security:

* Install Tailscale or WireGuard
* Close public SMB access
* Access SMB only through VPN

This significantly reduces exposure to Internet scans and attacks.

---

# Verification Checklist

* [ ] Bind mount configured
* [ ] Samba installed
* [ ] SMB user created
* [ ] Share configured
* [ ] smbd running
* [ ] Port 445 listening
* [ ] OCI ingress rule configured
* [ ] iptables rule added
* [ ] Rules persisted
* [ ] Local SMB test successful
* [ ] External SMB test successful
* [ ] macOS connection successful
* [ ] Security restrictions applied

```
```

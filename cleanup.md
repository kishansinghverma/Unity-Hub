# Session cleanup ledger

Last updated: 2026-08-31 (Asia/Kolkata)

## Rule for the remainder of this session

Before installing an application/tool/dependency or changing machine, shell, editor, Codex, network, or project configuration:

1. Add the planned action here with status `planned`.
2. Record its location and exact rollback procedure.
3. Perform the change only after the entry exists.
4. Change its status to `applied`, `failed`, or `reverted` afterward.

## Installed applications, tools, and dependencies

None. Existing system and repository tools were used; no package installation was performed.

## Configuration changes

### Local Oakter TCP emulator test — partially applied

- Temporary file created: `/private/tmp/oakter-emulator.py`.
- Planned listener: `192.168.2.1:12343` on the Mac hotspot bridge.
- Initial behavior: accept and log Oakter protocol frames, validate their alternating-byte XOR checksums, and acknowledge registration frames; do not send an IR command automatically.
- Planned firewall scope: redirect only TCP traffic from Oakter `192.168.2.2` destined for the observed Oakter server `3.124.134.67:12343` to the Mac listener at `192.168.2.1:12343`.
- Planned rule-loading command:

  ```sh
  echo 'rdr pass on bridge100 inet proto tcp from 192.168.2.2 to 3.124.134.67 port = 12343 -> 192.168.2.1 port 12343' | sudo pfctl -a com.apple/oakter-emulator -f -
  ```

- Exact firewall rollback command:

  ```sh
  sudo pfctl -a com.apple/oakter-emulator -F all
  ```

- Firmware-update traffic on TCP `35050` will not be redirected.
- The firewall change requires an interactive administrator command and must not be applied until the listener is running.
- Rollback: remove only the dedicated Oakter redirect rule/anchor described when it is applied, stop the emulator with `Ctrl-C`, and delete `/private/tmp/oakter-emulator.py` after testing.
- Status: emulator created and self-tested. Its process was stopped before the planned Mac restart. The PF anchor may remain until explicitly flushed or rebooted.

### Scoped Oakter DNS responder — planned

- Reason: macOS Internet Sharing currently returns DNS `SERVFAIL` to the ESP for `live.oakter.com`, preventing any TCP connection attempt even though the Mac and public DNS resolvers resolve the name successfully.
- Planned temporary file: `/private/tmp/oakter-dns.py`.
- Planned listener: UDP `192.168.2.1:10053`; answer `live.oakter.com` with the observed address `3.124.134.67` and forward any unrelated query to `1.1.1.1`.
- Planned firewall scope: add a second redirect in the existing `com.apple/oakter-emulator` anchor for DNS packets only from `192.168.2.2` to the Mac DNS service at `192.168.2.1:53`, redirecting them to `192.168.2.1:10053`.
- Planned combined rule-loading command (replaces the contents of only the dedicated anchor):

  ```sh
  printf '%s\n' 'rdr pass on bridge100 inet proto udp from 192.168.2.2 to 192.168.2.1 port = 53 -> 192.168.2.1 port 10053' 'rdr pass on bridge100 inet proto tcp from 192.168.2.2 to 3.124.134.67 port = 12343 -> 192.168.2.1 port 12343' | sudo pfctl -a com.apple/oakter-emulator -f -
  ```

- Rollback: `sudo pfctl -a com.apple/oakter-emulator -F all`, stop the responder with `Ctrl-C`, and delete `/private/tmp/oakter-dns.py`.
- Status: responder created and locally verified, but the redirect was ineffective because macOS Internet Sharing answered first. The responder process was stopped before the planned Mac restart. The temporary file remains for later reuse or cleanup.

### iPhone USB DNS override — planned

- Current setting: no manually configured DNS servers; macOS receives `172.20.10.1` and an IPv6 link-local resolver automatically from the iPhone USB service.
- Reason: the Mac resolves `live.oakter.com` and can query `1.1.1.1`, but the Internet Sharing DNS proxy returns `SERVFAIL` to hotspot clients.
- Planned change: set DNS on the `iPhone USB` network service to `1.1.1.1` and `8.8.8.8` temporarily.
- Apply: `sudo networksetup -setdnsservers 'iPhone USB' 1.1.1.1 8.8.8.8`.
- Rollback to the original automatic setting: `sudo networksetup -setdnsservers 'iPhone USB' empty`.
- Status: user applied the override successfully; `networksetup` reports `1.1.1.1` and `8.8.8.8`. The Internet Sharing DNS proxy still returned `SERVFAIL`; later inspection showed Internet Sharing NAT was incorrectly using `en10` while the working iPhone USB default route is `en5`. Rollback remains required.

### Mac restart — planned by user

- Before restart: clear the dedicated PF anchor with `sudo pfctl -a com.apple/oakter-emulator -F all` and restore automatic iPhone USB DNS with `sudo networksetup -setdnsservers 'iPhone USB' empty`.
- Restart command: `sudo shutdown -r now`.
- Codex resume directory: `/Users/kishansinghverma/Extras/Repos/Unity-Hub`.
- Codex resume command: `codex resume --last`; fallback: `codex resume --all` and select this conversation.
- The temporary TCP emulator and DNS responder processes were stopped before restart.
- Status: `planned`.

### Router remote syslog — applied by user

- Device: Digisol `DG-GR6821AC-NV` at `192.168.1.1`.
- Expected applied settings: logging enabled, Debugging level, mode `Both`, remote server `192.168.1.34`, UDP port `5514`.
- Purpose: observe Oakter connection activity without changing the Oakter device.
- Rollback: open **Management → Log File → System Log**, set **Log** to `Disable`, restore **Log Level** and **Display Level** to `Notice`, restore **Mode** to `Local`, then save/apply.
- Result: remote syslog captured the Oakter WPA2 handshake and DHCP lease, but no DNS queries, outbound connections, or command activity. Router syslog is insufficient for protocol capture.
- Status: `applied`; rollback is now recommended.

### Controlled Oakter hotspot — applied by user

- Planned Mac change: enable Internet Sharing from the iPhone USB connection to Wi-Fi, using a temporary 2.4 GHz WPA2 hotspot.
- Planned Oakter change: provision the remote onto the temporary hotspot SSID.
- Planned diagnostic artifact: a MAC-filtered packet capture under `/private/tmp/` containing only traffic involving Oakter MAC `24:62:ab:0e:0a:60` where supported by the capture interface.
- Security note: packet captures can contain destination names, addresses, tokens, and unencrypted payloads; do not commit or share the capture without review.
- Rollback:
  1. Stop packet capture.
  2. Turn off macOS Internet Sharing.
  3. Reconnect/re-provision the Oakter remote to the original 2.4 GHz Wi-Fi network.
  4. Remove the temporary hotspot credentials if they were saved.
  5. Delete the packet capture from `/private/tmp/` after analysis.
- Capture artifact: `/private/tmp/oakter-20260831.pcap` (8,529 bytes, 55 packets), created manually after the automated attempt was rejected because macOS required an interactive administrator password.
- Status: `applied`; capture completed successfully and the artifact remains on disk.
- Current diagnostic note: after the hotspot was recreated, its PF NAT rule used `en10` (link-local `169.254.x.x`) even though the functional iPhone USB uplink/default route is `en5` (`172.20.10.2`). This interface mismatch explains the hotspot DNS `SERVFAIL` responses and must be corrected by recreating Internet Sharing from the active `iPhone USB` service.
- Interface mapping verified from `/Library/Preferences/SystemConfiguration/com.apple.nat`: `iPhone USB 2` maps to stale/link-local `en10` and is not usable as the uplink. The working `iPhone USB` network service maps to `en5`, has `172.20.10.2`, and owns the default route. Use the non-`2` source and verify the generated NAT rule targets `en5` before restoring redirects.

No Terminal, shell, Codex, or Oakter-device configuration was changed.

Codex CLI approvals granted during documentation lookup allowed narrowly scoped `curl` requests to official OpenAI documentation. These are managed by the Codex session/application rather than this repository; no repository configuration file was changed.

## Repository source changes

### Committed during this session

- `e81ee1f` — Oakter device synchronization and the frontend refresh action.
  - Added `POST /api/oakterremote/syncdevices`.
  - Kept `GET /api/oakterremote/devices` as a live Oakter catalog request.
  - Added atomic persistence to `src/backend/static/oakterremote-devices.json`.
  - Added the Refresh Devices frontend control.
- `289dc8f` — Remote page visual and accessibility refresh.
  - Updated `src/frontends/emandi/src/pages/remote.tsx`.
  - Updated `src/frontends/emandi/src/pages/remote.css`.
- `6a69b5d` — Audio and haptic feedback refactor.
  - Updated `src/frontends/emandi/src/pages/remote.tsx`.

Review or revert these with normal Git operations; inspect each commit before reverting because later commits build on earlier ones.

### Currently uncommitted

- `src/frontends/emandi/src/pages/remote.tsx`
  - Replaces the generated audio-buffer feedback from `6a69b5d` with a simpler reusable `AudioContext`, short triangle-wave click, and shorter vibration pulses.

Before discarding this change, inspect it with:

```sh
git diff -- src/frontends/emandi/src/pages/remote.tsx
```

## Generated and runtime files

- `src/backend/static/oakterremote-devices.json`
  - Ignored by Git.
  - Runtime catalog produced by device synchronization.
  - Removing it deletes the locally persisted Oakter catalog; the next sync recreates it.
- `src/frontends/emandi/build/`
  - Ignored by Git.
  - Generated by frontend production-build verification.
  - Safe to regenerate with `npm run build --prefix src/frontends/emandi`.

## Read-only system and network investigation

- Inspected the active macOS network interface and ARP table.
- Performed one ICMP discovery pass over `192.168.1.0/24`; it created no persistent configuration.
- Identified the likely Oakter remote as `ESP_0E0A60` at `192.168.1.35`, MAC `24:62:ab:0e:0a:60`; the suffix also matches the Oakter catalog path `0e0a60`.
- Confirmed `192.168.1.35` responds to ICMP with TTL 255.
- Checked common TCP service ports `22`, `23`, `53`, `80`, `443`, `1883`, `3333`, `6666`–`6668`, `8000`, `8080`, `8266`, `8883`, `8888`, and `9000`; none were open.
- Identified the gateway as a Digisol `DG-GR6821AC-NV`, hardware `V4.1`, firmware `V3.2.00-250125`.
- Inspected the router's unauthenticated web UI and visible menu read-only. It exposes system logs and basic diagnostics but no visible packet-capture or port-mirroring control.
- Checked likely hidden packet-capture and port-mirroring page names; all returned HTTP 404.
- Confirmed the router can send local or remote syslog at levels through Debugging. No logging setting has been changed.
- Confirmed from the supplied router log that the Oakter remote completed its WPA2 handshake on `wlan1` and received `192.168.1.35` by DHCP at `20:08:30`.
- Captured a controlled Oakter reboot and three-command test through remote syslog on UDP `5514`; only WPA2, DHCP, and repetitive dnsmasq host-file events appeared.
- Captured Oakter traffic through the Mac hotspot (`bridge100`): the remote used `192.168.2.2`, resolved `live.oakter.com` to `3.124.134.67`, used plaintext TCP ports `35050` and `12343`, and exposed an ESP8266 OTA request plus a proprietary command stream. No configuration was changed during analysis.
- Checked router management ports `21`, `22`, `23`, `53`, `80`, `443`, `7547`, `8080`, and `8443`; only DNS (`53`) and HTTP(S) (`80`, `443`) were open. No SSH or Telnet service was found.
- Inspected Codex CLI version, terminal identity, terminfo capabilities, and relevant Codex config keys.
- Fetched official OpenAI and Apple documentation using `curl`; no downloaded files were retained.
- No packet capture, port scan, firmware access, router change, or Oakter hardware modification was performed.

## Cleanup checklist

- Review `git status --short` and all source diffs.
- Revert session commits only if their functionality is no longer wanted.
- Remove `src/frontends/emandi/build/` if generated build output should not remain locally.
- Remove `src/backend/static/oakterremote-devices.json` only if the cached device catalog should be discarded.
- Review Codex application approvals if temporary official-documentation command approvals should be removed.

# Open Fliqlo Lock Screen — GNOME Shell extension

Runs `fliqlo --lockscreen` inside the GNOME unlock dialog.

- **Portable zip / EGO-style install:** Flutter binary lives under `app/` inside the extension.
- **deb/rpm:** Extension is installed as a **User Extension** under
  `~/.local/share/gnome-shell/extensions/` and uses the shared binary at
  `/usr/lib/open-fliqlo/fliqlo` (no `app/` copy).

Clock options from extension preferences are passed as CLI flags and **override**
the app’s SharedPreferences for that lock session.

## Install (deb / rpm)

```bash
# Debian/Ubuntu
sudo dpkg -i open-fliqlo_*_amd64.deb
# Fedora/RHEL
sudo rpm -i open-fliqlo-*-1.x86_64.rpm
```

`postinstall` copies the extension into the **installing user’s**
`~/.local/share/gnome-shell/extensions/` (shows under **User Extensions** in
the Extensions app) and best-effort enables it.

If you installed as root without `sudo` (no `SUDO_USER`), or for another
account:

```bash
/usr/lib/open-fliqlo/install-user-extension.sh
gnome-extensions enable open-fliqlo-lockscreen@openfliqlo
```

First install this session: log out and back in, then Super+L.

> Note: `session-modes` is `unlock-dialog` only, so while the desktop is
> unlocked the extension stays `INITIALIZED` (not `ACTIVE`). That is normal;
> it activates on the lock screen.

## Install (portable release zip)

```bash
# From the extracted OpenFliqlo-linux-x64-* folder:
gnome-extensions install gnome-extension/open-fliqlo-lockscreen@openfliqlo.shell-extension.zip
gnome-extensions enable open-fliqlo-lockscreen@openfliqlo
# First install this session: log out and back in, then Super+L
```

## Dev install

```bash
cd apps/open_fliqlo && flutter build linux --release
cd ../../platforms/gnome_shell_extension
./install.sh   # rsyncs JS + copies the Flutter bundle into ~/.local/.../extensions/
gnome-extensions enable open-fliqlo-lockscreen@openfliqlo
```

## Pack (self-contained extension zip)

```bash
cd apps/open_fliqlo && flutter build linux --release
cd ../../platforms/gnome_shell_extension
./pack.sh dist
# optional: ./pack.sh dist --bundle=/path/to/bundle
```

Release Linux packages (`.deb` / `.rpm` / portable `.zip`) are built by
[`packaging/linux/package.sh`](../packaging/linux/package.sh) — see [ci.md](ci.md).

## Behavior (fixed)

Always applied on lock (not user-configurable):

- Hide the stock GNOME unlock clock
- Move the unlock prompt to the bottom
- Auto bottom margin ≈ 5% of monitor height (clamped 40–120 px)
- Hide the unlock profile avatar

## Preferences

### Clock (passed to `fliqlo`)

| Setting | Default | CLI flag |
|---|---|---|
| 24-hour clock | on | `--use-24-hour` / `--no-use-24-hour` |
| Show seconds | off | `--show-seconds` / `--no-show-seconds` |
| Show separators | on | `--show-separators` / `--no-show-separators` |
| Show flaps | on | `--show-flaps` / `--no-show-flaps` |
| Dim | `0.0` | `--dim=0..0.8` |
| Flip sound | off | `--flip-sound` / `--no-flip-sound` |

Example spawn:

```text
…/fliqlo --lockscreen --use-24-hour --no-show-seconds --dim=0 --show-flaps --show-separators --no-flip-sound
```

### Shell

| Setting | Default | Notes |
|---|---|---|
| Show on monitors | `all` | `current` \| `all` |
| Fade-in duration | `400` ms | |
| Window wait timeout | `20000` ms | Wait for Flutter window after spawn |

## Desktop CLI (any launch mode)

Priority: **CLI flag → SharedPreferences → built-in default**.

```bash
./fliqlo --screensaver --show-seconds --dim=0.3 --no-show-separators
```

## Layout on disk

**Portable zip / `pack.sh` / `install.sh` (self-contained):**

```
~/.local/share/gnome-shell/extensions/open-fliqlo-lockscreen@openfliqlo/
  extension.js
  prefs.js
  schemas/
  app/                 # Flutter Linux release bundle
    fliqlo
    data/
    lib/
```

**deb/rpm (User Extension + shared binary):**

```
/usr/lib/open-fliqlo/fliqlo
/usr/share/open-fliqlo/gnome-extension/   # package payload (no app/)
~/.local/share/gnome-shell/extensions/open-fliqlo-lockscreen@openfliqlo/
  extension.js
  prefs.js
  schemas/             # no app/ — uses /usr/lib/open-fliqlo/fliqlo
```

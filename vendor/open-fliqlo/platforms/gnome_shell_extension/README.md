# Open Fliqlo Lock Screen — GNOME Shell extension

Runs `fliqlo --lockscreen` in the GNOME unlock dialog (bundled `app/` or system
`/usr/lib/open-fliqlo/fliqlo` for deb/rpm User Extension installs).

Full docs: [docs/lockscreen-gnome.md](../../docs/lockscreen-gnome.md)

```bash
# Build Flutter Linux release, then install / pack
(cd ../../apps/open_fliqlo && flutter build linux --release)

# Dev install (rsync + bundled app into ~/.local/share/gnome-shell/extensions/)
./install.sh

# Or pack a self-contained zip for gnome-extensions install
./pack.sh
gnome-extensions install dist/open-fliqlo-lockscreen@openfliqlo.shell-extension.zip

gnome-extensions enable open-fliqlo-lockscreen@openfliqlo
```

Release `.deb` / `.rpm` / portable `.zip` (app + extension): see
[`packaging/linux/package.sh`](../../packaging/linux/package.sh).

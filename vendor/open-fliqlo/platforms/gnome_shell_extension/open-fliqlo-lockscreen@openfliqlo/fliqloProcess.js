import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {sleep} from './utils.js';

/**
 * Module-level singleton host.
 *
 * GNOME may call extension disable()/enable() several times during a single
 * lock. Live Lock Screen / Idlescape patterns: keep one subprocess for the
 * whole lock, and only SIGKILL it when the screen is actually unlocked.
 */
let host = null; // {proc, pid, window, binary}

export function hasHost() {
    return host !== null && host.proc !== null;
}

export function getHost() {
    return host;
}

/**
 * Live Lock Screen style teardown:
 *   proc.send_signal(9)  // SIGKILL — preferred race-free Gio API
 *   window.kill()        // Meta.Window fallback (LLS comment: send_signal
 *                        // sometimes does not do the job)
 * plus force_exit() like Idlescape's escalation path.
 */
export function stopHost(reason = 'stop') {
    if (!host) {
        console.log(`[OpenFliqloLockscreen] stopHost(${reason}): no host`);
        return;
    }

    const {proc, pid, window, binary} = host;
    host = null;
    console.log(
        `[OpenFliqloLockscreen] stopHost(${reason}): pid=${pid} binary=${binary}`
    );

    if (proc) {
        try {
            proc.send_signal(9);
        } catch (_e) {
            // ignore
        }
        try {
            proc.force_exit();
        } catch (_e) {
            // ignore
        }
    }

    if (window) {
        try {
            window.kill();
        } catch (_e) {
            // ignore
        }
    }

    if (pid && pid > 1) {
        try {
            // Absolute path — Shell PATH is minimal.
            GLib.spawn_command_line_sync(`/bin/kill -9 ${pid}`);
        } catch (_e) {
            try {
                GLib.spawn_command_line_sync(`/usr/bin/kill -9 ${pid}`);
            } catch (_e2) {
                // ignore
            }
        }
    }

    // Sweep any orphans matching our lockscreen argv (Idlescape "zombie safety").
    sweepLockscreenOrphans(binary);
}

/**
 * Kill leftover fliqlo --lockscreen processes via /proc.
 */
export function sweepLockscreenOrphans(binaryPath = null) {
    let dir;
    try {
        dir = Gio.File.new_for_path('/proc').enumerate_children(
            'standard::name',
            Gio.FileQueryInfoFlags.NONE,
            null
        );
    } catch (e) {
        console.error(`[OpenFliqloLockscreen] /proc scan failed: ${e}`);
        return;
    }

    let info;
    while ((info = dir.next_file(null)) !== null) {
        const name = info.get_name();
        if (!/^\d+$/.test(name))
            continue;
        const pid = parseInt(name, 10);
        if (pid <= 1)
            continue;

        let cmdline;
        try {
            const [, contents] = Gio.File.new_for_path(`/proc/${pid}/cmdline`)
                .load_contents(null);
            let s = '';
            for (let i = 0; i < contents.length; i++) {
                const b = contents[i];
                s += b === 0 ? ' ' : String.fromCharCode(b);
            }
            cmdline = s.trim();
        } catch (_e) {
            continue;
        }

        // Match "fliqlo" so both current (`fliqlo`) and legacy (`open_fliqlo`) binaries hit.
        if (!cmdline.includes('fliqlo') || !cmdline.includes('--lockscreen'))
            continue;
        if (binaryPath && !cmdline.includes(GLib.path_get_basename(binaryPath)) &&
            !cmdline.includes(binaryPath)) {
            // still kill any fliqlo --lockscreen
        }

        console.log(`[OpenFliqloLockscreen] sweep orphan pid=${pid}`);
        try {
            GLib.spawn_command_line_sync(`/bin/kill -9 ${pid}`);
        } catch (_e) {
            try {
                GLib.spawn_command_line_sync(`/usr/bin/kill -9 ${pid}`);
            } catch (_e2) {
                // ignore
            }
        }
    }

    try {
        dir.close(null);
    } catch (_e) {
        // ignore
    }
}

/**
 * Build fliqlo CLI flags from extension gsettings (clock page).
 * Matches FliqloSettingsArgsParser / FliqloSettingsArgsParser.toArgs.
 *
 * @param {Gio.Settings} settings
 * @returns {string[]}
 */
export function buildClockArgs(settings) {
    const dim = Math.min(0.8, Math.max(0, settings.get_double('dim')));
    const dimStr = String(Number(dim.toFixed(2)));
    return [
        settings.get_boolean('use-24-hour') ? '--use-24-hour' : '--no-use-24-hour',
        settings.get_boolean('show-seconds') ? '--show-seconds' : '--no-show-seconds',
        `--dim=${dimStr}`,
        settings.get_boolean('show-flaps') ? '--show-flaps' : '--no-show-flaps',
        settings.get_boolean('show-separators')
            ? '--show-separators'
            : '--no-show-separators',
        settings.get_boolean('flip-sound') ? '--flip-sound' : '--no-flip-sound',
    ];
}

export class FliqloProcess {
    /**
     * @param {string} binaryPath
     * @param {string[]} [clockArgs] Display flags from [buildClockArgs]
     */
    constructor(binaryPath, clockArgs = []) {
        this._binaryPath = binaryPath;
        this._clockArgs = clockArgs;
        this._proc = null;
        this._pid = null;
        this._window = null;
        this._winTimeoutId = null;
        this._mapHandler = 0;
        this._resolved = false;
        this.w = 0;
        this.h = 0;
    }

    async run() {
        // If a host already exists (lock thrashing), reuse it.
        if (host?.proc) {
            this._proc = host.proc;
            this._pid = host.pid;
            this._window = host.window;
            this._reused = true;
            return;
        }

        const argv = [this._binaryPath, '--lockscreen', ...this._clockArgs];
        this._proc = Gio.Subprocess.new(
            argv,
            Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE
        );
        this._pid = parseInt(this._proc.get_identifier(), 10);
        host = {
            proc: this._proc,
            pid: this._pid,
            window: null,
            binary: this._binaryPath,
        };
        this._reused = false;
    }

    async waitForWindow(timeoutMs) {
        if (this._reused && host?.window)
            return this._acceptWindow(host.window);

        const existing = this._findExistingWindow();
        if (existing)
            return this._acceptWindow(existing);

        return new Promise((resolve, reject) => {
            const finish = win => {
                if (this._resolved)
                    return;
                this._resolved = true;
                this._acceptWindow(win);
                this._disconnectMap();
                if (this._winTimeoutId !== null) {
                    GLib.source_remove(this._winTimeoutId);
                    this._winTimeoutId = null;
                }
                resolve(win);
            };

            this._mapHandler = global.window_manager.connect(
                'map',
                (_wm, windowActor) => {
                    const win = windowActor.get_meta_window();
                    if (!win || win.get_pid() !== this._pid)
                        return;
                    finish(win);
                }
            );

            this._winTimeoutId = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                timeoutMs,
                () => {
                    this._winTimeoutId = null;
                    this._disconnectMap();
                    if (this._resolved)
                        return GLib.SOURCE_REMOVE;
                    const late = this._findExistingWindow();
                    if (late)
                        finish(late);
                    else {
                        this._resolved = true;
                        reject(new Error(
                            `Timed out waiting for Open Fliqlo window (pid ${this._pid})`
                        ));
                    }
                    return GLib.SOURCE_REMOVE;
                }
            );

            (async () => {
                const steps = Math.ceil(timeoutMs / 250);
                for (let i = 0; i < steps; i++) {
                    if (this._resolved)
                        return;
                    await sleep(250);
                    if (this._resolved)
                        return;
                    const win = this._findExistingWindow();
                    if (win)
                        finish(win);
                }
            })();
        });
    }

    _acceptWindow(win) {
        this._window = win;
        const wpid = win.get_pid();
        if (wpid)
            this._pid = wpid;
        if (host) {
            host.window = win;
            host.pid = this._pid;
            host.proc = this._proc;
        }
        const rect = win.get_frame_rect();
        this.w = rect.width;
        this.h = rect.height;
        return win;
    }

    _findExistingWindow() {
        if (!this._pid)
            return null;
        for (const actor of global.get_window_actors()) {
            const win = actor.meta_window;
            if (win && win.get_pid() === this._pid)
                return win;
        }
        return null;
    }

    _disconnectMap() {
        if (this._mapHandler) {
            global.window_manager.disconnect(this._mapHandler);
            this._mapHandler = 0;
        }
    }

    /**
     * Detach JS refs only — do NOT kill. Killing is stopHost()'s job when
     * the screen is actually unlocked (survives enable/disable thrashing).
     */
    detach() {
        if (this._winTimeoutId !== null) {
            GLib.source_remove(this._winTimeoutId);
            this._winTimeoutId = null;
        }
        this._disconnectMap();
        this._proc = null;
        this._window = null;
        this._pid = null;
    }
}

function _exists(path) {
    try {
        return Gio.File.new_for_path(path).query_exists(null);
    } catch (_e) {
        return false;
    }
}

/**
 * Resolve the Flutter Linux binary:
 *   1. `<extension>/app/fliqlo` (portable zip / user install)
 *   2. `/usr/lib/open-fliqlo/fliqlo` (deb/rpm system package)
 *
 * @param {string} extensionPath Absolute path to the installed extension dir
 * @returns {string|null}
 */
export function resolveBundledBinary(extensionPath) {
    if (extensionPath) {
        const bundled = GLib.build_filenamev([extensionPath, 'app', 'fliqlo']);
        if (_exists(bundled))
            return bundled;
    }
    const system = '/usr/lib/open-fliqlo/fliqlo';
    if (_exists(system))
        return system;
    return null;
}

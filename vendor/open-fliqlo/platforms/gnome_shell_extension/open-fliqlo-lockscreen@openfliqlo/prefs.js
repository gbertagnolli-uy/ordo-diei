import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class OpenFliqloLockscreenPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const clockPage = new Adw.PreferencesPage({
            title: _('Clock'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(clockPage);

        const clockGroup = new Adw.PreferencesGroup({
            title: _('Flip clock'),
            description: _(
                'These options are passed to the bundled Open Fliqlo process ' +
                'as command-line flags (they override the app SharedPreferences).'
            ),
        });
        clockPage.add(clockGroup);

        this._addSwitch(
            clockGroup,
            settings,
            'use-24-hour',
            _('24-hour clock')
        );
        this._addSwitch(
            clockGroup,
            settings,
            'show-seconds',
            _('Show seconds')
        );
        this._addSwitch(
            clockGroup,
            settings,
            'show-separators',
            _('Show separators')
        );
        this._addSwitch(
            clockGroup,
            settings,
            'show-flaps',
            _('Show flaps')
        );

        const dimRow = new Adw.SpinRow({
            title: _('Dim'),
            subtitle: _('Black overlay opacity (0–0.8)'),
            digits: 2,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 0.8,
                step_increment: 0.05,
                page_increment: 0.1,
                value: settings.get_double('dim'),
            }),
        });
        settings.bind(
            'dim',
            dimRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );
        clockGroup.add(dimRow);

        this._addSwitch(
            clockGroup,
            settings,
            'flip-sound',
            _('Flip sound'),
            _('Only used by the interactive app; lockscreen stays silent')
        );

        const shellPage = new Adw.PreferencesPage({
            title: _('Shell'),
            icon_name: 'applications-system-symbolic',
        });
        window.add(shellPage);

        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Lock screen behavior'),
            description: _(
                'Open Fliqlo is bundled with this extension. Stock clock and ' +
                'avatar are hidden automatically; the unlock prompt sits at ' +
                'the bottom with a margin scaled to your display.'
            ),
        });
        shellPage.add(behaviorGroup);

        const monitorMode = new Adw.ComboRow({
            title: _('Show on monitors'),
            subtitle: _(
                'Full flip clock on each selected screen — never split across monitors'
            ),
            model: new Gtk.StringList({
                strings: [
                    _('Current monitor only'),
                    _('All monitors'),
                ],
            }),
        });
        const modeToIndex = mode => (mode === 'all' ? 1 : 0);
        const indexToMode = index => (index === 1 ? 'all' : 'current');
        monitorMode.selected = modeToIndex(settings.get_string('monitor-mode'));
        monitorMode.connect('notify::selected', () => {
            settings.set_string(
                'monitor-mode',
                indexToMode(monitorMode.selected)
            );
        });
        settings.connect('changed::monitor-mode', () => {
            const next = modeToIndex(settings.get_string('monitor-mode'));
            if (monitorMode.selected !== next)
                monitorMode.selected = next;
        });
        behaviorGroup.add(monitorMode);

        const fadeRow = new Adw.SpinRow({
            title: _('Fade-in duration'),
            subtitle: _('Milliseconds'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 3000,
                step_increment: 50,
                page_increment: 100,
                value: settings.get_int('fade-in-ms'),
            }),
        });
        settings.bind(
            'fade-in-ms',
            fadeRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );
        behaviorGroup.add(fadeRow);

        const timeoutRow = new Adw.SpinRow({
            title: _('Window wait timeout'),
            subtitle: _('Milliseconds to wait for Open Fliqlo to appear'),
            adjustment: new Gtk.Adjustment({
                lower: 5000,
                upper: 60000,
                step_increment: 1000,
                page_increment: 5000,
                value: settings.get_int('window-timeout-ms'),
            }),
        });
        settings.bind(
            'window-timeout-ms',
            timeoutRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );
        behaviorGroup.add(timeoutRow);
    }

    _addSwitch(group, settings, key, title, subtitle = null) {
        const row = new Adw.SwitchRow({
            title,
            subtitle: subtitle ?? null,
        });
        settings.bind(
            key,
            row,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        group.add(row);
    }
}

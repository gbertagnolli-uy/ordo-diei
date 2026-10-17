import 'settings.dart';

/// Partial settings from CLI; `null` fields fall through to SharedPreferences.
class FliqloSettingsOverrides {
  const FliqloSettingsOverrides({
    this.use24Hour,
    this.showSeconds,
    this.dim,
    this.showFlaps,
    this.showSeparators,
    this.enableFlipSound,
  });

  final bool? use24Hour;
  final bool? showSeconds;
  final double? dim;
  final bool? showFlaps;
  final bool? showSeparators;
  final bool? enableFlipSound;

  bool get isEmpty =>
      use24Hour == null &&
      showSeconds == null &&
      dim == null &&
      showFlaps == null &&
      showSeparators == null &&
      enableFlipSound == null;

  /// Merge onto [base]: each non-null override wins.
  FliqloSettings apply(FliqloSettings base) {
    return base.copyWith(
      use24Hour: use24Hour,
      showSeconds: showSeconds,
      dim: dim,
      showFlaps: showFlaps,
      showSeparators: showSeparators,
      enableFlipSound: enableFlipSound,
    );
  }

  FliqloSettingsOverrides merge(FliqloSettingsOverrides other) {
    return FliqloSettingsOverrides(
      use24Hour: other.use24Hour ?? use24Hour,
      showSeconds: other.showSeconds ?? showSeconds,
      dim: other.dim ?? dim,
      showFlaps: other.showFlaps ?? showFlaps,
      showSeparators: other.showSeparators ?? showSeparators,
      enableFlipSound: other.enableFlipSound ?? enableFlipSound,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is FliqloSettingsOverrides &&
        other.use24Hour == use24Hour &&
        other.showSeconds == showSeconds &&
        other.dim == dim &&
        other.showFlaps == showFlaps &&
        other.showSeparators == showSeparators &&
        other.enableFlipSound == enableFlipSound;
  }

  @override
  int get hashCode => Object.hash(
        use24Hour,
        showSeconds,
        dim,
        showFlaps,
        showSeparators,
        enableFlipSound,
      );
}

/// Parses display settings from program arguments.
///
/// Supported flags (later occurrences win):
/// - `--use-24-hour` / `--no-use-24-hour` / `--use-24-hour=true|false`
/// - `--show-seconds` / `--no-show-seconds` / `--show-seconds=true|false`
/// - `--show-flaps` / `--no-show-flaps` / `--show-flaps=true|false`
/// - `--show-separators` / `--no-show-separators` / `--show-separators=true|false`
/// - `--flip-sound` / `--no-flip-sound` / `--flip-sound=true|false`
/// - `--dim=<0..0.8>` or `--dim <value>`
///
/// Launch-mode flags (`--screensaver`, `--lockscreen`, …) are ignored here.
abstract final class FliqloSettingsArgsParser {
  static const _modeFlags = {
    '--screensaver',
    '-screensaver',
    '--lockscreen',
    '-lockscreen',
    '--configure',
    '-configure',
    '--preview',
    '-preview',
  };

  /// Serialize [settings] to CLI flags (always emits every field).
  static List<String> toArgs(FliqloSettings settings) {
    return [
      settings.use24Hour ? '--use-24-hour' : '--no-use-24-hour',
      settings.showSeconds ? '--show-seconds' : '--no-show-seconds',
      '--dim=${_formatDim(settings.dim)}',
      settings.showFlaps ? '--show-flaps' : '--no-show-flaps',
      settings.showSeparators ? '--show-separators' : '--no-show-separators',
      settings.enableFlipSound ? '--flip-sound' : '--no-flip-sound',
    ];
  }

  static FliqloSettingsOverrides parse(List<String> args) {
    bool? use24Hour;
    bool? showSeconds;
    double? dim;
    bool? showFlaps;
    bool? showSeparators;
    bool? enableFlipSound;

    for (var i = 0; i < args.length; i++) {
      final raw = args[i];
      if (!raw.startsWith('-')) continue;

      final lower = raw.toLowerCase();
      if (_modeFlags.contains(lower)) continue;

      bool? takeBool(String name) {
        final eq = '--$name=';
        if (lower == '--$name') return true;
        if (lower == '--no-$name') return false;
        if (lower.startsWith(eq)) return _parseBool(lower.substring(eq.length));
        return null;
      }

      final u24 = takeBool('use-24-hour');
      if (u24 != null) {
        use24Hour = u24;
        continue;
      }
      final secs = takeBool('show-seconds');
      if (secs != null) {
        showSeconds = secs;
        continue;
      }
      final flaps = takeBool('show-flaps');
      if (flaps != null) {
        showFlaps = flaps;
        continue;
      }
      final seps = takeBool('show-separators');
      if (seps != null) {
        showSeparators = seps;
        continue;
      }
      // Alias: --flip-sound maps to enableFlipSound.
      final sound = takeBool('flip-sound') ?? takeBool('enable-flip-sound');
      if (sound != null) {
        enableFlipSound = sound;
        continue;
      }

      if (lower.startsWith('--dim=')) {
        dim = _parseDim(lower.substring('--dim='.length)) ?? dim;
        continue;
      }
      if (lower == '--dim' && i + 1 < args.length) {
        dim = _parseDim(args[++i]) ?? dim;
        continue;
      }
    }

    return FliqloSettingsOverrides(
      use24Hour: use24Hour,
      showSeconds: showSeconds,
      dim: dim,
      showFlaps: showFlaps,
      showSeparators: showSeparators,
      enableFlipSound: enableFlipSound,
    );
  }

  static bool? _parseBool(String raw) {
    switch (raw.trim().toLowerCase()) {
      case '1':
      case 'true':
      case 'yes':
      case 'on':
        return true;
      case '0':
      case 'false':
      case 'no':
      case 'off':
        return false;
      default:
        return null;
    }
  }

  static double? _parseDim(String raw) {
    final v = double.tryParse(raw.trim());
    if (v == null) return null;
    return v.clamp(0.0, 0.8);
  }

  static String _formatDim(double dim) {
    final clamped = dim.clamp(0.0, 0.8);
    if (clamped == clamped.roundToDouble()) {
      return clamped.toStringAsFixed(0);
    }
    // Trim trailing zeros: 0.40 → 0.4
    var s = clamped.toStringAsFixed(2);
    while (s.contains('.') && (s.endsWith('0') || s.endsWith('.'))) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }
}

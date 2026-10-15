import 'package:fliqlo_core/fliqlo_core.dart';
import 'package:flutter/material.dart';

import 'theme.dart';

/// How settings chrome is presented (drag handle vs dialog padding).
enum SettingsChrome {
  /// Phone / narrow: modal bottom sheet with a drag handle.
  sheet,

  /// Desktop / wide: centered dialog without a drag handle.
  dialog,
}

/// Dark preferences panel for the flip clock.
class SettingsSheet extends StatelessWidget {
  const SettingsSheet({
    super.key,
    required this.settings,
    required this.onChanged,
    this.onCommit,
    this.chrome = SettingsChrome.sheet,
  });

  final FliqloSettings settings;

  /// Preview / in-memory updates (e.g. every slider tick).
  final ValueChanged<FliqloSettings> onChanged;

  /// Immediate persist path for toggles and slider [onChangeEnd].
  ///
  /// Falls back to [onChanged] when null.
  final ValueChanged<FliqloSettings>? onCommit;

  final SettingsChrome chrome;

  /// Prefer a centered dialog once the viewport is comfortably wide.
  static const double wideBreakpoint = 600;

  static const double dialogMaxWidth = 420;

  static bool useWideDialog(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= wideBreakpoint;

  /// Bottom sheet on narrow viewports; centered dialog on wide ones.
  static Future<void> show(
    BuildContext context, {
    required Widget Function(BuildContext context, SettingsChrome chrome)
        builder,
  }) {
    final chrome = useWideDialog(context)
        ? SettingsChrome.dialog
        : SettingsChrome.sheet;

    if (chrome == SettingsChrome.dialog) {
      return showDialog<void>(
        context: context,
        barrierColor: const Color(0x99000000),
        builder: (context) {
          final maxHeight = MediaQuery.sizeOf(context).height * 0.85;
          return Dialog(
            backgroundColor: FliqloTheme.sheetBackground,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 24,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: dialogMaxWidth,
                maxHeight: maxHeight,
              ),
              child: builder(context, chrome),
            ),
          );
        },
      );
    }

    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: FliqloTheme.sheetBackground,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: builder(context, chrome),
        );
      },
    );
  }

  void _commit(FliqloSettings next) => (onCommit ?? onChanged)(next);

  @override
  Widget build(BuildContext context) {
    // Bound height so the sheet can scroll when content exceeds the
    // viewport (common in phone landscape).
    final maxHeight = MediaQuery.sizeOf(context).height;
    final isDialog = chrome == SettingsChrome.dialog;
    final padding = isDialog
        ? const EdgeInsets.fromLTRB(24, 20, 24, 24)
        : const EdgeInsets.fromLTRB(20, 12, 20, 24);

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: SingleChildScrollView(
          padding: padding,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!isDialog) ...[
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF444444),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              Text(
                'Settings',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: FliqloTheme.sheetForeground,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('24-hour clock'),
                value: settings.use24Hour,
                onChanged: (v) => _commit(settings.copyWith(use24Hour: v)),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Show seconds'),
                value: settings.showSeconds,
                onChanged: (v) => _commit(settings.copyWith(showSeconds: v)),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Show separators'),
                value: settings.showSeparators,
                onChanged: (v) =>
                    _commit(settings.copyWith(showSeparators: v)),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Show flaps'),
                value: settings.showFlaps,
                onChanged: (v) => _commit(settings.copyWith(showFlaps: v)),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Flip sound'),
                value: settings.enableFlipSound,
                onChanged: (v) =>
                    _commit(settings.copyWith(enableFlipSound: v)),
              ),
              const SizedBox(height: 8),
              Text(
                'Dim (${(settings.dim * 100).round()}%)',
                style: const TextStyle(color: FliqloTheme.sheetForeground),
              ),
              Slider(
                value: settings.dim,
                min: 0,
                max: 0.8,
                onChanged: (v) => onChanged(settings.copyWith(dim: v)),
                onChangeEnd: (v) => _commit(settings.copyWith(dim: v)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

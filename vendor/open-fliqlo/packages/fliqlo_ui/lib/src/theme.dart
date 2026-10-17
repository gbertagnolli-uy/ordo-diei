import 'package:flutter/material.dart';

/// Visual tokens for the Open Fliqlo clock face.
abstract final class FliqloTheme {
  // [Ordo Diei] Paleta oscura (original) y clara, elegida al arrancar con [light];
  // [transparentBackground] deja el fondo sin pintar para embeber el reloj en otra página.
  static bool light = false;
  static bool transparentBackground = false;

  static Color get background => transparentBackground
      ? const Color(0x00000000)
      : (light ? const Color(0xFFFAF9F6) : const Color(0xFF000000));
  static Color get digitBackground =>
      light ? const Color(0xFFEDEBE4) : const Color(0xFF1A1A1A);
  static Color get digitForeground =>
      light ? const Color(0xFF1C1B19) : const Color(0xFFF5F5F5);
  static Color get hinge =>
      light ? const Color(0xFFC9C6BC) : const Color(0xFF0A0A0A);
  static const Color sheetBackground = Color(0xFF141414);
  static const Color sheetForeground = Color(0xFFE8E8E8);

  static const Duration flipDuration = Duration(milliseconds: 500);

  /// Digit font from gluqlo.ttf (glyphs: 0–9, A, M, P).
  static const String digitFontFamily = 'Fliqlo';
  static const String digitFontPackage = 'fliqlo_ui';

  static ThemeData material() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.dark(
        surface: sheetBackground,
        onSurface: sheetForeground,
        primary: digitForeground,
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: digitForeground,
        inactiveTrackColor: Color(0xFF333333),
        thumbColor: digitForeground,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => digitForeground,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? const Color(0xFF555555)
              : const Color(0xFF333333),
        ),
      ),
    );
  }
}

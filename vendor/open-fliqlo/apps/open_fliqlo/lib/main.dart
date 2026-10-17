import 'package:fliqlo_core/fliqlo_core.dart';
import 'package:fliqlo_ui/fliqlo_ui.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'clock_screen.dart';
import 'launch_mode.dart';
import 'platform_shell.dart';

/// Global launch mode set in [main] before [runApp].
LaunchMode appLaunchMode = LaunchMode.normal;

/// CLI display overrides parsed in [main] (null fields → SharedPreferences).
FliqloSettingsOverrides appSettingsOverrides = const FliqloSettingsOverrides();

Future<void> main(List<String> args) async {
  WidgetsFlutterBinding.ensureInitialized();

  // [Ordo Diei] En la web los ajustes llegan por la URL del iframe:
  //   ?tema=claro|oscuro  ?fondo=transparente  ?modo=lockscreen  ?show-seconds=true ...
  // `tema`, `fondo` y `modo` son propios; el resto son las banderas de siempre (--clave=valor).
  if (kIsWeb) {
    final query = Uri.base.queryParameters;
    FliqloTheme.light = query['tema'] == 'claro';
    FliqloTheme.transparentBackground = query['fondo'] == 'transparente';
    args = [
      if (query['modo'] != null) '--${query['modo']}',
      for (final e in query.entries)
        if (!{'tema', 'fondo', 'modo'}.contains(e.key)) '--${e.key}=${e.value}',
    ];
  }

  appLaunchMode = LaunchModeParser.fromArgs(args);
  appSettingsOverrides = FliqloSettingsArgsParser.parse(args);

  // Android Dream / configure can pass mode via dartEntrypointArguments.
  // When args are empty, also check --dart-define LAUNCH_MODE.
  const defineMode = String.fromEnvironment('LAUNCH_MODE');
  if (args.isEmpty && defineMode.isNotEmpty) {
    appLaunchMode = LaunchModeParser.fromName(defineMode);
  }

  await PlatformShell.initialize(appLaunchMode);

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.black,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(
    OpenFliqloApp(
      mode: appLaunchMode,
      settingsOverrides: appSettingsOverrides,
    ),
  );
}

class OpenFliqloApp extends StatelessWidget {
  const OpenFliqloApp({
    super.key,
    this.mode = LaunchMode.normal,
    this.settingsOverrides = const FliqloSettingsOverrides(),
  });

  final LaunchMode mode;
  final FliqloSettingsOverrides settingsOverrides;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Open Fliqlo',
      debugShowCheckedModeBanner: false,
      theme: FliqloTheme.material(),
      builder: (context, child) {
        if (mode.isScreensaverLike) {
          return MouseRegion(
            cursor: SystemMouseCursors.none,
            child: child ?? const SizedBox.shrink(),
          );
        }
        return child ?? const SizedBox.shrink();
      },
      home: ClockScreen(
        mode: mode,
        settingsOverrides: settingsOverrides,
      ),
    );
  }
}

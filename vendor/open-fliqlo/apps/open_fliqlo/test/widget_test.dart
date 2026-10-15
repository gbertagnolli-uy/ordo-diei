import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:open_fliqlo/launch_mode.dart';
import 'package:open_fliqlo/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _pumpUntilReady(WidgetTester tester) async {
  await tester.pump();
  await tester.idle();
  await tester.pump();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('OpenFliqloApp builds in normal mode', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const OpenFliqloApp());
    await _pumpUntilReady(tester);
    expect(find.byType(OpenFliqloApp), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('screensaver mode has no settings long-press path', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const OpenFliqloApp(mode: LaunchMode.screensaver));
    await _pumpUntilReady(tester);

    // Do not dispatch pointer events: screensaver input calls exit(0) on desktop.
    expect(
      find.byWidgetPredicate(
        (widget) => widget is GestureDetector && widget.onLongPress != null,
      ),
      findsNothing,
    );
    expect(find.text('Settings'), findsNothing);
  });

  testWidgets('normal mode opens settings on secondary tap', (tester) async {
    SharedPreferences.setMockInitialValues({});
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const OpenFliqloApp());
    await _pumpUntilReady(tester);
    expect(find.byType(CircularProgressIndicator), findsNothing);

    final settingsTarget = find.byWidgetPredicate(
      (widget) =>
          widget is GestureDetector && widget.onSecondaryTap != null,
    );
    expect(settingsTarget, findsOneWidget);

    await tester.tap(settingsTarget, buttons: kSecondaryButton);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Settings'), findsOneWidget);
    expect(find.byType(Dialog), findsOneWidget);
  });
}

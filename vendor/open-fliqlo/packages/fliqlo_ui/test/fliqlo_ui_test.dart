import 'package:fliqlo_core/fliqlo_core.dart';
import 'package:fliqlo_ui/fliqlo_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

ClockSnapshot _snap({
  bool use24Hour = true,
  bool isPm = false,
}) {
  return ClockSnapshot(
    now: DateTime(2026, 9, 9, isPm ? 14 : 9, 35),
    hourTens: 1,
    hourOnes: 4,
    minuteTens: 3,
    minuteOnes: 5,
    secondTens: 0,
    secondOnes: 0,
    flips: {
      for (final s in DigitSlot.values) s: FlipState.settled(0),
    },
    showSeconds: false,
    use24Hour: use24Hour,
    isPm: isPm,
  );
}

void main() {
  testWidgets('ClockFace renders without overflow', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 600,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byType(ClockFace), findsOneWidget);
    expect(find.text('AM'), findsNothing);
    expect(find.text('PM'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  test('DigitGlyphAtlas rasters 0-9 and AM/PM once per size', () async {
    final atlas = DigitGlyphAtlas();
    addTearDown(atlas.dispose);

    var notifications = 0;
    atlas.addListener(() => notifications++);

    const size = Size(72, 100);
    await atlas.ensure(digitSize: size, dpr: 1);
    expect(atlas.isReady, isTrue);
    expect(notifications, 1);

    await atlas.ensure(digitSize: size, dpr: 1);
    expect(notifications, 1);

    await atlas.ensure(digitSize: const Size(80, 110), dpr: 1);
    expect(atlas.isReady, isTrue);
    expect(notifications, 2);
  });

  testWidgets('ClockFace shows AM/PM in 12-hour mode', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 600,
            child: ClockFace(
              snapshot: _snap(use24Hour: false, isPm: true),
              settings: const FliqloSettings(use24Hour: false),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // AM/PM is drawn via CustomPainter (not a Text widget).
    expect(find.byType(CustomPaint), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('ClockFace isolates each digit and colon with RepaintBoundary',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 600,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // 4 digits + 1 colon (no seconds).
    expect(find.byType(RepaintBoundary), findsAtLeastNWidgets(5));
    expect(find.byType(FlipDigit), findsNWidgets(4));
  });

  testWidgets('landscape fills the binding viewport axis', (tester) async {
    const viewW = 800.0;
    const viewH = 600.0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: viewW,
            height: viewH,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    final digits = find.byType(FlipDigit);
    final left = tester.getTopLeft(digits.at(0)).dx;
    final right = tester.getBottomRight(digits.at(3)).dx;
    // Landscape: width is binding — row should span most of the view.
    expect(right - left, greaterThan(viewW * 0.85));
  });

  testWidgets('hiding separators reclaims space for larger digits',
      (tester) async {
    Future<Size> digitSize({required bool showSeparators}) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 800,
              height: 600,
              child: ClockFace(
                snapshot: _snap(),
                settings: FliqloSettings(showSeparators: showSeparators),
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));
      return tester.getSize(find.byType(FlipDigit).first);
    }

    final withColon = await digitSize(showSeparators: true);
    final withoutColon = await digitSize(showSeparators: false);
    expect(withoutColon.width, greaterThan(withColon.width));
    expect(withoutColon.height, greaterThan(withColon.height));
  });

  testWidgets('SettingsSheet scrolls in a short landscape viewport', (tester) async {
    // Phone landscape-ish: wide but short — content taller than viewport.
    await tester.binding.setSurfaceSize(const Size(800, 280));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: Scaffold(
          body: SettingsSheet(
            settings: const FliqloSettings(),
            onChanged: (_) {},
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('24-hour clock'), findsOneWidget);

    // Dim slider sits below the fold in this viewport; drag to reveal.
    await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -200));
    await tester.pumpAndSettle();

    expect(find.textContaining('Dim'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('SettingsSheet.show uses a centered dialog on wide viewports',
      (tester) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: Builder(
          builder: (context) {
            return Scaffold(
              body: Center(
                child: TextButton(
                  onPressed: () {
                    SettingsSheet.show(
                      context,
                      builder: (context, chrome) {
                        expect(chrome, SettingsChrome.dialog);
                        return SettingsSheet(
                          chrome: chrome,
                          settings: const FliqloSettings(),
                          onChanged: (_) {},
                        );
                      },
                    );
                  },
                  child: const Text('Open'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.byType(Dialog), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
    expect(find.byType(SettingsSheet), findsOneWidget);
  });

  testWidgets('SettingsSheet.show uses a bottom sheet on narrow viewports',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: Builder(
          builder: (context) {
            return Scaffold(
              body: Center(
                child: TextButton(
                  onPressed: () {
                    expect(MediaQuery.sizeOf(context).width, lessThan(600));
                    SettingsSheet.show(
                      context,
                      builder: (context, chrome) {
                        expect(chrome, SettingsChrome.sheet);
                        return SettingsSheet(
                          chrome: chrome,
                          settings: const FliqloSettings(),
                          onChanged: (_) {},
                        );
                      },
                    );
                  },
                  child: const Text('Open'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.byType(Dialog), findsNothing);
    expect(find.text('Settings'), findsOneWidget);
  });

  testWidgets('ClockFace uses vertical layout in portrait viewport',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 400,
            height: 800,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byType(ClockFace), findsOneWidget);
    expect(find.byType(FlipDigit), findsNWidgets(4));
    expect(find.byType(Column), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('ClockFace vertical layout forces no separators',
      (tester) async {
    Finder colonPainters() => find.byWidgetPredicate(
          (w) =>
              w is CustomPaint &&
              w.painter.runtimeType.toString() == '_ColonPainter',
        );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 400,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(showSeparators: true),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    expect(colonPainters(), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 400,
            height: 800,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(showSeparators: true),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    expect(colonPainters(), findsNothing);
  });

  testWidgets('ClockFace portrait with seconds fits without overflow',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 400,
            height: 800,
            child: ClockFace(
              snapshot: _snap(),
              settings: const FliqloSettings(showSeconds: true),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.byType(FlipDigit), findsNWidgets(6));
    expect(tester.takeException(), isNull);
  });

  testWidgets('ClockFace debounces onDigitFlip across simultaneous flips',
      (tester) async {
    var flips = 0;
    final snap1 = _snap();
    final snap2 = ClockSnapshot(
      now: DateTime(2026, 9, 9, 10, 0),
      hourTens: 1,
      hourOnes: 0,
      minuteTens: 0,
      minuteOnes: 0,
      secondTens: 0,
      secondOnes: 0,
      flips: {
        for (final s in DigitSlot.values) s: FlipState.settled(0),
      },
      showSeconds: false,
      use24Hour: true,
      isPm: false,
    );

    late StateSetter setFaceState;
    var snapshot = snap1;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 600,
            child: StatefulBuilder(
              builder: (context, setState) {
                setFaceState = setState;
                return ClockFace(
                  snapshot: snapshot,
                  settings: const FliqloSettings(),
                  onDigitFlip: () => flips++,
                );
              },
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    expect(flips, 0);

    setFaceState(() => snapshot = snap2);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(flips, 1);
  });

  testWidgets('SettingsSheet exposes separators and flip sound toggles',
      (tester) async {
    var latest = const FliqloSettings();
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: Scaffold(
          body: SettingsSheet(
            settings: latest,
            onChanged: (s) => latest = s,
          ),
        ),
      ),
    );

    expect(find.text('Show separators'), findsOneWidget);
    expect(find.text('Flip sound'), findsOneWidget);
    expect(find.text('Force landscape'), findsNothing);
    expect(find.text('Vertical layout'), findsNothing);
    expect(find.textContaining('Scale'), findsNothing);

    await tester.tap(find.text('Show separators'));
    await tester.pumpAndSettle();
    expect(latest.showSeparators, isFalse);

    await tester.tap(find.text('Flip sound'));
    await tester.pumpAndSettle();
    expect(latest.enableFlipSound, isTrue);
  });
}

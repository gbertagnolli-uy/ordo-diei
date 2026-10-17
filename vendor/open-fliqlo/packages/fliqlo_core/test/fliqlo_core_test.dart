import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fliqlo_core/fliqlo_core.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('ClockEngine', () {
    test('delayUntilNextBoundary aligns to next second with slop', () {
      final now = DateTime(2026, 9, 9, 10, 0, 0, 200);
      final delay = ClockEngine.delayUntilNextBoundary(
        now,
        showSeconds: true,
      );
      expect(
        delay,
        const Duration(milliseconds: 800) + ClockEngine.boundarySlop,
      );
    });

    test('delayUntilNextBoundary aligns to next minute with slop', () {
      final now = DateTime(2026, 9, 9, 10, 0, 42, 250);
      final delay = ClockEngine.delayUntilNextBoundary(
        now,
        showSeconds: false,
      );
      expect(
        delay,
        const Duration(seconds: 17, milliseconds: 750) +
            ClockEngine.boundarySlop,
      );
    });

    test('delayUntilNextBoundary never goes below minScheduleDelay', () {
      final onBoundary = DateTime(2026, 9, 9, 10, 0, 5);
      expect(
        ClockEngine.delayUntilNextBoundary(onBoundary, showSeconds: true),
        greaterThanOrEqualTo(ClockEngine.minScheduleDelay),
      );
    });

    test('emits settled digits for initial time', () {
      final engine = ClockEngine(
        clock: () => DateTime(2026, 9, 9, 14, 35, 42),
      )..start();
      final snap = engine.snapshot!;
      expect(snap.hourTens, 1);
      expect(snap.hourOnes, 4);
      expect(snap.minuteTens, 3);
      expect(snap.minuteOnes, 5);
      expect(snap.secondTens, 4);
      expect(snap.secondOnes, 2);
      expect(snap.flipFor(DigitSlot.minuteOnes).isFlipping, isFalse);
      engine.dispose();
    });

    test('12-hour mode maps midnight and 13:00 correctly', () {
      final midnight = ClockEngine(
        use24Hour: false,
        clock: () => DateTime(2026, 9, 9, 0, 0),
      )..start();
      expect(midnight.snapshot!.hourTens, 1);
      expect(midnight.snapshot!.hourOnes, 2);
      expect(midnight.snapshot!.amPmLabel, 'AM');
      expect(midnight.snapshot!.isPm, isFalse);
      midnight.dispose();

      final pm = ClockEngine(
        use24Hour: false,
        clock: () => DateTime(2026, 9, 9, 13, 5),
      )..start();
      expect(pm.snapshot!.hourTens, 0);
      expect(pm.snapshot!.hourOnes, 1);
      expect(pm.snapshot!.amPmLabel, 'PM');
      expect(pm.snapshot!.isPm, isTrue);
      pm.dispose();
    });

    test('24-hour mode hides AM/PM label', () {
      final engine = ClockEngine(
        use24Hour: true,
        clock: () => DateTime(2026, 9, 9, 15, 0),
      )..start();
      expect(engine.snapshot!.amPmLabel, isNull);
      engine.dispose();
    });

    test('detects minute digit flip when time advances', () {
      final times = <DateTime>[
        DateTime(2026, 9, 9, 10, 0, 59),
        DateTime(2026, 9, 9, 10, 1, 0),
      ];
      var index = 0;
      final engine = ClockEngine(
        showSeconds: true,
        clock: () => times[index],
      )..start();
      expect(engine.snapshot!.minuteOnes, 0);
      expect(engine.snapshot!.secondOnes, 9);

      index = 1;
      engine.refresh();
      expect(engine.snapshot!.minuteOnes, 1);
      final flip = engine.snapshot!.flipFor(DigitSlot.minuteOnes);
      expect(flip.from, 0);
      expect(flip.to, 1);
      expect(flip.isFlipping, isTrue);
      engine.dispose();
    });

    test('does not notify when only seconds change and seconds are hidden', () {
      final times = <DateTime>[
        DateTime(2026, 9, 9, 10, 0, 10),
        DateTime(2026, 9, 9, 10, 0, 11),
      ];
      var index = 0;
      final engine = ClockEngine(
        showSeconds: false,
        clock: () => times[index],
      )..start();

      var notifications = 0;
      engine.addListener(() => notifications++);

      index = 1;
      engine.refresh();
      expect(notifications, 0);
      expect(engine.snapshot!.minuteOnes, 0);
      engine.dispose();
    });

    test('notifies when seconds change and seconds are shown', () {
      final times = <DateTime>[
        DateTime(2026, 9, 9, 10, 0, 10),
        DateTime(2026, 9, 9, 10, 0, 11),
      ];
      var index = 0;
      final engine = ClockEngine(
        showSeconds: true,
        clock: () => times[index],
      )..start();

      var notifications = 0;
      engine.addListener(() => notifications++);

      index = 1;
      engine.refresh();
      expect(notifications, 1);
      expect(engine.snapshot!.secondOnes, 1);
      engine.dispose();
    });

    test('one-shot timer fires once per second boundary', () {
      fakeAsync((async) {
        var now = DateTime(2026, 9, 9, 10, 0, 0, 200);
        final engine = ClockEngine(
          showSeconds: true,
          clock: () => now,
        )..start();

        var notifications = 0;
        engine.addListener(() => notifications++);

        final firstDelay = ClockEngine.delayUntilNextBoundary(
          DateTime(2026, 9, 9, 10, 0, 0, 200),
          showSeconds: true,
        );
        now = DateTime(2026, 9, 9, 10, 0, 1);
        async.elapse(firstDelay);
        expect(notifications, 1);
        expect(engine.snapshot!.secondOnes, 1);

        final secondDelay = ClockEngine.delayUntilNextBoundary(
          now,
          showSeconds: true,
        );
        now = DateTime(2026, 9, 9, 10, 0, 2);
        async.elapse(secondDelay);
        expect(notifications, 2);
        expect(engine.snapshot!.secondOnes, 2);

        engine.dispose();
      });
    });

    test('switching 12/24 hour resettles without flip artifact', () {
      final engine = ClockEngine(
        use24Hour: true,
        clock: () => DateTime(2026, 9, 9, 13, 0),
      )..start();
      expect(engine.snapshot!.hourTens, 1);
      expect(engine.snapshot!.hourOnes, 3);
      engine.updateOptions(use24Hour: false);
      expect(engine.snapshot!.hourOnes, 1);
      expect(engine.snapshot!.flipFor(DigitSlot.hourOnes).isFlipping, isFalse);
      engine.dispose();
    });
  });

  group('SettingsStore', () {
    test('load and persist settings', () async {
      SharedPreferences.setMockInitialValues({
        'use24Hour': false,
        'dim': 0.4,
        'showSeparators': false,
        'enableFlipSound': true,
      });
      final store = SettingsStore();
      await store.load();
      expect(store.settings.use24Hour, isFalse);
      expect(store.settings.dim, 0.4);
      expect(store.settings.showSeparators, isFalse);
      expect(store.settings.enableFlipSound, isTrue);

      await store.patch(
        showSeconds: true,
        showSeparators: true,
        enableFlipSound: false,
      );
      expect(store.settings.showSeconds, isTrue);
      expect(store.settings.showSeparators, isTrue);
      expect(store.settings.enableFlipSound, isFalse);

      final store2 = SettingsStore();
      await store2.load();
      expect(store2.settings.showSeconds, isTrue);
      expect(store2.settings.use24Hour, isFalse);
      expect(store2.settings.showSeparators, isTrue);
      expect(store2.settings.enableFlipSound, isFalse);
      store.dispose();
      store2.dispose();
    });

    test('showSeparators defaults to true when missing', () async {
      SharedPreferences.setMockInitialValues({});
      final store = SettingsStore();
      await store.load();
      expect(store.settings.showSeparators, isTrue);
      expect(store.settings.enableFlipSound, isFalse);
      store.dispose();
    });

    test('update debounces disk writes until flush or debounce elapses', () {
      fakeAsync((async) {
        SharedPreferences.setMockInitialValues({});
        final store = SettingsStore(
          persistDebounce: const Duration(milliseconds: 250),
        );
        // load() is async; drive it under fakeAsync.
        store.load();
        async.flushMicrotasks();

        store.update(store.settings.copyWith(dim: 0.1));
        store.update(store.settings.copyWith(dim: 0.2));
        store.update(store.settings.copyWith(dim: 0.3));
        expect(store.settings.dim, 0.3);

        // Debounce not elapsed — second store should still see defaults.
        async.elapse(const Duration(milliseconds: 249));
        async.flushMicrotasks();

        final early = SettingsStore();
        early.load();
        async.flushMicrotasks();
        expect(early.settings.dim, 0.0);
        early.dispose();

        async.elapse(const Duration(milliseconds: 1));
        async.flushMicrotasks();

        final late = SettingsStore();
        late.load();
        async.flushMicrotasks();
        expect(late.settings.dim, 0.3);
        late.dispose();
        store.dispose();
      });
    });

    test('commit persists immediately without waiting for debounce', () {
      fakeAsync((async) {
        SharedPreferences.setMockInitialValues({});
        final store = SettingsStore(
          persistDebounce: const Duration(seconds: 5),
        );
        store.load();
        async.flushMicrotasks();

        store.commit(store.settings.copyWith(dim: 0.7));
        async.flushMicrotasks();

        final other = SettingsStore();
        other.load();
        async.flushMicrotasks();
        expect(other.settings.dim, 0.7);
        other.dispose();
        store.dispose();
      });
    });

    test('CLI overrides win over SharedPreferences without writing them', () async {
      SharedPreferences.setMockInitialValues({
        'use24Hour': true,
        'showSeconds': false,
        'dim': 0.1,
      });
      final store = SettingsStore(
        overrides: const FliqloSettingsOverrides(
          use24Hour: false,
          showSeconds: true,
          dim: 0.5,
        ),
      );
      await store.load();
      expect(store.settings.use24Hour, isFalse);
      expect(store.settings.showSeconds, isTrue);
      expect(store.settings.dim, 0.5);
      expect(store.baseSettings.use24Hour, isTrue);
      expect(store.baseSettings.dim, 0.1);

      await store.flush();
      final reloaded = SettingsStore();
      await reloaded.load();
      expect(reloaded.settings.use24Hour, isTrue);
      expect(reloaded.settings.showSeconds, isFalse);
      expect(reloaded.settings.dim, 0.1);
      store.dispose();
      reloaded.dispose();
    });

    test('commit clears overrides and persists the new base', () async {
      SharedPreferences.setMockInitialValues({'showSeconds': false});
      final store = SettingsStore(
        overrides: const FliqloSettingsOverrides(showSeconds: true),
      );
      await store.load();
      expect(store.settings.showSeconds, isTrue);

      await store.commit(store.settings.copyWith(showSeconds: false));
      expect(store.overrides, isNull);
      expect(store.settings.showSeconds, isFalse);

      final reloaded = SettingsStore();
      await reloaded.load();
      expect(reloaded.settings.showSeconds, isFalse);
      store.dispose();
      reloaded.dispose();
    });
  });

  group('FliqloSettingsArgsParser', () {
    test('empty args yield empty overrides', () {
      expect(FliqloSettingsArgsParser.parse([]).isEmpty, isTrue);
      expect(
        FliqloSettingsArgsParser.parse(['--lockscreen']).isEmpty,
        isTrue,
      );
    });

    test('parses bool flags and dim', () {
      final o = FliqloSettingsArgsParser.parse([
        '--lockscreen',
        '--no-use-24-hour',
        '--show-seconds',
        '--dim=0.4',
        '--no-show-flaps',
        '--show-separators=false',
        '--flip-sound',
      ]);
      expect(o.use24Hour, isFalse);
      expect(o.showSeconds, isTrue);
      expect(o.dim, 0.4);
      expect(o.showFlaps, isFalse);
      expect(o.showSeparators, isFalse);
      expect(o.enableFlipSound, isTrue);
    });

    test('dim accepts separate value and clamps', () {
      expect(
        FliqloSettingsArgsParser.parse(['--dim', '0.9']).dim,
        0.8,
      );
      expect(
        FliqloSettingsArgsParser.parse(['--dim=-1']).dim,
        0.0,
      );
    });

    test('later flags win', () {
      final o = FliqloSettingsArgsParser.parse([
        '--show-seconds',
        '--no-show-seconds',
      ]);
      expect(o.showSeconds, isFalse);
    });

    test('toArgs round-trips through parse', () {
      const settings = FliqloSettings(
        use24Hour: false,
        showSeconds: true,
        dim: 0.25,
        showFlaps: false,
        showSeparators: false,
        enableFlipSound: true,
      );
      final args = FliqloSettingsArgsParser.toArgs(settings);
      final parsed = FliqloSettingsArgsParser.parse(args);
      expect(parsed.apply(const FliqloSettings()), settings);
    });

    test('apply only overlays provided fields', () {
      const base = FliqloSettings(use24Hour: true, dim: 0.2);
      const overrides = FliqloSettingsOverrides(showSeconds: true);
      final merged = overrides.apply(base);
      expect(merged.use24Hour, isTrue);
      expect(merged.showSeconds, isTrue);
      expect(merged.dim, 0.2);
    });
  });
}


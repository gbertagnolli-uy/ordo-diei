import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'settings.dart';
import 'settings_args.dart';

/// Persists [FliqloSettings] via [SharedPreferences].
///
/// Effective [settings] = CLI [overrides] (when set) layered on disk values.
/// [update] / [commit] / [patch] clear overrides and become the new base
/// (interactive UI takes ownership). Disk writes always use the base value,
/// so lockscreen argv overrides do not pollute SharedPreferences on dispose.
///
/// [update] applies settings in memory immediately and debounces disk writes.
/// [commit] / [flush] write through right away (toggles, slider end, dispose).
class SettingsStore extends ChangeNotifier {
  SettingsStore({
    SharedPreferences? prefs,
    this.persistDebounce = defaultPersistDebounce,
    FliqloSettingsOverrides? overrides,
  })  : _prefsOverride = prefs,
        _overrides = (overrides == null || overrides.isEmpty) ? null : overrides;

  /// Default delay before a debounced [update] hits disk.
  static const Duration defaultPersistDebounce = Duration(milliseconds: 250);

  final SharedPreferences? _prefsOverride;
  final Duration persistDebounce;

  SharedPreferences? _prefs;
  FliqloSettings _settings = const FliqloSettings();
  FliqloSettingsOverrides? _overrides;
  bool _loaded = false;
  Timer? _persistTimer;
  Future<void>? _persistInFlight;
  bool _disposed = false;

  /// Disk-backed settings with optional CLI overrides applied.
  FliqloSettings get settings =>
      _overrides == null ? _settings : _overrides!.apply(_settings);

  /// Values loaded from SharedPreferences (ignores CLI overrides).
  FliqloSettings get baseSettings => _settings;

  FliqloSettingsOverrides? get overrides => _overrides;

  bool get isLoaded => _loaded;

  static const _kUse24Hour = 'use24Hour';
  static const _kShowSeconds = 'showSeconds';
  static const _kDim = 'dim';
  static const _kShowFlaps = 'showFlaps';
  static const _kShowSeparators = 'showSeparators';
  static const _kEnableFlipSound = 'enableFlipSound';

  /// Replace CLI overrides. Empty / null clears them.
  void setOverrides(FliqloSettingsOverrides? next) {
    if (_disposed) return;
    final normalized = (next == null || next.isEmpty) ? null : next;
    if (normalized == _overrides) return;
    _overrides = normalized;
    notifyListeners();
  }

  Future<void> load() async {
    _prefs ??= _prefsOverride ?? await SharedPreferences.getInstance();
    final p = _prefs!;
    _settings = FliqloSettings(
      use24Hour: p.getBool(_kUse24Hour) ?? true,
      showSeconds: p.getBool(_kShowSeconds) ?? false,
      dim: (p.getDouble(_kDim) ?? 0.0).clamp(0.0, 0.8),
      showFlaps: p.getBool(_kShowFlaps) ?? true,
      showSeparators: p.getBool(_kShowSeparators) ?? true,
      enableFlipSound: p.getBool(_kEnableFlipSound) ?? false,
    );
    _loaded = true;
    notifyListeners();
  }

  /// Updates memory and notifies listeners; schedules a debounced persist.
  void update(FliqloSettings next) {
    if (_disposed) return;
    _overrides = null;
    _settings = next;
    notifyListeners();
    _schedulePersist();
  }

  /// Updates memory, notifies, and persists immediately (cancels debounce).
  Future<void> commit(FliqloSettings next) async {
    if (_disposed) return;
    _overrides = null;
    _settings = next;
    notifyListeners();
    await flush();
  }

  /// Writes the current base (disk) settings — not CLI overlays.
  Future<void> flush() async {
    _persistTimer?.cancel();
    _persistTimer = null;
    await _persistNow(_settings);
  }

  Future<void> patch({
    bool? use24Hour,
    bool? showSeconds,
    double? dim,
    bool? showFlaps,
    bool? showSeparators,
    bool? enableFlipSound,
  }) {
    return commit(
      settings.copyWith(
        use24Hour: use24Hour,
        showSeconds: showSeconds,
        dim: dim,
        showFlaps: showFlaps,
        showSeparators: showSeparators,
        enableFlipSound: enableFlipSound,
      ),
    );
  }

  void _schedulePersist() {
    if (_disposed) return;
    _persistTimer?.cancel();
    _persistTimer = Timer(persistDebounce, () {
      _persistTimer = null;
      if (_disposed) return;
      unawaited(_persistNow(_settings));
    });
  }

  Future<void> _persistNow(FliqloSettings next) async {
    // Serialize writes so overlapping flush/commit don't interleave.
    while (_persistInFlight != null) {
      await _persistInFlight;
    }

    final future = _writePrefs(next);
    _persistInFlight = future;
    try {
      await future;
    } finally {
      if (_persistInFlight == future) {
        _persistInFlight = null;
      }
    }
  }

  Future<void> _writePrefs(FliqloSettings next) async {
    final p = _prefs ?? _prefsOverride ?? await SharedPreferences.getInstance();
    _prefs = p;
    await Future.wait([
      p.setBool(_kUse24Hour, next.use24Hour),
      p.setBool(_kShowSeconds, next.showSeconds),
      p.setDouble(_kDim, next.dim),
      p.setBool(_kShowFlaps, next.showFlaps),
      p.setBool(_kShowSeparators, next.showSeparators),
      p.setBool(_kEnableFlipSound, next.enableFlipSound),
    ]);
  }

  @override
  void dispose() {
    _disposed = true;
    _persistTimer?.cancel();
    _persistTimer = null;
    super.dispose();
  }
}

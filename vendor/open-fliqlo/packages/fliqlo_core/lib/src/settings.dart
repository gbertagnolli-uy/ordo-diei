/// How digit pairs are arranged on the clock face.
///
/// Chosen automatically from viewport aspect ratio (landscape → horizontal,
/// portrait → vertical); not a user preference.
enum ClockLayout {
  /// Classic Fliqlo row: HH : MM (: SS).
  horizontal,

  /// Stacked pairs: hours above minutes (optional seconds row below).
  vertical,
}

/// User-configurable display options for Open Fliqlo.
class FliqloSettings {
  const FliqloSettings({
    this.use24Hour = true,
    this.showSeconds = false,
    this.dim = 0.0,
    this.showFlaps = true,
    this.showSeparators = true,
    this.enableFlipSound = false,
  });

  final bool use24Hour;
  final bool showSeconds;

  /// Black overlay opacity from 0.0 to 0.8.
  final double dim;

  /// Whether to draw the horizontal flap hinge.
  final bool showFlaps;

  /// Whether to draw `:` between hour / minute / second pairs.
  ///
  /// Ignored in [ClockLayout.vertical] (portrait), which always uses gaps.
  final bool showSeparators;

  /// Play a short click when a digit flips (interactive app only).
  final bool enableFlipSound;

  FliqloSettings copyWith({
    bool? use24Hour,
    bool? showSeconds,
    double? dim,
    bool? showFlaps,
    bool? showSeparators,
    bool? enableFlipSound,
  }) {
    return FliqloSettings(
      use24Hour: use24Hour ?? this.use24Hour,
      showSeconds: showSeconds ?? this.showSeconds,
      dim: dim ?? this.dim,
      showFlaps: showFlaps ?? this.showFlaps,
      showSeparators: showSeparators ?? this.showSeparators,
      enableFlipSound: enableFlipSound ?? this.enableFlipSound,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is FliqloSettings &&
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

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';

/// App-wide spacing, radius, and dimension constants
class HmsSpacing {
  HmsSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double huge = 40;
  static const double massive = 48;
}

class HmsRadius {
  HmsRadius._();

  static const double sm = 6;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double full = 999;
}

class HmsShadows {
  HmsShadows._();

  static List<BoxShadow> get sm => [
    BoxShadow(
      color: const Color(0xFF17241B).withValues(alpha: 0.05),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get md => [
    BoxShadow(
      color: const Color(0xFF17241B).withValues(alpha: 0.08),
      blurRadius: 15,
      offset: const Offset(0, 4),
      spreadRadius: -3,
    ),
    BoxShadow(
      color: const Color(0xFF17241B).withValues(alpha: 0.04),
      blurRadius: 6,
      offset: const Offset(0, 2),
      spreadRadius: -2,
    ),
  ];

  static List<BoxShadow> get lg => [
    BoxShadow(
      color: const Color(0xFF17241B).withValues(alpha: 0.10),
      blurRadius: 25,
      offset: const Offset(0, 10),
      spreadRadius: -5,
    ),
    BoxShadow(
      color: const Color(0xFF17241B).withValues(alpha: 0.04),
      blurRadius: 10,
      offset: const Offset(0, 5),
      spreadRadius: -5,
    ),
  ];

  static List<BoxShadow> get gold => [
    BoxShadow(
      color: HmsColors.gold.withValues(alpha: 0.3),
      blurRadius: 20,
      offset: const Offset(0, 8),
      spreadRadius: -4,
    ),
  ];
}

/// Haptic feedback helper
class HmsHaptics {
  static void lightImpact() => HapticFeedback.lightImpact();
  static void mediumImpact() => HapticFeedback.mediumImpact();
  static void heavyImpact() => HapticFeedback.heavyImpact();
  static void selectionClick() => HapticFeedback.selectionClick();
}

/// Duration constants
class HmsDurations {
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration verySlow = Duration(milliseconds: 800);
}

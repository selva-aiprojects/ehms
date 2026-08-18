import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'hms_colors.dart';

/// HostSphere Design System — Theme Configuration
/// Matches the web app's design tokens from globals.css
class HmsTheme {
  HmsTheme._();

  // ─── Typography ───
  static TextStyle heading1 = GoogleFonts.plusJakartaSans(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    color: HmsColors.textDark,
    letterSpacing: -0.5,
    height: 1.2,
  );

  static TextStyle heading2 = GoogleFonts.plusJakartaSans(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: HmsColors.textDark,
    letterSpacing: -0.3,
    height: 1.3,
  );

  static TextStyle heading3 = GoogleFonts.plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: HmsColors.textDark,
    height: 1.3,
  );

  static TextStyle heading4 = GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: HmsColors.textDark,
    height: 1.4,
  );

  static TextStyle bodyLarge = GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: HmsColors.textMuted,
    height: 1.6,
  );

  static TextStyle bodyMedium = GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: HmsColors.textMuted,
    height: 1.5,
  );

  static TextStyle bodySmall = GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: HmsColors.textFaint,
    height: 1.4,
  );

  static TextStyle label = GoogleFonts.plusJakartaSans(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: HmsColors.textFaint,
    letterSpacing: 0.5,
    height: 1.3,
  );

  static TextStyle stat = GoogleFonts.plusJakartaSans(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    color: HmsColors.textDark,
    height: 1.1,
  );

  static TextStyle statSmall = GoogleFonts.plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: HmsColors.textDark,
    height: 1.2,
  );

  static TextStyle mono = GoogleFonts.firaCode(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: HmsColors.primary,
  );

  // ─── Light Theme ───
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: HmsColors.backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: HmsColors.gold,
        onPrimary: HmsColors.surfaceWhite,
        secondary: HmsColors.navy,
        onSecondary: HmsColors.surfaceWhite,
        surface: HmsColors.surfaceWhite,
        onSurface: HmsColors.textDark,
        error: HmsColors.danger,
        onError: HmsColors.surfaceWhite,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: HmsColors.surfaceWhite,
        foregroundColor: HmsColors.textDark,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.05),
        titleTextStyle: heading4.copyWith(color: HmsColors.textDark),
      ),
      cardTheme: CardThemeData(
        color: HmsColors.surfaceWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: HmsColors.borderLight, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: HmsColors.surfaceMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.gold, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: bodyMedium.copyWith(color: HmsColors.textFaint),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: HmsColors.gold,
          foregroundColor: HmsColors.surfaceWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: bodyMedium.copyWith(
            color: HmsColors.surfaceWhite,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: HmsColors.navy,
          side: const BorderSide(color: HmsColors.gold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: HmsColors.borderLight,
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: HmsColors.surfaceWhite,
        selectedItemColor: HmsColors.gold,
        unselectedItemColor: HmsColors.textFaint,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  // ─── Dark Theme ───
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: HmsColors.darkBg,
      colorScheme: const ColorScheme.dark(
        primary: HmsColors.darkGold,
        onPrimary: HmsColors.darkText,
        secondary: HmsColors.darkNavy,
        onSecondary: HmsColors.darkText,
        surface: HmsColors.darkSurface,
        onSurface: HmsColors.darkText,
        error: HmsColors.danger,
        onError: HmsColors.darkText,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: HmsColors.darkSurface,
        foregroundColor: HmsColors.darkText,
        elevation: 0,
        titleTextStyle: heading4.copyWith(color: HmsColors.darkText),
      ),
      cardTheme: CardThemeData(
        color: HmsColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: HmsColors.darkBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: HmsColors.darkSurfaceMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HmsColors.darkGold, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: bodyMedium.copyWith(color: HmsColors.darkTextMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: HmsColors.darkGold,
          foregroundColor: HmsColors.darkText,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: HmsColors.darkSurface,
        selectedItemColor: HmsColors.darkGold,
        unselectedItemColor: HmsColors.darkTextMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}

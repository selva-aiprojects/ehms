import 'package:flutter/material.dart';

/// HostSphere Design System — Color Tokens
/// Mirrors the web app's CSS custom properties from globals.css
class HmsColors {
  HmsColors._();

  // ─── Core Brand ───
  static const Color navy = Color(0xFF255230);
  static const Color navyDark = Color(0xFF1A3D24);
  static const Color navyLight = Color(0xFF3A6B44);
  static const Color green = Color(0xFF7BB347);
  static const Color greenLight = Color(0xFFA5D375);
  static const Color greenDark = Color(0xFF5C9138);

  // ─── CTA / Gold ───
  static const Color gold = Color(0xFFC9A227);
  static const Color goldLight = Color(0xFFDFC04F);
  static const Color goldDark = Color(0xFFA8861E);

  // ─── Surfaces ───
  static const Color backgroundLight = Color(0xFFF8FAF8);
  static const Color backgroundCream = Color(0xFFFBF7EC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF1F5F1);

  // ─── Text ───
  static const Color textDark = Color(0xFF17241B);
  static const Color textMuted = Color(0xFF55685C);
  static const Color textFaint = Color(0xFF84978C);

  // ─── Borders ───
  static const Color borderLight = Color(0xFFE3E9E4);
  static const Color borderStrong = Color(0xFFC9D4CB);

  // ─── Semantic ───
  static const Color primary = Color(0xFFC9A227);
  static const Color primaryDark = Color(0xFFA8861E);
  static const Color secondary = Color(0xFF255230);
  static const Color success = Color(0xFF10B981);
  static const Color successDark = Color(0xFF065F46);
  static const Color successSoft = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningDark = Color(0xFF92400E);
  static const Color warningSoft = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerDark = Color(0xFF991B1B);
  static const Color dangerSoft = Color(0xFFFEF2F2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoDark = Color(0xFF1E40AF);
  static const Color infoSoft = Color(0xFFEFF6FF);
  static const Color violet = Color(0xFF7C3AED);
  static const Color violetDark = Color(0xFF6D28D9);
  static const Color violetSoft = Color(0x1A7C3AED);

  // ─── Room Status ───
  static const Color roomVacant = Color(0xFF22C55E);
  static const Color roomOccupied = Color(0xFF3B82F6);
  static const Color roomDirty = Color(0xFFF59E0B);
  static const Color roomCleaning = Color(0xFF7C3AED);
  static const Color roomMaintenance = Color(0xFFEF4444);
  static const Color roomReserved = Color(0xFF6B7280);
  static const Color roomInspection = Color(0xFF10B981);

  // ─── Dark Theme ───
  static const Color darkBg = Color(0xFF0F1115);
  static const Color darkSurface = Color(0xFF1A1D24);
  static const Color darkSurfaceMuted = Color(0xFF22252E);
  static const Color darkText = Color(0xFFE8E8ED);
  static const Color darkTextMuted = Color(0xFFB0B0BC);
  static const Color darkBorder = Color(0xFF2C2F38);
  static const Color darkNavy = Color(0xFF4A8B5C);
  static const Color darkGold = Color(0xFFD4B23A);

  // ─── Theme-aware Helpers ───
  static Color surface(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkSurface : surfaceWhite;
  static Color surfaceMutedFor(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkSurfaceMuted : HmsColors.surfaceMuted;
  static Color border(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkBorder : borderLight;
  static Color textPrimary(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkText : textDark;
  static Color textSecondary(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkTextMuted : textMuted;
  static Color textTertiary(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF80808E) : textFaint;

  // ─── Gradients ───
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [gold, goldLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient navyGradient = LinearGradient(
    colors: [navy, navyLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [success, Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient dangerGradient = LinearGradient(
    colors: [danger, Color(0xFFF87171)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkEmberGradient = LinearGradient(
    colors: [Color(0xFFC47F1F), Color(0xFFE6A23C), Color(0xFFE9B84A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ─── Room Status Helpers ───
  static Color roomStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'vacant':
      case 'available':
        return roomVacant;
      case 'occupied':
      case 'guest':
        return roomOccupied;
      case 'dirty':
        return roomDirty;
      case 'cleaning':
        return roomCleaning;
      case 'maintenance':
        return roomMaintenance;
      case 'reserved':
        return roomReserved;
      case 'inspection':
        return roomInspection;
      default:
        return textFaint;
    }
  }

  static Color roomStatusBg(String status) {
    return roomStatusColor(status).withValues(alpha: 0.12);
  }

  static Color priorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'critical':
        return danger;
      case 'high':
        return warning;
      case 'medium':
        return textMuted;
      case 'low':
        return primary;
      default:
        return textFaint;
    }
  }

  static Color statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return danger;
      case 'assigned':
        return navy;
      case 'in_progress':
        return warning;
      case 'resolved':
      case 'completed':
        return success;
      case 'closed':
        return textFaint;
      default:
        return textFaint;
    }
  }
}

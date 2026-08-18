import 'package:flutter/material.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';

/// Status badge pill — colored dot + label
/// Mirrors the web app's badge component
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? backgroundColor;
  final bool isSmall;
  final bool showDot;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.backgroundColor,
    this.isSmall = false,
    this.showDot = true,
    this.icon,
  });

  /// Factory for common status types
  factory StatusBadge.roomStatus(String status) {
    return StatusBadge(
      label: status[0].toUpperCase() + status.substring(1),
      color: HmsColors.roomStatusColor(status),
      backgroundColor: HmsColors.roomStatusBg(status),
    );
  }

  factory StatusBadge.priority(String priority) {
    return StatusBadge(
      label: priority[0].toUpperCase() + priority.substring(1),
      color: HmsColors.priorityColor(priority),
      backgroundColor: HmsColors.priorityColor(priority).withValues(alpha: 0.12),
      isSmall: true,
    );
  }

  factory StatusBadge.taskStatus(String status) {
    final label = status.replaceAll('_', ' ');
    return StatusBadge(
      label: label[0].toUpperCase() + label.substring(1),
      color: HmsColors.statusColor(status),
      backgroundColor: HmsColors.statusColor(status).withValues(alpha: 0.12),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fontSize = isSmall ? 10.0 : 11.0;
    final paddingH = isSmall ? 6.0 : 8.0;
    final paddingV = isSmall ? 2.0 : 3.0;
    final dotSize = isSmall ? 5.0 : 6.0;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: paddingH, vertical: paddingV),
      decoration: BoxDecoration(
        color: backgroundColor ?? color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(HmsRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: color),
            SizedBox(width: 3),
          ],
          if (showDot) ...[
            Container(
              width: dotSize,
              height: dotSize,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Glass effect card (for hero content, login overlays)
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double opacity;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 16,
    this.opacity = 0.75,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: (isDark ? Colors.white : Colors.white).withValues(alpha: isDark ? 0.06 : opacity),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: (isDark ? Colors.white : Colors.white).withValues(alpha: isDark ? 0.08 : 0.3),
          width: 1,
        ),
      ),
      child: child,
    );
  }
}

/// HSM-themed card wrapper matching web's .hs-card
class HmsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final bool isSelected;
  final Color? borderColor;

  const HmsCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.isSelected = false,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final borderCol = HmsColors.border(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: HmsDurations.fast,
        margin: margin,
        padding: padding ?? const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(HmsRadius.xxl),
          border: Border.all(
            color: isSelected
                ? HmsColors.navy
                : borderColor ?? borderCol,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected ? HmsShadows.md : HmsShadows.sm,
        ),
        child: child,
      ),
    );
  }
}

/// Section header with optional action
class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ],
          ),
        ),
        if (action != null) action!,
      ],
    );
  }
}

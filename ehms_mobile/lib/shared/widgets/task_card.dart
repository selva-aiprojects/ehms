import 'package:flutter/material.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'status_badge.dart';

/// Swipeable task card for housekeeping/maintenance Kanban
/// Rich card with avatar, priority, due time, and action
class TaskCard extends StatefulWidget {
  final String id;
  final String title;
  final String? subtitle;
  final String priority;
  final String status;
  final String? assigneeName;
  final String? assigneeInitials;
  final String? room;
  final String? scheduledTime;
  final String? notes;
  final VoidCallback? onTap;
  final VoidCallback? onAction;
  final String? actionLabel;
  final Widget? trailing;
  final Color? accentColor;

  const TaskCard({
    super.key,
    required this.id,
    required this.title,
    this.subtitle,
    this.priority = 'medium',
    this.status = 'open',
    this.assigneeName,
    this.assigneeInitials,
    this.room,
    this.scheduledTime,
    this.notes,
    this.onTap,
    this.onAction,
    this.actionLabel,
    this.trailing,
    this.accentColor,
  });

  @override
  State<TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<TaskCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: HmsDurations.normal,
      vsync: this,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accent = widget.accentColor ?? HmsColors.primary;

    return SlideTransition(
      position: _slideAnim,
      child: FadeTransition(
        opacity: _fadeAnim,
        child: GestureDetector(
          onTap: () {
            HmsHaptics.lightImpact();
            widget.onTap?.call();
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(HmsRadius.lg),
              border: Border.all(color: HmsColors.borderLight, width: 1),
              boxShadow: HmsShadows.sm,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Priority + Status + Room
                Row(
                  children: [
                    StatusBadge.priority(widget.priority),
                    const SizedBox(width: 6),
                    StatusBadge.taskStatus(widget.status),
                    if (widget.room != null) ...[
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: HmsColors.navy.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(HmsRadius.full),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.king_bed_outlined, size: 12, color: HmsColors.navy),
                            const SizedBox(width: 3),
                            Text(
                              widget.room!,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: HmsColors.navy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 10),

                // Title
                Text(
                  widget.title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                    height: 1.3,
                  ),
                ),

                if (widget.subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    widget.subtitle!,
                    style: TextStyle(
                      fontSize: 12,
                      color: HmsColors.textMuted,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                // Meta row: time + assignee
                if (widget.scheduledTime != null || widget.assigneeName != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (widget.scheduledTime != null) ...[
                        Icon(Icons.access_time, size: 13, color: HmsColors.textFaint),
                        const SizedBox(width: 4),
                        Text(
                          widget.scheduledTime!,
                          style: TextStyle(
                            fontSize: 11,
                            color: HmsColors.textFaint,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const Spacer(),
                      if (widget.assigneeInitials != null)
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: accent.withValues(alpha: 0.15),
                          child: Text(
                            widget.assigneeInitials!,
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: accent,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],

                // Notes
                if (widget.notes != null && widget.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: HmsColors.backgroundLight,
                      borderRadius: BorderRadius.circular(HmsRadius.sm),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.notes, size: 12, color: HmsColors.textFaint),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            widget.notes!,
                            style: TextStyle(
                              fontSize: 11,
                              color: HmsColors.textMuted,
                              fontStyle: FontStyle.italic,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Action button
                if (widget.onAction != null) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        HmsHaptics.mediumImpact();
                        widget.onAction!.call();
                      },
                      icon: Icon(_actionIcon, size: 16),
                      label: Text(widget.actionLabel ?? _defaultActionLabel),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: accent,
                        side: BorderSide(color: accent.withValues(alpha: 0.3)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(HmsRadius.md),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData get _actionIcon {
    switch (widget.status) {
      case 'open':
        return Icons.play_arrow_rounded;
      case 'assigned':
        return Icons.play_arrow_rounded;
      case 'in_progress':
        return Icons.check_circle_outline;
      default:
        return Icons.chevron_right;
    }
  }

  String get _defaultActionLabel {
    switch (widget.status) {
      case 'open':
        return 'Start Task';
      case 'assigned':
        return 'Accept';
      case 'in_progress':
        return 'Mark Complete';
      default:
        return 'View';
    }
  }
}

/// Timeline event item (for housekeeping schedule, maintenance history)
class TimelineEvent extends StatelessWidget {
  final String time;
  final String title;
  final String? location;
  final Color dotColor;
  final bool isActive;
  final bool isLast;

  const TimelineEvent({
    super.key,
    required this.time,
    required this.title,
    this.location,
    this.dotColor = HmsColors.navy,
    this.isActive = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Time label
          SizedBox(
            width: 52,
            child: Text(
              time,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isActive ? dotColor : HmsColors.textFaint,
              ),
            ),
          ),
          // Dot + line
          Column(
            children: [
              Container(
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: dotColor.withValues(alpha: 0.3),
                            blurRadius: 6,
                          ),
                        ]
                      : null,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 1.5,
                    color: HmsColors.borderLight,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 10),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      color: isActive
                          ? Theme.of(context).textTheme.bodyLarge?.color
                          : HmsColors.textMuted,
                    ),
                  ),
                  if (location != null) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 11, color: HmsColors.textFaint),
                        const SizedBox(width: 3),
                        Text(
                          location!,
                          style: TextStyle(
                            fontSize: 11,
                            color: HmsColors.textFaint,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

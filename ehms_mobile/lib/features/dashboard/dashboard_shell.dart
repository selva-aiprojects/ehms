import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/api/push_service.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';

/// Dashboard shell with bottom navigation
class DashboardShell extends StatefulWidget {
  final Widget child;
  const DashboardShell({super.key, required this.child});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int _currentIndex = 0;

  final _navItems = [
    _NavItem(icon: Icons.dashboard_rounded, label: 'Home', route: '/dashboard'),
    _NavItem(icon: Icons.king_bed_rounded, label: 'Front Desk', route: '/dashboard/front-desk'),
    _NavItem(icon: Icons.cleaning_services_rounded, label: 'Housekeep', route: '/dashboard/housekeeping'),
    _NavItem(icon: Icons.build_rounded, label: 'Maint.', route: '/dashboard/maintenance'),
    _NavItem(icon: Icons.account_balance_rounded, label: 'Finance', route: '/dashboard/finance'),
  ];

  @override
  Widget build(BuildContext context) {
    // Provide context for push notification deep-linking
    PushNotificationService.setContext(context);

    final currentPath = GoRouterState.of(context).matchedLocation;
    _currentIndex = _navItems.indexWhere((item) => item.route == currentPath);
    if (_currentIndex < 0) _currentIndex = 0;

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).bottomNavigationBarTheme.backgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: _navItems.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final isActive = index == _currentIndex;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    HmsHaptics.lightImpact();
                    context.go(item.route);
                  },
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: HmsDurations.fast,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive
                          ? HmsColors.gold.withValues(alpha: 0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          size: 22,
                          color: isActive ? HmsColors.gold : HmsColors.textFaint,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                            color: isActive ? HmsColors.gold : HmsColors.textFaint,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  _NavItem({required this.icon, required this.label, required this.route});
}

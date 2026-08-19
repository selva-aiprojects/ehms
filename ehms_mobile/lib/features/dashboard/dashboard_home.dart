import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/auth/auth_service.dart';
import 'package:ehms_mobile/core/auth/auth_models.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/core/config/property_provider.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Role-based dashboard home screen with animated KPIs and quick actions
class DashboardHome extends ConsumerStatefulWidget {
  const DashboardHome({super.key});

  @override
  ConsumerState<DashboardHome> createState() => _DashboardHomeState();
}

class _DashboardHomeState extends ConsumerState<DashboardHome> {
  Map<String, dynamic>? _kpiData;
  List<Map<String, dynamic>> _recentActivity = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final user = ref.read(currentUserProvider);
      final role = user?.roleName ?? 'unknown';
      final propId = ref.read(propertySelectionProvider).activePropertyId;

      // Sync assigned properties into the provider
      if (user?.assignedPropertyIds.isNotEmpty == true) {
        ref
            .read(propertySelectionProvider.notifier)
            .setAssignedProperties(user!.assignedPropertyIds);
      }

      // Fetch role-specific data with property filter
      if (role == 'front_desk') {
        final resp = await FrontDeskService().getFrontDeskDashboard(
          propertyId: propId,
        );
        if (resp.isSuccess) setState(() => _kpiData = resp.data);
      } else if (role.startsWith('housekeeping')) {
        final resp = await HousekeepingService().getStats(propertyId: propId);
        if (resp.isSuccess) setState(() => _kpiData = resp.data);
      } else if (role.startsWith('maintenance')) {
        final resp = await MaintenanceService().getStats(propertyId: propId);
        if (resp.isSuccess) setState(() => _kpiData = resp.data);
      } else if (role.contains('finance')) {
        final resp = await FinanceService().getDashboard(propertyId: propId);
        if (resp.isSuccess) setState(() => _kpiData = resp.data);
      }

      // Fetch recent activity from audit events
      final auditResp = await AdminService().getAuditEvents(limit: 4);
      if (auditResp.isSuccess && auditResp.data != null) {
        setState(() => _recentActivity = auditResp.data!);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.read(currentUserProvider);
    final role = user?.roleName ?? 'unknown';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboardData,
          color: HmsColors.gold,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _buildHeader(context, ref, user)),
              SliverToBoxAdapter(child: _buildKPIs(context, role)),
              SliverToBoxAdapter(child: _buildQuickActions(context, role)),
              SliverToBoxAdapter(child: _buildRecentActivity(context)),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, UserData? user) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => context.push('/profile'),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: HmsColors.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: HmsShadows.gold,
                  ),
                  child: Center(
                    child: Text(
                      user?.initials ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back,',
                      style: TextStyle(
                        fontSize: 12,
                        color: HmsColors.textFaint,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      user?.firstName ?? 'User',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HmsColors.border(context)),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(
                      Icons.notifications_outlined,
                      color: HmsColors.textMuted,
                      size: 22,
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: HmsColors.danger,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Property selector
          const SizedBox(height: 12),
          _buildPropertySelector(context, ref, user),
        ],
      ),
    );
  }

  Widget _buildPropertySelector(
    BuildContext context,
    WidgetRef ref,
    UserData? user,
  ) {
    final propertySelection = ref.watch(propertySelectionProvider);
    final properties = user?.assignedPropertyIds ?? [];

    if (properties.isEmpty) return const SizedBox.shrink();

    return GestureDetector(
      onTap: properties.length > 1
          ? () => _showPropertyPicker(context, ref, properties)
          : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: HmsColors.surfaceMutedFor(context),
          borderRadius: BorderRadius.circular(HmsRadius.md),
          border: Border.all(color: HmsColors.border(context), width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.business_outlined,
              size: 16,
              color: HmsColors.textSecondary(context),
            ),
            const SizedBox(width: 6),
            Text(
              propertySelection.activePropertyName ?? 'All Properties',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: HmsColors.textSecondary(context),
              ),
            ),
            if (properties.length > 1) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.expand_more,
                size: 16,
                color: HmsColors.textTertiary(context),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showPropertyPicker(
    BuildContext context,
    WidgetRef ref,
    List<String> properties,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: HmsColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Select Property',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HmsColors.gold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.all_inclusive,
                  color: HmsColors.gold,
                  size: 20,
                ),
              ),
              title: const Text(
                'All Properties',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              onTap: () {
                ref
                    .read(propertySelectionProvider.notifier)
                    .selectProperty(null, name: 'All Properties');
                Navigator.pop(context);
              },
            ),
            ...properties.map(
              (id) => ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: HmsColors.navy.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.business, color: HmsColors.navy, size: 20),
                ),
                title: Text(
                  id,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                onTap: () {
                  ref
                      .read(propertySelectionProvider.notifier)
                      .selectProperty(id, name: id);
                  Navigator.pop(context);
                },
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildKPIs(BuildContext context, String role) {
    final kpis = _getKpisForRole(role, _kpiData);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Today\'s Overview',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
            ),
            itemCount: kpis.length,
            itemBuilder: (context, index) {
              final kpi = kpis[index];
              return StatCard(
                icon: kpi['icon'] as IconData,
                label: kpi['label'] as String,
                value: kpi['value'] as String,
                trend: kpi['trend'] as String?,
                trendUp: kpi['trendUp'] as bool?,
                accentColor: kpi['color'] as Color,
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, String role) {
    final actions = _getActionsForRole(role);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: MediaQuery.sizeOf(context).width < 390 ? 3 : 4,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: MediaQuery.sizeOf(context).width < 390
                  ? 1.05
                  : 0.85,
            ),
            itemCount: actions.length,
            itemBuilder: (context, index) {
              final action = actions[index];
              return QuickAction(
                icon: action['icon'] as IconData,
                label: action['label'] as String,
                color: action['color'] as Color,
                onTap: () {
                  final route = action['route'] as String?;
                  if (route != null) context.go(route);
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Activity',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              TextButton(
                onPressed: () => context.go('/dashboard/admin'),
                child: Text(
                  'View All',
                  style: TextStyle(
                    color: HmsColors.gold,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_recentActivity.isNotEmpty)
            ..._recentActivity.map((event) {
              final action = (event['action'] ?? event['type'] ?? '') as String;
              final details =
                  (event['details'] ??
                          event['description'] ??
                          event['entity'] ??
                          '')
                      as String;
              final timestamp =
                  (event['created_at'] ?? event['timestamp'] ?? '') as String;
              final timeAgo = _formatTimeAgo(timestamp);

              IconData icon;
              Color color;
              if (action.toLowerCase().contains('check') ||
                  action.toLowerCase().contains('login')) {
                icon = Icons.login_rounded;
                color = HmsColors.success;
              } else if (action.toLowerCase().contains('clean') ||
                  action.toLowerCase().contains('housekeep')) {
                icon = Icons.cleaning_services;
                color = HmsColors.violet;
              } else if (action.toLowerCase().contains('maintenance') ||
                  action.toLowerCase().contains('repair')) {
                icon = Icons.build_rounded;
                color = HmsColors.warning;
              } else if (action.toLowerCase().contains('invoice') ||
                  action.toLowerCase().contains('payment')) {
                icon = Icons.receipt_long;
                color = HmsColors.info;
              } else {
                icon = Icons.timeline;
                color = HmsColors.textMuted;
              }

              return _buildActivityItem(
                context: context,
                icon: icon,
                color: color,
                title: action.replaceAll('_', ' '),
                subtitle: details,
                time: timeAgo,
              );
            })
          else ...[
            _buildActivityItem(
              context: context,
              icon: Icons.login_rounded,
              color: HmsColors.success,
              title: 'Guest Check-in',
              subtitle: 'Room 301 — Mr. Sharma',
              time: '2m ago',
            ),
            _buildActivityItem(
              context: context,
              icon: Icons.cleaning_services,
              color: HmsColors.violet,
              title: 'Room Cleaned',
              subtitle: 'Room 205 — inspection pending',
              time: '15m ago',
            ),
            _buildActivityItem(
              context: context,
              icon: Icons.build_rounded,
              color: HmsColors.warning,
              title: 'Maintenance Request',
              subtitle: 'AC repair — Room 412',
              time: '1h ago',
            ),
          ],
        ],
      ),
    );
  }

  String _formatTimeAgo(String timestamp) {
    if (timestamp.isEmpty) return '';
    try {
      final dt = DateTime.parse(timestamp);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return '';
    }
  }

  Widget _buildActivityItem({
    required BuildContext context,
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String time,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(HmsRadius.md),
        border: Border.all(color: HmsColors.border(context), width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 11, color: HmsColors.textFaint),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          SizedBox(
            width: 50,
            child: Text(
              time,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                color: HmsColors.textFaint,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Role-based Data (with optional live data) ───

  List<Map<String, dynamic>> _getKpisForRole(
    String role,
    Map<String, dynamic>? liveData,
  ) {
    switch (role) {
      case 'front_desk':
        return [
          {
            'icon': Icons.king_bed_rounded,
            'label': 'Occupied',
            'value': '${liveData?['occupied'] ?? 24}',
            'color': HmsColors.info,
            'trend': '+3',
            'trendUp': true,
          },
          {
            'icon': Icons.event_available,
            'label': 'Arrivals',
            'value': '${liveData?['arrivals'] ?? 8}',
            'color': HmsColors.success,
            'trend': '+2',
            'trendUp': true,
          },
          {
            'icon': Icons.logout_rounded,
            'label': 'Departures',
            'value': '${liveData?['departures'] ?? 5}',
            'color': HmsColors.warning,
          },
          {
            'icon': Icons.meeting_room,
            'label': 'Vacant',
            'value': '${liveData?['vacant'] ?? 12}',
            'color': HmsColors.navy,
          },
        ];
      case 'housekeeping_supervisor':
      case 'housekeeping_staff':
        return [
          {
            'icon': Icons.pending_actions,
            'label': 'Open Tasks',
            'value': '${liveData?['open'] ?? 15}',
            'color': HmsColors.warning,
          },
          {
            'icon': Icons.autorenew,
            'label': 'In Progress',
            'value': '${liveData?['in_progress'] ?? 6}',
            'color': HmsColors.info,
          },
          {
            'icon': Icons.check_circle,
            'label': 'Completed',
            'value': '${liveData?['completed'] ?? 23}',
            'color': HmsColors.success,
            'trend': '+8',
            'trendUp': true,
          },
          {
            'icon': Icons.priority_high,
            'label': 'Critical',
            'value': '${liveData?['critical'] ?? 2}',
            'color': HmsColors.danger,
          },
        ];
      case 'maintenance_staff':
      case 'maintenance_supervisor':
        return [
          {
            'icon': Icons.report_problem,
            'label': 'Open',
            'value': '${liveData?['open'] ?? 9}',
            'color': HmsColors.danger,
          },
          {
            'icon': Icons.engineering,
            'label': 'In Progress',
            'value': '${liveData?['in_progress'] ?? 4}',
            'color': HmsColors.warning,
            'trend': '-2',
            'trendUp': false,
          },
          {
            'icon': Icons.task_alt,
            'label': 'Resolved',
            'value': '${liveData?['resolved'] ?? 12}',
            'color': HmsColors.success,
          },
          {
            'icon': Icons.timer,
            'label': 'Avg Time',
            'value': '${liveData?['avg_time'] ?? '2.4h'}',
            'color': HmsColors.navy,
          },
        ];
      case 'finance_manager':
      case 'finance_executive':
        return [
          {
            'icon': Icons.trending_up,
            'label': 'Revenue MTD',
            'value': '${liveData?['revenue_mtd'] ?? '₹18L'}',
            'color': HmsColors.navy,
            'trend': '+12%',
            'trendUp': true,
          },
          {
            'icon': Icons.trending_down,
            'label': 'Outstanding',
            'value': '${liveData?['outstanding'] ?? '₹4.2L'}',
            'color': HmsColors.danger,
          },
          {
            'icon': Icons.account_balance,
            'label': 'Payouts',
            'value': '${liveData?['payouts'] ?? '₹8.5L'}',
            'color': HmsColors.gold,
          },
          {
            'icon': Icons.receipt_long,
            'label': 'Invoices',
            'value': '${liveData?['invoices'] ?? 47}',
            'color': HmsColors.info,
          },
        ];
      default: // super_admin, property_manager, executive
        return [
          {
            'icon': Icons.king_bed_rounded,
            'label': 'Occupancy',
            'value': '78%',
            'color': HmsColors.info,
            'trend': '+5%',
            'trendUp': true,
          },
          {
            'icon': Icons.trending_up,
            'label': 'Revenue',
            'value': '₹18L',
            'color': HmsColors.navy,
            'trend': '+12%',
            'trendUp': true,
          },
          {
            'icon': Icons.people,
            'label': 'Guests',
            'value': '34',
            'color': HmsColors.success,
          },
          {
            'icon': Icons.star,
            'label': 'Rating',
            'value': '4.8',
            'color': HmsColors.gold,
          },
        ];
    }
  }

  List<Map<String, dynamic>> _getActionsForRole(String role) {
    switch (role) {
      case 'front_desk':
        return [
          {
            'icon': Icons.login_rounded,
            'label': 'Check In',
            'color': HmsColors.success,
            'route': '/dashboard/front-desk',
          },
          {
            'icon': Icons.logout_rounded,
            'label': 'Check Out',
            'color': HmsColors.danger,
            'route': '/dashboard/front-desk',
          },
          {
            'icon': Icons.king_bed_rounded,
            'label': 'Rooms',
            'color': HmsColors.info,
            'route': '/dashboard/front-desk',
          },
          {
            'icon': Icons.receipt_long,
            'label': 'Billing',
            'color': HmsColors.gold,
            'route': '/dashboard/front-desk',
          },
        ];
      case 'housekeeping_supervisor':
      case 'housekeeping_staff':
        return [
          {
            'icon': Icons.add_task,
            'label': 'New Task',
            'color': HmsColors.success,
            'route': '/dashboard/housekeeping',
          },
          {
            'icon': Icons.cleaning_services,
            'label': 'My Tasks',
            'color': HmsColors.violet,
            'route': '/dashboard/housekeeping',
          },
          {
            'icon': Icons.camera_alt,
            'label': 'Inspect',
            'color': HmsColors.info,
            'route': '/photo-capture?category=inspection',
          },
          {
            'icon': Icons.checkroom,
            'label': 'Linen',
            'color': HmsColors.gold,
            'route': '/dashboard/housekeeping',
          },
        ];
      case 'maintenance_staff':
      case 'maintenance_supervisor':
        return [
          {
            'icon': Icons.report,
            'label': 'Report',
            'color': HmsColors.danger,
            'route': '/dashboard/maintenance',
          },
          {
            'icon': Icons.build_rounded,
            'label': 'My Jobs',
            'color': HmsColors.warning,
            'route': '/dashboard/maintenance',
          },
          {
            'icon': Icons.inventory_2,
            'label': 'Parts',
            'color': HmsColors.info,
            'route': '/dashboard/maintenance',
          },
          {
            'icon': Icons.store,
            'label': 'Vendors',
            'color': HmsColors.navy,
            'route': '/dashboard/maintenance',
          },
        ];
      default:
        return [
          {
            'icon': Icons.dashboard_rounded,
            'label': 'Overview',
            'color': HmsColors.gold,
            'route': '/dashboard',
          },
          {
            'icon': Icons.king_bed_rounded,
            'label': 'Front Desk',
            'color': HmsColors.info,
            'route': '/dashboard/front-desk',
          },
          {
            'icon': Icons.cleaning_services,
            'label': 'Housekeep',
            'color': HmsColors.violet,
            'route': '/dashboard/housekeeping',
          },
          {
            'icon': Icons.build_rounded,
            'label': 'Maint.',
            'color': HmsColors.warning,
            'route': '/dashboard/maintenance',
          },
          {
            'icon': Icons.account_balance,
            'label': 'Finance',
            'color': HmsColors.navy,
            'route': '/dashboard/finance',
          },
          {
            'icon': Icons.people,
            'label': 'HR',
            'color': HmsColors.success,
            'route': '/dashboard/hr',
          },
        ];
    }
  }
}

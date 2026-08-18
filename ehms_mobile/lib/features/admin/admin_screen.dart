import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Admin — Users, Roles, Audit Trail, System Health
class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  final AdminService _api = AdminService();
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _auditEvents = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        _api.getUsers(),
        _api.getAuditEvents(limit: 10),
      ]);
      final usersResp = results[0];
      final auditResp = results[1];
      if (usersResp.isSuccess) {
        setState(() {
          _users = usersResp.data ?? [];
          _auditEvents = auditResp.data ?? [];
          _isLoading = false;
        });
      } else {
        setState(() { _error = usersResp.error; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: HmsColors.gold,
          child: _isLoading
              ? ShimmerLoading.fullPage()
              : _error != null
                  ? _buildErrorState()
                  : _buildContent(),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline, size: 48, color: HmsColors.danger.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: HmsColors.textMuted)),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
            style: OutlinedButton.styleFrom(foregroundColor: HmsColors.gold),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(child: _buildSystemHealth()),
        SliverToBoxAdapter(child: _buildAdminActions()),
        SliverToBoxAdapter(child: _buildRecentAudit()),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Text('Administration', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
    );
  }

  Widget _buildSystemHealth() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: HmsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.health_and_safety, color: HmsColors.success, size: 20),
                const SizedBox(width: 8),
                Text('System Health', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                const Spacer(),
                StatusBadge(label: 'All Systems Go', color: HmsColors.success, isSmall: true, icon: Icons.check_circle),
              ],
            ),
            const SizedBox(height: 16),
            _healthRow('API Server', 'Healthy', HmsColors.success),
            _healthRow('Database', 'Healthy', HmsColors.success),
            _healthRow('Cache', 'Healthy', HmsColors.success),
            _healthRow('Email Service', 'Healthy', HmsColors.success),
            _healthRow('Push Service', 'Degraded', HmsColors.warning),
          ],
        ),
      ),
    );
  }

  Widget _healthRow(String service, String status, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(child: Text(service, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
          Text(status, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _buildAdminActions() {
    final actions = [
      ('Users', Icons.people, HmsColors.navy, '${_users.length} active'),
      ('Roles', Icons.admin_panel_settings, HmsColors.info, '8 roles'),
      ('Audit Trail', Icons.history, HmsColors.warning, '${_auditEvents.length} events'),
      ('Backups', Icons.backup, HmsColors.success, 'Last: 2h ago'),
      ('Broadcasts', Icons.campaign, HmsColors.violet, '3 active'),
      ('Tenants', Icons.business, HmsColors.gold, '6 tenants'),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Management', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.8,
            ),
            itemCount: actions.length,
            itemBuilder: (context, index) {
              final a = actions[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(HmsRadius.md),
                  border: Border.all(color: HmsColors.border(context), width: 0.5),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: a.$3.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                      child: Icon(a.$2, color: a.$3, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(a.$1, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          Text(a.$4, style: TextStyle(fontSize: 10, color: HmsColors.textFaint)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentAudit() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent Audit Events', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          if (_auditEvents.isEmpty)
            Center(child: Text('No recent events', style: TextStyle(color: HmsColors.textMuted)))
          else
            ..._auditEvents.take(5).map((event) {
              final action = (event['action'] ?? event['type'] ?? '') as String;
              final detail = (event['detail'] ?? event['description'] ?? '') as String;
              final time = (event['created_at'] ?? event['time'] ?? '') as String;
              return _auditItem(action, detail, time, HmsColors.info);
            }),
        ],
      ),
    );
  }

  Widget _auditItem(String action, String detail, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(HmsRadius.md),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(action, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text(detail, style: TextStyle(fontSize: 11, color: HmsColors.textFaint), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Text(time, style: TextStyle(fontSize: 10, color: HmsColors.textFaint)),
        ],
      ),
    );
  }
}

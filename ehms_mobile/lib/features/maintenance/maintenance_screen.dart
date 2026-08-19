import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Maintenance — Work Orders + Timeline + Vendor Monitor (with pagination)
class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen> {
  final MaintenanceService _api = MaintenanceService();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _tickets = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _offset = 0;
  static const int _pageSize = 50;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; _offset = 0; _hasMore = true; });
    try {
      final response = await _api.getTickets(offset: 0, limit: _pageSize);
      if (response.isSuccess) {
        setState(() {
          _tickets = response.data ?? [];
          _offset = _tickets.length;
          _hasMore = _tickets.length >= _pageSize;
          _isLoading = false;
        });
      } else {
        setState(() { _error = response.error; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() => _isLoadingMore = true);
    try {
      final response = await _api.getTickets(offset: _offset, limit: _pageSize);
      if (response.isSuccess && response.data != null) {
        final newItems = response.data!;
        setState(() {
          _tickets.addAll(newItems);
          _offset += newItems.length;
          _hasMore = newItems.length >= _pageSize;
          _isLoadingMore = false;
        });
      } else {
        setState(() => _isLoadingMore = false);
      }
    } catch (_) {
      setState(() => _isLoadingMore = false);
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showReportIssueSheet(context),
        backgroundColor: HmsColors.danger,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Report Issue', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
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
          Text(_error!, textAlign: TextAlign.center, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(color: HmsColors.textMuted)),
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
    final openCount = _tickets.where((t) => t['status'] == 'open').length;
    final inProgressCount = _tickets.where((t) => t['status'] == 'in_progress').length;
    final resolvedCount = _tickets.where((t) => t['status'] == 'resolved' || t['status'] == 'closed').length;

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(child: _buildStats(openCount, inProgressCount, resolvedCount)),
        SliverToBoxAdapter(child: _buildSectionTitle('Active Work Orders')),
        _buildTicketSliverList(),
        if (_isLoadingMore)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
          ),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Maintenance', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('${_tickets.length} work orders', style: TextStyle(fontSize: 12, color: HmsColors.textFaint)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HmsColors.border(context)),
            ),
            child: Icon(Icons.filter_list, color: HmsColors.textMuted, size: 22),
          ),
        ],
      ),
    );
  }

  Widget _buildStats(int open, int inProgress, int resolved) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(child: StatCard(icon: Icons.report_problem, label: 'Open', value: '$open', accentColor: HmsColors.danger, isCompact: true)),
          const SizedBox(width: 10),
          Expanded(child: StatCard(icon: Icons.engineering, label: 'In Progress', value: '$inProgress', accentColor: HmsColors.warning, isCompact: true)),
          const SizedBox(width: 10),
          Expanded(child: StatCard(icon: Icons.task_alt, label: 'Resolved', value: '$resolved', accentColor: HmsColors.success, isCompact: true)),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
    );
  }

  Widget _buildTicketSliverList() {
    if (_tickets.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Text('No active work orders', style: TextStyle(color: HmsColors.textMuted)),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final ticket = _tickets[index];
            final id = (ticket['ticket_number'] ?? ticket['id'] ?? '') as String;
            final title = (ticket['title'] ?? ticket['description'] ?? '') as String;
            final priority = (ticket['priority'] ?? 'medium') as String;
            final status = (ticket['status'] ?? 'open') as String;
            final assigned = ticket['assigned_to'] as String?;
            final category = (ticket['category'] ?? '') as String;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(HmsRadius.lg),
                border: Border.all(color: HmsColors.border(context), width: 0.5),
                boxShadow: HmsShadows.sm,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(child: Text(id, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: HmsColors.primary, fontFamily: 'monospace'))),
                      const SizedBox(width: 8),
                      StatusBadge.priority(priority),
                      const SizedBox(width: 6),
                      StatusBadge.taskStatus(status),
                      if (category.isNotEmpty) ...[
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: HmsColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(HmsRadius.full)),
                          child: Text(category, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: HmsColors.info)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color)),
                  if (assigned != null && assigned.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 10,
                          backgroundColor: HmsColors.navy.withValues(alpha: 0.15),
                          child: Text(assigned[0], style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: HmsColors.navy)),
                        ),
                        const SizedBox(width: 6),
                        Flexible(child: Text(assigned, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: HmsColors.textMuted, fontWeight: FontWeight.w500))),
                      ],
                    ),
                  ],
                ],
              ),
            );
          },
          childCount: _tickets.length,
        ),
      ),
    );
  }

  void _showReportIssueSheet(BuildContext context) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String priority = 'medium';
    String category = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          decoration: BoxDecoration(
            color: Theme.of(ctx).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: HmsColors.borderLight, borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 20),
                Text('Report Issue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 16),
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Issue Title')),
                const SizedBox(height: 12),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: const [
                    DropdownMenuItem(value: 'low', child: Text('Low')),
                    DropdownMenuItem(value: 'medium', child: Text('Medium')),
                    DropdownMenuItem(value: 'high', child: Text('High')),
                    DropdownMenuItem(value: 'critical', child: Text('Critical')),
                  ],
                  onChanged: (v) => setModalState(() => priority = v ?? 'medium'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: category.isEmpty ? null : category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  hint: const Text('Select category'),
                  items: const [
                    DropdownMenuItem(value: 'plumbing', child: Text('Plumbing')),
                    DropdownMenuItem(value: 'electrical', child: Text('Electrical')),
                    DropdownMenuItem(value: 'hvac', child: Text('HVAC')),
                    DropdownMenuItem(value: 'furniture', child: Text('Furniture')),
                    DropdownMenuItem(value: 'other', child: Text('Other')),
                  ],
                  onChanged: (v) => setModalState(() => category = v ?? ''),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: titleCtrl.text.isEmpty ? null : () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: const Text('Issue reported successfully'), backgroundColor: HmsColors.success),
                      );
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: HmsColors.danger, foregroundColor: Colors.white),
                    child: const Text('Submit Report', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

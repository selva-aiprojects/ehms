import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Housekeeping — Kanban Board + Task Cards + Progress (with pagination)
class HousekeepingScreen extends ConsumerStatefulWidget {
  const HousekeepingScreen({super.key});

  @override
  ConsumerState<HousekeepingScreen> createState() => _HousekeepingScreenState();
}

class _HousekeepingScreenState extends ConsumerState<HousekeepingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final HousekeepingService _api = HousekeepingService();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _tasks = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int _offset = 0;
  static const int _pageSize = 50;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
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
      final resp = await _api.getTasks(offset: 0, limit: _pageSize);
      if (resp.isSuccess) {
        setState(() {
          _tasks = resp.data ?? [];
          _offset = _tasks.length;
          _hasMore = _tasks.length >= _pageSize;
          _isLoading = false;
        });
      } else {
        setState(() { _error = resp.error; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() => _isLoadingMore = true);
    try {
      final resp = await _api.getTasks(offset: _offset, limit: _pageSize);
      if (resp.isSuccess && resp.data != null) {
        final newItems = resp.data!;
        setState(() {
          _tasks.addAll(newItems);
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
    final openCount = _tasks.where((t) => t['status'] == 'open').length;
    final inProgressCount = _tasks.where((t) => t['status'] == 'in_progress' || t['status'] == 'assigned').length;
    final completedCount = _tasks.where((t) => t['status'] == 'completed').length;
    final criticalCount = _tasks.where((t) => t['priority'] == 'critical' && t['status'] != 'completed').length;
    final total = _tasks.length;
    final progress = total > 0 ? completedCount / total : 0.0;

    return Column(
      children: [
        _buildHeader(progress),
        _buildProgressSection(openCount, inProgressCount, completedCount, criticalCount),
        _buildTabBar(),
        Expanded(child: _buildTaskList()),
      ],
    );
  }

  Widget _buildHeader(double progress) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Housekeeping',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 2),
                Text('${_tasks.length} tasks', style: TextStyle(fontSize: 12, color: HmsColors.textFaint)),
              ],
            ),
          ),
          ProgressRing(progress: progress, size: 56, strokeWidth: 6, color: HmsColors.gold),
        ],
      ),
    );
  }

  Widget _buildProgressSection(int open, int inProgress, int done, int critical) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: HmsColors.navyGradient,
          borderRadius: BorderRadius.circular(HmsRadius.lg),
          boxShadow: [BoxShadow(color: HmsColors.navy.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            _progressStat('Open', '$open', Colors.white.withValues(alpha: 0.7)),
            Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2)),
            _progressStat('In Progress', '$inProgress', Colors.white.withValues(alpha: 0.7)),
            Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2)),
            _progressStat('Done', '$done', Colors.white.withValues(alpha: 0.7)),
            Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2)),
            _progressStat('Critical', '$critical', HmsColors.danger),
          ],
        ),
      ),
    );
  }

  Widget _progressStat(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.6), fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(HmsRadius.md),
        border: Border.all(color: HmsColors.borderLight, width: 0.5),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(color: HmsColors.gold, borderRadius: BorderRadius.circular(HmsRadius.md)),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: Colors.white,
        unselectedLabelColor: HmsColors.textMuted,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        tabs: const [Tab(text: 'All'), Tab(text: 'Open'), Tab(text: 'Active'), Tab(text: 'Done')],
      ),
    );
  }

  Widget _buildTaskList() {
    return TabBarView(
      controller: _tabController,
      children: [
        _taskListView(_tasks, showLoadMore: true),
        _taskListView(_tasks.where((t) => t['status'] == 'open').toList()),
        _taskListView(_tasks.where((t) => t['status'] == 'in_progress' || t['status'] == 'assigned').toList()),
        _taskListView(_tasks.where((t) => t['status'] == 'completed').toList()),
      ],
    );
  }

  Widget _taskListView(List<Map<String, dynamic>> tasks, {bool showLoadMore = false}) {
    if (tasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_outline, size: 48, color: HmsColors.success.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('All caught up!', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: HmsColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: showLoadMore ? _scrollController : null,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
      itemCount: tasks.length + (showLoadMore && _isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == tasks.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          );
        }

        final task = tasks[index];
        final assignee = (task['assigned_to'] as String? ?? task['assignee'] as String? ?? '?');
        final initials = assignee.isNotEmpty ? assignee.substring(0, 1).toUpperCase() : '?';

        return TaskCard(
          id: (task['id'] ?? '').toString(),
          title: (task['title'] ?? task['name'] ?? 'Untitled task') as String,
          priority: (task['priority'] ?? 'medium') as String,
          status: (task['status'] ?? 'open') as String,
          room: (task['room_number'] ?? task['room'] ?? '') as String,
          scheduledTime: (task['scheduled_time'] ?? task['time'] ?? '') as String,
          notes: task['notes'] as String?,
          assigneeInitials: initials,
          onAction: () => _showTaskDetail(task),
        );
      },
    );
  }

  void _showTaskDetail(Map<String, dynamic> task) {
    final status = (task['status'] ?? 'open') as String;
    final title = (task['title'] ?? task['name'] ?? '') as String;
    final room = (task['room_number'] ?? task['room'] ?? '') as String;
    final notes = task['notes'] as String? ?? '';
    final assignee = task['assigned_to'] as String? ?? task['assignee'] as String? ?? '';
    final priority = (task['priority'] ?? 'medium') as String;
    final taskId = (task['id'] ?? '').toString();

    String newStatus = status;

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
                Row(
                  children: [
                    Expanded(child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
                    if (taskId.isNotEmpty) Flexible(child: Text(taskId, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: HmsColors.textFaint, fontFamily: 'monospace'))),
                  ],
                ),
                const SizedBox(height: 16),
                Text('Status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HmsColors.textSecondary(context))),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: ['open', 'in_progress', 'completed'].map((s) {
                    final isActive = newStatus == s;
                    final chipColor = s == 'completed' ? HmsColors.success : s == 'in_progress' ? HmsColors.info : HmsColors.warning;
                    return GestureDetector(
                      onTap: () => setModalState(() => newStatus = s),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isActive ? chipColor : chipColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(HmsRadius.full),
                          border: Border.all(color: isActive ? chipColor : chipColor.withValues(alpha: 0.3)),
                        ),
                        child: Text(s.replaceAll('_', ' '), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : chipColor)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                _detailRow('Room', room, Icons.king_bed_rounded, HmsColors.info),
                const SizedBox(height: 8),
                _detailRow('Assignee', assignee, Icons.person_rounded, HmsColors.navy),
                const SizedBox(height: 8),
                _detailRow('Priority', priority, Icons.flag_rounded, priority == 'critical' ? HmsColors.danger : HmsColors.warning),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('Notes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HmsColors.textSecondary(context))),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: HmsColors.surfaceMutedFor(context), borderRadius: BorderRadius.circular(HmsRadius.md)),
                    child: Text(notes, maxLines: 4, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: HmsColors.textSecondary(context))),
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HmsRadius.md)),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Task updated to ${newStatus.replaceAll('_', ' ')}'), backgroundColor: HmsColors.success),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HmsColors.gold,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HmsRadius.md)),
                        ),
                        child: const Text('Update', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(fontSize: 12, color: HmsColors.textFaint)),
        const SizedBox(width: 6),
        Flexible(child: Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: HmsColors.textPrimary(context)))),
      ],
    );
  }
}

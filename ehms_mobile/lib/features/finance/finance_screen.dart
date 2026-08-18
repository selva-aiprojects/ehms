import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Finance — Charts, P&L, Invoices, Budget
class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen> {
  final FinanceService _api = FinanceService();
  Map<String, dynamic>? _dashboard;
  Map<String, dynamic>? _profitLoss;
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
        _api.getDashboard(),
        _api.getProfitLoss(),
      ]);
      final dashResp = results[0];
      final plResp = results[1];
      if (dashResp.isSuccess) {
        setState(() {
          _dashboard = dashResp.data;
          _profitLoss = plResp.data;
          _isLoading = false;
        });
      } else {
        setState(() { _error = dashResp.error; _isLoading = false; });
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
    final revenue = _dashboard?['revenue_mtd'] ?? _dashboard?['total_revenue'] ?? 0;
    final outstanding = _dashboard?['outstanding'] ?? 0;
    final revenueStr = _formatCurrency(revenue);
    final outstandingStr = _formatCurrency(outstanding);

    final revenueNum = (revenue is num) ? revenue.toDouble() : 0.0;
    final expensesNum = (_profitLoss?['expenses'] is num) ? (_profitLoss!['expenses'] as num).toDouble() : revenueNum * 0.7;
    final netProfit = revenueNum - expensesNum;
    final profitMargin = revenueNum > 0 ? (netProfit / revenueNum * 100) : 0.0;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(child: _buildKPIs(revenueStr, outstandingStr)),
        SliverToBoxAdapter(child: _buildRevenueChart()),
        SliverToBoxAdapter(child: _buildPnLSummary(revenueNum, expensesNum, netProfit, profitMargin)),
        SliverToBoxAdapter(child: _buildQuickNav()),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  String _formatCurrency(dynamic value) {
    if (value is num) {
      if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(1)}L';
      if (value >= 1000) return '₹${(value / 1000).toStringAsFixed(1)}K';
      return '₹${value.toStringAsFixed(0)}';
    }
    return '₹0';
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
                Text('Finance', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('Revenue, expenses & reconciliation', style: TextStyle(fontSize: 12, color: HmsColors.textFaint)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: HmsColors.navy.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(HmsRadius.full),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.calendar_today, size: 14, color: HmsColors.navy),
                const SizedBox(width: 6),
                Text('Aug 2026', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HmsColors.navy)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKPIs(String revenue, String outstanding) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(child: StatCard(icon: Icons.trending_up, label: 'Revenue MTD', value: revenue, trend: '+12%', trendUp: true, accentColor: HmsColors.navy, isCompact: true)),
          const SizedBox(width: 10),
          Expanded(child: StatCard(icon: Icons.trending_down, label: 'Outstanding', value: outstanding, accentColor: HmsColors.danger, isCompact: true)),
        ],
      ),
    );
  }

  Widget _buildRevenueChart() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: HmsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Revenue Trend', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                StatusBadge(label: '+12% vs last month', color: HmsColors.success, isSmall: true, showDot: false, icon: Icons.trending_up),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 25,
                  barTouchData: BarTouchData(
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        return BarTooltipItem(
                          '₹${rod.toY.round()}L',
                          const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        );
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(months[value.toInt()], style: TextStyle(fontSize: 10, color: HmsColors.textFaint)),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        getTitlesWidget: (value, meta) {
                          return Text('₹${value.toInt()}L', style: TextStyle(fontSize: 10, color: HmsColors.textFaint));
                        },
                      ),
                    ),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: 5,
                    getDrawingHorizontalLine: (value) {
                      return FlLine(color: HmsColors.borderLight.withValues(alpha: 0.5), strokeWidth: 0.5);
                    },
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: [
                    _barGroup(0, 12, HmsColors.borderStrong),
                    _barGroup(1, 14, HmsColors.borderStrong),
                    _barGroup(2, 11, HmsColors.borderStrong),
                    _barGroup(3, 15, HmsColors.borderStrong),
                    _barGroup(4, 13, HmsColors.borderStrong),
                    _barGroup(5, 16, HmsColors.borderStrong),
                    _barGroup(6, 18, HmsColors.borderStrong),
                    _barGroup(7, 18.2, HmsColors.gold),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _barGroup(int x, double y, Color color) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: color,
          width: 20,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
          backDrawRodData: BackgroundBarChartRodData(show: true, toY: 25, color: HmsColors.borderLight.withValues(alpha: 0.3)),
        ),
      ],
    );
  }

  Widget _buildPnLSummary(double revenue, double expenses, double netProfit, double margin) {
    final revenueStr = _formatCurrency(revenue);
    final expensesStr = _formatCurrency(expenses);
    final netStr = _formatCurrency(netProfit);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: HmsCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('P&L Summary', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: HmsColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(HmsRadius.md)),
                        child: Icon(Icons.trending_up, color: HmsColors.success, size: 24),
                      ),
                      const SizedBox(height: 8),
                      Text(revenueStr, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: HmsColors.success)),
                      Text('Revenue', style: TextStyle(fontSize: 11, color: HmsColors.textFaint)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: HmsColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(HmsRadius.md)),
                        child: Icon(Icons.trending_down, color: HmsColors.danger, size: 24),
                      ),
                      const SizedBox(height: 8),
                      Text(expensesStr, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: HmsColors.danger)),
                      Text('Expenses', style: TextStyle(fontSize: 11, color: HmsColors.textFaint)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: HmsColors.success.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(HmsRadius.md)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Net Profit: ', style: TextStyle(fontSize: 13, color: HmsColors.textMuted)),
                  Text(netStr, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: HmsColors.success)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: HmsColors.success.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(HmsRadius.full)),
                    child: Text('${margin.toStringAsFixed(1)}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: HmsColors.success)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickNav() {
    final items = [
      ('Chart of Accounts', Icons.account_tree, HmsColors.navy),
      ('Journal', Icons.book, HmsColors.info),
      ('Invoices', Icons.receipt_long, HmsColors.gold),
      ('Budget', Icons.savings, HmsColors.success),
      ('Tax', Icons.gavel, HmsColors.warning),
      ('Reports', Icons.analytics, HmsColors.violet),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: items.map((item) {
          return GestureDetector(
            onTap: () {},
            child: Container(
              width: (MediaQuery.of(context).size.width - 50) / 3,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: item.$3.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(HmsRadius.md),
                border: Border.all(color: item.$3.withValues(alpha: 0.15)),
              ),
              child: Column(
                children: [
                  Icon(item.$2, color: item.$3, size: 24),
                  const SizedBox(height: 6),
                  Text(item.$1, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: HmsColors.textDark), textAlign: TextAlign.center),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

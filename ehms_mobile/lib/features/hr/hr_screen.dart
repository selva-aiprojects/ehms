import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/core/api/location_service.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// HR — Attendance, Roster, Leave Management
class HrScreen extends ConsumerStatefulWidget {
  const HrScreen({super.key});

  @override
  ConsumerState<HrScreen> createState() => _HrScreenState();
}

class _HrScreenState extends ConsumerState<HrScreen> {
  final HrService _api = HrService();
  final LocationService _location = LocationService();
  List<Map<String, dynamic>> _employees = [];
  List<Map<String, dynamic>> _attendance = [];
  bool _isLoading = true;
  String? _error;
  bool _isClockingIn = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        _api.getEmployees(),
        _api.getAttendance(),
      ]);
      final empResp = results[0];
      final attResp = results[1];
      if (empResp.isSuccess) {
        setState(() {
          _employees = empResp.data ?? [];
          _attendance = attResp.data ?? [];
          _isLoading = false;
        });
      } else {
        setState(() { _error = empResp.error; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _clockIn() async {
    setState(() => _isClockingIn = true);
    try {
      final loc = await _location.getCurrentLocation();
      final resp = await _api.clockIn(
        latitude: loc?.latitude,
        longitude: loc?.longitude,
      );
      if (resp.isSuccess && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clocked in successfully'), backgroundColor: HmsColors.success),
        );
        _loadData();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(resp.error ?? 'Clock in failed'), backgroundColor: HmsColors.danger),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: HmsColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isClockingIn = false);
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
    final presentCount = _attendance.where((a) => a['status'] == 'present' || a['clock_in'] != null).length;
    final absentCount = _attendance.where((a) => a['status'] == 'absent').length;
    final leaveCount = _attendance.where((a) => a['status'] == 'leave').length;
    final totalEmployees = _employees.isNotEmpty ? _employees.length : (presentCount + absentCount + leaveCount);
    final attendanceRate = totalEmployees > 0 ? presentCount / totalEmployees : 0.0;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(child: _buildAttendanceCard(attendanceRate, presentCount, absentCount, leaveCount)),
        SliverToBoxAdapter(child: _buildClockInButton()),
        SliverToBoxAdapter(child: _buildStats(absentCount)),
        SliverToBoxAdapter(child: _buildTeamList()),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Text('Human Resources', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
    );
  }

  Widget _buildAttendanceCard(double rate, int present, int absent, int leave) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: HmsCard(
        child: Row(
          children: [
            ProgressRing(progress: rate, size: 72, strokeWidth: 7, color: HmsColors.success),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Attendance Today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _attBadge('Present', '$present', HmsColors.success),
                      const SizedBox(width: 12),
                      _attBadge('Absent', '$absent', HmsColors.danger),
                      const SizedBox(width: 12),
                      _attBadge('Leave', '$leave', HmsColors.warning),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _attBadge(String label, String count, Color color) {
    return Column(
      children: [
        Text(count, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: HmsColors.textFaint)),
      ],
    );
  }

  Widget _buildClockInButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isClockingIn ? null : _clockIn,
          icon: _isClockingIn
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.fingerprint, size: 22),
          label: Text(
            _isClockingIn ? 'Clocking In...' : 'Clock In with Biometrics',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: HmsColors.gold,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HmsRadius.md)),
          ),
        ),
      ),
    );
  }

  Widget _buildStats(int absent) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(child: StatTile(icon: Icons.person_add, label: 'On Leave', value: '$absent', accent: HmsColors.warning)),
          const SizedBox(width: 10),
          Expanded(child: StatTile(icon: Icons.access_time, label: 'Overtime', value: '8h', accent: HmsColors.info)),
        ],
      ),
    );
  }

  Widget _buildTeamList() {
    if (_employees.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Team', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Center(
              child: Text('No team members found', style: TextStyle(color: HmsColors.textMuted)),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Team', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ..._employees.map((member) {
            final name = (member['full_name'] ?? member['name'] ?? 'Unknown') as String;
            final role = (member['role'] ?? member['department'] ?? '') as String;
            final status = (member['attendance_status'] ?? member['status'] ?? 'present') as String;
            final clockIn = (member['clock_in'] ?? member['time'] ?? '') as String;
            final isPresent = status == 'present' || status == 'clocked_in';

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(HmsRadius.md),
                border: Border.all(color: HmsColors.border(context), width: 0.5),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: isPresent
                        ? HmsColors.success.withValues(alpha: 0.15)
                        : HmsColors.warning.withValues(alpha: 0.15),
                    child: Text(
                      name[0].toUpperCase(),
                      style: TextStyle(fontWeight: FontWeight.w700, color: isPresent ? HmsColors.success : HmsColors.warning),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        Text(role, style: TextStyle(fontSize: 11, color: HmsColors.textFaint)),
                      ],
                    ),
                  ),
                  if (clockIn.isNotEmpty)
                    Text(clockIn, style: TextStyle(fontSize: 11, color: HmsColors.textMuted)),
                  const SizedBox(width: 8),
                  StatusBadge(
                    label: isPresent ? 'Present' : 'Leave',
                    color: isPresent ? HmsColors.success : HmsColors.warning,
                    isSmall: true,
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

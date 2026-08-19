import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/status_badge.dart';

/// Interactive property floor plan — fetches rooms from API
class FloorPlanScreen extends StatefulWidget {
  final String? propertyId;
  const FloorPlanScreen({super.key, this.propertyId});

  @override
  State<FloorPlanScreen> createState() => _FloorPlanScreenState();
}

class _FloorPlanScreenState extends State<FloorPlanScreen> {
  final FrontDeskService _api = FrontDeskService();
  int _selectedFloor = 0;
  String _selectedRoom = '';
  bool _showDetails = false;
  bool _isLoading = true;
  List<Map<String, dynamic>> _rooms = [];

  List<String> _floors = ['All Floors'];

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  Future<void> _loadRooms() async {
    setState(() => _isLoading = true);
    try {
      final resp = await _api.getRooms(propertyId: widget.propertyId);
      if (resp.isSuccess && resp.data != null) {
        final rooms = resp.data!;
        final floorSet = <String>{};
        for (final r in rooms) {
          final f = (r['floor'] ?? '') as String;
          if (f.isNotEmpty) floorSet.add(f);
        }
        setState(() {
          _rooms = rooms;
          _floors = ['All Floors', ...floorSet.toList()..sort()];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredRooms {
    if (_selectedFloor == 0) return _rooms;
    final floorName = _floors[_selectedFloor];
    return _rooms.where((r) => (r['floor'] ?? '') == floorName).toList();
  }

  /// Assign grid positions to rooms based on their index
  List<Map<String, dynamic>> get _positionedRooms {
    final filtered = _filteredRooms;
    const cols = 4;
    const padX = 0.08;
    const padY = 0.12;
    const spacingX = 0.22;
    const spacingY = 0.30;

    return filtered.asMap().entries.map((entry) {
      final idx = entry.key;
      final room = entry.value;
      final col = idx % cols;
      final row = idx ~/ cols;
      return {
        ...room,
        'x': padX + col * spacingX,
        'y': padY + row * spacingY,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildFloorSelector(),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                  : _buildFloorPlan(),
            ),
            if (_showDetails) _buildRoomDetailPanel(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: HmsColors.border(context)),
              ),
              child: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: HmsColors.textSecondary(context)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Floor Plan', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                Text('${_rooms.length} rooms', style: TextStyle(fontSize: 12, color: HmsColors.textFaint)),
              ],
            ),
          ),
          _buildLegend(),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(HmsRadius.md),
        border: Border.all(color: HmsColors.borderLight, width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _legendDot('Vacant', HmsColors.roomVacant),
          const SizedBox(width: 8),
          _legendDot('Occ.', HmsColors.roomOccupied),
          const SizedBox(width: 8),
          _legendDot('Dirty', HmsColors.roomDirty),
        ],
      ),
    );
  }

  Widget _legendDot(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 3),
        Text(label, style: TextStyle(fontSize: 9, color: HmsColors.textFaint, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildFloorSelector() {
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
        itemCount: _floors.length,
        itemBuilder: (context, index) {
          final isActive = index == _selectedFloor;
          return GestureDetector(
            onTap: () => setState(() { _selectedFloor = index; _showDetails = false; }),
            child: AnimatedContainer(
              duration: HmsDurations.fast,
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isActive ? HmsColors.gold : Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(HmsRadius.full),
                border: Border.all(color: isActive ? HmsColors.gold : HmsColors.borderLight),
              ),
              child: Center(
                child: Text(_floors[index], style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : HmsColors.textMuted)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFloorPlan() {
    final positioned = _positionedRooms;
    if (positioned.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.map_outlined, size: 48, color: HmsColors.textFaint.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('No rooms on this floor', style: TextStyle(color: HmsColors.textMuted)),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(20),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(HmsRadius.lg),
              border: Border.all(color: HmsColors.borderLight, width: 1),
            ),
            child: Stack(
              children: [
                CustomPaint(size: Size(constraints.maxWidth, constraints.maxHeight), painter: _FloorGridPainter()),
                ...positioned.map((room) {
                  final x = (room['x'] as double) * constraints.maxWidth;
                  final y = (room['y'] as double) * constraints.maxHeight;
                  final status = (room['status'] ?? 'vacant') as String;
                  final color = HmsColors.roomStatusColor(status);
                  final roomNum = (room['room_number'] ?? '') as String;
                  final isSelected = _selectedRoom == roomNum;

                  return Positioned(
                    left: x - 24,
                    top: y - 24,
                    child: GestureDetector(
                      onTap: () => setState(() { _selectedRoom = roomNum; _showDetails = true; }),
                      child: AnimatedContainer(
                        duration: HmsDurations.fast,
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isSelected ? color : color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? color : color.withValues(alpha: 0.3), width: isSelected ? 2 : 1),
                          boxShadow: isSelected ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 2))] : null,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(roomNum, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: isSelected ? Colors.white : color)),
                            Container(width: 4, height: 4, decoration: BoxDecoration(color: isSelected ? Colors.white.withValues(alpha: 0.8) : color, shape: BoxShape.circle)),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                Positioned(
                  right: 12, top: 12,
                  child: Column(
                    children: [
                      _facilityIcon(Icons.elevator, 'Lift'),
                      const SizedBox(height: 6),
                      _facilityIcon(Icons.stairs, 'Stairs'),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _facilityIcon(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(color: HmsColors.surfaceMuted, borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: [
          Icon(icon, size: 16, color: HmsColors.textFaint),
          Text(label, style: TextStyle(fontSize: 7, color: HmsColors.textFaint)),
        ],
      ),
    );
  }

  Widget _buildRoomDetailPanel() {
    final room = _rooms.firstWhere(
      (r) => (r['room_number'] ?? '') == _selectedRoom,
      orElse: () => {},
    );
    if (room.isEmpty) return const SizedBox.shrink();

    final status = (room['status'] ?? 'vacant') as String;
    final color = HmsColors.roomStatusColor(status);
    final roomType = (room['room_type'] ?? '') as String;
    final guest = room['guest_name'] as String?;
    final rate = room['rate'] != null ? '₹${room['rate']}' : '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.king_bed_rounded, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Text('Room $_selectedRoom', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          const SizedBox(width: 8),
                          StatusBadge.roomStatus(status),
                        ],
                      ),
                      Text('$roomType${guest != null ? ' — $guest' : ''}${rate.isNotEmpty ? '  $rate' : ''}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: HmsColors.textMuted)),
                    ],
                  ),
                ),
                IconButton(onPressed: () => setState(() => _showDetails = false), icon: Icon(Icons.close, color: HmsColors.textFaint, size: 20)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _actionBtn(Icons.login_rounded, 'Check In', HmsColors.success)),
                const SizedBox(width: 8),
                Expanded(child: _actionBtn(Icons.build_rounded, 'Report', HmsColors.warning)),
                const SizedBox(width: 8),
                Expanded(child: _actionBtn(Icons.cleaning_services, 'Clean', HmsColors.violet)),
                const SizedBox(width: 8),
                Expanded(child: _actionBtn(Icons.logout_rounded, 'Check Out', HmsColors.danger)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label, Color color) {
    return OutlinedButton(
      onPressed: () => Navigator.pop(context),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.3)),
        padding: const EdgeInsets.symmetric(vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HmsRadius.md)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

class _FloorGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = HmsColors.borderLight.withValues(alpha: 0.3)
      ..strokeWidth = 0.5;
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

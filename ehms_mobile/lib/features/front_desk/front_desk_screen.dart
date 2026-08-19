import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/api/api_services.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';
import 'package:ehms_mobile/shared/widgets/widgets.dart';

/// Front Desk — Interactive Room Map + Check-in/Out
class FrontDeskScreen extends ConsumerStatefulWidget {
  const FrontDeskScreen({super.key});

  @override
  ConsumerState<FrontDeskScreen> createState() => _FrontDeskScreenState();
}

class _FrontDeskScreenState extends ConsumerState<FrontDeskScreen> {
  final FrontDeskService _api = FrontDeskService();
  final ScrollController _roomScrollController = ScrollController();
  List<Map<String, dynamic>> _rooms = [];
  bool _isLoading = true;
  String? _error;
  String _selectedFilter = 'all';
  String? _selectedRoom;
  int _selectedFloor = 0;

  List<String> _floors = ['All Floors'];

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  @override
  void dispose() {
    _roomScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadRooms() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await _api.getRooms();
      if (response.isSuccess && response.data != null) {
        final rooms = response.data!;
        final floorSet = <String>{};
        for (final r in rooms) {
          final f = (r['floor'] ?? '') as String;
          if (f.isNotEmpty) floorSet.add(f);
        }
        final sortedFloors = floorSet.toList()..sort();
        setState(() {
          _rooms = rooms;
          _floors = ['All Floors', ...sortedFloors];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.error ?? 'Failed to load rooms';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filteredRooms {
    var rooms = _rooms;
    if (_selectedFloor > 0) {
      final floorName = _floors[_selectedFloor];
      rooms = rooms.where((r) => (r['floor'] ?? '') == floorName).toList();
    }
    if (_selectedFilter != 'all') {
      rooms = rooms.where((r) => r['status'] == _selectedFilter).toList();
    }
    return rooms;
  }

  Map<String, int> get _statusCounts {
    final counts = <String, int>{};
    for (final room in _rooms) {
      final status = (room['status'] ?? 'unknown') as String;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadRooms,
          color: HmsColors.gold,
          child: _isLoading
              ? ShimmerLoading.fullPage()
              : _error != null
              ? _buildErrorState()
              : _buildContent(),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCheckInSheet(context),
        backgroundColor: HmsColors.gold,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Quick Check-in',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: HmsColors.danger.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: HmsColors.textMuted),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _loadRooms,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: OutlinedButton.styleFrom(foregroundColor: HmsColors.gold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        _buildHeader(),
        _buildStatsBar(),
        _buildFloorSelector(),
        _buildFilterChips(),
        Expanded(child: _buildRoomGrid()),
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
                Text(
                  'Room Map',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_rooms.length} rooms total',
                  style: TextStyle(fontSize: 12, color: HmsColors.textFaint),
                ),
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
            child: Icon(Icons.search, color: HmsColors.textMuted, size: 22),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBar() {
    final counts = _statusCounts;
    final total = _rooms.length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(HmsRadius.lg),
          border: Border.all(color: HmsColors.border(context), width: 0.5),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _statMini(
                  'Vacant',
                  counts['vacant'] ?? 0,
                  HmsColors.roomVacant,
                  total,
                ),
                _statMini(
                  'Occupied',
                  counts['occupied'] ?? 0,
                  HmsColors.roomOccupied,
                  total,
                ),
                _statMini(
                  'Dirty',
                  counts['dirty'] ?? 0,
                  HmsColors.roomDirty,
                  total,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _statMini(
                  'Cleaning',
                  counts['cleaning'] ?? 0,
                  HmsColors.roomCleaning,
                  total,
                ),
                _statMini(
                  'Maint.',
                  counts['maintenance'] ?? 0,
                  HmsColors.roomMaintenance,
                  total,
                ),
                _statMini(
                  'Reserved',
                  counts['reserved'] ?? 0,
                  HmsColors.roomReserved,
                  total,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statMini(String label, int count, Color color, int total) {
    final pct = total > 0 ? count / total : 0.0;
    return Expanded(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 4),
              Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ProgressBar(progress: pct, color: color, height: 4),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 9,
              color: HmsColors.textFaint,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFloorSelector() {
    return SizedBox(
      height: 44,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
        itemCount: _floors.length,
        itemBuilder: (context, index) {
          final isActive = index == _selectedFloor;
          return GestureDetector(
            onTap: () => setState(() => _selectedFloor = index),
            child: AnimatedContainer(
              duration: HmsDurations.fast,
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isActive
                    ? HmsColors.navy
                    : Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(HmsRadius.full),
                border: Border.all(
                  color: isActive ? HmsColors.navy : HmsColors.border(context),
                ),
              ),
              child: Center(
                child: Text(
                  _floors[index],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : HmsColors.textMuted,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      ('all', 'All', HmsColors.textMuted),
      ('vacant', 'Vacant', HmsColors.roomVacant),
      ('occupied', 'Occupied', HmsColors.roomOccupied),
      ('dirty', 'Dirty', HmsColors.roomDirty),
      ('cleaning', 'Cleaning', HmsColors.roomCleaning),
      ('maintenance', 'Maint.', HmsColors.roomMaintenance),
    ];

    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final f = filters[index];
          final count = f.$1 == 'all'
              ? _rooms.length
              : _rooms.where((r) => r['status'] == f.$1).length;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: RoomFilterChip(
              label: f.$2,
              count: count,
              color: f.$3,
              isActive: _selectedFilter == f.$1,
              onTap: () => setState(() => _selectedFilter = f.$1),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRoomGrid() {
    final rooms = _filteredRooms;

    if (rooms.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.king_bed_rounded,
              size: 48,
              color: HmsColors.textFaint.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'No rooms match this filter',
              style: TextStyle(color: HmsColors.textMuted),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Scrollbar(
        controller: _roomScrollController,
        thumbVisibility: true,
        trackVisibility: true,
        child: GridView.builder(
          controller: _roomScrollController,
          padding: const EdgeInsets.only(right: 10, bottom: 120),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: MediaQuery.sizeOf(context).width < 600 ? 2 : 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: MediaQuery.sizeOf(context).width < 600
                ? 1.1
                : 0.85,
          ),
          itemCount: rooms.length,
          itemBuilder: (context, index) {
            final room = rooms[index];
            final roomNumber = (room['room_number'] ?? '') as String;
            final roomType = (room['room_type'] ?? '') as String;
            final status = (room['status'] ?? 'vacant') as String;
            final rate = room['rate'] != null ? '₹${room['rate']}' : '';
            final guest = room['guest_name'] as String?;
            final floor = (room['floor'] ?? '') as String;

            return RoomCard(
              roomNumber: roomNumber,
              roomType: roomType,
              status: status,
              rate: rate,
              guestName: guest,
              floor: floor,
              isSelected: _selectedRoom == roomNumber,
              onTap: () {
                setState(() => _selectedRoom = roomNumber);
                _showRoomDetail(room);
              },
            );
          },
        ),
      ),
    );
  }

  void _showRoomDetail(Map<String, dynamic> room) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _RoomDetailSheet(room: room),
    );
  }

  void _showCheckInSheet(BuildContext context) {
    final guestNameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    String? selectedRoom;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.fromLTRB(
            24,
            24,
            24,
            MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          decoration: BoxDecoration(
            color: Theme.of(ctx).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
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
                  'Quick Check-in',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: selectedRoom,
                  decoration: const InputDecoration(labelText: 'Select Room'),
                  items: _rooms.where((r) => r['status'] == 'vacant').map((r) {
                    final num = (r['room_number'] ?? '') as String;
                    return DropdownMenuItem(
                      value: num,
                      child: Text('Room $num'),
                    );
                  }).toList(),
                  onChanged: (v) => setModalState(() => selectedRoom = v),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: guestNameCtrl,
                  decoration: const InputDecoration(labelText: 'Guest Name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone Number'),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedRoom == null
                        ? null
                        : () {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Checked in to Room $selectedRoom',
                                ),
                                backgroundColor: HmsColors.success,
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HmsColors.gold,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text(
                      'Complete Check-in',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
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

class _RoomDetailSheet extends StatelessWidget {
  final Map<String, dynamic> room;
  const _RoomDetailSheet({required this.room});

  @override
  Widget build(BuildContext context) {
    final status = (room['status'] ?? 'vacant') as String;
    final statusColor = HmsColors.roomStatusColor(status);
    final roomNumber = (room['room_number'] ?? '') as String;
    final roomType = (room['room_type'] ?? '') as String;
    final rate = room['rate'] != null ? '₹${room['rate']}' : '-';
    final floor = (room['floor'] ?? '') as String;
    final guest = room['guest_name'] as String?;

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: HmsColors.border(context),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      Icons.king_bed_rounded,
                      color: statusColor,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Room $roomNumber',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          roomType,
                          style: TextStyle(
                            fontSize: 13,
                            color: HmsColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusBadge.roomStatus(status),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _infoTile('Rate', rate, HmsColors.gold)),
                  const SizedBox(width: 10),
                  Expanded(child: _infoTile('Floor', floor, HmsColors.navy)),
                ],
              ),
              if (guest != null) ...[
                const SizedBox(height: 10),
                _infoTile('Guest', guest, HmsColors.info),
              ],
              const SizedBox(height: 24),
              Text(
                'Actions',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              _actionButton(
                context,
                Icons.login_rounded,
                'Check In',
                HmsColors.success,
              ),
              const SizedBox(height: 8),
              _actionButton(
                context,
                Icons.cleaning_services,
                'Mark Clean',
                HmsColors.violet,
              ),
              const SizedBox(height: 8),
              _actionButton(
                context,
                Icons.build_rounded,
                'Report Issue',
                HmsColors.warning,
              ),
              const SizedBox(height: 8),
              _actionButton(
                context,
                Icons.logout_rounded,
                'Check Out',
                HmsColors.danger,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _infoTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(HmsRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: HmsColors.textFaint,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
  ) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => Navigator.pop(context),
        icon: Icon(icon, size: 18, color: color),
        label: Text(
          label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color.withValues(alpha: 0.3)),
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(HmsRadius.md),
          ),
        ),
      ),
    );
  }
}

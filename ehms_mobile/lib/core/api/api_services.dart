import 'dart:io';
import 'package:dio/dio.dart';
import 'package:ehms_mobile/core/api/api_client.dart';

/// Paginated list response wrapper
class PaginatedResult<T> {
  final List<T> items;
  final int totalCount;
  final int offset;
  final int limit;
  final bool hasMore;

  PaginatedResult({
    required this.items,
    this.totalCount = 0,
    this.offset = 0,
    this.limit = 20,
  }) : hasMore = offset + items.length < totalCount;
}

/// Front Desk API Service — rooms, bookings, check-in/out
class FrontDeskService {
  final ApiClient _api = ApiClient();

  // ─── Rooms ───

  /// Fetch rooms from the front-desk matrix endpoint.
  /// Returns normalized room maps with keys: room_number, room_type, status,
  /// rate, guest_name, floor, building_code, check_in, check_out.
  Future<ApiResponse<List<Map<String, dynamic>>>> getRooms({
    String? propertyId,
    String? status,
    String? floor,
    int offset = 0,
    int limit = 100,
  }) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;

    final response = await _api.get(
      '/api/dashboard/front-desk/matrix',
      queryParameters: query,
    );

    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to load rooms');
    }

    final rawData = response.data;
    final List<dynamic> rows;
    if (rawData is Map<String, dynamic> && rawData.containsKey('data')) {
      rows = rawData['data'] as List<dynamic>;
    } else if (rawData is List) {
      rows = rawData;
    } else {
      return ApiResponse.error('Unexpected response format');
    }

    final rooms = rows.map<Map<String, dynamic>>((row) {
      final r = row as Map<String, dynamic>;
      return {
        'id': r['id'],
        'room_number': (r['unit_label'] ?? '') as String,
        'room_type': (r['unit_type'] ?? '') as String,
        'layout_type': (r['layout_type'] ?? '') as String,
        'status': (r['status'] ?? 'vacant') as String,
        'rate': r['rate'] ?? r['base_rate'],
        'base_rate': r['base_rate'],
        'guest_name': r['guest_name'] as String?,
        'floor': 'Floor ${(r['floor_number'] ?? 0)}',
        'floor_number': r['floor_number'],
        'building_code': (r['building_code'] ?? '') as String,
        'building_name': (r['building_name'] ?? '') as String,
        'property_name': (r['property_name'] ?? '') as String,
        'booking_id': r['booking_id'],
        'booking_status': r['booking_status'],
        'check_in': r['check_in'],
        'check_out': r['check_out'],
        'vip': r['vip'] == true,
        'pending_requests': r['pending_requests_count'] ?? 0,
        'children': r['children'],
      };
    }).toList();

    // Client-side filter by status
    List<Map<String, dynamic>> filtered = rooms;
    if (status != null && status != 'all') {
      filtered = filtered.where((r) => r['status'] == status).toList();
    }
    if (floor != null && floor.isNotEmpty) {
      filtered = filtered.where((r) => r['floor'] == floor).toList();
    }

    return ApiResponse.success(filtered);
  }

  Future<ApiResponse<Map<String, dynamic>>> updateRoomStatus({
    required String roomId,
    required String status,
  }) async {
    return _api.put('/api/dashboard/front-desk/room-status', body: {'room_id': roomId, 'status': status});
  }

  // ─── Bookings ───

  Future<ApiResponse<List<Map<String, dynamic>>>> getActiveBookings({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/dashboard/front-desk/active-bookings', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  // ─── Check-in / Check-out ───

  Future<ApiResponse<Map<String, dynamic>>> checkin({
    required String reservationId,
    String? roomId,
    Map<String, dynamic>? guestData,
  }) async {
    return _api.post('/api/dashboard/front-desk/checkin', body: {
      'reservation_id': reservationId,
      if (roomId != null) 'room_id': roomId,
      if (guestData != null) ...guestData,
    });
  }

  Future<ApiResponse<Map<String, dynamic>>> checkout({
    required String reservationId,
    String? folioId,
  }) async {
    return _api.post('/api/checkout', body: {
      'reservation_id': reservationId,
      if (folioId != null) 'folio_id': folioId,
    });
  }

  // ─── Dashboard Stats ───

  Future<ApiResponse<Map<String, dynamic>>> getFrontDeskDashboard({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/dashboard/front-desk/dashboard', queryParameters: query);
  }

  // ─── Requests / Logs ───

  Future<ApiResponse<List<Map<String, dynamic>>>> getRequests({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/dashboard/front-desk/requests', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> createRequest(Map<String, dynamic> body) async {
    return _api.post('/api/dashboard/front-desk/requests', body: body);
  }

  // ─── Matrix / Availability ───

  Future<ApiResponse<Map<String, dynamic>>> getMatrix({String? propertyId, String? date}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (date != null) query['date'] = date;
    return _api.get('/api/dashboard/front-desk/matrix', queryParameters: query);
  }

  Future<ApiResponse<Map<String, dynamic>>> checkAvailability({
    String? propertyId,
    String? checkIn,
    String? checkOut,
    String? roomType,
  }) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (checkIn != null) query['check_in'] = checkIn;
    if (checkOut != null) query['check_out'] = checkOut;
    if (roomType != null) query['room_type'] = roomType;
    return _api.get('/api/reservations/check-availability', queryParameters: query);
  }
}

/// Housekeeping API Service
class HousekeepingService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<List<Map<String, dynamic>>>> getTasks({
    String? propertyId,
    String? status,
    String? assignedTo,
    int offset = 0,
    int limit = 50,
  }) async {
    final query = <String, dynamic>{
      'offset': offset,
      'limit': limit,
    };
    if (propertyId != null) query['property_id'] = propertyId;
    if (status != null) query['status'] = status;
    if (assignedTo != null) query['assigned_to'] = assignedTo;
    return _api.getList('/api/housekeeping', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> updateTask({
    required String taskId,
    required Map<String, dynamic> updates,
  }) async {
    return _api.put('/api/housekeeping/$taskId', body: updates);
  }

  Future<ApiResponse<Map<String, dynamic>>> createTask(Map<String, dynamic> body) async {
    return _api.post('/api/housekeeping', body: body);
  }

  Future<ApiResponse<Map<String, dynamic>>> getStats({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/housekeeping/stats', queryParameters: query);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getChecklists({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/housekeeping/checklists', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getInspections({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/housekeeping/inspections', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> createInspection(Map<String, dynamic> body) async {
    return _api.post('/api/housekeeping/inspections', body: body);
  }

  // ─── Linen ───

  Future<ApiResponse<List<Map<String, dynamic>>>> getLinenItems({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/housekeeping/linen/items', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }
}

/// Maintenance API Service
class MaintenanceService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<List<Map<String, dynamic>>>> getTickets({
    String? propertyId,
    String? status,
    String? priority,
    int offset = 0,
    int limit = 50,
  }) async {
    final query = <String, dynamic>{
      'offset': offset,
      'limit': limit,
    };
    if (propertyId != null) query['property_id'] = propertyId;
    if (status != null) query['status'] = status;
    if (priority != null) query['priority'] = priority;
    return _api.getList('/api/maintenance', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> updateTicket({
    required String ticketId,
    required Map<String, dynamic> updates,
  }) async {
    return _api.put('/api/maintenance/$ticketId', body: updates);
  }

  Future<ApiResponse<Map<String, dynamic>>> createTicket(Map<String, dynamic> body) async {
    return _api.post('/api/maintenance', body: body);
  }

  Future<ApiResponse<Map<String, dynamic>>> getStats({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/maintenance/stats', queryParameters: query);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getAssets({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/maintenance/assets', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getVendors({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/maintenance/vendors', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getTimeEntries({String? ticketId}) async {
    final query = <String, dynamic>{};
    if (ticketId != null) query['ticket_id'] = ticketId;
    return _api.getList('/api/maintenance/time-entries', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> createTimeEntry(Map<String, dynamic> body) async {
    return _api.post('/api/maintenance/time-entries', body: body);
  }
}

/// Finance API Service
class FinanceService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<Map<String, dynamic>>> getDashboard({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/finance', queryParameters: query);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getAccounts({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/finance/accounts', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getJournalEntries({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/finance/journal-entries', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getVendorBills({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/finance/vendor-bills', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> getProfitLoss({String? propertyId, String? period}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (period != null) query['period'] = period;
    return _api.get('/api/finance/reports/profit-loss', queryParameters: query);
  }

  Future<ApiResponse<Map<String, dynamic>>> getTrialBalance({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/finance/reports/trial-balance', queryParameters: query);
  }

  Future<ApiResponse<Map<String, dynamic>>> getBalanceSheet({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/finance/reports/balance-sheet', queryParameters: query);
  }

  Future<ApiResponse<Map<String, dynamic>>> getBudget({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.get('/api/finance/budget', queryParameters: query);
  }
}

/// HR API Service
class HrService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<List<Map<String, dynamic>>>> getEmployees({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/hr/employees', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getAttendance({String? propertyId, String? date}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (date != null) query['date'] = date;
    return _api.getList('/api/hr/timesheets', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> clockIn({String? propertyId, double? latitude, double? longitude}) async {
    return _api.post('/api/hr/timesheets', body: {
      'action': 'clock_in',
      if (propertyId != null) 'property_id': propertyId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    });
  }

  Future<ApiResponse<Map<String, dynamic>>> clockOut({String? timesheetId}) async {
    return _api.put('/api/hr/timesheets/${timesheetId ?? ""}', body: {'action': 'clock_out'});
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getLeaves({String? propertyId, String? employeeId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (employeeId != null) query['employee_id'] = employeeId;
    return _api.getList('/api/hr/leaves', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> applyLeave(Map<String, dynamic> body) async {
    return _api.post('/api/hr/leaves', body: body);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getShifts({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/hr/shifts', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getRoster({String? propertyId, String? week}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (week != null) query['week'] = week;
    return _api.getList('/api/hr/roster', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }
}

/// Admin API Service
class AdminService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<List<Map<String, dynamic>>>> getUsers({String? propertyId}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    return _api.getList('/api/admin/users', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getRoles() async {
    return _api.getList('/api/admin/roles', parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getAuditEvents({int page = 1, int limit = 50}) async {
    return _api.getList('/api/admin/audit-events', queryParameters: {'page': page, 'limit': limit}, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getSessions() async {
    return _api.getList('/api/admin/sessions', parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<List<Map<String, dynamic>>>> getBackups() async {
    return _api.getList('/api/admin/backup', parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> createBackup() async {
    return _api.post('/api/admin/backup', body: {});
  }
}

/// Guest API Service
class GuestService {
  final ApiClient _api = ApiClient();

  Future<ApiResponse<List<Map<String, dynamic>>>> getGuests({String? propertyId, String? search}) async {
    final query = <String, dynamic>{};
    if (propertyId != null) query['property_id'] = propertyId;
    if (search != null) query['search'] = search;
    return _api.getList('/api/guests', queryParameters: query, parser: (e) => e as Map<String, dynamic>);
  }

  Future<ApiResponse<Map<String, dynamic>>> createGuest(Map<String, dynamic> body) async {
    return _api.post('/api/guests', body: body);
  }
}

/// Upload API Service — multipart image upload to backend
class UploadService {
  final ApiClient _api = ApiClient();

  /// Upload a single image file to the server
  Future<ApiResponse<Map<String, dynamic>>> uploadImage(String filePath, {String? context}) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return ApiResponse.error('File not found');
      }

      final fileName = filePath.split(Platform.pathSeparator).last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
        if (context != null) 'context': context,
      });

      final response = await _api.dio.post(
        '/api/upload',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );

      final data = response.data;
      if (data is Map<String, dynamic> && data.containsKey('data')) {
        return ApiResponse.success(data['data'] as Map<String, dynamic>);
      }
      return ApiResponse.success(data as Map<String, dynamic>);
    } on DioException catch (e) {
      return ApiResponse.error(e.message ?? 'Upload failed');
    } catch (e) {
      return ApiResponse.error('Upload failed: $e');
    }
  }

  /// Upload multiple images
  Future<ApiResponse<List<Map<String, dynamic>>>> uploadImages(List<String> filePaths, {String? context}) async {
    final results = <Map<String, dynamic>>[];
    for (final path in filePaths) {
      final resp = await uploadImage(path, context: context);
      if (resp.isSuccess && resp.data != null) {
        results.add(resp.data!);
      } else {
        return ApiResponse.error(resp.error ?? 'Upload failed');
      }
    }
    return ApiResponse.success(results);
  }
}

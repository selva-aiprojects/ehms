import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:ehms_mobile/core/api/api_client.dart';
import 'package:ehms_mobile/core/offline/offline_service.dart';

/// Sync status enum
enum SyncStatus { idle, syncing, error, success }

/// Offline sync manager with conflict resolution
class SyncManager {
  static SyncManager? _instance;
  final OfflineService _offline = OfflineService();
  final ApiClient _api = ApiClient();
  final StreamController<SyncStatus> _statusController = StreamController<SyncStatus>.broadcast();
  Timer? _syncTimer;
  bool _isSyncing = false;

  SyncManager._();

  factory SyncManager() => _instance ??= SyncManager._();

  Stream<SyncStatus> get statusStream => _statusController.stream;
  int get pendingCount => _offline.pendingCount;

  /// Initialize sync manager — listen for connectivity changes
  void init() {
    Connectivity().onConnectivityChanged.listen((results) {
      final hasConnection = results.isNotEmpty && !results.contains(ConnectivityResult.none);
      if (hasConnection && !_isSyncing) {
        syncPendingActions();
      }
    });

    // Periodic sync every 5 minutes when connected
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      if (!_isSyncing && _offline.pendingCount > 0) {
        syncPendingActions();
      }
    });
  }

  /// Sync all pending offline actions
  Future<void> syncPendingActions() async {
    if (_isSyncing) return;

    final pending = _offline.getPendingActions();
    if (pending.isEmpty) return;

    _isSyncing = true;
    _statusController.add(SyncStatus.syncing);

    int failCount = 0;

    for (final action in pending) {
      try {
        final response = await _executeAction(action);
        if (response.isSuccess) {
          await _offline.removeAction(action.id);
        } else {
          failCount++;
          // Increment retry count — remove after 5 retries
          action.retryCount++;
          if (action.retryCount >= 5) {
            await _offline.removeAction(action.id);
          }
        }
      } catch (e) {
        failCount++;
        action.retryCount++;
        if (action.retryCount >= 5) {
          await _offline.removeAction(action.id);
        }
      }
    }

    _isSyncing = false;
    _statusController.add(
      failCount == 0 ? SyncStatus.success : SyncStatus.error,
    );
  }

  /// Execute a single offline action against the API
  Future<ApiResponse<dynamic>> _executeAction(OfflineAction action) async {
    switch (action.method.toUpperCase()) {
      case 'POST':
        return _api.post(action.path, body: action.body);
      case 'PUT':
        return _api.put(action.path, body: action.body);
      case 'DELETE':
        return _api.delete(action.path);
      default:
        return ApiResponse.error('Unknown method: ${action.method}');
    }
  }

  /// Queue a mutation for later sync
  Future<void> queueAction({
    required String method,
    required String path,
    Map<String, dynamic>? body,
  }) async {
    final action = OfflineAction(
      id: '${DateTime.now().millisecondsSinceEpoch}_${path.hashCode}',
      method: method,
      path: path,
      body: body,
      createdAt: DateTime.now(),
    );
    await _offline.enqueue(action);
    _statusController.add(SyncStatus.idle);
  }

  /// Clear all pending actions
  Future<void> clearAll() async {
    await _offline.clearQueue();
    _statusController.add(SyncStatus.idle);
  }

  void dispose() {
    _syncTimer?.cancel();
    _statusController.close();
  }
}

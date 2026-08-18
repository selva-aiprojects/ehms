import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';

/// Offline queue item for pending mutations
class OfflineAction {
  final String id;
  final String method; // POST, PUT, DELETE
  final String path;
  final Map<String, dynamic>? body;
  final DateTime createdAt;
  int retryCount;

  OfflineAction({
    required this.id,
    required this.method,
    required this.path,
    this.body,
    required this.createdAt,
    this.retryCount = 0,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'method': method,
    'path': path,
    'body': body,
    'createdAt': createdAt.toIso8601String(),
    'retryCount': retryCount,
  };

  factory OfflineAction.fromJson(Map<String, dynamic> json) => OfflineAction(
    id: json['id'] as String,
    method: json['method'] as String,
    path: json['path'] as String,
    body: json['body'] as Map<String, dynamic>?,
    createdAt: DateTime.parse(json['createdAt'] as String),
    retryCount: json['retryCount'] as int? ?? 0,
  );
}

/// Offline-first cache and sync manager
class OfflineService {
  static OfflineService? _instance;
  late Box<String> _cacheBox;
  late Box<String> _queueBox;

  OfflineService._();

  factory OfflineService() => _instance ??= OfflineService._();

  Future<void> init() async {
    await Hive.initFlutter();
    _cacheBox = await Hive.openBox<String>('ehms_cache');
    _queueBox = await Hive.openBox<String>('ehms_offline_queue');
  }

  // ─── Cache Operations ───

  Future<void> cacheData(String key, dynamic data, {Duration? ttl}) async {
    final entry = {
      'data': data,
      'cachedAt': DateTime.now().toIso8601String(),
      'ttl': (ttl ?? const Duration(minutes: 5)).inSeconds,
    };
    await _cacheBox.put(key, jsonEncode(entry));
  }

  T? getCachedData<T>(String key) {
    final raw = _cacheBox.get(key);
    if (raw == null) return null;

    final entry = jsonDecode(raw) as Map<String, dynamic>;
    final cachedAt = DateTime.parse(entry['cachedAt'] as String);
    final ttl = entry['ttl'] as int;

    if (DateTime.now().difference(cachedAt).inSeconds > ttl) {
      _cacheBox.delete(key);
      return null;
    }

    return entry['data'] as T;
  }

  Future<void> clearCache() async {
    await _cacheBox.clear();
  }

  // ─── Offline Queue ───

  Future<void> enqueue(OfflineAction action) async {
    final existing = _queueBox.get(action.id);
    if (existing != null) {
      await _queueBox.put(action.id, jsonEncode(action.toJson()));
    } else {
      await _queueBox.put(action.id, jsonEncode(action.toJson()));
    }
  }

  List<OfflineAction> getPendingActions() {
    return _queueBox.values.map((raw) {
      return OfflineAction.fromJson(jsonDecode(raw));
    }).toList();
  }

  Future<void> removeAction(String id) async {
    await _queueBox.delete(id);
  }

  Future<void> clearQueue() async {
    await _queueBox.clear();
  }

  int get pendingCount => _queueBox.length;
}

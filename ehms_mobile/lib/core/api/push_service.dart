import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/api/api_client.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background message
  print('[FCM] Background message: ${message.messageId}');
}

/// Push notification service using Firebase Cloud Messaging
class PushNotificationService {
  static PushNotificationService? _instance;
  static BuildContext? _appContext;

  FirebaseMessaging? _fcm;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final ApiClient _api = ApiClient();
  bool _initialized = false;

  PushNotificationService._();

  factory PushNotificationService() => _instance ??= PushNotificationService._();

  /// Store the app context for navigation from notifications
  static void setContext(BuildContext context) {
    _appContext = context;
  }

  /// Initialize FCM and local notifications
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    // Skip push notifications on web
    if (kIsWeb) return;

    try {
    _fcm = FirebaseMessaging.instance;

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission
    final settings = await _fcm!.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      criticalAlert: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Initialize local notifications
      await _initLocalNotifications();

      // Get FCM token
      final token = await _fcm!.getToken();
      if (token != null) {
        await _registerToken(token);
      }

      // Listen for token refresh
      _fcm!.onTokenRefresh.listen((newToken) {
        _registerToken(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle notification tap (app opened from notification)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check if app opened from notification (cold start)
      final initialMessage = await _fcm!.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    }
    } catch (_) {}
  }

  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: (details) {
        final payload = details.payload;
        if (payload != null) {
          final data = jsonDecode(payload) as Map<String, dynamic>;
          _navigateFromNotification(data);
        }
      },
    );

    // Create notification channels
    await _createNotificationChannels();
  }

  Future<void> _createNotificationChannels() async {
    const taskChannel = AndroidNotificationChannel(
      'ehms_tasks',
      'Task Notifications',
      description: 'Notifications for task assignments and updates',
      importance: Importance.high,
      enableVibration: true,
    );

    const alertChannel = AndroidNotificationChannel(
      'ehms_alerts',
      'System Alerts',
      description: 'Critical system alerts and guest notifications',
      importance: Importance.max,
      enableVibration: true,
      enableLights: true,
    );

    final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(taskChannel);
    await androidPlugin?.createNotificationChannel(alertChannel);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification != null) {
      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            message.data['channel'] ?? 'ehms_tasks',
            message.data['channel'] == 'ehms_alerts' ? 'System Alerts' : 'Task Notifications',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            color: const Color(0xFFC9A227),
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    _navigateFromNotification(message.data);
  }

  void _navigateFromNotification(Map<String, dynamic> data) {
    final context = _appContext;
    if (context == null) return;

    final route = data['route'] as String?;
    final module = data['module'] as String?;

    String target;
    if (route != null && route.isNotEmpty) {
      target = route;
    } else if (module != null && module.isNotEmpty) {
      target = '/dashboard/$module';
    } else {
      target = '/dashboard';
    }

    GoRouter.of(context).go(target);
  }

  /// Register FCM token with backend
  Future<void> _registerToken(String token) async {
    try {
      await _api.post('/api/push/subscribe', body: {
        'token': token,
        'platform': 'flutter',
      });
    } catch (_) {}
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _fcm?.subscribeToTopic(topic);
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcm?.unsubscribeFromTopic(topic);
  }

  /// Get FCM token
  Future<String?> getToken() async {
    return await _fcm?.getToken();
  }

  /// Clear all notifications
  Future<void> clearAll() async {
    await _localNotifications.cancelAll();
  }
}

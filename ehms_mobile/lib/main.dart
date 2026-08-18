import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/offline/offline_service.dart';
import 'package:ehms_mobile/core/offline/sync_manager.dart';
import 'package:ehms_mobile/core/api/push_service.dart';
import 'package:ehms_mobile/core/config/app_router.dart';
import 'package:ehms_mobile/core/config/settings_provider.dart';
import 'package:ehms_mobile/shared/theme/hms_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize core services
  await OfflineService().init();
  SyncManager().init();

  // Initialize push notifications
  await PushNotificationService().init();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // System UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  runApp(const ProviderScope(child: EhmsApp()));
}

class EhmsApp extends ConsumerWidget {
  const EhmsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final settings = ref.watch(settingsProvider);

    return MaterialApp.router(
      title: 'HostSphere',
      debugShowCheckedModeBanner: false,
      theme: HmsTheme.lightTheme,
      darkTheme: HmsTheme.darkTheme,
      themeMode: settings.themeMode,
      routerConfig: router,
    );
  }
}

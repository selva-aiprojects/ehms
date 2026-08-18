import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

/// App-wide settings (theme, notifications, biometric, etc.)
class SettingsProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ThemeMode _themeMode = ThemeMode.light;
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;
  bool _offlineMode = true;

  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get biometricEnabled => _biometricEnabled;
  bool get offlineMode => _offlineMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  /// Load settings from secure storage
  Future<void> load() async {
    final themeStr = await _storage.read(key: AppConfig.themeKey);
    if (themeStr == 'dark') {
      _themeMode = ThemeMode.dark;
    } else if (themeStr == 'system') {
      _themeMode = ThemeMode.system;
    }

    final bioStr = await _storage.read(key: AppConfig.biometricKey);
    _biometricEnabled = bioStr == 'true';

    notifyListeners();
  }

  /// Toggle dark/light mode
  Future<void> toggleTheme() async {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    await _storage.write(key: AppConfig.themeKey, value: _themeMode.name);
    notifyListeners();
  }

  /// Toggle notifications
  Future<void> toggleNotifications() async {
    _notificationsEnabled = !_notificationsEnabled;
    notifyListeners();
  }

  /// Toggle biometric
  Future<void> toggleBiometric() async {
    _biometricEnabled = !_biometricEnabled;
    await _storage.write(key: AppConfig.biometricKey, value: _biometricEnabled.toString());
    notifyListeners();
  }

  /// Toggle offline mode
  Future<void> toggleOfflineMode() async {
    _offlineMode = !_offlineMode;
    notifyListeners();
  }
}

/// Riverpod provider for settings
final settingsProvider = ChangeNotifierProvider<SettingsProvider>((ref) {
  final provider = SettingsProvider();
  provider.load();
  return provider;
});

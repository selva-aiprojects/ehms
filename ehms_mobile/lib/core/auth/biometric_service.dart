import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

/// Biometric authentication service
class BiometricService {
  final LocalAuthentication _localAuth = LocalAuthentication();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Check if biometrics are available on device
  Future<bool> isAvailable() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return canCheck && isDeviceSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableTypes() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Authenticate with biometrics
  Future<bool> authenticate({String? reason}) async {
    try {
      return await _localAuth.authenticate(
        localizedReason: reason ?? 'Authenticate to access HostSphere',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  /// Check if user has enabled biometric login
  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: AppConfig.biometricKey);
    return value == 'true';
  }

  /// Enable/disable biometric login
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(
      key: AppConfig.biometricKey,
      value: enabled.toString(),
    );
  }
}

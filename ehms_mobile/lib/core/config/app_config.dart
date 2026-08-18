class AppConfig {
  AppConfig._();

  static const String appName = 'HostSphere';
  static const String appTagline = 'Luxury Hospitality Management';
  
  // ─── API ───
  // For local dev, use your machine's IP or localhost
  // For production, point to your Vercel/domain
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://hostsphere.cybelinx.com',
  );

  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 15);

  // ─── Storage Keys ───
  static const String tokenKey = 'ehms_jwt_token';
  static const String refreshTokenKey = 'ehms_refresh_token';
  static const String userDataKey = 'ehms_user_data';
  static const String tenantKey = 'ehms_tenant_data';
  static const String themeKey = 'ehms_theme_mode';
  static const String onboardedKey = 'ehms_onboarded';
  static const String biometricKey = 'ehms_biometric_enabled';
  static const String pinKey = 'ehms_pin_code';
  static const String offlineQueueKey = 'ehms_offline_queue';

  // ─── Pagination ───
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // ─── Cache ───
  static const Duration cacheTtl = Duration(minutes: 5);
  static const Duration longCacheTtl = Duration(hours: 1);
}

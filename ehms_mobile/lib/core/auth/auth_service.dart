import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import 'auth_models.dart';

/// Authentication state
enum AuthState { initial, authenticated, unauthenticated, loading, error }

/// Auth state holder
class AuthNotifier extends StateNotifier<AuthState> {
  final SecureStorage _storage = SecureStorage();
  final ApiClient _api = ApiClient();

  AuthNotifier() : super(AuthState.initial);

  UserData? _user;
  TenantData? _tenant;

  UserData? get user => _user;
  TenantData? get tenant => _tenant;

  /// Check if user has stored token
  Future<void> checkAuth() async {
    state = AuthState.loading;
    try {
      final hasToken = await _storage.hasToken();
      if (hasToken) {
        _user = await _storage.getUser();
        _tenant = await _storage.getTenant();
        if (_user != null) {
          state = AuthState.authenticated;
          return;
        }
      }
      state = AuthState.unauthenticated;
    } catch (e) {
      state = AuthState.unauthenticated;
    }
  }

  /// Login with email/password/tenant
  Future<String?> login({
    required String email,
    required String password,
    String? tenantCode,
  }) async {
    state = AuthState.loading;
    try {
      final body = {
        'email': email,
        'password': password,
        if (tenantCode != null) 'tenant_code': tenantCode,
      };

      final response = await _api.post(
        '/api/auth/mobile-login',
        body: body,
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;

        // Extract token from cookie or response body
        final tokenStr = data['token'] as String? ?? '';
        final userData = data['user'] as Map<String, dynamic>? ?? {};
        final tenantData = data['tenant'] as Map<String, dynamic>?;

        _user = UserData.fromJson(userData);
        if (tenantData != null) {
          _tenant = TenantData.fromJson(tenantData);
        }

        // Store securely
        await _storage.saveToken(TokenData(
          token: tokenStr,
          expiresAt: DateTime.now().add(const Duration(days: 7)),
        ));
        await _storage.saveUser(_user!);
        if (_tenant != null) {
          await _storage.saveTenant(_tenant!);
        }

        state = AuthState.authenticated;
        return null; // No error
      } else {
        state = AuthState.error;
        return response.error ?? 'Login failed';
      }
    } catch (e) {
      state = AuthState.error;
      return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Platform admin login (no tenant)
  Future<String?> platformLogin({
    required String email,
    required String password,
  }) async {
    state = AuthState.loading;
    try {
      final response = await _api.post(
        '/api/auth/platform-login',
        body: {'email': email, 'password': password},
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final tokenStr = data['token'] as String? ?? '';
        final userData = data['user'] as Map<String, dynamic>? ?? {};

        _user = UserData.fromJson(userData);
        await _storage.saveToken(TokenData(
          token: tokenStr,
          expiresAt: DateTime.now().add(const Duration(days: 7)),
        ));
        await _storage.saveUser(_user!);

        state = AuthState.authenticated;
        return null;
      } else {
        state = AuthState.error;
        return response.error ?? 'Login failed';
      }
    } catch (e) {
      state = AuthState.error;
      return 'An unexpected error occurred.';
    }
  }

  /// Fetch available tenants for selection
  Future<List<Map<String, dynamic>>> fetchTenants() async {
    try {
      final response = await _api.get('/api/admin/tenants');
      if (response.isSuccess && response.data != null) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
        if (data is Map && data.containsKey('data')) {
          return (data['data'] as List).cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Refresh user data from server
  Future<void> refreshUser() async {
    try {
      final response = await _api.get('/api/auth/me');
      if (response.isSuccess && response.data != null) {
        _user = UserData.fromJson(response.data as Map<String, dynamic>);
        await _storage.saveUser(_user!);
      }
    } catch (_) {}
  }

  /// Update local user data (for profile edits)
  void updateUser(UserData updated) {
    _user = updated;
    _storage.saveUser(updated);
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _api.post('/api/auth/logout');
    } catch (_) {}
    _user = null;
    _tenant = null;
    await _storage.clearAll();
    state = AuthState.unauthenticated;
  }
}

/// Providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final currentUserProvider = Provider<UserData?>((ref) {
  final auth = ref.read(authProvider.notifier);
  return auth.user;
});

final currentTenantProvider = Provider<TenantData?>((ref) {
  final auth = ref.read(authProvider.notifier);
  return auth.tenant;
});

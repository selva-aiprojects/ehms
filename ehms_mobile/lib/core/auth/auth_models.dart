import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

/// Token model stored securely
class TokenData {
  final String token;
  final String? refreshToken;
  final DateTime expiresAt;

  TokenData({
    required this.token,
    this.refreshToken,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Map<String, dynamic> toJson() => {
    'token': token,
    'refreshToken': refreshToken,
    'expiresAt': expiresAt.toIso8601String(),
  };

  factory TokenData.fromJson(Map<String, dynamic> json) => TokenData(
    token: json['token'] as String,
    refreshToken: json['refreshToken'] as String?,
    expiresAt: DateTime.parse(json['expiresAt'] as String),
  );
}

/// User data from JWT payload
class UserData {
  final String userId;
  final String email;
  final String firstName;
  final String lastName;
  final String roleName;
  final String? roleId;
  final String? avatarUrl;
  final String? phone;
  final String? tenantCode;
  final String? tenantSchema;
  final String? tenantName;
  final List<String> tenantVerticals;
  final bool isPlatformAdmin;
  final List<String> assignedPropertyIds;

  UserData({
    required this.userId,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.roleName,
    this.roleId,
    this.avatarUrl,
    this.phone,
    this.tenantCode,
    this.tenantSchema,
    this.tenantName,
    this.tenantVerticals = const [],
    this.isPlatformAdmin = false,
    this.assignedPropertyIds = const [],
  });

  String get fullName => '$firstName $lastName'.trim();
  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty ? lastName[0] : '';
    return '$f$l'.toUpperCase();
  }

  UserData copyWith({
    String? userId,
    String? email,
    String? firstName,
    String? lastName,
    String? roleName,
    String? roleId,
    String? avatarUrl,
    String? phone,
    String? tenantCode,
    String? tenantSchema,
    String? tenantName,
    List<String>? tenantVerticals,
    bool? isPlatformAdmin,
    List<String>? assignedPropertyIds,
  }) {
    return UserData(
      userId: userId ?? this.userId,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      roleName: roleName ?? this.roleName,
      roleId: roleId ?? this.roleId,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      phone: phone ?? this.phone,
      tenantCode: tenantCode ?? this.tenantCode,
      tenantSchema: tenantSchema ?? this.tenantSchema,
      tenantName: tenantName ?? this.tenantName,
      tenantVerticals: tenantVerticals ?? this.tenantVerticals,
      isPlatformAdmin: isPlatformAdmin ?? this.isPlatformAdmin,
      assignedPropertyIds: assignedPropertyIds ?? this.assignedPropertyIds,
    );
  }

  Map<String, dynamic> toJson() => {
    'user_id': userId,
    'email': email,
    'first_name': firstName,
    'last_name': lastName,
    'role_name': roleName,
    'role_id': roleId,
    'avatar_url': avatarUrl,
    'phone': phone,
    'tenant_code': tenantCode,
    'tenant_schema': tenantSchema,
    'tenant_name': tenantName,
    'tenant_verticals': tenantVerticals,
    'is_platform_admin': isPlatformAdmin,
    'assigned_property_ids': assignedPropertyIds,
  };

  factory UserData.fromJson(Map<String, dynamic> json) => UserData(
    userId: json['user_id']?.toString() ?? '',
    email: json['email']?.toString() ?? '',
    firstName: json['first_name']?.toString() ?? '',
    lastName: json['last_name']?.toString() ?? '',
    roleName: json['role_name']?.toString() ?? 'unknown',
    roleId: json['role_id']?.toString(),
    avatarUrl: json['avatar_url']?.toString(),
    phone: json['phone']?.toString(),
    tenantCode: json['tenant_code']?.toString(),
    tenantSchema: json['tenant_schema']?.toString(),
    tenantName: json['tenant_name']?.toString(),
    tenantVerticals: (json['tenant_verticals'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
    isPlatformAdmin: json['is_platform_admin'] == true,
    assignedPropertyIds: (json['assigned_property_ids'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
  );
}

/// Tenant data
class TenantData {
  final String code;
  final String name;
  final String schema;
  final List<String> verticals;
  final List<Workspace> workspaces;

  TenantData({
    required this.code,
    required this.name,
    required this.schema,
    this.verticals = const [],
    this.workspaces = const [],
  });

  Map<String, dynamic> toJson() => {
    'code': code,
    'name': name,
    'schema': schema,
    'verticals': verticals,
    'workspaces': workspaces.map((w) => w.toJson()).toList(),
  };

  factory TenantData.fromJson(Map<String, dynamic> json) => TenantData(
    code: json['code']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    schema: json['schema']?.toString() ?? '',
    verticals: (json['verticals'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [],
    workspaces: (json['workspaces'] as List<dynamic>?)
        ?.map((e) => Workspace.fromJson(e as Map<String, dynamic>))
        .toList() ?? [],
  );
}

class Workspace {
  final String type;
  final String name;
  final bool isPrimary;

  Workspace({required this.type, required this.name, this.isPrimary = false});

  Map<String, dynamic> toJson() => {'type': type, 'name': name, 'is_primary': isPrimary};

  factory Workspace.fromJson(Map<String, dynamic> json) => Workspace(
    type: json['type']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    isPrimary: json['is_primary'] == true,
  );
}

/// Secure token + user storage
class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveToken(TokenData token) async {
    await _storage.write(key: AppConfig.tokenKey, value: jsonEncode(token.toJson()));
  }

  Future<TokenData?> getToken() async {
    final raw = await _storage.read(key: AppConfig.tokenKey);
    if (raw == null) return null;
    return TokenData.fromJson(jsonDecode(raw));
  }

  Future<void> saveUser(UserData user) async {
    await _storage.write(key: AppConfig.userDataKey, value: jsonEncode(user.toJson()));
  }

  Future<UserData?> getUser() async {
    final raw = await _storage.read(key: AppConfig.userDataKey);
    if (raw == null) return null;
    return UserData.fromJson(jsonDecode(raw));
  }

  Future<void> saveTenant(TenantData tenant) async {
    await _storage.write(key: AppConfig.tenantKey, value: jsonEncode(tenant.toJson()));
  }

  Future<TenantData?> getTenant() async {
    final raw = await _storage.read(key: AppConfig.tenantKey);
    if (raw == null) return null;
    return TenantData.fromJson(jsonDecode(raw));
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && !token.isExpired;
  }
}

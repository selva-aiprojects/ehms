import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/app_config.dart';
import '../auth/auth_models.dart';

/// API response wrapper
class ApiResponse<T> {
  final T? data;
  final String? error;
  final int? statusCode;
  final bool isSuccess;

  ApiResponse({this.data, this.error, this.statusCode, this.isSuccess = true});

  factory ApiResponse.success(T data, [int? statusCode]) =>
      ApiResponse(data: data, statusCode: statusCode, isSuccess: true);

  factory ApiResponse.error(String error, [int? statusCode]) =>
      ApiResponse(error: error, statusCode: statusCode, isSuccess: false);
}

/// Core API client with interceptors for auth, tenant, and error handling
class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;
  final SecureStorage _storage = SecureStorage();

  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.addAll([
      _AuthInterceptor(_storage),
      _TenantInterceptor(_storage),
      _ErrorInterceptor(),
      _LogInterceptor(),
    ]);
  }

  factory ApiClient() => _instance ??= ApiClient._();

  Dio get dio => _dio;

  // ─── Convenience Methods ───

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? parser,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      final data = response.data;
      if (data is Map<String, dynamic> && data.containsKey('data')) {
        return ApiResponse.success(
          parser != null ? parser(data['data']) : data['data'] as T,
          response.statusCode,
        );
      }
      return ApiResponse.success(data as T, response.statusCode);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e), e.response?.statusCode);
    }
  }

  Future<ApiResponse<List<T>>> getList<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      final data = response.data;
      List<dynamic> list;
      if (data is Map<String, dynamic> && data.containsKey('data')) {
        list = data['data'] as List<dynamic>;
      } else {
        list = data as List<dynamic>;
      }
      return ApiResponse.success(
        list.map((e) => parser(e)).toList(),
        response.statusCode,
      );
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e), e.response?.statusCode);
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? parser,
  }) async {
    try {
      final response = await _dio.post(path, data: body);
      final data = response.data;
      if (data is Map<String, dynamic> && data.containsKey('data')) {
        return ApiResponse.success(
          parser != null ? parser(data['data']) : data['data'] as T,
          response.statusCode,
        );
      }
      return ApiResponse.success(data as T, response.statusCode);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e), e.response?.statusCode);
    }
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic body,
    T Function(dynamic)? parser,
  }) async {
    try {
      final response = await _dio.put(path, data: body);
      final data = response.data;
      if (data is Map<String, dynamic> && data.containsKey('data')) {
        return ApiResponse.success(
          parser != null ? parser(data['data']) : data['data'] as T,
          response.statusCode,
        );
      }
      return ApiResponse.success(data as T, response.statusCode);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e), e.response?.statusCode);
    }
  }

  Future<ApiResponse<void>> delete(String path) async {
    try {
      await _dio.delete(path);
      return ApiResponse.success(null);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e), e.response?.statusCode);
    }
  }

  Future<bool> checkConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    return results.isNotEmpty && !results.contains(ConnectivityResult.none);
  }

  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Please check your network.';
      case DioExceptionType.connectionError:
        return 'No internet connection. Please try again.';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final data = e.response?.data;
        if (data is Map<String, dynamic> && data.containsKey('error')) {
          return data['error'] as String;
        }
        if (statusCode == 401) return 'Session expired. Please log in again.';
        if (statusCode == 403) return 'You don\'t have permission for this action.';
        if (statusCode == 404) return 'Resource not found.';
        if (statusCode == 500) return 'Server error. Please try again later.';
        return 'Error ($statusCode). Please try again.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      default:
        return 'An unexpected error occurred.';
    }
  }
}

/// Injects JWT token into requests
class _AuthInterceptor extends Interceptor {
  final SecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getToken();
    if (token != null && !token.isExpired) {
      options.headers['Cookie'] = 'ehms_token=${token.token}';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      _storage.clearAll();
    }
    handler.next(err);
  }
}

/// Injects tenant schema header
class _TenantInterceptor extends Interceptor {
  final SecureStorage _storage;
  _TenantInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final tenant = await _storage.getTenant();
    if (tenant != null) {
      options.headers['x-tenant-schema'] = tenant.schema;
      options.headers['x-tenant-code'] = tenant.code;
    }
    handler.next(options);
  }
}

/// Global error handler
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.next(err);
  }
}

/// Request/response logger (debug only)
class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    assert(() {
      print('[API] ${options.method} ${options.uri}');
      return true;
    }());
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    assert(() {
      print('[API] ${response.statusCode} ${response.requestOptions.uri}');
      return true;
    }());
    handler.next(response);
  }
}

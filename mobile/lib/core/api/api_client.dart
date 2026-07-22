import 'package:dio/dio.dart';
import '../config/app_config.dart';

/// Singleton Dio client.
/// Mirrors the web app's api.ts:
///   - Attaches Authorization header on every request
///   - On 401 → clears token (router redirect handles navigation to /login)
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  Dio? _dio;
  void Function()? onUnauthorized;

  Dio get dio {
    if (_dio == null) {
      throw StateError('ApiClient must be initialized by calling init() before use.');
    }
    return _dio!;
  }

  Future<void> init() async {
    final baseUrl = await AppConfig.instance.getBaseUrl();
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    dio.interceptors.add(_AuthInterceptor());
    dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (o) => debugPrint('[Dio] $o'),
    ));
    _dio = dio;
  }

  /// Call this after changing the base URL in Settings.
  Future<void> reinit() async {
    final newUrl = await AppConfig.instance.getBaseUrl();
    if (_dio != null) {
      _dio!.options.baseUrl = newUrl;
    } else {
      await init();
    }
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // DO NOT add Authorization header to login/register requests
    // This prevents the backend from getting credentials confusion
    final isAuthRequest = options.path.contains('/auth/login') || 
                         options.path.contains('/auth/register');

    if (!isAuthRequest) {
      final token = await AppConfig.instance.getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
        // Track the token used for this specific request to detect race conditions
        options.extra['token_used'] = token;
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final tokenUsed = err.requestOptions.extra['token_used'];
      final currentToken = await AppConfig.instance.getToken();

      // Only clear and logout if the token that failed is exactly the one we
      // currently have. If they differ, it was a race condition from a stale request.
      if (tokenUsed == currentToken && currentToken != null) {
        debugPrint('[Auth] Valid session token rejected! Logging out. token: ${tokenUsed.substring(0, 10)}...');
        await AppConfig.instance.clearToken();
        if (ApiClient.instance.onUnauthorized != null) {
          ApiClient.instance.onUnauthorized!();
        }
      } else {
        debugPrint('[Auth] Suppressed 401 from stale/wrong token. Request token: ${tokenUsed?.substring(0, 10)}..., Storage token: ${currentToken?.substring(0, 10)}...');
      }
    }
    handler.next(err);
  }
}

/// Extracts a user-friendly error message from a Dio error.
/// Mirrors the web app's handleApiError() function.
String handleApiError(Object error, {String defaultMessage = 'Something went wrong'}) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['detail'] != null) {
      final detail = data['detail'];
      if (detail is String) return detail;
      if (detail is List) return detail.map((e) => e['msg'] ?? e.toString()).join(', ');
      return detail.toString();
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'Connection timed out. Check your network or server URL.';
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'Cannot reach server. Check your server URL in Settings.';
    }
  }
  return defaultMessage;
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

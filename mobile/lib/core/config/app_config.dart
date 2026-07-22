import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_config.g.dart';

@riverpod
Future<bool> hasBaseUrl(HasBaseUrlRef ref) async {
  return AppConfig.instance.hasBaseUrl();
}

/// Manages the configurable backend base URL and JWT token.
/// Stored encrypted via flutter_secure_storage.
class AppConfig {
  AppConfig._();
  static final AppConfig instance = AppConfig._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _urlKey = 'api_base_url';
  static const _tokenKey = 'auth_token';
  static const defaultBaseUrl = 'http://localhost:8000';

  // ── Base URL ──────────────────────────────────────────────────────────────

  Future<String> getBaseUrl() async {
    return (await _storage.read(key: _urlKey)) ?? defaultBaseUrl;
  }

  Future<void> saveBaseUrl(String url) async {
    // Trim trailing slash for consistency
    final clean = url.trimRight().replaceAll(RegExp(r'/+$'), '');
    await _storage.write(key: _urlKey, value: clean);
  }

  Future<bool> hasBaseUrl() async {
    return await _storage.read(key: _urlKey) != null;
  }

  /// Pings the backend health endpoint to verify connectivity.
  Future<bool> testConnection(String url) async {
    try {
      final clean = url.trimRight().replaceAll(RegExp(r'/+$'), '');
      final dio = Dio(BaseOptions(
        baseUrl: clean,
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));
      // FastAPI auto-generates /docs — a lightweight ping target
      final response = await dio.get('/docs');
      return response.statusCode != null && response.statusCode! < 500;
    } catch (_) {
      return false;
    }
  }

  // ── Auth Token ────────────────────────────────────────────────────────────

  Future<String?> getToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<bool> hasToken() async {
    final t = await _storage.read(key: _tokenKey);
    return t != null && t.isNotEmpty;
  }
}

import 'package:dio/dio.dart';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../config/app_config.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../models/models.dart';

part 'auth_provider.g.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Auth State
// ─────────────────────────────────────────────────────────────────────────────

@Riverpod(keepAlive: true)
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<User?> build() async {
    debugPrint('[Auth] Initializing auth state...');
    // Automatically log out if the ApiClient hits a 401
    ApiClient.instance.onUnauthorized = () {
      debugPrint('[Auth] API triggered onUnauthorized callback');
      logout();
    };

    // On cold start, try to restore session from stored token
    final hasToken = await AppConfig.instance.hasToken();
    if (!hasToken) {
      debugPrint('[Auth] No token found in storage.');
      return null;
    }

    try {
      debugPrint('[Auth] Validating token with /me...');
      final response = await ApiClient.instance.dio.get(ApiEndpoints.me);
      final user = User.fromJson(response.data as Map<String, dynamic>);
      debugPrint('[Auth] Token valid. User: ${user.email}');
      return user;
    } catch (e) {
      debugPrint('[Auth] Token validation failed: $e');
      await AppConfig.instance.clearToken();
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    debugPrint('[Auth] Starting login for $email...');
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final response = await ApiClient.instance.dio.post(
        ApiEndpoints.login,
        data: {'username': email, 'password': password},
        options: Options(contentType: 'application/x-www-form-urlencoded'),
      );
      final token = response.data['access_token'] as String;
      debugPrint('[Auth] Login successful. Saving token...');
      await AppConfig.instance.saveToken(token);

      // Fetch user profile
      final meResponse = await ApiClient.instance.dio.get(ApiEndpoints.me);
      return User.fromJson(meResponse.data as Map<String, dynamic>);
    });
  }

  Future<void> register(String email, String password, {String? fullName}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ApiClient.instance.dio.post(ApiEndpoints.register, data: {
        'email': email,
        'password': password,
        if (fullName != null && fullName.isNotEmpty) 'full_name': fullName,
      });
      // Auto-login after registration
      await login(email, password);
      return state.value;
    });
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await ApiClient.instance.dio.post(
      ApiEndpoints.changePassword,
      data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      },
    );
  }

  Future<void> logout() async {
    final isLoggedIn = state.valueOrNull != null;
    debugPrint('[Auth] Logging out (isLoggedIn: $isLoggedIn, hasError: ${state.hasError})...');
    
    // Always clear token and state, even if we think we are logged out 
    // or in an error state, to be absolutely sure.
    await AppConfig.instance.clearToken();
    state = const AsyncData(null);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience selectors
// ─────────────────────────────────────────────────────────────────────────────

/// True iff the user is currently logged in.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).valueOrNull != null;
});

/// The logged-in user, or null.
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authNotifierProvider).valueOrNull;
});

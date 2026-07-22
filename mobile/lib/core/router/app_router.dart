
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../../features/onboarding/server_config_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/accounts/accounts_screen.dart';
import '../../features/accounts/account_detail_screen.dart';
import '../../features/transactions/transactions_screen.dart';
import '../../features/portfolio/portfolio_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shared/widgets/app_shell.dart';

part 'app_router.g.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Route names — use these constants everywhere instead of raw strings
// ─────────────────────────────────────────────────────────────────────────────
class AppRoute {
  static const onboarding = 'onboarding';
  static const login = 'login';
  static const register = 'register';
  static const dashboard = 'dashboard';
  static const accounts = 'accounts';
  static const accountDetail = 'account-detail';
  static const transactions = 'transactions';
  static const portfolio = 'portfolio';
  static const settings = 'settings';
}

// ─────────────────────────────────────────────────────────────────────────────
@Riverpod(keepAlive: true)
GoRouter appRouter(Ref ref) {
  // We use an incrementing counter to force GoRouter to re-evaluate the redirect
  // logic without destroying the GoRouter instance itself.
  final notifier = ValueNotifier<int>(0);

  // Listen to both providers and nudge the router on any change
  ref.listen(authNotifierProvider, (prev, next) {
    debugPrint('[Router] Auth state changed: loading=${next.isLoading}');
    notifier.value++;
  });
  
  ref.listen(hasBaseUrlProvider, (prev, next) {
    debugPrint('[Router] Config state changed: loading=${next.isLoading}');
    notifier.value++;
  });

  return GoRouter(
    initialLocation: '/loading',
    refreshListenable: notifier,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      final configState = ref.read(hasBaseUrlProvider);

      final isLoggedIn = authState.valueOrNull != null;
      final authLoading = authState.isLoading;
      final configLoading = configState.isLoading;
      final hasBaseUrl = configState.valueOrNull ?? true;

      final onOnboarding = state.matchedLocation == '/onboarding';
      final onAuth = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final onLoading = state.matchedLocation == '/loading';

      debugPrint('[Router] Check: path=${state.matchedLocation}, authLoading=$authLoading, configLoading=$configLoading, isLoggedIn=$isLoggedIn, hasUrl=$hasBaseUrl');

      // 1. App initialization loading
      if (authLoading || configLoading) {
        if (onLoading) return null;
        return '/loading';
      }

      // 2. Configuration check
      if (!hasBaseUrl) {
        if (onOnboarding) return null;
        return '/onboarding';
      }

      // 3. Authenticated?
      if (isLoggedIn) {
        if (onAuth || onLoading) return '/dashboard';
        return null;
      }

      // 4. Unauthenticated
      if (!onAuth && !onOnboarding) {
        return '/login';
      }

      return null;
    },
    routes: [
      // ── System / Loading ───────────────────────────────────────────────
      GoRoute(
        path: '/loading',
        builder: (_, __) => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      ),
      // ── Public / Onboarding ───────────────────────────────────────────────
      GoRoute(
        path: '/onboarding',
        name: AppRoute.onboarding,
        builder: (_, __) => const ServerConfigScreen(),
      ),
      GoRoute(
        path: '/login',
        name: AppRoute.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        name: AppRoute.register,
        builder: (_, __) => const RegisterScreen(),
      ),

      // ── Protected Shell (Bottom Nav) ──────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            name: AppRoute.dashboard,
            pageBuilder: (_, __) => const NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: '/accounts',
            name: AppRoute.accounts,
            pageBuilder: (_, __) => const NoTransitionPage(child: AccountsScreen()),
            routes: [
              GoRoute(
                path: ':id',
                name: AppRoute.accountDetail,
                builder: (_, state) => AccountDetailScreen(
                  accountId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/transactions',
            name: AppRoute.transactions,
            pageBuilder: (_, __) => const NoTransitionPage(child: TransactionsScreen()),
          ),
          GoRoute(
            path: '/portfolio',
            name: AppRoute.portfolio,
            pageBuilder: (_, __) => const NoTransitionPage(child: PortfolioScreen()),
          ),
          GoRoute(
            path: '/settings',
            name: AppRoute.settings,
            pageBuilder: (_, __) => const NoTransitionPage(child: SettingsScreen()),
          ),
        ],
      ),
    ],
  );
}

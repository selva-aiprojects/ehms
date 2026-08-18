import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/auth/auth_service.dart';
import 'package:ehms_mobile/features/auth/login_screen.dart';
import 'package:ehms_mobile/features/auth/splash_screen.dart';
import 'package:ehms_mobile/features/dashboard/dashboard_shell.dart';
import 'package:ehms_mobile/features/dashboard/dashboard_home.dart';
import 'package:ehms_mobile/features/front_desk/front_desk_screen.dart';
import 'package:ehms_mobile/features/front_desk/floor_plan_screen.dart';
import 'package:ehms_mobile/features/housekeeping/housekeeping_screen.dart';
import 'package:ehms_mobile/features/maintenance/maintenance_screen.dart';
import 'package:ehms_mobile/features/finance/finance_screen.dart';
import 'package:ehms_mobile/features/hr/hr_screen.dart';
import 'package:ehms_mobile/features/admin/admin_screen.dart';
import 'package:ehms_mobile/features/settings/settings_screen.dart';
import 'package:ehms_mobile/features/profile/profile_screen.dart';
import 'package:ehms_mobile/features/shared_screens/photo_capture_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isOnAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/splash';
      final isAuthenticated = authState == AuthState.authenticated;
      final isLoading = authState == AuthState.loading ||
          authState == AuthState.initial;

      // Still loading — stay on splash
      if (isLoading && !isOnAuthRoute) return '/splash';

      // Not authenticated and not on auth route — go to login
      if (!isAuthenticated && !isOnAuthRoute) return '/login';

      // Authenticated and on auth route — go to dashboard
      if (isAuthenticated && isOnAuthRoute) return '/dashboard';

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => DashboardShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardHome(),
            ),
          ),
          GoRoute(
            path: '/dashboard/front-desk',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: FrontDeskScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/housekeeping',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HousekeepingScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/maintenance',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: MaintenanceScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/finance',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: FinanceScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/hr',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HrScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/admin',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AdminScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard/settings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SettingsScreen(),
            ),
          ),
        ],
      ),
      // Full-screen routes (outside shell)
      GoRoute(
        path: '/floor-plan',
        builder: (context, state) {
          final propertyId = state.uri.queryParameters['propertyId'];
          return FloorPlanScreen(propertyId: propertyId);
        },
      ),
      GoRoute(
        path: '/photo-capture',
        builder: (context, state) {
          final category = state.uri.queryParameters['category'];
          final roomId = state.uri.queryParameters['roomId'];
          return PhotoCaptureScreen(category: category, roomId: roomId);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});

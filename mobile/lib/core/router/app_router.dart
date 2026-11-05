import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import 'package:swm_mobile/features/auth/auth.dart';
import 'package:swm_mobile/features/dashboard/dashboard.dart';
import 'package:swm_mobile/features/home/home.dart';
import 'package:swm_mobile/features/profile/profile.dart';
import 'package:swm_mobile/features/reports/reports.dart';

import 'auth_guard.dart';

part 'app_router.gr.dart';

@AutoRouterConfig()
class AppRouter extends RootStackRouter {
  AppRouter(this._auth);

  final AuthProvider _auth;

  @override
  RouteType get defaultRouteType => const RouteType.material();

  @override
  List<AutoRoute> get routes {
    final guard = AuthGuard(_auth);
    return [
      AutoRoute(page: SplashRoute.page, path: '/', initial: true),
      AutoRoute(page: LoginRoute.page, path: '/login'),
      AutoRoute(page: RegisterRoute.page, path: '/register'),
      AutoRoute(
        page: HomeRoute.page,
        path: '/home',
        guards: [guard],
        children: [
          AutoRoute(page: DashboardRoute.page, path: 'dashboard', initial: true),
          AutoRoute(page: ReportHistoryRoute.page, path: 'reports'),
          AutoRoute(page: ProfileRoute.page, path: 'profile'),
        ],
      ),
      AutoRoute(page: CreateReportRoute.page, path: '/reports/new', guards: [guard]),
      AutoRoute(page: ReportDetailRoute.page, path: '/reports/:id', guards: [guard]),
      AutoRoute(page: EditProfileRoute.page, path: '/profile/edit', guards: [guard]),
      AutoRoute(page: ChangePasswordRoute.page, path: '/profile/password', guards: [guard]),
    ];
  }
}

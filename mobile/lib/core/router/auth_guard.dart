import 'package:auto_route/auto_route.dart';

import 'package:swm_mobile/features/auth/auth.dart';

import 'app_router.dart';

/// Blocks protected routes until the user is signed in.
class AuthGuard extends AutoRouteGuard {
  AuthGuard(this._auth);

  final AuthProvider _auth;

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    if (_auth.isAuthenticated) {
      resolver.next();
    } else {
      resolver.next(false);
      router.replaceAll([const LoginRoute()]);
    }
  }
}

import 'package:flutter/foundation.dart';

import 'package:swm_mobile/core/core.dart';

import '../data/data.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._repo);

  final AuthRepository _repo;

  AuthStatus status = AuthStatus.unknown;
  User? user;
  bool isLoading = false;
  String? errorMessage;
  Map<String, String> fieldErrors = {};

  bool get isAuthenticated => status == AuthStatus.authenticated;

  /// Called from the splash screen: validates the stored token.
  Future<void> checkSession() async {
    if (!await _repo.hasToken()) {
      _setStatus(AuthStatus.unauthenticated);
      return;
    }
    try {
      user = await _repo.me();
      if (user!.isAdmin) {
        await _repo.clearLocalSession();
        user = null;
        _setStatus(AuthStatus.unauthenticated);
        return;
      }
      _setStatus(AuthStatus.authenticated);
    } on ApiException catch (e) {
      // Offline: keep the user signed in rather than forcing a new login.
      if (e.statusCode == null) {
        _setStatus(AuthStatus.authenticated);
      } else {
        await _repo.clearLocalSession();
        _setStatus(AuthStatus.unauthenticated);
      }
    }
  }

  Future<bool> login(String email, String password) =>
      _run(() async => user = await _repo.login(email, password));

  Future<bool> register({required String name, required String email, required String password, String? phone}) =>
      _run(() async => user = await _repo.register(name: name, email: email, password: password, phone: phone));

  Future<bool> updateProfile({required String name, required String email, String? phone}) =>
      _run(() async => user = await _repo.updateProfile(name: name, email: email, phone: phone), keepStatus: true);

  Future<bool> changePassword(String current, String next) =>
      _run(() => _repo.changePassword(current, next), keepStatus: true);

  Future<void> refreshUser() async {
    try {
      user = await _repo.me();
      notifyListeners();
    } on ApiException catch (_) {}
  }

  Future<void> logout() async {
    try {
      await _repo.logout();
    } on ApiException catch (_) {
      // Token is cleared locally even if the request fails.
    }
    user = null;
    _setStatus(AuthStatus.unauthenticated);
  }

  /// Token rejected by the server (401).
  Future<void> forceLogout() async {
    await _repo.clearLocalSession();
    user = null;
    _setStatus(AuthStatus.unauthenticated);
  }

  void clearErrors() {
    errorMessage = null;
    fieldErrors = {};
    notifyListeners();
  }

  Future<bool> _run(Future<void> Function() action, {bool keepStatus = false}) async {
    isLoading = true;
    errorMessage = null;
    fieldErrors = {};
    notifyListeners();
    try {
      await action();
      if (!keepStatus) status = AuthStatus.authenticated;
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      fieldErrors = e.fieldErrors;
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void _setStatus(AuthStatus value) {
    status = value;
    notifyListeners();
  }
}

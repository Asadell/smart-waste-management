import 'package:swm_mobile/core/core.dart';

import 'user.dart';

class AuthRepository {
  AuthRepository(this._api, this._tokens);

  final ApiClient _api;
  final TokenStorage _tokens;

  Future<bool> hasToken() async => await _tokens.read() != null;

  Future<User> login(String email, String password) async {
    final res = await _api.post<Map<String, dynamic>>('/auth/login', data: {
      'email': email,
      'password': password,
      // Backend rejects admin accounts when the client is mobile.
      'client': 'mobile',
      'device_name': 'android',
    });
    return _saveSession(res);
  }

  Future<User> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final res = await _api.post<Map<String, dynamic>>('/auth/register', data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'password_confirmation': password,
      'device_name': 'android',
    });
    return _saveSession(res);
  }

  Future<User> me() async {
    final res = await _api.get<Map<String, dynamic>>('/auth/me');
    return User.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<User> updateProfile({required String name, required String email, String? phone}) async {
    final res = await _api.put<Map<String, dynamic>>('/auth/profile', data: {
      'name': name,
      'email': email,
      'phone': phone,
    });
    return User.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<void> changePassword(String current, String next) => _api.put('/auth/password', data: {
        'current_password': current,
        'password': next,
        'password_confirmation': next,
      });

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } finally {
      await _tokens.clear();
    }
  }

  Future<void> clearLocalSession() => _tokens.clear();

  Future<User> _saveSession(Map<String, dynamic> res) async {
    final data = res['data'] as Map<String, dynamic>;
    await _tokens.write(data['token'] as String);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }
}

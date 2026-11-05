import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the Sanctum token in the platform keystore.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  static const _key = 'auth_token';
  final FlutterSecureStorage _storage;
  String? _cache;

  Future<String?> read() async => _cache ??= await _storage.read(key: _key);

  Future<void> write(String token) async {
    _cache = token;
    await _storage.write(key: _key, value: token);
  }

  Future<void> clear() async {
    _cache = null;
    await _storage.delete(key: _key);
  }
}

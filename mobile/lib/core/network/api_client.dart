import 'package:dio/dio.dart';

import '../config.dart';
import '../storage/storage.dart';
import 'api_exception.dart';

/// Shared Dio instance: base URL, bearer token, and 401 handling.
class ApiClient {
  ApiClient(this._tokenStorage) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Accept': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.read();
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
        onError: (error, handler) {
          final isLogin = error.requestOptions.path.endsWith('/auth/login');
          if (error.response?.statusCode == 401 && !isLogin) {
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  final TokenStorage _tokenStorage;
  late final Dio dio;

  /// Set by the app to log the user out when the token is expired/revoked.
  void Function()? onUnauthorized;

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) =>
      _send(() => dio.get(path, queryParameters: query));

  Future<T> post<T>(String path, {Object? data}) => _send(() => dio.post(path, data: data));

  Future<T> put<T>(String path, {Object? data}) => _send(() => dio.put(path, data: data));

  Future<T> delete<T>(String path) => _send(() => dio.delete(path));

  Future<T> _send<T>(Future<Response<dynamic>> Function() request) async {
    try {
      final response = await request();
      return response.data as T;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

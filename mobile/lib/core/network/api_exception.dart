import 'package:dio/dio.dart';

/// Error with a human readable message (in Indonesian) and optional
/// per-field validation errors coming from Laravel.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.fieldErrors = const {}});

  final String message;
  final int? statusCode;
  final Map<String, String> fieldErrors;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;

    if (response == null) {
      return switch (e.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.sendTimeout =>
          ApiException('Koneksi ke server terlalu lama. Coba lagi.'),
        _ => ApiException('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'),
      };
    }

    final data = response.data;
    var message = 'Terjadi kesalahan (${response.statusCode}).';
    final fields = <String, String>{};

    if (data is Map) {
      if (data['message'] is String) message = data['message'] as String;
      final errors = data['errors'];
      if (errors is Map) {
        errors.forEach((key, value) {
          if (value is List && value.isNotEmpty) fields[key.toString()] = value.first.toString();
        });
        if (fields.isNotEmpty) message = fields.values.first;
      }
    }

    return ApiException(message, statusCode: response.statusCode, fieldErrors: fields);
  }

  @override
  String toString() => message;
}

import 'package:dio/dio.dart';

import 'package:swm_mobile/core/core.dart';

import 'prediction.dart';
import 'report.dart';

class NewReport {
  const NewReport({
    required this.photoPath,
    required this.title,
    this.description,
    required this.latitude,
    required this.longitude,
    this.address,
    required this.category,
    this.prediction,
  });

  final String photoPath;
  final String title;
  final String? description;
  final double latitude;
  final double longitude;
  final String? address;
  final WasteCategory category;
  final Prediction? prediction;
}

class ReportRepository {
  ReportRepository(this._api);

  final ApiClient _api;

  Future<PaginatedReports> list({int page = 1, int perPage = 10, ReportStatus? status, String? search}) async {
    final res = await _api.get<Map<String, dynamic>>('/reports', query: {
      'page': page,
      'per_page': perPage,
      'status': ?status?.apiValue,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final meta = res['meta'] as Map<String, dynamic>;
    return PaginatedReports(
      items: (res['data'] as List<dynamic>).map((e) => Report.fromJson(e as Map<String, dynamic>)).toList(),
      currentPage: meta['current_page'] as int,
      lastPage: meta['last_page'] as int,
      total: meta['total'] as int,
    );
  }

  Future<Report> detail(int id) async {
    final res = await _api.get<Map<String, dynamic>>('/reports/$id');
    return Report.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<Report> create(NewReport input) async {
    final p = input.prediction;
    final form = FormData.fromMap({
      'photo': await MultipartFile.fromFile(input.photoPath, filename: 'report.jpg'),
      'title': input.title,
      'description': ?input.description,
      'latitude': input.latitude,
      'longitude': input.longitude,
      'address': ?input.address,
      'category': input.category.name,
      if (p?.label != null) ...{
        'ai_label': p!.label!.name,
        'ai_confidence': p.confidence,
        'ai_uncertain': p.uncertain ? 1 : 0,
      },
    });
    final res = await _api.post<Map<String, dynamic>>('/reports', data: form);
    return Report.fromJson(res['data'] as Map<String, dynamic>);
  }

  Future<void> delete(int id) => _api.delete('/reports/$id');

  Future<Prediction> predict(String photoPath) async {
    final form = FormData.fromMap({'file': await MultipartFile.fromFile(photoPath, filename: 'photo.jpg')});
    final res = await _api.post<Map<String, dynamic>>('/predict', data: form);
    return Prediction.fromJson(res['data'] as Map<String, dynamic>);
  }
}

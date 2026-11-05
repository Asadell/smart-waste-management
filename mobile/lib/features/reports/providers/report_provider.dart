import 'package:flutter/foundation.dart';

import 'package:swm_mobile/core/core.dart';

import '../data/data.dart';

/// Report history (paginated + status filter) and report detail.
class ReportProvider extends ChangeNotifier {
  ReportProvider(this._repo);

  final ReportRepository _repo;

  // --- list ---
  List<Report> reports = [];
  ReportStatus? statusFilter;
  bool isLoading = false;
  bool isLoadingMore = false;
  String? errorMessage;
  int _page = 1;
  bool _hasMore = true;
  bool get hasMore => _hasMore;

  // --- detail ---
  Report? detail;
  bool isDetailLoading = false;
  String? detailError;

  // --- create ---
  bool isSubmitting = false;

  Future<void> loadReports({bool refresh = true}) async {
    if (refresh) {
      _page = 1;
      _hasMore = true;
      isLoading = reports.isEmpty;
      errorMessage = null;
    } else {
      if (!_hasMore || isLoadingMore || isLoading) return;
      isLoadingMore = true;
    }
    notifyListeners();

    try {
      final result = await _repo.list(page: _page, status: statusFilter);
      reports = refresh ? result.items : [...reports, ...result.items];
      _hasMore = result.hasMore;
      _page = result.currentPage + 1;
    } on ApiException catch (e) {
      errorMessage = e.message;
    } finally {
      isLoading = false;
      isLoadingMore = false;
      notifyListeners();
    }
  }

  Future<void> setStatusFilter(ReportStatus? status) async {
    if (status == statusFilter) return;
    statusFilter = status;
    reports = [];
    await loadReports();
  }

  Future<void> loadDetail(int id) async {
    if (detail?.id != id) detail = null;
    isDetailLoading = detail == null;
    detailError = null;
    notifyListeners();
    try {
      detail = await _repo.detail(id);
    } on ApiException catch (e) {
      detailError = e.message;
    } finally {
      isDetailLoading = false;
      notifyListeners();
    }
  }

  /// Returns the created report, or throws [ApiException].
  Future<Report> create(NewReport input) async {
    isSubmitting = true;
    notifyListeners();
    try {
      final report = await _repo.create(input);
      reports = [report, ...reports];
      return report;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> delete(int id) async {
    await _repo.delete(id);
    reports = reports.where((r) => r.id != id).toList();
    if (detail?.id == id) detail = null;
    notifyListeners();
  }

  void reset() {
    reports = [];
    detail = null;
    statusFilter = null;
    errorMessage = null;
    notifyListeners();
  }
}

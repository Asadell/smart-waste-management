import 'package:flutter/foundation.dart';

import 'package:swm_mobile/core/core.dart';

import '../data/data.dart';

class DashboardProvider extends ChangeNotifier {
  DashboardProvider(this._repo);

  final DashboardRepository _repo;

  DashboardStats? stats;
  bool isLoading = false;
  String? errorMessage;

  Future<void> load() async {
    isLoading = stats == null;
    errorMessage = null;
    notifyListeners();
    try {
      stats = await _repo.stats();
    } on ApiException catch (e) {
      errorMessage = e.message;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    stats = null;
    notifyListeners();
  }
}

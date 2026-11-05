import 'package:flutter/foundation.dart';

import 'package:swm_mobile/core/core.dart';

import '../data/data.dart';

enum PredictState { idle, loading, result, error }

/// State of the AI image detection on the "create report" screen.
class PredictProvider extends ChangeNotifier {
  PredictProvider(this._repo);

  final ReportRepository _repo;

  PredictState state = PredictState.idle;
  Prediction? prediction;
  String? errorMessage;
  int _requestId = 0;

  Future<Prediction?> predict(String photoPath) async {
    final id = ++_requestId;
    state = PredictState.loading;
    prediction = null;
    errorMessage = null;
    notifyListeners();

    try {
      final result = await _repo.predict(photoPath);
      if (id != _requestId) return null; // a newer photo was picked meanwhile
      prediction = result;
      state = PredictState.result;
      return result;
    } on ApiException catch (e) {
      if (id != _requestId) return null;
      errorMessage = e.statusCode == 503 ? 'Layanan AI sedang tidak tersedia. Pilih kategori secara manual.' : e.message;
      state = PredictState.error;
      return null;
    } finally {
      if (id == _requestId) notifyListeners();
    }
  }

  void reset() {
    _requestId++;
    state = PredictState.idle;
    prediction = null;
    errorMessage = null;
    notifyListeners();
  }
}

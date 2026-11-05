import 'package:flutter_test/flutter_test.dart';
import 'package:swm_mobile/features/reports/reports.dart';

void main() {
  test('Report.fromJson parses API payload', () {
    final report = Report.fromJson({
      'id': 7,
      'title': 'Botol plastik',
      'description': null,
      'photo_url': 'http://localhost/storage/reports/a.jpg',
      'latitude': -7.28,
      'longitude': 112.79,
      'address': 'Surabaya',
      'category': 'plastic',
      'ai_label': 'paper',
      'ai_confidence': 0.71,
      'ai_uncertain': false,
      'status': 'in_progress',
      'admin_note': null,
      'can': {'update': false, 'delete': false},
      'status_logs': [
        {'from_status': null, 'to_status': 'pending', 'note': 'Laporan dibuat.', 'created_at': '2026-11-04T10:00:00+00:00'},
      ],
      'created_at': '2026-11-04T10:00:00+00:00',
    });

    expect(report.status, ReportStatus.inProgress);
    expect(report.category, WasteCategory.plastic);
    expect(report.aiLabel, WasteCategory.paper);
    expect(report.logs.single.toStatus, ReportStatus.pending);
  });

  test('ReportStatus maps API values both ways', () {
    for (final s in ReportStatus.values) {
      expect(ReportStatus.fromApi(s.apiValue), s);
    }
    expect(ReportStatus.inProgress.apiValue, 'in_progress');
  });

  test('Prediction.fromJson keeps uncertain flag', () {
    final p = Prediction.fromJson({
      'label': 'organic',
      'confidence': 0.42,
      'uncertain': true,
      'probabilities': {'organic': 0.42, 'paper': 0.3, 'plastic': 0.28},
    });
    expect(p.label, WasteCategory.organic);
    expect(p.uncertain, isTrue);
    expect(p.probabilities['paper'], 0.3);
  });
}

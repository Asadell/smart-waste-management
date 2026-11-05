import 'package:swm_mobile/features/reports/reports.dart';

class DashboardStats {
  const DashboardStats({
    required this.total,
    required this.byStatus,
    required this.byCategory,
    required this.recent,
  });

  final int total;
  final Map<ReportStatus, int> byStatus;
  final Map<WasteCategory, int> byCategory;
  final List<Report> recent;

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final status = json['by_status'] as Map<String, dynamic>;
    final category = json['by_category'] as Map<String, dynamic>;
    return DashboardStats(
      total: json['total_reports'] as int,
      byStatus: {for (final s in ReportStatus.values) s: (status[s.apiValue] as int?) ?? 0},
      byCategory: {for (final c in WasteCategory.values) c: (category[c.name] as int?) ?? 0},
      recent: (json['recent_reports'] as List<dynamic>).map((e) => Report.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

import 'package:flutter/material.dart';

import 'package:swm_mobile/core/core.dart';

enum ReportStatus {
  pending('Pending', AppColors.pending, Icons.schedule),
  inProgress('In Progress', AppColors.inProgress, Icons.local_shipping_outlined),
  completed('Completed', AppColors.completed, Icons.check_circle_outline),
  rejected('Rejected', AppColors.rejected, Icons.cancel_outlined);

  const ReportStatus(this.label, this.color, this.icon);

  final String label;
  final Color color;
  final IconData icon;

  String get apiValue => this == inProgress ? 'in_progress' : name;

  static ReportStatus fromApi(String value) =>
      ReportStatus.values.firstWhere((s) => s.apiValue == value, orElse: () => ReportStatus.pending);
}

enum WasteCategory {
  organic('Organik', AppColors.organic, Icons.eco_outlined),
  plastic('Plastik', AppColors.plastic, Icons.local_drink_outlined),
  paper('Kertas', AppColors.paper, Icons.description_outlined);

  const WasteCategory(this.label, this.color, this.icon);

  final String label;
  final Color color;
  final IconData icon;

  static WasteCategory? tryParse(String? value) =>
      WasteCategory.values.where((c) => c.name == value).firstOrNull;
}

class StatusLog {
  const StatusLog({
    required this.toStatus,
    this.fromStatus,
    this.note,
    this.changedBy,
    required this.createdAt,
  });

  final ReportStatus? fromStatus;
  final ReportStatus toStatus;
  final String? note;
  final String? changedBy;
  final DateTime createdAt;

  factory StatusLog.fromJson(Map<String, dynamic> json) => StatusLog(
        fromStatus: json['from_status'] == null ? null : ReportStatus.fromApi(json['from_status'] as String),
        toStatus: ReportStatus.fromApi(json['to_status'] as String),
        note: json['note'] as String?,
        changedBy: (json['changed_by'] as Map<String, dynamic>?)?['name'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      );
}

class Report {
  const Report({
    required this.id,
    required this.title,
    this.description,
    this.photoUrl,
    required this.latitude,
    required this.longitude,
    this.address,
    required this.category,
    this.aiLabel,
    this.aiConfidence,
    this.aiUncertain = false,
    required this.status,
    this.adminNote,
    this.canUpdate = false,
    this.canDelete = false,
    this.logs = const [],
    required this.createdAt,
  });

  final int id;
  final String title;
  final String? description;
  final String? photoUrl;
  final double latitude;
  final double longitude;
  final String? address;
  final WasteCategory category;
  final WasteCategory? aiLabel;
  final double? aiConfidence;
  final bool aiUncertain;
  final ReportStatus status;
  final String? adminNote;
  final bool canUpdate;
  final bool canDelete;
  final List<StatusLog> logs;
  final DateTime createdAt;

  factory Report.fromJson(Map<String, dynamic> json) {
    final can = json['can'] as Map<String, dynamic>? ?? const {};
    return Report(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      photoUrl: json['photo_url'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'] as String?,
      category: WasteCategory.tryParse(json['category'] as String?) ?? WasteCategory.organic,
      aiLabel: WasteCategory.tryParse(json['ai_label'] as String?),
      aiConfidence: (json['ai_confidence'] as num?)?.toDouble(),
      aiUncertain: json['ai_uncertain'] as bool? ?? false,
      status: ReportStatus.fromApi(json['status'] as String),
      adminNote: json['admin_note'] as String?,
      canUpdate: can['update'] as bool? ?? false,
      canDelete: can['delete'] as bool? ?? false,
      logs: (json['status_logs'] as List<dynamic>? ?? [])
          .map((e) => StatusLog.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    );
  }
}

class PaginatedReports {
  const PaginatedReports({required this.items, required this.currentPage, required this.lastPage, required this.total});

  final List<Report> items;
  final int currentPage;
  final int lastPage;
  final int total;

  bool get hasMore => currentPage < lastPage;
}

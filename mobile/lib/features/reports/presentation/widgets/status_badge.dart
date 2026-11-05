import 'package:flutter/material.dart';

import '../../data/data.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key});

  final ReportStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: status.color, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }
}

class CategoryChip extends StatelessWidget {
  const CategoryChip(this.category, {super.key});

  final WasteCategory category;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(category.icon, size: 16, color: category.color),
        const SizedBox(width: 4),
        Text(category.label, style: TextStyle(color: category.color, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/core/router/router.dart';

import '../../data/data.dart';
import 'status_badge.dart';

class ReportCard extends StatelessWidget {
  const ReportCard({super.key, required this.report});

  final Report report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.router.push(ReportDetailRoute(id: report.id)),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(width: 72, height: 72, child: ReportPhoto(url: report.photoUrl)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(report.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text(
                      report.address ?? '${report.latitude.toStringAsFixed(4)}, ${report.longitude.toStringAsFixed(4)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        StatusBadge(report.status),
                        const SizedBox(width: 8),
                        CategoryChip(report.category),
                        const Spacer(),
                        Text(formatDate(report.createdAt), style: theme.textTheme.labelSmall),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReportPhoto extends StatelessWidget {
  const ReportPhoto({super.key, required this.url, this.fit = BoxFit.cover});

  final String? url;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final placeholder = ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.image_outlined)),
    );
    if (url == null) return placeholder;
    return CachedNetworkImage(
      imageUrl: url!,
      fit: fit,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }
}

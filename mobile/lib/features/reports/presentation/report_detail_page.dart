import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/features/dashboard/dashboard.dart';

import '../data/data.dart';
import '../providers/providers.dart';
import 'widgets/widgets.dart';

@RoutePage()
class ReportDetailPage extends StatefulWidget {
  const ReportDetailPage({super.key, @PathParam('id') required this.id});

  final int id;

  @override
  State<ReportDetailPage> createState() => _ReportDetailPageState();
}

class _ReportDetailPageState extends State<ReportDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() => context.read<ReportProvider>().loadDetail(widget.id);

  Future<void> _delete(Report report) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus laporan?'),
        content: const Text('Laporan yang dihapus tidak bisa dikembalikan.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error, minimumSize: const Size(0, 40)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      await context.read<ReportProvider>().delete(report.id);
      if (!mounted) return;
      context.read<DashboardProvider>().load();
      showSnack(context, 'Laporan dihapus');
      context.router.maybePop();
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();
    final report = provider.detail?.id == widget.id ? provider.detail : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Laporan'),
        actions: [
          if (report?.canDelete ?? false)
            IconButton(tooltip: 'Hapus', icon: const Icon(Icons.delete_outline), onPressed: () => _delete(report!)),
        ],
      ),
      body: provider.isDetailLoading
          ? const Center(child: CircularProgressIndicator())
          : report == null
              ? ErrorView(message: provider.detailError ?? 'Laporan tidak ditemukan', onRetry: _load)
              : RefreshIndicator(onRefresh: _load, child: _DetailBody(report: report)),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({required this.report});

  final Report report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AspectRatio(aspectRatio: 4 / 3, child: ReportPhoto(url: report.photoUrl)),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            StatusBadge(report.status),
            const SizedBox(width: 10),
            CategoryChip(report.category),
            const Spacer(),
            Text(formatDate(report.createdAt), style: theme.textTheme.bodySmall),
          ],
        ),
        const SizedBox(height: 12),
        Text(report.title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
        if (report.description?.isNotEmpty ?? false) ...[
          const SizedBox(height: 8),
          Text(report.description!, style: theme.textTheme.bodyMedium),
        ],
        if (report.adminNote?.isNotEmpty ?? false) ...[
          const SizedBox(height: 16),
          _NoteBox(note: report.adminNote!, status: report.status),
        ],
        const SizedBox(height: 20),
        _AiResult(report: report),
        const SizedBox(height: 20),
        Text('Lokasi', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        LocationMap(point: LatLng(report.latitude, report.longitude), height: 180),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.place_outlined, size: 18),
            const SizedBox(width: 6),
            Expanded(
              child: Text(report.address ?? '${report.latitude.toStringAsFixed(5)}, ${report.longitude.toStringAsFixed(5)}'),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text('Riwayat status', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        _Timeline(logs: report.logs),
      ],
    );
  }
}

class _NoteBox extends StatelessWidget {
  const _NoteBox({required this.note, required this.status});

  final String note;
  final ReportStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: status.color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.admin_panel_settings_outlined, color: status.color, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text('Catatan petugas: $note')),
        ],
      ),
    );
  }
}

class _AiResult extends StatelessWidget {
  const _AiResult({required this.report});

  final Report report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ai = report.aiLabel;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Icon(Icons.auto_awesome, color: theme.colorScheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ai == null
                  ? const Text('Deteksi AI tidak tersedia untuk laporan ini.')
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hasil deteksi AI', style: theme.textTheme.labelMedium),
                        const SizedBox(height: 2),
                        Text(
                          '${ai.label} · ${formatPercent(report.aiConfidence ?? 0)}',
                          style: theme.textTheme.titleSmall?.copyWith(color: ai.color),
                        ),
                        if (ai != report.category)
                          Text('Kategori diubah menjadi ${report.category.label}', style: theme.textTheme.bodySmall),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.logs});

  final List<StatusLog> logs;

  @override
  Widget build(BuildContext context) {
    if (logs.isEmpty) return const Text('Belum ada riwayat.');
    final theme = Theme.of(context);
    return Column(
      children: [
        for (var i = 0; i < logs.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Icon(logs[i].toStatus.icon, color: logs[i].toStatus.color, size: 22),
                    if (i < logs.length - 1)
                      Expanded(child: Container(width: 2, color: theme.colorScheme.outlineVariant)),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(logs[i].toStatus.label, style: theme.textTheme.titleSmall),
                        Text(formatDateTime(logs[i].createdAt), style: theme.textTheme.bodySmall),
                        if (logs[i].note?.isNotEmpty ?? false)
                          Padding(padding: const EdgeInsets.only(top: 4), child: Text(logs[i].note!)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

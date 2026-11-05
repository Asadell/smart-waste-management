import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';

import '../data/data.dart';
import '../providers/providers.dart';
import 'widgets/widgets.dart';

@RoutePage()
class ReportHistoryPage extends StatefulWidget {
  const ReportHistoryPage({super.key});

  @override
  State<ReportHistoryPage> createState() => _ReportHistoryPageState();
}

class _ReportHistoryPageState extends State<ReportHistoryPage> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ReportProvider>().loadReports());
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 300) {
      context.read<ReportProvider>().loadReports(refresh: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Laporan')),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(label: 'Semua', selected: provider.statusFilter == null, onTap: () => provider.setStatusFilter(null)),
                for (final s in ReportStatus.values)
                  _FilterChip(label: s.label, selected: provider.statusFilter == s, onTap: () => provider.setStatusFilter(s)),
              ],
            ),
          ),
          Expanded(child: _buildList(provider)),
        ],
      ),
    );
  }

  Widget _buildList(ReportProvider provider) {
    if (provider.isLoading) return const Center(child: CircularProgressIndicator());

    if (provider.reports.isEmpty) {
      final child = provider.errorMessage != null
          ? ErrorView(message: provider.errorMessage!, onRetry: provider.loadReports)
          : EmptyView(
              message: provider.statusFilter == null
                  ? 'Belum ada laporan'
                  : 'Tidak ada laporan berstatus ${provider.statusFilter!.label}',
            );
      // Still scrollable so pull-to-refresh works on an empty list.
      return RefreshIndicator(
        onRefresh: provider.loadReports,
        child: LayoutBuilder(
          builder: (context, c) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(height: c.maxHeight, child: child),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: provider.loadReports,
      child: ListView.separated(
        controller: _scroll,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        itemCount: provider.reports.length + (provider.hasMore ? 1 : 0),
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          if (i >= provider.reports.length) {
            return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
          }
          return ReportCard(report: provider.reports[i]);
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap()),
    );
  }
}

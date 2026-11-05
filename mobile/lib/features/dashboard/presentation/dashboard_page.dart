import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/core/router/router.dart';
import 'package:swm_mobile/features/auth/auth.dart';
import 'package:swm_mobile/features/reports/reports.dart';

import '../data/data.dart';
import '../providers/providers.dart';

@RoutePage()
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<DashboardProvider>().load());
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DashboardProvider>();
    final user = context.select<AuthProvider, String>((a) => a.user?.name.split(' ').first ?? '');
    final stats = provider.stats;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: provider.load,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                sliver: SliverToBoxAdapter(child: _Greeting(name: user)),
              ),
              if (provider.isLoading)
                const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
              else if (stats == null)
                SliverFillRemaining(
                  child: ErrorView(message: provider.errorMessage ?? 'Gagal memuat data', onRetry: provider.load),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverToBoxAdapter(child: _StatsGrid(stats: stats)),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverToBoxAdapter(child: _CategoryBar(stats: stats)),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 8, 8),
                  sliver: SliverToBoxAdapter(
                    child: Row(
                      children: [
                        Text('Laporan terbaru', style: Theme.of(context).textTheme.titleMedium),
                        const Spacer(),
                        TextButton(
                          onPressed: () => AutoTabsRouter.of(context).setActiveIndex(1),
                          child: const Text('Lihat semua'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (stats.recent.isEmpty)
                  SliverToBoxAdapter(
                    child: EmptyView(
                      message: 'Belum ada laporan.\nYuk buat laporan pertamamu!',
                      icon: Icons.add_a_photo_outlined,
                      action: FilledButton.tonal(
                        onPressed: () => context.router.push(const CreateReportRoute()),
                        child: const Text('Buat laporan'),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 96),
                    sliver: SliverList.separated(
                      itemCount: stats.recent.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => ReportCard(report: stats.recent[i]),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Halo, $name 👋', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('Ringkasan laporan sampah kamu', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Total', stats.total, Icons.assignment_outlined, Theme.of(context).colorScheme.primary),
      for (final s in [ReportStatus.pending, ReportStatus.inProgress, ReportStatus.completed])
        (s.label, stats.byStatus[s] ?? 0, s.icon, s.color),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.7,
      children: [
        for (final (label, value, icon, color) in items)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(icon, color: color, size: 20),
                      const SizedBox(width: 6),
                      Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  Text('$value', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: color)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _CategoryBar extends StatelessWidget {
  const _CategoryBar({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final total = stats.byCategory.values.fold<int>(0, (a, b) => a + b);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Per kategori', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: SizedBox(
                height: 12,
                child: total == 0
                    ? ColoredBox(color: Theme.of(context).colorScheme.surfaceContainerHighest)
                    : Row(
                        children: [
                          for (final c in WasteCategory.values)
                            if ((stats.byCategory[c] ?? 0) > 0)
                              Expanded(flex: stats.byCategory[c]!, child: ColoredBox(color: c.color)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 4,
              children: [
                for (final c in WasteCategory.values)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 10, height: 10, decoration: BoxDecoration(color: c.color, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      Text('${c.label} (${stats.byCategory[c] ?? 0})'),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

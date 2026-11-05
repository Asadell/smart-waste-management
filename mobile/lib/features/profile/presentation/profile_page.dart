import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/router/router.dart';
import 'package:swm_mobile/features/auth/auth.dart';
import 'package:swm_mobile/features/dashboard/dashboard.dart';
import 'package:swm_mobile/features/reports/reports.dart';

@RoutePage()
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  Future<void> _logout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar dari akun?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Keluar')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    await context.read<AuthProvider>().logout();
    if (!context.mounted) return;
    context.read<ReportProvider>().reset();
    context.read<DashboardProvider>().reset();
    context.router.replaceAll([const LoginRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: RefreshIndicator(
        onRefresh: context.read<AuthProvider>().refreshUser,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Text(user?.initials ?? '', style: theme.textTheme.headlineSmall),
                    ),
                    const SizedBox(height: 12),
                    Text(user?.name ?? '-', style: theme.textTheme.titleLarge),
                    Text(user?.email ?? '-', style: theme.textTheme.bodyMedium),
                    if (user?.phone != null) Text(user!.phone!, style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.edit_outlined),
                    title: const Text('Edit profil'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.router.push(const EditProfileRoute()),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.lock_outline),
                    title: const Text('Ganti password'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.router.push(const ChangePasswordRoute()),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.logout, color: theme.colorScheme.error),
                    title: Text('Keluar', style: TextStyle(color: theme.colorScheme.error)),
                    onTap: () => _logout(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

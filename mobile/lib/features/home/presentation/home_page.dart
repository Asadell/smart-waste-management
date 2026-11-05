import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import 'package:swm_mobile/core/router/router.dart';

/// Bottom navigation shell: Dashboard / Riwayat / Profil.
@RoutePage()
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AutoTabsRouter(
      routes: const [DashboardRoute(), ReportHistoryRoute(), ProfileRoute()],
      builder: (context, child) {
        final tabs = AutoTabsRouter.of(context);
        return Scaffold(
          body: child,
          floatingActionButton: tabs.activeIndex == 2
              ? null
              : FloatingActionButton.extended(
                  onPressed: () => context.router.push(const CreateReportRoute()),
                  icon: const Icon(Icons.add_a_photo_outlined),
                  label: const Text('Lapor'),
                ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: tabs.activeIndex,
            onDestinationSelected: tabs.setActiveIndex,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
              NavigationDestination(icon: Icon(Icons.history_outlined), selectedIcon: Icon(Icons.history), label: 'Riwayat'),
              NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profil'),
            ],
          ),
        );
      },
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/router/router.dart';

import '../providers/providers.dart';

@RoutePage()
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  Future<void> _start() async {
    final auth = context.read<AuthProvider>();
    await auth.checkSession();
    if (!mounted) return;
    context.router.replaceAll([auth.isAuthenticated ? const HomeRoute() : const LoginRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: Image.asset('assets/images/logo.png', width: 112, height: 112),
            ),
            const SizedBox(height: 16),
            Text(
              'Smart Waste',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            SizedBox(width: 28, height: 28, child: CircularProgressIndicator(color: scheme.onPrimary, strokeWidth: 3)),
          ],
        ),
      ),
    );
  }
}

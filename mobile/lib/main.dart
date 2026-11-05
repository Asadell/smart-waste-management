import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/core/router/router.dart';
import 'package:swm_mobile/features/auth/auth.dart';
import 'package:swm_mobile/features/dashboard/dashboard.dart';
import 'package:swm_mobile/features/reports/reports.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');

  final tokens = TokenStorage();
  final api = ApiClient(tokens);
  final reportRepo = ReportRepository(api);

  final auth = AuthProvider(AuthRepository(api, tokens));
  final reports = ReportProvider(reportRepo);
  final dashboard = DashboardProvider(DashboardRepository(api));
  final router = AppRouter(auth);

  // Expired / revoked token: clear the session and go back to login.
  api.onUnauthorized = () async {
    if (!auth.isAuthenticated) return;
    await auth.forceLogout();
    reports.reset();
    dashboard.reset();
    router.replaceAll([const LoginRoute()]);
  };

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: reports),
        ChangeNotifierProvider.value(value: dashboard),
        ChangeNotifierProvider(create: (_) => PredictProvider(reportRepo)),
      ],
      child: SwmApp(router: router),
    ),
  );
}

class SwmApp extends StatelessWidget {
  const SwmApp({super.key, required this.router});

  final AppRouter router;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: const Locale('id', 'ID'),
      supportedLocales: const [Locale('id', 'ID'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router.config(),
    );
  }
}

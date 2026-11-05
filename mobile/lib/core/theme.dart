import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const primary = Color(0xFF2E7D32);
  static const pending = Color(0xFFF9A825);
  static const inProgress = Color(0xFF1E88E5);
  static const completed = Color(0xFF43A047);
  static const rejected = Color(0xFFE53935);

  static const organic = Color(0xFF6D4C41);
  static const plastic = Color(0xFF0288D1);
  static const paper = Color(0xFFEF6C00);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: AppColors.primary);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: const Color(0xFFF6F8F5),
    appBarTheme: const AppBarTheme(centerTitle: false, scrolledUnderElevation: 0),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.5)),
      ),
    ),
  );
}

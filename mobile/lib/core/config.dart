/// Build-time configuration.
///
/// Override with:
///   flutter run --dart-define=API_BASE_URL=https://api.swm.example.com/api/v1
class AppConfig {
  AppConfig._();

  /// Default points to the Laravel container from the Android emulator.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8088/api/v1',
  );

  static const appName = 'Smart Waste';
}

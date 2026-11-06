/// Build-time configuration.
///
/// Point the app at a deployed API when building:
///   flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com/api/v1
class AppConfig {
  AppConfig._();

  /// Default points to a local backend (`php artisan serve`). On a physical device run
  /// `adb reverse tcp:8000 tcp:8000` first so `localhost` reaches the computer.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000/api/v1',
  );

  static const appName = 'Smart Waste';
}

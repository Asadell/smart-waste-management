import 'dart:ui';

import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class LocationException implements Exception {
  LocationException(this.message, {this.canOpenSettings = false, this.isServiceDisabled = false});

  final String message;
  final bool canOpenSettings;
  final bool isServiceDisabled;

  @override
  String toString() => message;
}

class LocationService {
  final _geocoding = Geocoding(locale: const Locale('id', 'ID'));

  /// Current position, asking for permission if needed.
  Future<Position> currentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw LocationException('GPS tidak aktif. Aktifkan lokasi di perangkat Anda.', isServiceDisabled: true);
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw LocationException('Izin lokasi ditolak. Lokasi dibutuhkan untuk laporan.');
    }
    if (permission == LocationPermission.deniedForever) {
      throw LocationException('Izin lokasi ditolak permanen. Buka pengaturan untuk mengizinkan.', canOpenSettings: true);
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 15)),
      );
    } catch (_) {
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) return last;
      throw LocationException('Gagal mendapatkan lokasi. Coba lagi di tempat terbuka.');
    }
  }

  /// Human readable address, or null when reverse geocoding fails/offline.
  Future<String?> addressFor(double lat, double lng) async {
    try {
      final places = await _geocoding.placemarkFromCoordinates(lat, lng);
      if (places.isEmpty) return null;
      final p = places.first;
      final parts = [p.street, p.subLocality, p.locality, p.subAdministrativeArea]
          .whereType<String>()
          .where((s) => s.trim().isNotEmpty)
          .toSet();
      return parts.isEmpty ? null : parts.join(', ');
    } catch (_) {
      return null;
    }
  }

  Future<void> openSettings({bool location = false}) =>
      location ? Geolocator.openLocationSettings() : Geolocator.openAppSettings();
}

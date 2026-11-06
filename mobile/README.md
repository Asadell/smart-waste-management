# Mobile — Flutter

Aplikasi untuk **user** (pelapor): daftar/login, dashboard ringkasan, buat laporan sampah dengan
foto + GPS + **deteksi AI**, riwayat & detail status laporan, dan profil.
Akun admin ditolak di mobile (`client=mobile` → 403 dari backend).

## Stack
Flutter 3.38 · Provider · auto_route · Dio · image_picker · geolocator + geocoding · flutter_map (OpenStreetMap) · flutter_secure_storage

## Struktur
```
lib/
├── main.dart
├── core/
│   ├── core.dart                # barrel: config, theme, formatters, network, storage, services, widgets
│   ├── config.dart              # API_BASE_URL (--dart-define)
│   ├── network/                 # ApiClient (Dio + bearer token + 401), ApiException   → network.dart
│   ├── router/                  # app_router.dart (+ .gr.dart), AuthGuard              → router.dart
│   ├── services/                # LocationService (izin, GPS, reverse geocoding)       → services.dart
│   ├── storage/                 # TokenStorage (secure storage)                        → storage.dart
│   └── widgets/                 # EmptyView/ErrorView, snackbar                        → widgets.dart
└── features/
    ├── auth/        auth.dart      = data/ + providers/ (AuthProvider) + presentation/ (splash, login, register)
    ├── dashboard/   dashboard.dart = data/ + providers/ (DashboardProvider) + presentation/
    ├── reports/     reports.dart   = data/ + providers/ (ReportProvider, PredictProvider)
    │                                 + presentation/ (history, detail, create) + presentation/widgets/
    ├── profile/     profile.dart   = presentation/ (profil, edit profil, ganti password)
    └── home/        home.dart      = presentation/ (bottom navigation, AutoTabsRouter)
```

### Barrel file
Setiap folder punya barrel yang mengekspor isinya, misalnya `data/data.dart`, `providers/providers.dart`,
`presentation/presentation.dart`, dan barrel fitur `features/reports/reports.dart`. Aturan import:

| Dari | Ke | Import |
|---|---|---|
| fitur lain / `main.dart` | fitur | `package:swm_mobile/features/reports/reports.dart` |
| mana saja di luar `core` | core | `package:swm_mobile/core/core.dart` |
| mana saja | router | `package:swm_mobile/core/router/router.dart` (terpisah dari `core.dart` karena router mengimpor semua fitur) |
| layer lain di fitur yang sama | layer | `../data/data.dart`, `../providers/providers.dart`, `widgets/widgets.dart` |
| folder yang sama | file | `report.dart` (langsung, agar file tidak mengimpor barrel yang mengekspor dirinya sendiri) |

## State management (Provider)
| Provider | Tugas |
|---|---|
| `AuthProvider` | sesi (cek token di splash), login/register/logout, update profil, ganti password |
| `ReportProvider` | riwayat (pagination + filter status), detail, buat & hapus laporan |
| `DashboardProvider` | statistik ringkasan milik user |
| `PredictProvider` | state deteksi AI: `idle → loading → result / error` |

Semua provider punya `isLoading` + `errorMessage`. UI memakai `context.watch` (rebuild),
`context.read` (aksi tanpa rebuild), dan `context.select` (rebuild hanya untuk satu field).

## Alur buat laporan
1. Pilih foto (kamera/galeri, dikompres ke maks 1600px, kualitas 80).
2. Foto dikirim ke `POST /api/v1/predict` → label + confidence tampil, kategori **terisi otomatis** (tetap bisa diubah).
   Kalau `uncertain` atau layanan AI mati, user diminta memilih kategori sendiri.
3. Lokasi diambil otomatis via GPS + alamat (reverse geocoding), tampil di peta OSM. Titik bisa dipindah dengan mengetuk peta.
   Izin ditolak / GPS mati ditangani (tombol buka pengaturan / aktifkan GPS).
4. Isi judul + deskripsi → `POST /api/v1/reports` (multipart). Kalau gagal (misal koneksi putus), isi form tidak hilang dan bisa langsung dikirim ulang.

Status terbaru diambil dengan **pull-to-refresh** di Dashboard, Riwayat, dan Detail.

## Menjalankan
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs --force-jit   # generate app_router.gr.dart

# Default: http://localhost:8000/api/v1 (backend lokal via `php artisan serve`)
adb reverse tcp:8000 tcp:8000      # agar localhost di HP/emulator diteruskan ke komputer
flutter run

# Backend lain (Docker port 8088, IP LAN, atau server)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8088/api/v1
```
`--force-jit` diperlukan karena beberapa dependency memakai *build hooks* yang belum didukung mode AOT build_runner.

## Build APK
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.swm.example.com/api/v1
# build/app/outputs/flutter-apk/app-release.apk → upload ke GitHub Releases
```

## Test
```bash
flutter analyze
flutter test
```

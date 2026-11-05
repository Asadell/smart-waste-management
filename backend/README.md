# Backend — Laravel API

REST API untuk web dan mobile: autentikasi Sanctum, role admin/user, CRUD laporan, update status
+ audit log, manajemen user, statistik dashboard, dan proxy ke layanan ML.

## Stack
Laravel 13 · PHP 8.4 · PostgreSQL 16 · Sanctum · Intervention Image · Scribe · FrankenPHP (Docker)

## Menjalankan (Docker)
Dari root repo:
```bash
docker compose up -d postgres backend              # http://localhost:8088
docker compose exec backend php artisan db:seed    # data demo
docker compose exec -e DB_DATABASE=swm_test backend php artisan test
```
Entrypoint container otomatis menjalankan `migrate --force` dan `storage:link --relative`.

## Menjalankan tanpa Docker (Postgres lokal)
Butuh PHP 8.4 dengan `pdo_pgsql` (`sudo dnf install php-pgsql`) dan Postgres lokal:
```bash
sudo -u postgres psql -c "CREATE ROLE swm LOGIN PASSWORD 'secret' CREATEDB;" \
  -c "CREATE DATABASE swm OWNER swm;" -c "CREATE DATABASE swm_test OWNER swm;"

composer install
cp .env.example .env && php artisan key:generate
# di .env: DB_HOST=127.0.0.1, APP_URL=http://localhost:8000,
#          ML_URL=http://localhost:8001  (jalankan FastAPI dengan --port 8001 agar tidak bentrok dengan artisan serve)
php artisan migrate:fresh --seed
php artisan storage:link --relative
php artisan serve                       # http://localhost:8000
DB_DATABASE=swm_test php artisan test
```
`php artisan serve` hanya membaca konfigurasi DB dari `.env` (env var shell tidak diteruskan ke worker-nya), jadi isi DB di `.env`.
Symlink `public/storage` dibuat **relatif** supaya berfungsi baik di host maupun di container.

Akun demo: `admin@swm.test` / `password` (web saja) · `user@swm.test` / `password`.

## Seeder
`php artisan migrate:fresh --seed` membuat:
- 1 admin, 3 user aktif (`user@`, `siti@`, `andi@swm.test`), dan 1 user nonaktif (`rudi@swm.test`), semua dengan password `password`
- 30 laporan (`ReportSeeder`): 10 per kategori, semua status terisi, lokasi nyata di Surabaya, tersebar 30 hari terakhir,
  riwayat status lengkap dengan catatan admin, serta ~85% tebakan AI sama dengan kategori final (untuk statistik akurasi AI)

Foto laporan diambil dari **Pexels** (24 foto, 8 per kategori), sudah dicek manual satu per satu agar sesuai kategorinya.
File-nya ada di `database/seeders/photos/{organic,plastic,paper}/`, dengan kredit fotografer dan URL di `photos/manifest.json`
([Pexels License](https://www.pexels.com/license/): bebas dipakai). Saat seeding, foto disalin ke `storage/app/public/reports/seed/`
dan dipakai bersama oleh beberapa laporan, jadi `PhotoStorage` tidak pernah menghapus file di folder itu.

Mengunduh ulang kandidat foto: `python scripts/fetch_seed_photos.py --out /tmp/kandidat` (key dari `$PEXELS_API_KEY` atau `~/.pexels_keys`).
Script hanya mengunduh **kandidat**; pilih yang sesuai secara manual.

## Struktur kode
```
app/
├── Enums/                  UserRole, ReportStatus, WasteCategory
├── Http/
│   ├── Controllers/Api/V1/ Auth, Report, Predict, User, Dashboard
│   ├── Middleware/         EnsureRole (alias `role:admin`)
│   ├── Requests/           FormRequest terpisah per aksi (Store*/Update* ...)
│   └── Resources/          UserResource, ReportResource, ReportStatusLogResource
├── Models/                 User, Report (soft delete + scope visibleTo/filter/sorted), ReportStatusLog
├── Policies/ReportPolicy   owner vs admin, edit/hapus hanya saat pending
└── Services/               MlClient (HTTP ke FastAPI), PhotoStorage (resize + re-encode)
```

## Database
Migration default Laravel (`users`, `cache`, `jobs`, `personal_access_tokens`) + migration tambahan:
- `add_profile_fields_to_users_table`: `role`, `phone`, `avatar_path`, `is_active`
- `create_reports_table`: index di `status`, `category`, `user_id`, `created_at`; soft delete
- `create_report_status_logs_table`: audit trail perubahan status

`category` adalah pilihan final user, sedangkan `ai_label` / `ai_confidence` menyimpan tebakan AI apa adanya,
sehingga akurasi AI di dunia nyata bisa diukur (`dashboard/stats → ai_accuracy`).

## Endpoint (`/api/v1`)
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | publik (rate limit 10/menit) |
| POST | `/auth/logout` · GET `/auth/me` · PUT `/auth/profile` · PUT `/auth/password` | auth |
| GET/POST | `/reports` | auth (user: miliknya, admin: semua) |
| GET/PUT/DELETE | `/reports/{id}` | owner (pending) / admin |
| PATCH | `/reports/{id}/status` | admin |
| POST | `/predict` | auth, proxy ke ML |
| GET | `/dashboard/stats?days=7\|30` | auth |
| CRUD | `/users`, PATCH `/users/{id}/toggle-active`, `/users/{id}/reset-password` | admin |

Query `/reports`: `search`, `status`, `category`, `user_id` (admin), `date_from`, `date_to`, `sort` (`-created_at`, `title`, ...), `page`, `per_page`.

Dokumentasi lengkap: **`/docs`** (Scribe). Export: `docs/postman_collection.json`, `docs/openapi.yaml`.
Regenerate: `docker compose exec backend php artisan scribe:generate`.

## Catatan keamanan
- Policy mencegah user membuka/mengubah laporan milik orang lain (403).
- Upload divalidasi (mime + ukuran) lalu di-**re-encode** ke JPEG maks 1280px (EXIF dan payload tersembunyi ikut terbuang).
- Menonaktifkan user / reset password mencabut semua token user tersebut.
- Kalau layanan ML mati, laporan tetap tersimpan (`ai_label = null`), sedangkan `/predict` mengembalikan 503.

## Env penting
| Key | Contoh |
|---|---|
| `DB_*` | `pgsql`, host `postgres` |
| `APP_URL` | dipakai untuk URL foto (`/storage/...`) |
| `ML_URL`, `ML_API_KEY`, `ML_TIMEOUT` | `http://ml:8000` |
| `CORS_ALLOWED_ORIGINS` | `https://swm.example.com` |

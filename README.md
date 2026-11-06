# Smart Waste Management System

Sistem pelaporan sampah berbasis AI. Warga memotret tumpukan sampah dari **aplikasi mobile atau web**. Model **machine learning**
mendeteksi jenis sampahnya (organik, plastik, kertas), lalu **admin** di dashboard web menindaklanjuti laporan sampai selesai.

| | Link |
|---|---|
| Demo website | _diisi setelah deploy_ |
| APK Android | _GitHub Releases_ |
| Video demo | _diisi_ |
| Dokumentasi API | `/docs` di backend (Scribe) · [Postman](docs/postman_collection.json) · [OpenAPI](docs/openapi.yaml) · ML: `/docs` (Swagger FastAPI) |

**Akun demo** (dari seeder): `admin@swm.test` / `password` (khusus web) · `user@swm.test` / `password`

---

## Daftar isi
- [Fitur](#fitur)
- [Arsitektur](#arsitektur)
- [Tech stack](#tech-stack)
- [Struktur repo](#struktur-repo)
- [Menjalankan secara lokal](#menjalankan-secara-lokal)
- [Database (ERD)](#database-erd)
- [API](#api)
- [Machine learning](#machine-learning)
- [Alur AI end-to-end](#alur-ai-end-to-end)
- [Testing](#testing)

---

## Fitur

**Website (admin & user)** - `web/`
- Login berbasis role, register, profil + ganti password
- Dashboard statistik: jumlah per status, per kategori, tren 7/30 hari, laporan terbaru, akurasi AI di lapangan (admin)
- CRUD laporan dengan pencarian, filter status/kategori/tanggal, urutan, pagination (filter tersimpan di URL)
- Form laporan: upload foto, **deteksi AI otomatis**, pilih lokasi di peta OpenStreetMap + alamat otomatis
- Update status laporan: Pending, In Progress, Completed, Rejected (dengan catatan dan riwayat/audit log)
- Manajemen pengguna: CRUD, filter role/aktif, aktif/nonaktif, reset password
- Peta sebaran laporan (admin), responsive (sidebar menjadi drawer, tabel menjadi kartu di layar kecil)

**Aplikasi mobile (user)** - `mobile/`
- Register dan login (akun admin ditolak di mobile)
- Dashboard ringkasan laporan milik user
- Buat laporan: foto (kamera/galeri), **AI image detection**, lokasi GPS + alamat + peta, deskripsi
- Riwayat dan detail status laporan dengan pull-to-refresh, timeline status

**Machine learning** - `ml/`
- Klasifikasi 4 kelas (organic, paper, plastic, **other**), MobileNetV2 transfer learning (TensorFlow/Keras).
  Foto yang bukan sampah (mis. gitar) dijawab *"tidak dikenali sebagai sampah"*, tidak dipaksa jadi kertas/plastik
- Dataset 9.812 gambar dari 4 dataset Kaggle, **akurasi test 91,32%**, benda yang tidak pernah dilihat ditolak **87,7%**, confusion matrix, classification report
- REST API prediksi dengan FastAPI (model TFLite, ringan untuk server)

**Backend** - `backend/`
- REST API Laravel + Sanctum, PostgreSQL, Policy per role, FormRequest validation, API Resource
- Proxy ke layanan ML; laporan **tetap tersimpan walau layanan ML mati**
- Seeder 30 laporan realistis dengan foto asli, dokumentasi Scribe, 34 feature test

---

## Arsitektur

```mermaid
flowchart LR
    subgraph Clients
        W["Web<br/>React + Vite"]
        M["Mobile<br/>Flutter"]
    end
    subgraph Server["Server (Docker Compose)"]
        B["Backend API<br/>Laravel 13 + Sanctum"]
        DB[("PostgreSQL")]
        S[["Storage foto<br/>(volume)"]]
        ML["ML service<br/>FastAPI + TFLite"]
    end
    W -- "REST + Bearer token" --> B
    M -- "REST + Bearer token" --> B
    B --> DB
    B --> S
    B -- "HTTP internal /predict" --> ML
```

- **Web dan mobile hanya berbicara ke backend.** Layanan ML tidak diekspos ke publik; backend yang meneruskan foto ke `/predict`.
- **ML dipisah jadi service sendiri** karena runtime-nya berbeda (Python vs PHP), model bisa diperbarui tanpa redeploy backend,
  dan kalau ML mati, pembuatan laporan tetap berjalan.
- Foto disimpan di disk `public` Laravel (Docker volume); database menyimpan path relatif, URL dibuat di API Resource.

## Tech stack

| Bagian | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.4), Sanctum, PostgreSQL, Intervention Image, Scribe, PHPUnit, FrankenPHP (Docker) |
| Web | React 19, TypeScript, Vite, TanStack Router + Query, Tailwind CSS v4, shadcn/ui, react-hook-form + zod, Leaflet (OSM), Recharts |
| Mobile | Flutter 3.38, Provider, auto_route, Dio, image_picker, geolocator + geocoding, flutter_map (OSM), flutter_secure_storage |
| ML | Python, TensorFlow/Keras (MobileNetV2), scikit-learn, FastAPI, TFLite (`ai-edge-litert`) |
| Infra | Docker, Docker Compose, nginx (web) |

## Struktur repo

```
smart-waste-management/
├── backend/            # Laravel API            → backend/README.md
├── web/                # React SPA (admin/user)  → web/README.md
├── mobile/             # Flutter app (user)      → mobile/README.md
├── ml/                 # dataset, notebook, model, FastAPI → ml/README.md, ml/dataset/README.md
├── docs/               # postman_collection.json, openapi.yaml
├── scripts/            # fetch_seed_photos.py (foto seeder dari Pexels)
├── docker/             # init script Postgres (database test)
└── docker-compose.yml  # stack dev: postgres + backend (+ ml)
```

Setiap folder punya README sendiri dengan detail instalasi, env, dan struktur kodenya.

---

## Menjalankan secara lokal

### Prasyarat
Docker (cara cepat), atau: PHP 8.4 + `pdo_pgsql`, Composer, PostgreSQL, Bun/Node 20, Flutter 3.38, Python 3.12.

### 1. Backend + database (Docker)
```bash
docker compose up -d postgres backend                 # API di http://localhost:8088
docker compose exec backend php artisan db:seed       # akun demo + 30 laporan
```
Tanpa Docker (Postgres lokal): lihat [backend/README.md](backend/README.md#menjalankan-tanpa-docker-postgres-lokal).

### 2. Layanan ML
```bash
cd ml
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8001            # Swagger: http://localhost:8001/docs
```
Atau lewat Docker: `docker compose --profile ml up -d ml`. Backend membaca alamatnya dari `ML_URL`.

### 3. Web
```bash
cd web
bun install
echo "VITE_API_URL=http://localhost:8088/api/v1" > .env
bun run dev                                           # http://localhost:5173
```

### 4. Mobile
```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs --force-jit
flutter run                                           # default http://localhost:8000/api/v1 (adb reverse tcp:8000 tcp:8000)
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

### Environment variable penting

| Aplikasi | Variabel | Contoh |
|---|---|---|
| backend | `DB_*` | `pgsql`, `127.0.0.1`, `swm` / `secret` |
| backend | `APP_URL` | dipakai untuk URL foto `/storage/...` |
| backend | `ML_URL`, `ML_API_KEY` | `http://ml:8000` |
| backend | `CORS_ALLOWED_ORIGINS` | `https://swm.example.com` |
| web | `VITE_API_URL` | `http://localhost:8088/api/v1` |
| mobile | `--dart-define=API_BASE_URL` | default `http://localhost:8000/api/v1` |
| ml | `CONFIDENCE_THRESHOLD`, `API_KEY` | `0.6` |

### Deploy (server dengan Docker + Nginx Proxy Manager)
```bash
git clone https://github.com/Asadell/smart-waste-management.git && cd smart-waste-management
cp .env.staging.example .env.staging        # isi APP_KEY, DB_PASSWORD, ML_API_KEY, URL
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
docker compose -f docker-compose.staging.yml --env-file .env.staging exec backend php artisan db:seed --force   # sekali saja
```
Stack: `swm-postgres`, `swm-ml` (keduanya internal), `swm-backend`, dan `swm-web`. Backend dan web bergabung ke network
`npm_proxy`, jadi di Nginx Proxy Manager cukup arahkan domain ke `swm-backend:80` dan `swm-web:80`. Foto dan database
tersimpan di Docker volume, sehingga aman saat rebuild. Update: `git pull` lalu ulangi perintah `up -d --build`.

---

## Database (ERD)

```mermaid
erDiagram
    users ||--o{ reports : creates
    users ||--o{ report_status_logs : changes
    reports ||--o{ report_status_logs : has

    users {
        bigint id PK
        string name
        string email UK
        string password
        enum role "admin | user"
        string phone
        string avatar_path
        boolean is_active
        timestamps created_at
    }
    reports {
        bigint id PK
        bigint user_id FK
        string title
        text description
        string photo_path "relatif, disk public"
        decimal latitude
        decimal longitude
        string address
        enum category "organic | plastic | paper (pilihan final user)"
        string ai_label "tebakan AI, nullable"
        float ai_confidence
        boolean ai_uncertain
        enum status "pending | in_progress | completed | rejected"
        text admin_note
        timestamps created_at
        timestamp deleted_at "soft delete"
    }
    report_status_logs {
        bigint id PK
        bigint report_id FK
        bigint changed_by FK
        enum from_status
        enum to_status
        text note
        timestamp created_at
    }
```

- `category` (pilihan final user) dipisah dari `ai_label` / `ai_confidence` (tebakan AI apa adanya), sehingga akurasi AI di dunia nyata bisa diukur.
- `report_status_logs` adalah audit trail: siapa mengubah status, kapan, dari apa ke apa, dan catatannya.
- Index: `reports(status)`, `reports(category)`, `reports(user_id)`, `reports(created_at)`, `users(role)`.
- Memakai migration default Laravel ditambah migration `add_profile_fields_to_users_table`, `create_reports_table`, `create_report_status_logs_table`.

## API

Base URL `/api/v1`, autentikasi `Authorization: Bearer {token}` (Sanctum). Format response: `{ data, meta, message }`.

| Grup | Endpoint |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` |
| Reports | `GET/POST /reports`, `GET/PUT/DELETE /reports/{id}`, `PATCH /reports/{id}/status` (admin) |
| AI | `POST /predict` (proxy ke FastAPI) |
| Dashboard | `GET /dashboard/stats?days=7\|30` |
| Users (admin) | `GET/POST /users`, `GET/PUT/DELETE /users/{id}`, `PATCH /users/{id}/toggle-active`, `PATCH /users/{id}/reset-password` |

Dokumentasi lengkap dengan contoh request/response: **`/docs`** (Scribe), [docs/postman_collection.json](docs/postman_collection.json),
[docs/openapi.yaml](docs/openapi.yaml). Layanan ML: Swagger di `{ML_URL}/docs`.

**Aturan akses** (Policy Laravel): user hanya melihat dan mengubah laporannya sendiri, dan hanya selama status masih `pending`;
admin mengakses semua laporan dan satu-satunya yang bisa mengubah status. Login dari mobile dengan akun admin ditolak (403).

## Machine learning

| | |
|---|---|
| Dataset | 4 dataset Kaggle: [Garbage Classification (12 classes)](https://www.kaggle.com/datasets/mostafaabla/garbage-classification) (ODbL-1.0), [Garbage Dataset v2](https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2) (MIT), [Recyclable and Household Waste](https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification) (MIT), [Caltech-101](https://www.kaggle.com/datasets/imbikramsaha/caltech-101) (CC0-1.0) |
| Mapping | `organic` = sisa makanan/biologis · `paper` = kertas, kardus, koran · `plastic` = botol, kantong, wadah, styrofoam · `other` = kaca, logam, baterai, baju/sepatu, 84 jenis benda sehari-hari |
| Data | 9.812 gambar (±2.500 per kelas, 3.710 duplikat dihapus via perceptual hash), split 70/15/15 + 488 gambar `unseen` |
| Model | MobileNetV2 (ImageNet) + head baru, 2 tahap: head saja, lalu fine-tune 60 layer terakhir |
| **Akurasi test** | **91,32%** (Keras) · **90,23%** (TFLite, lewat kode API) · macro F1 0,9138 |
| **Benda baru → `other`** | **87,7%** dari 488 gambar 8 jenis benda yang tidak pernah dilihat · gitar **74/75** |
| Output | `ml/models/waste_classifier.tflite` (2,4 MB, dipakai API), `.keras` (arsip) |

| Kelas | Precision | Recall | F1 |
|---|---|---|---|
| organic | 0,9527 | 0,9253 | 0,9388 |
| other | 0,8759 | 0,9202 | 0,8975 |
| paper | 0,9301 | 0,9227 | 0,9264 |
| plastic | 0,8997 | 0,8853 | 0,8925 |

<p>
  <img src="ml/reports/confusion_matrix.png" alt="Confusion matrix" width="360">
  <img src="ml/reports/training_curves.png" alt="Kurva training" width="520">
</p>

**Kenapa ada kelas `other`?** Model versi 1 (3 kelas, akurasi 97,04% pada foto studio) selalu memaksa jawaban, sehingga
foto gitar terbaca *"99% kertas"*. Versi 2 belajar mengenali "bukan sampah" dari ribuan contoh benda lain. Hasil `other`
diubah backend menjadi `label: null, recognized: false`, dan aplikasi menampilkan *"AI tidak mengenali foto ini sebagai sampah"*.

Pada foto dunia nyata dari sumber berbeda (24 foto Pexels), akurasinya **75% (18/24)**, sama dengan versi 1. Dari 24 foto
itu, 4 foto sampah ikut ditolak sebagai `other` karena objek non-sampah mendominasi foto (tempat sampah besi, pagar besi),
dan tidak ada benda non-sampah yang lolos sebagai sampah. Prediksi dengan confidence < 0,6 ditandai `uncertain`, dan pada
kedua kasus user memilih kategori sendiri. Detail: [ml/README.md](ml/README.md), [ml/dataset/README.md](ml/dataset/README.md),
dan notebook [ml/notebooks/training.ipynb](ml/notebooks/training.ipynb).

## Alur AI end-to-end

```
User memilih foto (web / mobile)
  → POST /api/v1/predict (Laravel)  → POST {ML_URL}/predict (FastAPI + TFLite)
  ← { label, confidence, uncertain, recognized, probabilities }
  → kategori terisi otomatis, user boleh mengubah (wajib memilih bila AI tidak yakin / foto bukan sampah / layanan AI mati)
User mengirim laporan
  → POST /api/v1/reports (foto + GPS + deskripsi + category final + ai_label/ai_confidence)
  → backend menyimpan foto (resize + re-encode), category, dan tebakan AI terpisah
  → bila ai_label kosong, backend memanggil ML sendiri; bila ML mati, laporan tetap tersimpan
Admin di web mengubah status → riwayat status tercatat → user melihatnya di mobile (pull-to-refresh)
```

## Testing

| Bagian | Perintah | Cakupan |
|---|---|---|
| Backend | `php artisan test` (DB `swm_test`) | 34 feature test: auth, role, CRUD laporan, policy, status + log, upload, proxy ML (termasuk foto bukan sampah), users, dashboard |
| Web | `bun run test`, `bun run build` | routing + typecheck |
| Mobile | `flutter analyze`, `flutter test` | parsing model API |
| ML | `python -m pytest`, `python scripts/evaluate_photos.py <folder>` | API dengan stub model (tanpa file model/TensorFlow); uji foto nyata dengan model asli |

## Kredit
- Dataset: [Garbage Classification (12 classes)](https://www.kaggle.com/datasets/mostafaabla/garbage-classification) oleh Mostafa Mohamed (ODbL-1.0),
  [Garbage Dataset v2](https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2) oleh `sumn2u` (MIT),
  [Recyclable and Household Waste Classification](https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification) oleh Alistair King (MIT),
  [Caltech-101](https://www.kaggle.com/datasets/imbikramsaha/caltech-101) (mirror Kaggle oleh `imbikramsaha`, CC0-1.0)
- Foto seeder: [Pexels](https://www.pexels.com) (Pexels License), daftar fotografer di `backend/database/seeders/photos/manifest.json`
- Peta: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors

# Web — Smart Waste Management

Dashboard web untuk **admin** dan **user**: login per role, statistik, CRUD laporan dengan filter/pencarian,
update status laporan, manajemen pengguna, peta sebaran laporan, dan profil. Terhubung ke API Laravel (`backend/`).

## Stack
Vite SPA, React 19, TypeScript · TanStack Router + TanStack Query · Tailwind CSS v4 + shadcn/ui ·
react-hook-form + zod · Leaflet/OpenStreetMap · Recharts · sonner (toast)

## Menjalankan
```sh
bun install
cp .env.example .env          # VITE_API_URL=http://localhost:8000/api/v1
bun run dev                   # http://localhost:5173
```
Backend harus jalan (lihat `backend/README.md`). Akun demo: `admin@swm.test` / `password`, `user@swm.test` / `password`.

```sh
bun run build     # output statis di dist/
bun run test      # vitest
bun run lint
bun run routes    # regenerasi src/routeTree.gen.ts setelah menambah route
```

## Halaman
| Route | Role | Isi |
|---|---|---|
| `/login`, `/register` | publik | validasi zod + error dari server (password salah, akun nonaktif, email terpakai) |
| `/dashboard` | admin & user | kartu statistik, pie kategori, bar status, tren 7/30 hari, laporan terbaru. Admin: total pengguna + akurasi AI di lapangan |
| `/reports` | admin & user | tabel (kartu di layar kecil), cari, filter status/kategori/tanggal, urutkan, pagination. Filter tersimpan di URL |
| `/reports/new` | admin & user | upload foto → **deteksi AI otomatis** (kategori terisi, bisa diubah), pilih lokasi di peta + alamat otomatis (OSM Nominatim) |
| `/reports/:id` | pemilik / admin | foto, peta, hasil AI vs kategori final, riwayat status; admin: update status + catatan (wajib saat menolak) |
| `/reports/:id/edit` | pemilik (pending) / admin | edit; ganti foto memperbarui hasil AI |
| `/users` | admin | CRUD pengguna, cari, filter role/aktif, aktif/nonaktif, reset password |
| `/map` | admin | semua laporan di peta, warna sesuai status |
| `/profile` | semua | edit profil + foto, ganti password |

## Alur data
```
halaman → hook (src/hooks, TanStack Query) → service (src/services) → http.ts (fetch + Bearer token) → Laravel /api/v1
```
- **Auth**: token Sanctum di localStorage, dicek ke `/auth/me` saat aplikasi dibuka; respons 401 di mana pun mengakhiri sesi.
- **Hak akses** tombol Edit/Hapus/Update status diambil dari `report.can` (dihitung Policy di backend), jadi UI dan API selalu sama.
- **AI**: foto dikirim ke `POST /api/v1/predict` (Laravel meneruskan ke FastAPI). Kalau AI tidak yakin, user wajib memilih kategori;
  kalau layanan AI mati (503), laporan tetap bisa dikirim dengan kategori pilihan user.
- Upload saat edit memakai `POST` + `_method=PUT` karena PHP tidak membaca multipart pada `PUT`.

## Docker
```sh
docker build --build-arg VITE_API_URL=https://api.swm.example.com/api/v1 -t swm-web .
docker run -p 8080:80 swm-web
```
Build multi-stage (bun → nginx). `nginx.conf` mengarahkan semua path ke `index.html` untuk routing SPA.

# Introduction

REST API untuk aplikasi web (admin & user) dan mobile Smart Waste Management.

<aside>
    <strong>Base URL</strong>: <code>http://localhost:8088</code>
</aside>

    Base URL: `/api/v1`. Semua response berformat JSON: `{ "data": ..., "meta": ..., "message": ... }`.

    - **Role**: `admin` dan `user`. User hanya bisa mengakses laporan miliknya; admin mengakses semua.
    - **Error validasi** (422): `{ "message": "...", "errors": { "field": ["pesan"] } }`.
    - **Akun demo**: `admin@swm.test` / `password` (web saja), `user@swm.test` / `password`.
    - Dokumentasi layanan ML (FastAPI) tersedia terpisah di `{ML_URL}/docs`.


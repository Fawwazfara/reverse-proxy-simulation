# App 2: Node.js + Express + MongoDB

Layanan backend sederhana berbasis Node.js dan Express untuk latihan reverse proxy.

## Fitur
- Berjalan di port default: `8002`
- Menampilkan inspeksi header reverse proxy (`X-Forwarded-*`, `Host`, `X-Real-IP`)
- Mendukung MongoDB via Mongoose dengan in-memory fallback ketika DB offline
- REST API endpoint:
  - `GET /` -> Web dashboard
  - `GET /api/health` -> Healthcheck JSON
  - `GET /api/items` -> Daftar data item
  - `POST /api/items` -> Tambah data item baru

## Menjalankan Sendiri
```bash
npm install
npm start
# atau dengan nodemon / watch mode:
npm run dev
```
Konfigurasi port dan URI MongoDB ada di file `.env`.


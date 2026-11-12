# App 3: Go + PostgreSQL

Layanan backend performa tinggi berbasis Golang untuk latihan reverse proxy.

## Fitur
- Berjalan di port default: `8003`
- Menggunakan standar Go 1.22 HTTP router & PostgreSQL driver (`lib/pq`)
- Menampilkan inspeksi header reverse proxy (`X-Forwarded-*`, `Host`, `X-Real-IP`)
- Mendukung PostgreSQL dengan in-memory fallback ketika DB offline
- REST API endpoint:
  - `GET /` -> Web dashboard
  - `GET /api/health` -> Healthcheck JSON
  - `GET /api/items` -> Daftar data item
  - `POST /api/items` -> Tambah data item baru

## Menjalankan Sendiri
```bash
# Jalankan langsung
go run main.go

# Atau compile terlebih dahulu
go build -o server main.go
./server
```
Konfigurasi port dan kredensial PostgreSQL ada di file `.env`.


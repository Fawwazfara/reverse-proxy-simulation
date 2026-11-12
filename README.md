# Lab Praktik Reverse Proxy

Repositori ini berisi 3 proyek web sederhana dengan stack berbeda untuk kebutuhan belajar **Reverse Proxy** (seperti Nginx, Apache, Caddy, HAProxy, Traefik, dsb.):

| No | Aplikasi | Stack | Database | Default Port | Status URL |
|---|---|---|---|---|---|
| 1 | **app-laravel** | PHP 8.x + Laravel | MySQL | `8001` | http://localhost:8001/api/health |
| 2 | **app-node** | Node.js + Express | MongoDB | `8002` | http://localhost:8002/api/health |
| 3 | **app-go** | Golang (net/http) | PostgreSQL | `8003` | http://localhost:8003/api/health |

---

## 🚀 Fitur Khusus untuk Belajar Reverse Proxy

Setiap aplikasi telah dilengkapi dengan:
1. **Inspektur Header Reverse Proxy** di tampilan web utama (`/`):
   - Menampilkan `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, dll.
   - Berguna untuk memastikan reverse proxy Anda meneruskan identitas klien dan host asli dengan benar.
2. **Graceful Database Fallback**:
   - Jika MySQL, MongoDB, atau PostgreSQL belum aktif, aplikasi **tetap dapat berjalan normal** dan tidak akan crash 500.
   - Status koneksi database ditampilkan langsung di dashboard dan di endpoint `/api/health`.
3. **Endpoint REST API**:
   - `GET /` -> Halaman dashboard interaktif
   - `GET /api/health` -> JSON health check
   - `GET /api/items` & `POST /api/items` -> Pengujian CRUD dasar

---

## 🛠️ Cara Menjalankan Layanan

### 1. Menjalankan Ketiganya Sekaligus (Rekomendasi)
Tersedia helper script siap pakai di root folder:

```bash
# Jalankan semua service di background
./start-all.sh

# Cek status kesehatan ketiga service
./status.sh

# Hentikan semua service
./stop-all.sh
```

Log aktivitas masing-masing service dapat dilihat di folder `logs/` (`laravel.log`, `node.log`, `go.log`).

---

### 2. Menjalankan Satu per Satu

#### Laravel (Port 8001)
```bash
cd app-laravel
php artisan serve --host=0.0.0.0 --port=8001
```

#### Node.js (Port 8002)
```bash
cd app-node
npm start
```

#### Go (Port 8003)
```bash
cd app-go
./server
# Atau: go run main.go
```

---

## 🌐 Contoh Konfigurasi Reverse Proxy

Contoh file konfigurasi sudah disediakan di folder `reverse-proxy-configs/`:

### Skenario A: Subdomain / Domain Virtual (`nginx-subdomain.conf`)
Mapping domain lokal ke masing-masing port:
- `http://laravel.test` -> `http://127.0.0.1:8001`
- `http://node.test`    -> `http://127.0.0.1:8002`
- `http://go.test`      -> `http://127.0.0.1:8003`

Tambahkan di `/etc/hosts` Anda:
```text
127.0.0.1 laravel.test node.test go.test
```

### Skenario B: Path-Based Routing (`nginx-path-based.conf`)
Mengakses semua service lewat satu IP / Host (port 80):
- `http://localhost/laravel/` -> `http://127.0.0.1:8001/`
- `http://localhost/node/`    -> `http://127.0.0.1:8002/`
- `http://localhost/go/`      -> `http://127.0.0.1:8003/`

### Skenario C: Caddy (`Caddyfile`)
Menggunakan Caddy web server dengan sintaks ringkas.

---

## 🐳 Database dengan Docker (Opsional)
Jika Anda ingin menyalakan ketiga database (MySQL, MongoDB, PostgreSQL) melalui Docker, salin file contoh:
```bash
cp docker-compose.yml.example docker-compose.yml
docker compose up -d
```
Aplikasi akan otomatis mendeteksi ketika database tersebut aktif.


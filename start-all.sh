#!/bin/bash

# Script untuk menjalankan ketiga aplikasi secara bersamaan di background

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
LOG_DIR="$DIR/logs"
mkdir -p "$LOG_DIR"

echo "=================================================="
echo "  Menjalankan 3 Web Apps untuk Belajar Reverse Proxy"
echo "=================================================="

# 1. Laravel + MySQL (Port 8001)
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "[!] Port 8001 sudah terpakai."
else
    cd "$DIR/app-laravel"
    nohup php artisan serve --host=0.0.0.0 --port=8001 > "$LOG_DIR/laravel.log" 2>&1 &
    echo $! > "$LOG_DIR/laravel.pid"
    echo "[✓] Laravel + MySQL berjalan di http://127.0.0.1:8001 (PID: $(cat "$LOG_DIR/laravel.pid"))"
fi

# 2. Node.js + MongoDB (Port 8002)
if lsof -Pi :8002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "[!] Port 8002 sudah terpakai."
else
    cd "$DIR/app-node"
    nohup node src/index.js > "$LOG_DIR/node.log" 2>&1 &
    echo $! > "$LOG_DIR/node.pid"
    echo "[✓] Node.js + MongoDB berjalan di http://127.0.0.1:8002 (PID: $(cat "$LOG_DIR/node.pid"))"
fi

# 3. Go + PostgreSQL (Port 8003)
if lsof -Pi :8003 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "[!] Port 8003 sudah terpakai."
else
    cd "$DIR/app-go"
    if [ ! -f "$DIR/app-go/server" ]; then
        echo "    Meng-compile binary Go terlebih dahulu..."
        GOTOOLCHAIN=local go build -o server main.go
    fi
    nohup ./server > "$LOG_DIR/go.log" 2>&1 &
    echo $! > "$LOG_DIR/go.pid"
    echo "[✓] Go + PostgreSQL berjalan di http://127.0.0.1:8003 (PID: $(cat "$LOG_DIR/go.pid"))"
fi

echo "=================================================="
echo "Semua service aktif! Log tersimpan di folder logs/"
echo "Gunakan ./stop-all.sh untuk mematikan semua service."
echo "Gunakan ./status.sh untuk memeriksa status service."
echo "=================================================="


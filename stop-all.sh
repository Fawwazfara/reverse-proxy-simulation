#!/bin/bash

# Script untuk menghentikan ketiga aplikasi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
LOG_DIR="$DIR/logs"

echo "=================================================="
echo "  Menghentikan 3 Web Apps Reverse Proxy"
echo "=================================================="

# Stop Laravel
if [ -f "$LOG_DIR/laravel.pid" ]; then
    PID=$(cat "$LOG_DIR/laravel.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" && echo "[✓] Laravel dihentikan (PID: $PID)"
    fi
    rm -f "$LOG_DIR/laravel.pid"
fi
fuser -k 8001/tcp 2>/dev/null

# Stop Node
if [ -f "$LOG_DIR/node.pid" ]; then
    PID=$(cat "$LOG_DIR/node.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" && echo "[✓] Node.js dihentikan (PID: $PID)"
    fi
    rm -f "$LOG_DIR/node.pid"
fi
fuser -k 8002/tcp 2>/dev/null

# Stop Go
if [ -f "$LOG_DIR/go.pid" ]; then
    PID=$(cat "$LOG_DIR/go.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" && echo "[✓] Go dihentikan (PID: $PID)"
    fi
    rm -f "$LOG_DIR/go.pid"
fi
fuser -k 8003/tcp 2>/dev/null

echo "Semua service telah dihentikan."
echo "=================================================="


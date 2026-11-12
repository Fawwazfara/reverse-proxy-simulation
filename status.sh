#!/bin/bash

# Script untuk cek status dan response ketiga aplikasi

echo "=================================================="
echo "         Status 3 Web Apps Reverse Proxy"
echo "=================================================="

check_service() {
    NAME=$1
    PORT=$2
    URL="http://127.0.0.1:$PORT/api/health"
    
    RESPONSE=$(curl -s -m 2 "$URL")
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        echo -e "[● AKTIF] $NAME (Port $PORT)"
        echo "          Response: $(echo "$RESPONSE" | cut -c1-90)..."
    else
        echo -e "[○ MATI ] $NAME (Port $PORT) - Tidak merespons"
    fi
}

check_service "Laravel + MySQL   " 8001
check_service "Node.js + MongoDB " 8002
check_service "Go + PostgreSQL   " 8003

echo "=================================================="


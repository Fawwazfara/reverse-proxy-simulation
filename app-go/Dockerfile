# ========================================================
# Dockerfile untuk app-go (Golang 1.22 + Multi-Stage Build)
# ========================================================

# ----------------------------------------------------
# Stage 1: Builder (Kompilasi source code ke binary statis)
# ----------------------------------------------------
# Menggunakan Golang 1.22 Alpine sesuai versi aktual di go.mod: "go 1.22.2"
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Salin definisi modul Go terlebih dahulu untuk layer caching
COPY go.mod go.sum ./
RUN go mod download

# Salin seluruh source code proyek
COPY . .

# Compile binary statis tanpa CGO (CGO_ENABLED=0) dan buang simbol debug (-ldflags="-w -s")
# agar ukuran binary sekecil mungkin dan mandiri tanpa dependensi libc eksternal
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server main.go

# ----------------------------------------------------
# Stage 2: Runtime (Image akhir yang sangat ramping ~15 MB)
# ----------------------------------------------------
FROM alpine:3.20

WORKDIR /app

# Buat grup dan user non-root untuk keamanan
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Salin HANYA file binary hasil kompilasi dari stage builder
COPY --from=builder /build/server /app/server

# Salin folder templates yang dibutuhkan untuk render dashboard HTML saat runtime
COPY --from=builder /build/templates /app/templates

# Ubah kepemilikan file aplikasi ke user non-root
RUN chown -R appuser:appgroup /app

# Beralih ke user non-root
USER appuser

# Expose port internal Go
EXPOSE 8003

# Jalankan binary server Go
CMD ["/app/server"]


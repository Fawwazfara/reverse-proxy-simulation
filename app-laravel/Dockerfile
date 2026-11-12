# ========================================================
# Dockerfile untuk app-laravel (PHP 8.4 + Laravel 11)
# ========================================================

# Menggunakan Base image PHP 8.4 CLI Alpine yang sangat ringan (~55 MB)
# Versi 8.4 dipilih karena composer.lock mengunci sub-dependensi (Symfony 8.1) ke PHP >= 8.4.1
FROM php:8.4-cli-alpine

# Install dependensi sistem dan ekstensi PHP yang dibutuhkan Laravel
# pdo_mysql untuk MySQL, pcntl untuk process management, bcmath untuk operasi aritmatika presisi
RUN apk add --no-cache \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    oniguruma-dev \
    && docker-php-ext-install \
    pdo_mysql \
    pcntl \
    bcmath

# Ambil binary Composer resmi langsung dari image composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Buat grup dan user non-root 'appuser' (UID 1000) untuk standar keamanan container
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

# Tentukan direktori kerja aplikasi di dalam container
WORKDIR /var/www/html

# Environment default agar container dapat berjalan tanpa database lokal
ENV SESSION_DRIVER=file \
    CACHE_STORE=file \
    DB_CONNECTION=mysql

# Salin definisi paket terlebih dahulu untuk memaksimalkan Docker layer caching
COPY composer.json composer.lock ./

# Install dependensi PHP tanpa package development (--no-dev)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Salin seluruh file proyek Laravel ke dalam container
COPY . .

# Buat autoloader yang dioptimasi
RUN composer dump-autoload --optimize --no-dev

# Berikan hak kepemilikan ke user non-root dan pastikan folder storage & cache dapat ditulis
RUN chown -R appuser:appgroup /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Beralih ke user non-root
USER appuser

# Expose port internal Laravel
EXPOSE 8001

# Jalankan server built-in Laravel binding ke 0.0.0.0 agar dapat diakses dari luar container
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8001"]


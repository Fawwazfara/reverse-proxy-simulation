# ========================================================
# Dockerfile untuk app-node (Node.js 20 LTS + Express)
# ========================================================

# Menggunakan Base image Node.js 20 LTS Alpine (~40 MB)
# Node 20 LTS adalah standar stabil industri untuk JavaScript backend
FROM node:20-alpine

# Tentukan direktori kerja aplikasi di dalam container
WORKDIR /app

# Salin manifest dependensi terlebih dahulu agar memanfaatkan cache layer Docker
COPY package.json package-lock.json ./

# Install dependensi production secara deterministik berdasarkan lockfile
RUN npm install --omit=dev

# Salin source code aplikasi dan tetapkan kepemilikan ke user bawaan 'node'
COPY --chown=node:node . .

# Gunakan user non-root 'node' bawaan image Alpine untuk keamanan
USER node

# Expose port internal Node.js
EXPOSE 8002

# Jalankan server Express
CMD ["node", "src/index.js"]


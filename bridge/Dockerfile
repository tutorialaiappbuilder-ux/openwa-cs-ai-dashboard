# ============================================
# Dockerfile untuk OpenWA Bridge
# Deploy ke Render.com (Free Tier)
# ============================================

# Base image dengan Node.js + Chromium bawaan
FROM ghcr.io/puppeteer/puppeteer:22.10.0

# Set working directory
WORKDIR /app

# Salin package.json terlebih dahulu (layer caching)
COPY package.json ./

# Install dependencies sebagai root (Render free tier perlu ini)
USER root
RUN npm install --omit=dev

# Salin semua source code bridge
COPY . .

# Buat folder untuk menyimpan sesi WhatsApp
RUN mkdir -p /app/session

# OpenWA perlu variabel ini agar Chrome berjalan di dalam container
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
# Pastikan Chrome berjalan tanpa sandbox (wajib di Linux container)
ENV CHROMIUM_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu"
ENV CHROME_PATH=/usr/bin/google-chrome-stable

# Port yang diexpose untuk endpoint /send dan /status
EXPOSE 8080

# Jalankan bridge
CMD ["node", "index.js"]

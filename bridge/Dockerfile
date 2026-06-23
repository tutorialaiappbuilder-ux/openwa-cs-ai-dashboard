# ============================================
# Dockerfile — Baileys WhatsApp Bridge v2.0
# TANPA Puppeteer/Chrome — jauh lebih ringan!
# ============================================

# Node.js slim — tidak perlu base image Puppeteer lagi
FROM node:20-slim

# Install dependencies minimal yang dibutuhkan Baileys
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json dan install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy semua source code
COPY . .

# Buat folder session untuk menyimpan auth Baileys
RUN mkdir -p /app/session

# Port bridge
EXPOSE 8080

# Jalankan bridge
CMD ["node", "index.js"]

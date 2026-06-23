# PRD — CS AI WhatsApp Gateway

**Versi:** 1.0
**Tanggal:** Juni 2026
**Pemilik Produk:** AiAppBuilder Team

---

## 1. Overview

### Latar Belakang

Bisnis skala kecil hingga menengah sering kehilangan peluang penjualan karena tidak mampu merespons pesan pelanggan di WhatsApp secara cepat, terutama di luar jam kerja. Admin manusia memiliki keterbatasan waktu, tenaga, dan konsistensi dalam memberikan jawaban.

CS AI WhatsApp Gateway hadir sebagai solusi customer service otomatis yang cerdas, mampu beroperasi 24/7, dan mampu memahami konteks percakapan meskipun pelanggan menggunakan bahasa informal, singkatan, atau typo.

### Visi Produk

Menjadi lapisan kecerdasan buatan yang duduk di antara WhatsApp bisnis dan pelanggan — membalas pesan secara natural, relevan, dan real-time, sehingga pemilik bisnis bisa fokus pada operasional inti tanpa kehilangan satu pun peluang dari chat masuk.

### Target Pengguna

- Pemilik toko online / UMKM yang aktif menjual via WhatsApp
- Bisnis dengan volume chat tinggi (kuliner, retail, jasa, top-up digital)
- Pengusaha yang ingin menekan biaya operasional CS tanpa mengorbankan kualitas layanan

---

## 2. Requirements

### Functional Requirements

- Sistem wajib mampu menerima pesan masuk dari WhatsApp dan meneruskannya ke engine AI dalam waktu kurang dari 2 detik.
- AI wajib mampu memproses pesan dalam bahasa Indonesia termasuk bahasa gaul, singkatan, dan typo umum.
- Sistem wajib menampilkan indikator "Sedang Mengetik..." sebelum mengirim balasan agar terasa seperti manusia.
- Admin wajib bisa mengonfigurasi System Instruction (panduan bisnis / kepribadian bot) melalui dashboard.
- Sistem wajib mendukung upload knowledge base dalam format dokumen (PDF, DOCX, atau teks biasa) yang dapat dibaca oleh AI.
- Dashboard wajib menampilkan riwayat percakapan secara real-time.
- Sistem wajib mendukung pengelolaan data toko: menu, harga, jam operasional, dan promo aktif.
- OpenWA wajib mampu membaca dan memproses dokumen yang dikirim pelanggan via WhatsApp.

### Non-Functional Requirements

- Uptime sistem minimal 99,5% per bulan.
- Latensi respons AI ke pelanggan maksimal 5 detik dalam kondisi normal.
- Keamanan: System Instruction dan knowledge base bersifat rahasia, tidak boleh terekspos ke pelanggan.
- Sistem harus mudah dikonfigurasi ulang oleh pemilik bisnis tanpa perlu intervensi developer.
- Biaya infrastruktur harus seminimal mungkin dengan memanfaatkan free tier yang tersedia.

---

## 3. Core Features

### F-01: Auto-Reply AI via WhatsApp
Bot menerima pesan dari pelanggan dan membalasnya secara otomatis menggunakan respons yang dihasilkan Gemini 3.1Flash. Balasan bersifat kontekstual dan natural, bukan berbasis menu kaku.

### F-02: Typing Simulation
Sebelum mengirim balasan, sistem menampilkan status "Sedang Mengetik..." untuk memberikan kesan interaksi yang lebih manusiawi dan mengurangi kecurigaan pelanggan bahwa mereka sedang bicara dengan bot.

### F-03: Knowledge Base Management
Admin dapat mengunggah dokumen referensi (FAQ, katalog produk, SOP layanan) melalui dashboard. Dokumen disimpan di Cloudflare R2, teks diekstrak dan dijadikan konteks tambahan bagi Gemini saat menyusun jawaban.

### F-04: System Instruction Configuration
Admin dapat menulis dan menyimpan instruksi sistem yang menentukan identitas, gaya bahasa, dan batasan bot. Contoh: "Kamu adalah CS AiAppBuilder, selalu sopan, jangan bahas kompetitor."

### F-05: Document Reader (dari Pelanggan)
Jika pelanggan mengirim dokumen (misalnya bukti transfer atau foto struk), OpenWA menangkap file tersebut, menyimpannya sementara di Cloudflare R2, dan AI dapat memproses isi dokumen tersebut sebagai bagian dari konteks percakapan.

### F-06: Dashboard Monitoring
Interface web yang menampilkan daftar percakapan masuk, status bot (aktif/nonaktif), log balasan AI, dan ringkasan aktivitas harian.

### F-07: Store Data Management
Pemilik bisnis dapat mengelola data toko secara mandiri melalui dashboard: nama menu, harga, jam buka, dan promo yang sedang berjalan. Data ini otomatis tersedia sebagai konteks untuk AI.

### F-08: Conversation History
Sistem menyimpan seluruh riwayat percakapan per nomor WhatsApp pelanggan di Neon Database, dapat diakses dan difilter oleh admin kapan saja.

---

## 4. User Flow

### Alur Pelanggan (End User)

1. Pelanggan membuka WhatsApp dan mengirim pesan ke nomor WhatsApp bisnis.
2. OpenWA (berjalan di Railway) mendeteksi pesan masuk dalam hitungan milidetik.
3. OpenWA mengirim webhook ke Backend API di Vercel.
4. Sistem menampilkan status "Sedang Mengetik..." di sisi pelanggan.
5. Backend mengambil System Instruction, data toko, dan knowledge base relevan dari Neon Database.
6. Backend menyusun prompt lengkap dan memanggil Gemini 3.1Flash API.
7. Gemini menghasilkan balasan yang natural dan kontekstual.
8. Backend mengirimkan balasan ke OpenWA, lalu OpenWA meneruskannya ke WhatsApp pelanggan.
9. Pesan dan balasan disimpan ke Neon Database sebagai riwayat percakapan.

### Alur Admin / Pemilik Bisnis

1. Admin login ke dashboard (Next.js di Vercel) melalui browser.
2. Admin mengatur System Instruction sesuai kepribadian dan kebutuhan bisnis.
3. Admin mengunggah dokumen knowledge base (katalog, FAQ, SOP) — file masuk ke Cloudflare R2, teks diekstrak dan disimpan ke Neon.
4. Admin mengisi data toko: menu, harga, jam operasional, promo.
5. Admin memantau percakapan masuk secara real-time dari dashboard.
6. Admin dapat menonaktifkan bot dan mengambil alih percakapan secara manual jika diperlukan.

### Alur Penanganan Dokumen dari Pelanggan

1. Pelanggan mengirim file (foto/PDF) via WhatsApp.
2. OpenWA mendeteksi media/dokumen dan mengunduhnya.
3. File diunggah sementara ke Cloudflare R2 dan URL-nya dikirim ke Backend API.
4. Backend meneruskan URL file + konteks percakapan ke Gemini 3.1 Flash.
5. Gemini memproses isi dokumen dan menjawab sesuai konteks.

---

## 5. Architecture

### Gambaran Umum Arsitektur

```
[WhatsApp Pelanggan]
        ↓
  [OpenWA Server]           ← Railway (Node.js persistent service)
        ↓ webhook
  [Backend API]             ← Vercel Serverless Functions (Next.js)
   ├── Message Handler
   ├── Knowledge Base Retriever
   ├── System Instruction Loader
   └── Gemini 3.1 Flash Client
        ↓                          ↓
[Google Gemini 3.1 Flash]   [Cloudflare R2]
  (AI Engine)                (File Storage)
        ↓
  [Neon Database]            ← PostgreSQL serverless
  (conversations, messages,
   knowledge base, config)
        ↓
  [Dashboard Frontend]       ← Vercel (Next.js)
```

### Penjelasan Komponen

**OpenWA Server (Railway):** Node.js service yang berjalan sebagai persistent process di Railway. Bertugas sebagai jembatan WhatsApp Web API — menangkap pesan masuk, mengirimkan webhook ke Vercel, dan mengeksekusi perintah kirim balasan. Harus berjalan terus-menerus karena membutuhkan sesi WebSocket aktif ke WhatsApp Web. Railway dipilih karena mendukung persistent service dengan free tier yang memadai untuk usage ringan, dan proses deploy semudah Vercel via GitHub.

**Backend API (Vercel):** Kumpulan serverless functions berbasis Next.js API Routes. Menerima webhook dari OpenWA, mengorkestrasi pengambilan konteks dari Neon, memanggil Gemini API, dan mengembalikan respons ke OpenWA. Stateless by design — semua state disimpan di Neon.

**Google Gemini 3.1 Flash:** Model AI multimodal Google yang memproses teks dan dokumen. Menerima system prompt, knowledge base yang relevan, riwayat percakapan, dan pesan pelanggan, lalu menghasilkan balasan dalam bahasa natural.

**Neon Database:** PostgreSQL serverless yang kompatibel penuh dengan PostgreSQL standar. Menyimpan seluruh data persisten: percakapan, pesan, konfigurasi bisnis, dan konten knowledge base yang sudah diekstrak. Dipilih karena serverless-friendly, latency rendah, dan memiliki free tier yang cukup untuk tahap awal.

**Cloudflare R2:** Object storage S3-compatible untuk menyimpan file — baik dokumen knowledge base yang diunggah admin maupun media yang dikirim pelanggan via WhatsApp. Dipilih karena biaya egress gratis (berbeda dengan AWS S3) dan integrasi mudah via S3-compatible SDK.

**Dashboard Frontend (Vercel):** Aplikasi Next.js yang di-deploy di Vercel. Digunakan admin untuk monitoring percakapan dan manajemen konfigurasi seluruh sistem.

---

## 6. Database Schema

### Tabel: businesses
Menyimpan data profil bisnis pengguna sistem.

- id (UUID, PK)
- name (VARCHAR) — nama bisnis
- wa_number (VARCHAR) — nomor WhatsApp terdaftar
- system_instruction (TEXT) — panduan kepribadian bot
- is_active (BOOLEAN) — status bot aktif/nonaktif
- created_at (TIMESTAMP)

### Tabel: store_data
Menyimpan informasi operasional toko yang dijadikan konteks AI.

- id (UUID, PK)
- business_id (UUID, FK → businesses)
- category (VARCHAR) — contoh: "menu", "promo", "jam_operasional"
- content (TEXT) — isi data dalam format teks
- updated_at (TIMESTAMP)

### Tabel: knowledge_base
Menyimpan dokumen referensi yang diunggah admin.

- id (UUID, PK)
- business_id (UUID, FK → businesses)
- file_name (VARCHAR)
- file_type (VARCHAR) — "pdf", "docx", "txt"
- r2_key (VARCHAR) — path file di Cloudflare R2
- content_text (TEXT) — hasil ekstraksi teks dari dokumen
- created_at (TIMESTAMP)

### Tabel: conversations
Menyimpan sesi percakapan per pelanggan.

- id (UUID, PK)
- business_id (UUID, FK → businesses)
- customer_wa_number (VARCHAR)
- started_at (TIMESTAMP)
- last_message_at (TIMESTAMP)

### Tabel: messages
Menyimpan setiap pesan dalam sebuah percakapan.

- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- role (ENUM: "user" | "assistant")
- content (TEXT) — isi pesan teks
- media_r2_key (VARCHAR, NULLABLE) — path file di R2 jika ada attachment
- sent_at (TIMESTAMP)

---

## 7. Tech Stack

### WhatsApp Bridge

- Library: OpenWA (@open-wa/wa-automate)
- Runtime: Node.js v18+
- Hosting: Render (persistent Node.js service, deploy via GitHub)

### Backend API

- Framework: Next.js API Routes (serverless)
- Runtime: Node.js v18+
- Hosting: Vercel
- AI Engine: Google Gemini 3.1 Flash via Google AI SDK (@google/generative-ai)
- Storage SDK: AWS SDK v3 (@aws-sdk/client-s3) — kompatibel dengan Cloudflare R2

### Frontend / Dashboard

- Framework: Next.js (React)
- UI: Tailwind CSS + Antigravity
- State Management: React Query (TanStack Query)
- Hosting: Vercel (monorepo dengan Backend API)

### Database & Storage

- Database: Neon (PostgreSQL serverless)
- ORM: Drizzle ORM — dipilih karena ringan dan sangat kompatibel dengan environment serverless/edge
- File Storage: Cloudflare R2

### Tooling & DevOps

- Version Control: GitHub
- CI/CD: Vercel Auto Deploy (Frontend + Backend) dan Railway Auto Deploy (OpenWA) dari GitHub
- Environment Management: Vercel Environment Variables + Railway Variables
- Logging: Vercel Logs + Railway Logs

---

## 8. Design Guidelines

### Prinsip Desain Sistem

**Natural First:** Semua respons AI harus terdengar seperti diketik manusia. Hindari format yang terlalu formal, poin-poin berlebihan, atau bahasa kaku yang tidak biasa dipakai dalam chat WhatsApp.

**Zero Config Experience:** Pemilik bisnis yang tidak memiliki latar belakang teknis harus bisa mengatur dan menggunakan sistem ini tanpa bantuan developer setelah setup awal selesai.

**Transparency for Admin:** Dashboard harus memberi visibilitas penuh kepada admin — siapa yang chat, apa yang dijawab bot, dan kapan terjadi — tanpa harus membuka WhatsApp secara langsung.

### Panduan UX Dashboard

- Tampilan utama adalah list percakapan terbaru, mirip tampilan inbox chat.
- Setiap percakapan bisa diklik untuk melihat thread lengkap beserta balasan AI.
- Tombol "Ambil Alih" (Human Takeover) harus selalu terlihat dan mudah diakses di setiap thread percakapan.
- Form pengaturan System Instruction harus dilengkapi placeholder contoh agar mudah diisi oleh non-developer.
- Upload knowledge base harus mendukung drag-and-drop dengan preview nama file yang sudah terunggah.
- Indikator status Railway (OpenWA online/offline) harus terlihat jelas di header dashboard.

### Panduan Perilaku AI (System Instruction Default)

- Gunakan bahasa Indonesia yang santai dan ramah, sesuaikan dengan tone brand bisnis.
- Selalu konfirmasi ulang jika pertanyaan pelanggan tidak jelas, alih-alih menebak.
- Jangan pernah mengungkapkan bahwa dirinya adalah bot, kecuali ditanya langsung.
- Jangan memberikan informasi di luar scope yang sudah ditetapkan dalam knowledge base.
- Sertakan CTA yang relevan di akhir setiap respons jika memungkinkan.
- Tidak perlu membalas pesan yang hanya berisi emoji atau stiker dengan respons panjang.

---

## 9. Roadmap

### Fase 0 — Proof of Concept (Minggu 1–2)

Tujuan: Validasi alur dasar sistem berjalan end-to-end.

- Setup OpenWA di Railway dan koneksi ke nomor WhatsApp uji coba
- Integrasi pertama dengan Gemini 3.1Flash API
- Alur lengkap: pesan masuk dari WhatsApp → Gemini → balasan otomatis
- Typing simulation berfungsi
- Webhook OpenWA → Vercel API berjalan stabil

### Fase 1 — MVP Core (Minggu 3–6)

Tujuan: Sistem siap digunakan oleh 1 bisnis pertama secara nyata.

- Neon Database live: tabel conversations, messages, businesses aktif
- System Instruction bisa dikonfigurasi melalui database
- Knowledge base: admin bisa upload dokumen ke Cloudflare R2, teks diekstrak dan digunakan sebagai konteks AI
- Dashboard versi awal: list percakapan dan detail thread
- Store data management: menu, harga, promo bisa diinput manual via dashboard

### Fase 2 — Dashboard Lengkap (Minggu 7–10)

Tujuan: Admin bisa mengelola semua konfigurasi secara mandiri tanpa developer.

- Dashboard dengan autentikasi (login admin)
- Manajemen knowledge base via UI: upload, hapus, preview dokumen
- Editor System Instruction di dashboard
- Fitur Human Takeover: bot bisa dinonaktifkan per percakapan
- Notifikasi ke admin jika ada percakapan yang perlu perhatian manusia
- Statistik dasar: jumlah chat masuk, rata-rata waktu respons, dokumen aktif

### Fase 3 — Skalabilitas & Multi-Tenant (Minggu 11–16)

Tujuan: Sistem bisa digunakan oleh lebih dari satu bisnis secara bersamaan.

- Arsitektur multi-tenant: satu sistem untuk banyak bisnis dengan isolasi data ketat
- Onboarding mandiri: pemilik bisnis baru bisa daftar dan setup sendiri
- Rate limiting dan quota management per tenant
- Peningkatan keamanan: enkripsi System Instruction di Neon
- Monitoring usage R2 dan Neon per tenant

### Fase 4 — Fitur Lanjutan (Bulan 5–6)

Tujuan: Meningkatkan nilai bisnis dan mendukung monetisasi.

- Order otomatis: bot mencatat pesanan dan mengirim rangkuman order ke admin
- Pengiriman bukti struk / konfirmasi pembayaran otomatis via WhatsApp
- Analitik percakapan: topik paling sering ditanyakan, pelanggan paling aktif
- Dukungan multi-bahasa (minimal Indonesia dan Inggris)
- Webhook keluar untuk integrasi eksternal (Google Sheets, CRM, dll.)
- Integrasi payment gateway (opsional)

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan proyek. Semua estimasi timeline bersifat indikatif dan dapat berubah berdasarkan prioritas dan kapasitas tim.*
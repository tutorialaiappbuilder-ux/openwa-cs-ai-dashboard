/**
 * OpenWA WhatsApp Bridge
 *
 * Service persistent yang berjalan di Railway.
 * - Menginisialisasi sesi WhatsApp via OpenWA
 * - Mendengarkan pesan masuk dan mengirim webhook ke Backend API
 * - Menerima perintah kirim balasan dari Backend API
 * - Mensimulasikan typing indicator sebelum mengirim balasan
 *
 * Environment Variables:
 * - BACKEND_API_URL: URL backend API (default: http://localhost:4000)
 * - DEFAULT_BUSINESS_ID: UUID bisnis default
 * - PORT: Port untuk endpoint /send (default: 8080)
 */

import 'dotenv/config'
import { create, decryptMedia } from '@open-wa/wa-automate'
import axios from 'axios'
import express from 'express'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:4000'
const PORT = process.env.PORT || 8080
const BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || ''

let waClient = null

// ============================================
// 1. Inisialisasi OpenWA Client
// ============================================
async function startWhatsApp() {
  console.log('📱 Memulai OpenWA WhatsApp Bridge...')
  console.log(`🌐 Backend API: ${BACKEND_URL}`)
  console.log(`🏢 Business ID: ${BUSINESS_ID || '(belum diset)'}`)

  const client = await create({
    sessionId: 'openwa-cs-ai',
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0, // Tidak timeout saat scan QR
  })

  waClient = client
  console.log('✅ WhatsApp client berhasil terkoneksi!')

  // ============================================
  // 2. Listen Pesan Masuk
  // ============================================
  client.onMessage(async (message) => {
    // Abaikan pesan dari diri sendiri dan grup
    if (message.fromMe || message.isGroupMsg) return

    console.log(`📩 Pesan masuk dari ${message.sender.pushname || message.from}: "${message.body}"`)

    try {
      // Kirim status "typing" ke pelanggan
      await client.simulateTyping(message.chatId, true)

      // Siapkan payload webhook
      const payload = {
        from: message.from,
        message: message.body || '',
        senderName: message.sender.pushname || message.sender.formattedName || '',
        businessId: BUSINESS_ID,
      }

      // Handle media/dokumen
      if (message.mimetype) {
        try {
          const mediaBuffer = await decryptMedia(message)
          // TODO: Upload media ke R2 via backend dan tambahkan mediaUrl ke payload
          payload.message += `\n\n[Pelanggan mengirimkan ${message.type}: ${message.mimetype}]`
        } catch (mediaErr) {
          console.warn('⚠️  Gagal mendekripsi media:', mediaErr.message)
        }
      }

      // Kirim webhook ke Backend API
      const response = await axios.post(`${BACKEND_URL}/api/webhook/message`, payload, {
        timeout: 30000, // 30 detik timeout (Gemini bisa lambat)
      })

      // Stop typing
      await client.simulateTyping(message.chatId, false)

      // Jika ada balasan otomatis, kirim ke WhatsApp
      if (response.data.autoReply && response.data.reply) {
        // Delay sebentar untuk simulasi manusia
        const typingDelay = Math.min(response.data.reply.length * 30, 3000)
        await new Promise((r) => setTimeout(r, typingDelay))

        await client.simulateTyping(message.chatId, true)
        await new Promise((r) => setTimeout(r, 1000))
        await client.simulateTyping(message.chatId, false)

        await client.sendText(message.from, response.data.reply)
        console.log(`🤖 Balasan AI terkirim ke ${message.from}`)
      } else {
        console.log(`⏸️  Tidak mengirim balasan otomatis (bot nonaktif atau takeover).`)
      }

    } catch (err) {
      console.error('❌ Error saat memproses pesan:', err.message)

      // Stop typing on error
      try {
        await client.simulateTyping(message.chatId, false)
      } catch (_) {}
    }
  })

  // Listen state changes
  client.onStateChanged((state) => {
    console.log(`📊 WhatsApp state berubah: ${state}`)
    if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
      client.forceRefocus()
    }
  })

  console.log('👂 Mendengarkan pesan masuk...\n')
}

// ============================================
// 3. Express endpoint untuk menerima perintah kirim
// ============================================
const app = express()
app.use(express.json())

/**
 * POST /send
 * Digunakan oleh backend untuk mengirim pesan manual (admin takeover)
 * Body: { to, message }
 */
app.post('/send', async (req, res) => {
  const { to, message } = req.body

  if (!to || !message) {
    return res.status(400).json({ error: '"to" dan "message" wajib diisi.' })
  }

  if (!waClient) {
    return res.status(503).json({ error: 'WhatsApp client belum terkoneksi.' })
  }

  try {
    // Simulasi typing
    await waClient.simulateTyping(to, true)
    await new Promise((r) => setTimeout(r, 1500))
    await waClient.simulateTyping(to, false)

    await waClient.sendText(to, message)
    console.log(`📤 Pesan manual terkirim ke ${to}`)

    return res.json({ status: 'sent', to })
  } catch (err) {
    console.error('❌ Gagal mengirim pesan:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /status
 * Health check bridge
 */
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpenWA Bridge',
    connected: !!waClient,
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`\n🌉 Bridge API listening on port ${PORT}`)
})

// ============================================
// 4. Start
// ============================================
startWhatsApp().catch((err) => {
  console.error('💥 Gagal memulai WhatsApp Bridge:', err)
  process.exit(1)
})

/**
 * OpenWA WhatsApp Bridge — UPDATED for containerized/cloud deployment
 *
 * Perubahan dari versi lokal:
 * - Chromium args disesuaikan untuk Docker/container (no-sandbox, dll)
 * - QR Code dicetak sebagai teks ASCII agar bisa dibaca di logs Render
 * - Session disimpan secara lokal (persistent disk Render)
 * - Endpoint /qr untuk melihat QR code terbaru via HTTP
 */

import 'dotenv/config'
import { create, decryptMedia } from '@open-wa/wa-automate'
import axios from 'axios'
import express from 'express'
import qrcode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:4000'
const PORT = process.env.PORT || 8080
const BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || ''

let waClient = null
let lastQrCode = null
let lastQrPng = null
let connectionStatus = 'disconnected'

// ============================================
// Express App — harus start SEBELUM OpenWA
// ============================================
const app = express()
app.use(express.json())

/** GET /status — cek apakah bridge sudah terkoneksi */
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    service: 'OpenWA Bridge',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString(),
  })
})

/** GET /qr — tampilkan QR code dalam format PNG (untuk scan via browser) */
app.get('/qr', async (req, res) => {
  if (connectionStatus === 'connected') {
    return res.send('<h2 style="font-family:sans-serif;color:green">✅ WhatsApp sudah terkoneksi! Bridge aktif.</h2>')
  }
  if (!lastQrCode) {
    return res.send(`
      <html><body style="font-family:sans-serif;padding:20px">
        <h2>⏳ Menunggu QR Code...</h2>
        <p>Refresh halaman ini dalam beberapa detik.</p>
        <script>setTimeout(()=>location.reload(), 3000)</script>
      </body></html>
    `)
  }

  try {
    const qrDataUrl = await qrcode.toDataURL(lastQrCode, { width: 400 })
    res.send(`
      <html><head><title>OpenWA QR Code</title></head>
      <body style="font-family:sans-serif;padding:20px;text-align:center;background:#0f172a;color:#fff">
        <h2>📱 Scan QR Code dengan WhatsApp Anda</h2>
        <img src="${qrDataUrl}" style="border:8px solid white;border-radius:12px;margin:20px auto;display:block" />
        <p style="color:#94a3b8">Buka WhatsApp → Menu → Perangkat Tertaut → Tautkan Perangkat</p>
        <p style="color:#64748b;font-size:12px">QR code akan diperbarui otomatis. <a href="/qr" style="color:#60a5fa">Refresh</a></p>
        <script>setTimeout(()=>location.reload(), 20000)</script>
      </body></html>
    `)
  } catch (e) {
    res.status(500).send('Gagal menghasilkan QR code: ' + e.message)
  }
})

/** POST /send — kirim pesan dari admin (via dashboard takeover) */
app.post('/send', async (req, res) => {
  const { to, message } = req.body
  if (!to || !message) {
    return res.status(400).json({ error: '"to" dan "message" wajib diisi.' })
  }
  if (!waClient || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp belum terkoneksi. Buka /qr untuk scan QR code.' })
  }
  try {
    await waClient.simulateTyping(to, true)
    await new Promise((r) => setTimeout(r, 1500))
    await waClient.simulateTyping(to, false)
    await waClient.sendText(to, message)
    console.log(`📤 Pesan terkirim ke ${to}`)
    return res.json({ status: 'sent', to })
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n🌉 Bridge HTTP listening on port ${PORT}`)
  console.log(`🔗 Buka URL ini di browser untuk scan QR:\n   https://<your-render-url>/qr\n`)
})

// ============================================
// OpenWA Client
// ============================================
async function startWhatsApp() {
  console.log('📱 Memulai OpenWA WhatsApp Bridge...')
  console.log(`🌐 Backend API: ${BACKEND_URL}`)
  console.log(`🏢 Business ID: ${BUSINESS_ID || '(belum diset di env)'}`)

  const client = await create({
    sessionId: 'openwa-bridge',
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    qrTimeout: 0,
    // Gunakan Chrome yang sudah terinstall di Docker image (ghcr.io/puppeteer/puppeteer)
    // JANGAN set chromiumArgs saat multiDevice: true — konflik dan menyebabkan timeout!
    useChrome: true,
    // Callback saat QR code tersedia
    qrCallback: (qr) => {
      lastQrCode = qr
      connectionStatus = 'waiting_for_scan'
      console.log('\n📲 QR Code siap! Buka URL /qr di browser untuk scan.')
      // Juga print di terminal sebagai fallback
      qrcodeTerminal.generate(qr, { small: true })
    },
  })

  waClient = client
  connectionStatus = 'connected'
  lastQrCode = null
  console.log('✅ WhatsApp berhasil terkoneksi!')

  // Listen pesan masuk
  client.onMessage(async (message) => {
    if (message.fromMe || message.isGroupMsg) return

    console.log(`📩 Dari ${message.sender.pushname || message.from}: "${message.body?.substring(0, 50)}"`)

    try {
      await client.simulateTyping(message.chatId, true)

      const payload = {
        from: message.from,
        message: message.body || '',
        senderName: message.sender.pushname || message.sender.formattedName || '',
        businessId: BUSINESS_ID,
      }

      if (message.mimetype) {
        payload.message += `\n\n[${message.type}: ${message.mimetype}]`
      }

      const response = await axios.post(`${BACKEND_URL}/api/webhook/message`, payload, {
        timeout: 30000,
      })

      await client.simulateTyping(message.chatId, false)

      if (response.data.autoReply && response.data.reply) {
        const delay = Math.min(response.data.reply.length * 30, 3000)
        await new Promise((r) => setTimeout(r, delay))
        await client.simulateTyping(message.chatId, true)
        await new Promise((r) => setTimeout(r, 800))
        await client.simulateTyping(message.chatId, false)
        await client.sendText(message.from, response.data.reply)
        console.log(`🤖 AI reply terkirim ke ${message.from}`)
      }
    } catch (err) {
      console.error('❌ Error proses pesan:', err.message)
      try { await client.simulateTyping(message.chatId, false) } catch (_) {}
    }
  })

  client.onStateChanged((state) => {
    console.log(`📊 State: ${state}`)
    if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
      connectionStatus = 'disconnected'
      client.forceRefocus()
    }
  })

  console.log('👂 Mendengarkan pesan masuk...\n')
}

startWhatsApp().catch((err) => {
  console.error('💥 Bridge gagal start:', err)
  connectionStatus = 'error'
  // Jangan exit — biarkan Express tetap berjalan agar /qr dan /status masih bisa diakses
  setTimeout(() => startWhatsApp(), 30000) // Retry setelah 30 detik
})

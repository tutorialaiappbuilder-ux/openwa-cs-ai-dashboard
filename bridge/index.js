/**
 * WhatsApp Bridge — Baileys Edition v2.0
 *
 * Menggunakan @whiskeysockets/baileys (WebSocket langsung ke WhatsApp)
 * TANPA Puppeteer/Chrome — jauh lebih ringan dan stabil di cloud.
 *
 * Endpoints:
 *   GET  /status  — cek status koneksi
 *   GET  /qr      — tampilkan QR code untuk scan
 *   POST /send    — kirim pesan (dari admin takeover di dashboard)
 */

import 'dotenv/config'
import express from 'express'
import qrcode from 'qrcode'
import axios from 'axios'
import pino from 'pino'
import { createRequire } from 'module'

// Baileys menggunakan CommonJS, kita perlu import via createRequire
const require = createRequire(import.meta.url)
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidNormalizedUser,
} = require('@whiskeysockets/baileys')

// ============================================
// Config
// ============================================
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:4000'
const PORT = process.env.PORT || 8080
const BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || ''
const SESSION_DIR = './session'

// ============================================
// State
// ============================================
let sock = null
let lastQrString = null
let connectionStatus = 'disconnected' // disconnected | connecting | waiting_for_scan | connected | error

// Logger minimal (tidak spam ke console)
const logger = pino({ level: 'silent' })

// ============================================
// Express App
// ============================================
const app = express()
app.use(express.json())

/** GET /status */
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    service: 'Baileys WhatsApp Bridge v2.0',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString(),
  })
})

/** GET /qr — tampilkan QR code sebagai HTML */
app.get('/qr', async (req, res) => {
  if (connectionStatus === 'connected') {
    return res.send(`
      <html><body style="font-family:sans-serif;padding:40px;text-align:center;background:#0f172a;color:#fff">
        <div style="font-size:64px">✅</div>
        <h2 style="color:#4ade80">WhatsApp Terhubung!</h2>
        <p style="color:#94a3b8">Bridge aktif dan siap menerima pesan.</p>
      </body></html>
    `)
  }

  if (!lastQrString) {
    return res.send(`
      <html><head><title>WhatsApp QR</title></head>
      <body style="font-family:sans-serif;padding:40px;text-align:center;background:#0f172a;color:#fff">
        <div style="font-size:64px">⏳</div>
        <h2>Menunggu QR Code...</h2>
        <p style="color:#94a3b8">Bridge sedang menghubungkan ke WhatsApp.<br>Halaman ini akan otomatis refresh.</p>
        <script>setTimeout(()=>location.reload(), 3000)</script>
      </body></html>
    `)
  }

  try {
    const qrDataUrl = await qrcode.toDataURL(lastQrString, { width: 400, margin: 2 })
    res.send(`
      <html>
      <head>
        <title>Scan QR WhatsApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family:sans-serif;padding:20px;text-align:center;background:#0f172a;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:48px">📱</div>
        <h2 style="margin:12px 0">Scan QR Code dengan WhatsApp</h2>
        <img src="${qrDataUrl}" style="border:8px solid white;border-radius:16px;margin:16px auto;display:block;max-width:320px" />
        <p style="color:#94a3b8;margin:8px 0">Buka WhatsApp → Titik Tiga → Perangkat Tertaut → Tautkan Perangkat</p>
        <p style="color:#64748b;font-size:12px">QR code diperbarui tiap 20 detik. <a href="/qr" style="color:#60a5fa">Refresh manual</a></p>
        <script>setTimeout(()=>location.reload(), 20000)</script>
      </body></html>
    `)
  } catch (e) {
    res.status(500).send('Gagal render QR: ' + e.message)
  }
})

/** POST /send — kirim pesan ke nomor tertentu */
app.post('/send', async (req, res) => {
  const { to, message } = req.body
  if (!to || !message) {
    return res.status(400).json({ error: '"to" dan "message" wajib diisi.' })
  }
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp belum terkoneksi.' })
  }
  try {
    // Format nomor: pastikan berakhir dengan @s.whatsapp.net
    const jid = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`
    await sock.sendMessage(jid, { text: message })
    console.log(`📤 Pesan terkirim ke ${jid}`)
    return res.json({ status: 'sent', to: jid })
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message)
    return res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n🌉 Baileys Bridge HTTP listening on port ${PORT}`)
  console.log(`🔗 Buka URL ini di browser untuk scan QR:\n   https://<your-render-url>/qr\n`)
})

// ============================================
// Baileys WhatsApp Connection
// ============================================
async function startWhatsApp() {
  console.log('📱 Memulai Baileys WhatsApp Bridge...')
  console.log(`🌐 Backend API: ${BACKEND_URL}`)
  console.log(`🏢 Business ID: ${BUSINESS_ID || '(belum diset di env)'}`)

  connectionStatus = 'connecting'

  // Load atau buat session baru
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  // Cek versi Baileys terbaru
  const { version } = await fetchLatestBaileysVersion()
  console.log(`📦 Baileys version: ${version.join('.')}`)

  sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: true, // Juga print ke log terminal sebagai fallback
    browser: ['Baileys Bridge', 'Chrome', '125.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 1000,
    maxRetries: 5,
  })

  // Simpan credentials setiap kali ada update
  sock.ev.on('creds.update', saveCreds)

  // Handle koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // QR code tersedia → tampilkan
    if (qr) {
      lastQrString = qr
      connectionStatus = 'waiting_for_scan'
      console.log('\n📲 QR Code siap! Buka URL /qr di browser untuk scan.')
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log(`🔌 Koneksi terputus. Reconnect: ${shouldReconnect}`)
      connectionStatus = 'disconnected'
      lastQrString = null
      sock = null

      if (shouldReconnect) {
        console.log('♻️ Mencoba reconnect dalam 5 detik...')
        setTimeout(() => startWhatsApp(), 5000)
      } else {
        console.log('🚪 Logged out dari WhatsApp. Hapus folder session untuk login ulang.')
        connectionStatus = 'logged_out'
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected'
      lastQrString = null
      console.log('✅ WhatsApp berhasil terkoneksi!')
      console.log(`📱 Nomor: ${sock.user?.id}`)
    }
  })

  // Handle pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Skip pesan dari diri sendiri dan grup
      if (msg.key.fromMe) continue
      if (msg.key.remoteJid?.endsWith('@g.us')) continue
      if (!msg.message) continue

      const from = msg.key.remoteJid
      const senderName =
        msg.pushName ||
        msg.key.participant?.split('@')[0] ||
        from?.split('@')[0] ||
        'Unknown'

      // Ekstrak teks pesan
      const msgContent = msg.message
      const text =
        msgContent.conversation ||
        msgContent.extendedTextMessage?.text ||
        msgContent.imageMessage?.caption ||
        msgContent.videoMessage?.caption ||
        ''

      if (!text) continue

      console.log(`📩 Dari ${senderName} (${from}): "${text.substring(0, 60)}"`)

      try {
        // Kirim ke backend untuk diproses AI
        const payload = {
          from,
          message: text,
          senderName,
          businessId: BUSINESS_ID,
        }

        const response = await axios.post(`${BACKEND_URL}/api/webhook/message`, payload, {
          timeout: 30000,
        })

        // Jika ada auto-reply dari AI, kirim balik
        if (response.data.autoReply && response.data.reply) {
          const replyText = response.data.reply

          // Simulasi typing delay agar terasa natural
          const typingDelay = Math.min(replyText.length * 25, 3000)
          await new Promise((r) => setTimeout(r, typingDelay))

          await sock.sendMessage(from, { text: replyText })
          console.log(`🤖 AI reply terkirim ke ${from}`)
        }
      } catch (err) {
        console.error('❌ Error proses pesan:', err.message)
      }
    }
  })

  console.log('👂 Mendengarkan pesan masuk...\n')
}

// Start
startWhatsApp().catch((err) => {
  console.error('💥 Bridge gagal start:', err.message)
  connectionStatus = 'error'
  // Retry setelah 15 detik
  setTimeout(() => startWhatsApp(), 15000)
})

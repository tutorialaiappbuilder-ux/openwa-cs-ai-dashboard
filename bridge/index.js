/**
 * WhatsApp Bridge — Baileys Edition v2.0
 *
 * Menggunakan @whiskeysockets/baileys (WebSocket langsung ke WhatsApp)
 * TANPA Puppeteer/Chrome — jauh lebih ringan dan stabil.
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
let connectionStatus = 'disconnected'

// ============================================
// Express App — start DULU sebelum WA
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
  console.log(`🔗 Buka http://localhost:${PORT}/qr di browser untuk scan QR\n`)
})

// ============================================
// Baileys WhatsApp Connection
// ============================================
async function startWhatsApp() {
  console.log('📱 Memulai Baileys WhatsApp Bridge...')
  console.log(`🌐 Backend API: ${BACKEND_URL}`)
  console.log(`🏢 Business ID: ${BUSINESS_ID || '(belum diset di env)'}`)

  connectionStatus = 'connecting'

  // Import Baileys secara dynamic (kompatibel ESM & CJS)
  const baileys = await import('@whiskeysockets/baileys')
  const makeWASocket = baileys.default
  const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = baileys

  // Load atau buat session baru
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  // Cek versi Baileys terbaru
  const { version } = await fetchLatestBaileysVersion()
  console.log(`📦 Baileys version: ${version.join('.')}`)

  // Buat koneksi WA
  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ['Baileys Bridge', 'Chrome', '125.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 1000,
    maxRetries: 5,
    logger: {
      level: 'silent',
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (msg) => console.log('⚠️', msg),
      error: (msg) => console.error('❌', msg),
      child: () => ({ level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, child: () => {} }),
    },
  })

  // Simpan credentials setiap kali ada update
  sock.ev.on('creds.update', saveCreds)

  // Handle koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      lastQrString = qr
      connectionStatus = 'waiting_for_scan'
      console.log('\n📲 QR Code siap! Buka http://localhost:' + PORT + '/qr di browser.')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log(`🔌 Koneksi terputus (${statusCode}). Reconnect: ${shouldReconnect}`)
      connectionStatus = 'disconnected'
      lastQrString = null
      sock = null

      if (shouldReconnect) {
        console.log('♻️ Reconnect dalam 5 detik...')
        setTimeout(() => startWhatsApp(), 5000)
      } else {
        console.log('🚪 Logged out. Hapus folder ./session untuk login ulang.')
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
      if (msg.key.fromMe) continue
      if (msg.key.remoteJid?.endsWith('@g.us')) continue
      if (!msg.message) continue

      const from = msg.key.remoteJid
      const senderName = msg.pushName || from?.split('@')[0] || 'Unknown'
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
        const payload = { from, message: text, senderName, businessId: BUSINESS_ID }
        const response = await axios.post(`${BACKEND_URL}/api/webhook/message`, payload, {
          timeout: 30000,
        })

        if (response.data.autoReply && response.data.reply) {
          const replyText = response.data.reply
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
  setTimeout(() => startWhatsApp(), 15000)
})

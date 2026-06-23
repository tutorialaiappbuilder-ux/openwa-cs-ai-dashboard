import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import webhookRoutes from './routes/webhook.js'
import conversationRoutes from './routes/conversations.js'
import businessRoutes from './routes/business.js'
import storeDataRoutes from './routes/store-data.js'
import knowledgeBaseRoutes from './routes/knowledge-base.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

// ============================================
// Middleware
// ============================================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files (fallback ketika R2 tidak dikonfigurasi)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// ============================================
// Routes
// ============================================
app.use('/api/webhook', webhookRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/store-data', storeDataRoutes)
app.use('/api/knowledge-base', knowledgeBaseRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OpenWA CS AI Gateway — Backend API',
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL ? 'configured' : 'not configured',
    gemini: !!process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
    r2: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) ? 'configured' : 'local fallback',
  })
})

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ditemukan.` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔴 Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', details: err.message })
})

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  🤖 OpenWA CS AI Gateway — Backend API      ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  🌐 Server:   http://localhost:${PORT}          ║`)
  console.log(`║  📋 Health:   http://localhost:${PORT}/api/health ║`)
  console.log('║                                              ║')
  console.log(`║  🗄️  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not set'}              ║`)
  console.log(`║  🧠 Gemini:   ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not set'}             ║`)
  console.log(`║  ☁️  R2:       ${process.env.R2_ACCOUNT_ID ? '✅ Configured' : '📁 Local fallback'}        ║`)
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')
})

export default app

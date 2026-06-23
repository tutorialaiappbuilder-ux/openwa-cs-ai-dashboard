import { Router } from 'express'
import { eq, desc } from 'drizzle-orm'
import { requireDb } from '../db/index.js'
import { conversations, messages } from '../db/schema.js'

const router = Router()

/**
 * GET /api/conversations
 * List semua percakapan (dengan pesan terakhir)
 */
router.get('/', async (req, res) => {
  try {
    const db = requireDb()

    const allConversations = await db.select().from(conversations)
      .orderBy(desc(conversations.lastMessageAt))

    // Untuk setiap conversation, ambil pesan terakhir
    const result = await Promise.all(
      allConversations.map(async (conv) => {
        const [lastMessage] = await db.select().from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.sentAt))
          .limit(1)

        const unreadCount = 0 // TODO: implement read tracking

        return {
          ...conv,
          lastMessage: lastMessage || null,
          unreadCount,
        }
      })
    )

    return res.json(result)
  } catch (err) {
    console.error('❌ GET /conversations error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/conversations/:id/messages
 * Ambil semua pesan dalam satu percakapan
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params

    const allMessages = await db.select().from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.sentAt)

    return res.json(allMessages)
  } catch (err) {
    console.error('❌ GET /conversations/:id/messages error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/conversations/:id/takeover
 * Toggle takeover mode untuk satu percakapan
 */
router.post('/:id/takeover', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params

    const [conv] = await db.select().from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)

    if (!conv) return res.status(404).json({ error: 'Conversation tidak ditemukan.' })

    const [updated] = await db.update(conversations)
      .set({ takeover: !conv.takeover })
      .where(eq(conversations.id, id))
      .returning()

    return res.json(updated)
  } catch (err) {
    console.error('❌ POST /takeover error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/conversations/:id/reply
 * Admin mengirim balasan manual
 */
router.post('/:id/reply', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params
    const { content } = req.body

    if (!content) return res.status(400).json({ error: 'Content wajib diisi.' })

    const [conv] = await db.select().from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)

    if (!conv) return res.status(404).json({ error: 'Conversation tidak ditemukan.' })

    // Simpan pesan admin
    const [msg] = await db.insert(messages).values({
      conversationId: id,
      role: 'admin',
      content,
    }).returning()

    // Update timestamp
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id))

    // TODO: Kirim via OpenWA bridge ke WhatsApp pelanggan
    return res.json({ status: 'sent', message: msg })
  } catch (err) {
    console.error('❌ POST /reply error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router

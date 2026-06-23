import { Router } from 'express'
import { eq, desc } from 'drizzle-orm'
import { requireDb } from '../db/index.js'
import { businesses, storeData, knowledgeBase, conversations, messages } from '../db/schema.js'
import { generateReply, formatStoreContext, formatKnowledgeContext } from '../services/gemini.js'
import axios from 'axios'

const router = Router()

/**
 * POST /api/webhook/message
 *
 * Menerima pesan masuk dari OpenWA Bridge.
 * Payload: { from, message, senderName, mediaUrl, businessId }
 */
router.post('/message', async (req, res) => {
  const { from, message, senderName, mediaUrl, businessId } = req.body

  if (!from || !message) {
    return res.status(400).json({ error: 'Field "from" dan "message" wajib diisi.' })
  }

  try {
    const db = requireDb()
    const bId = businessId || process.env.DEFAULT_BUSINESS_ID

    if (!bId) {
      return res.status(400).json({ error: 'businessId tidak ditemukan. Set DEFAULT_BUSINESS_ID di .env' })
    }

    // 1. Ambil data bisnis
    const [business] = await db.select().from(businesses).where(eq(businesses.id, bId)).limit(1)
    if (!business) {
      return res.status(404).json({ error: 'Bisnis tidak ditemukan.' })
    }

    // 2. Cari atau buat conversation
    let [conv] = await db.select().from(conversations)
      .where(eq(conversations.customerWaNumber, from))
      .limit(1)

    if (!conv) {
      const [newConv] = await db.insert(conversations).values({
        businessId: bId,
        customerWaNumber: from,
        customerName: senderName || from,
      }).returning()
      conv = newConv
    } else {
      // Update last_message_at
      await db.update(conversations)
        .set({ lastMessageAt: new Date(), customerName: senderName || conv.customerName })
        .where(eq(conversations.id, conv.id))
    }

    // 3. Simpan pesan masuk
    await db.insert(messages).values({
      conversationId: conv.id,
      role: 'user',
      content: message,
      mediaR2Key: mediaUrl || null,
    })

    // 4. Cek apakah bot aktif dan bukan takeover
    if (!business.isActive || conv.takeover) {
      console.log(`⏸️  Bot nonaktif atau takeover untuk ${from}. Tidak mengirim balasan otomatis.`)
      return res.json({ status: 'received', autoReply: false })
    }

    // 5. Ambil konteks toko
    const storeDataRows = await db.select().from(storeData)
      .where(eq(storeData.businessId, bId))

    // 6. Ambil knowledge base
    const kbRows = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.businessId, bId))

    // 7. Ambil riwayat chat (max 20 pesan terakhir)
    const chatHistory = await db.select().from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.sentAt))
      .limit(20)

    // Reverse untuk kronologis (oldest first)
    chatHistory.reverse()

    // 8. Generate AI reply
    const aiReply = await generateReply({
      systemInstruction: business.systemInstruction || '',
      storeContext: formatStoreContext(storeDataRows),
      knowledgeContext: formatKnowledgeContext(kbRows),
      chatHistory: chatHistory.map(m => ({ role: m.role, content: m.content })),
      userMessage: message,
      mediaDescription: mediaUrl ? 'Pelanggan mengirim file/gambar' : undefined,
    })

    // 9. Simpan balasan AI
    await db.insert(messages).values({
      conversationId: conv.id,
      role: 'assistant',
      content: aiReply,
    })

    // Update last_message_at
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conv.id))

    // 10. Kirim balasan ke OpenWA Bridge via callback
    // Bridge akan mengirim ke WhatsApp
    return res.json({
      status: 'replied',
      autoReply: true,
      reply: aiReply,
      to: from,
    })

  } catch (err) {
    console.error('❌ Webhook error:', err)
    return res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

export default router

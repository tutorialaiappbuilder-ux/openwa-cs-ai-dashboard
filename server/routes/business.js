import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { requireDb } from '../db/index.js'
import { businesses } from '../db/schema.js'

const router = Router()

/**
 * GET /api/business
 * Ambil profil bisnis aktif (menggunakan DEFAULT_BUSINESS_ID)
 */
router.get('/', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID

    if (!bId) {
      return res.status(400).json({ error: 'DEFAULT_BUSINESS_ID belum diset di .env' })
    }

    const [business] = await db.select().from(businesses).where(eq(businesses.id, bId)).limit(1)

    if (!business) {
      return res.status(404).json({ error: 'Bisnis tidak ditemukan.' })
    }

    return res.json(business)
  } catch (err) {
    console.error('❌ GET /business error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * PUT /api/business
 * Update profil bisnis (nama, system instruction, dsb)
 */
router.put('/', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID
    const { name, waNumber, systemInstruction, isActive } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (waNumber !== undefined) updateData.waNumber = waNumber
    if (systemInstruction !== undefined) updateData.systemInstruction = systemInstruction
    if (isActive !== undefined) updateData.isActive = isActive

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah.' })
    }

    const [updated] = await db.update(businesses)
      .set(updateData)
      .where(eq(businesses.id, bId))
      .returning()

    return res.json(updated)
  } catch (err) {
    console.error('❌ PUT /business error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * PUT /api/business/toggle-bot
 * Toggle status bot aktif/nonaktif
 */
router.put('/toggle-bot', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID

    const [business] = await db.select().from(businesses).where(eq(businesses.id, bId)).limit(1)

    if (!business) {
      return res.status(404).json({ error: 'Bisnis tidak ditemukan.' })
    }

    const [updated] = await db.update(businesses)
      .set({ isActive: !business.isActive })
      .where(eq(businesses.id, bId))
      .returning()

    return res.json({ isActive: updated.isActive })
  } catch (err) {
    console.error('❌ PUT /toggle-bot error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router

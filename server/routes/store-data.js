import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { requireDb } from '../db/index.js'
import { storeData } from '../db/schema.js'

const router = Router()

/**
 * GET /api/store-data
 * Ambil semua data toko (menu, promo, jam operasional)
 * Opsional: ?category=menu untuk filter
 */
router.get('/', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID
    const { category } = req.query

    let query = db.select().from(storeData)
      .where(eq(storeData.businessId, bId))

    const rows = await query

    // Filter by category jika ada
    let filtered = rows
    if (category) {
      filtered = rows.filter((r) => r.category === category)
    }

    // Parse JSON content
    const result = filtered.map((row) => ({
      ...row,
      content: JSON.parse(row.content),
    }))

    return res.json(result)
  } catch (err) {
    console.error('❌ GET /store-data error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/store-data
 * Tambah item baru (menu/promo/jam_operasional)
 */
router.post('/', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID
    const { category, content } = req.body

    if (!category || !content) {
      return res.status(400).json({ error: 'Field "category" dan "content" wajib diisi.' })
    }

    const [created] = await db.insert(storeData).values({
      businessId: bId,
      category,
      content: typeof content === 'string' ? content : JSON.stringify(content),
    }).returning()

    return res.status(201).json({
      ...created,
      content: JSON.parse(created.content),
    })
  } catch (err) {
    console.error('❌ POST /store-data error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * PUT /api/store-data/:id
 * Update item toko
 */
router.put('/:id', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params
    const { category, content } = req.body

    const updateData = { updatedAt: new Date() }
    if (category !== undefined) updateData.category = category
    if (content !== undefined) {
      updateData.content = typeof content === 'string' ? content : JSON.stringify(content)
    }

    const [updated] = await db.update(storeData)
      .set(updateData)
      .where(eq(storeData.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Item tidak ditemukan.' })
    }

    return res.json({
      ...updated,
      content: JSON.parse(updated.content),
    })
  } catch (err) {
    console.error('❌ PUT /store-data/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /api/store-data/:id
 * Hapus item toko
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params

    const [deleted] = await db.delete(storeData)
      .where(eq(storeData.id, id))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Item tidak ditemukan.' })
    }

    return res.json({ status: 'deleted', id })
  } catch (err) {
    console.error('❌ DELETE /store-data/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router

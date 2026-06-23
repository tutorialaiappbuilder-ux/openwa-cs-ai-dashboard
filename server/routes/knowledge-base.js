import { Router } from 'express'
import { eq } from 'drizzle-orm'
import multer from 'multer'
import { requireDb } from '../db/index.js'
import { knowledgeBase } from '../db/schema.js'
import { uploadFile, deleteFile } from '../services/r2.js'
import { extractText } from '../services/text-extractor.js'

const router = Router()

// Multer config — simpan di memory (buffer) untuk proses langsung
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format file tidak didukung. Hanya PDF, DOCX, dan TXT.'))
    }
  },
})

/**
 * GET /api/knowledge-base
 * List semua dokumen
 */
router.get('/', async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID

    const docs = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.businessId, bId))

    return res.json(docs)
  } catch (err) {
    console.error('❌ GET /knowledge-base error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/knowledge-base/:id
 * Detail satu dokumen (termasuk content_text)
 */
router.get('/:id', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params

    const [doc] = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.id, id))
      .limit(1)

    if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan.' })

    return res.json(doc)
  } catch (err) {
    console.error('❌ GET /knowledge-base/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/knowledge-base/upload
 * Upload file baru → simpan ke R2/lokal → ekstrak teks → simpan ke DB
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const db = requireDb()
    const bId = process.env.DEFAULT_BUSINESS_ID

    if (!req.file) {
      return res.status(400).json({ error: 'File wajib diunggah.' })
    }

    const { originalname, buffer, mimetype } = req.file
    const ext = originalname.split('.').pop().toLowerCase()

    // 1. Upload ke R2 / lokal
    const r2Key = `kb/${Date.now()}_${originalname}`
    await uploadFile(buffer, r2Key, mimetype)
    console.log(`📤 File diunggah: ${r2Key}`)

    // 2. Ekstrak teks
    const contentText = await extractText(buffer, ext)
    console.log(`📝 Teks diekstrak: ${contentText.length} karakter dari ${originalname}`)

    // 3. Simpan metadata ke DB
    const [doc] = await db.insert(knowledgeBase).values({
      businessId: bId,
      fileName: originalname,
      fileType: ext,
      r2Key,
      contentText,
    }).returning()

    return res.status(201).json(doc)
  } catch (err) {
    console.error('❌ POST /upload error:', err)

    // Handle multer errors
    if (err.message && err.message.includes('Format file')) {
      return res.status(400).json({ error: err.message })
    }

    return res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /api/knowledge-base/:id
 * Hapus dokumen dari R2 dan DB
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = requireDb()
    const { id } = req.params

    // Ambil data dulu untuk key R2
    const [doc] = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.id, id))
      .limit(1)

    if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan.' })

    // Hapus file dari R2/lokal
    if (doc.r2Key) {
      try {
        await deleteFile(doc.r2Key)
        console.log(`🗑️  File dihapus dari storage: ${doc.r2Key}`)
      } catch (e) {
        console.warn('⚠️  Gagal hapus file dari storage:', e.message)
      }
    }

    // Hapus dari DB
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id))

    return res.json({ status: 'deleted', id })
  } catch (err) {
    console.error('❌ DELETE /knowledge-base/:id error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router

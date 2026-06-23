import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI = null
let model = null

/**
 * Inisialisasi Gemini client (lazy)
 */
function getModel() {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY belum diset. Dapatkan di https://aistudio.google.com/apikey'
      )
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }
  return model
}

/**
 * Generate AI reply berdasarkan konteks lengkap
 *
 * @param {Object} params
 * @param {string} params.systemInstruction — System prompt bisnis
 * @param {string} params.storeContext     — Data toko (menu, promo, jam) dalam teks
 * @param {string} params.knowledgeContext — Knowledge base gabungan
 * @param {Array}  params.chatHistory      — Riwayat pesan [{role, content}]
 * @param {string} params.userMessage      — Pesan terbaru dari pelanggan
 * @param {string} [params.mediaDescription] — Deskripsi media jika ada attachment
 * @returns {Promise<string>} — Balasan AI
 */
export async function generateReply({
  systemInstruction,
  storeContext,
  knowledgeContext,
  chatHistory,
  userMessage,
  mediaDescription,
}) {
  const m = getModel()

  // Bangun system prompt gabungan
  const fullSystemPrompt = [
    '=== SYSTEM INSTRUCTION ===',
    systemInstruction,
    '',
    '=== DATA TOKO ===',
    storeContext || '(Tidak ada data toko yang tersedia)',
    '',
    '=== KNOWLEDGE BASE ===',
    knowledgeContext || '(Tidak ada knowledge base yang diunggah)',
    '',
    '=== ATURAN PENTING ===',
    '- Jawab dalam bahasa Indonesia sesuai instruksi di atas.',
    '- Jangan pernah mengungkapkan bahwa dirimu adalah bot, kecuali ditanya langsung.',
    '- Jangan memberikan informasi di luar data toko dan knowledge base.',
    '- Jika pertanyaan tidak jelas, minta klarifikasi.',
    '- Berikan CTA yang relevan di akhir respons jika memungkinkan.',
    '- Untuk pesan emoji/stiker saja, balas singkat saja.',
  ].join('\n')

  // Bangun chat history untuk konteks
  const formattedHistory = chatHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  // Pesan user terbaru
  let currentMessage = userMessage
  if (mediaDescription) {
    currentMessage += `\n\n[Pelanggan mengirim file/media: ${mediaDescription}]`
  }

  try {
    const chat = m.startChat({
      history: [
        // Inject system prompt sebagai pesan pertama
        { role: 'user', parts: [{ text: 'Kamu harus mengikuti instruksi berikut:\n\n' + fullSystemPrompt }] },
        { role: 'model', parts: [{ text: 'Baik, saya memahami semua instruksi tersebut dan siap menjadi CS AI sesuai panduan yang diberikan.' }] },
        // Riwayat chat sebelumnya
        ...formattedHistory,
      ],
    })

    const result = await chat.sendMessage(currentMessage)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message)

    // Fallback jika API error
    if (error.message.includes('API_KEY')) {
      throw new Error('GEMINI_API_KEY tidak valid. Periksa kembali API key Anda.')
    }

    return 'Mohon maaf Kak, saat ini sistem kami sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat ya. 🙏'
  }
}

/**
 * Format data toko menjadi teks konteks untuk Gemini
 */
export function formatStoreContext(storeDataRows) {
  if (!storeDataRows || storeDataRows.length === 0) return ''

  const sections = { menu: [], promo: [], jam_operasional: [] }

  for (const row of storeDataRows) {
    const data = JSON.parse(row.content)
    if (row.category === 'menu') {
      sections.menu.push(`- ${data.name}: Rp ${Number(data.price).toLocaleString('id-ID')} (${data.category})`)
    } else if (row.category === 'promo') {
      sections.promo.push(`- Kode: ${data.code} — ${data.desc}`)
    } else if (row.category === 'jam_operasional') {
      sections.jam_operasional.push(`Senin-Jumat: ${data.weekday}\nSabtu-Minggu: ${data.weekend}`)
    }
  }

  const parts = []
  if (sections.menu.length) parts.push('MENU:\n' + sections.menu.join('\n'))
  if (sections.promo.length) parts.push('PROMO AKTIF:\n' + sections.promo.join('\n'))
  if (sections.jam_operasional.length) parts.push('JAM OPERASIONAL:\n' + sections.jam_operasional.join('\n'))

  return parts.join('\n\n')
}

/**
 * Format knowledge base menjadi teks konteks untuk Gemini
 */
export function formatKnowledgeContext(kbRows) {
  if (!kbRows || kbRows.length === 0) return ''

  return kbRows
    .filter((row) => row.contentText)
    .map((row) => `--- Dokumen: ${row.fileName} ---\n${row.contentText}`)
    .join('\n\n')
}

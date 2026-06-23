import pdf from 'pdf-parse/lib/pdf-parse.js'
import mammoth from 'mammoth'

/**
 * Ekstrak teks dari buffer file berdasarkan tipe
 *
 * @param {Buffer} buffer — Isi file
 * @param {string} fileType — Ekstensi: 'pdf', 'docx', 'txt'
 * @returns {Promise<string>} — Teks yang diekstrak
 */
export async function extractText(buffer, fileType) {
  const type = fileType.toLowerCase().replace('.', '')

  switch (type) {
    case 'txt': {
      return buffer.toString('utf-8')
    }

    case 'pdf': {
      try {
        const data = await pdf(buffer)
        return data.text || ''
      } catch (err) {
        console.error('⚠️  Gagal parsing PDF:', err.message)
        return '[Gagal mengekstrak teks dari PDF]'
      }
    }

    case 'docx': {
      try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value || ''
      } catch (err) {
        console.error('⚠️  Gagal parsing DOCX:', err.message)
        return '[Gagal mengekstrak teks dari DOCX]'
      }
    }

    default:
      return `[Format .${type} tidak didukung untuk ekstraksi teks]`
  }
}

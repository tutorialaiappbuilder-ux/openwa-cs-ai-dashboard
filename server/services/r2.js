import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

// Cek apakah R2 dikonfigurasi
const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
)

let s3Client = null

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
  console.log('☁️  Cloudflare R2 terkonfigurasi.')
} else {
  // Buat folder uploads lokal sebagai fallback
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  console.log('📁 R2 belum dikonfigurasi. Menggunakan penyimpanan lokal: /uploads')
}

/**
 * Upload file ke R2 atau fallback ke lokal
 * @param {Buffer} buffer - Isi file
 * @param {string} key - Path/nama file (contoh: 'kb/faq.pdf')
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Key atau path lokal
 */
export async function uploadFile(buffer, key, contentType) {
  if (isR2Configured) {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }))
    return key
  } else {
    // Fallback: simpan ke disk lokal
    const filePath = path.join(UPLOADS_DIR, key)
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, buffer)
    return key
  }
}

/**
 * Hapus file dari R2 atau lokal
 * @param {string} key - Path/nama file
 */
export async function deleteFile(key) {
  if (isR2Configured) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }))
  } else {
    const filePath = path.join(UPLOADS_DIR, key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

/**
 * Dapatkan URL file (signed URL untuk R2, path lokal untuk fallback)
 * @param {string} key - Path/nama file
 * @returns {Promise<string>} - URL yang bisa diakses
 */
export async function getFileUrl(key) {
  if (isR2Configured) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  } else {
    // Serve dari express static /uploads
    return `/uploads/${key}`
  }
}

/**
 * Baca isi file dari R2 atau lokal
 * @param {string} key
 * @returns {Promise<Buffer>}
 */
export async function readFile(key) {
  if (isR2Configured) {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }))
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } else {
    const filePath = path.join(UPLOADS_DIR, key)
    return fs.readFileSync(filePath)
  }
}

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema.js'

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL belum diset. Jalankan tanpa koneksi database.')
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export const db = sql ? drizzle(sql, { schema }) : null

/**
 * Helper: pastikan database terhubung sebelum operasi
 */
export function requireDb() {
  if (!db) {
    throw new Error(
      'Database belum terkonfigurasi. Pastikan DATABASE_URL sudah diset di file .env\n' +
      'Lihat .env.example untuk contoh konfigurasi.'
    )
  }
  return db
}

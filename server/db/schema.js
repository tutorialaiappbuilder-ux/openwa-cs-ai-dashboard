import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'

// ============================================
// Tabel: businesses
// Menyimpan data profil bisnis pengguna sistem
// ============================================
export const businesses = pgTable('businesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  waNumber: varchar('wa_number', { length: 50 }).notNull(),
  systemInstruction: text('system_instruction').default(''),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// Tabel: store_data
// Menyimpan informasi operasional toko
// Kategori: "menu", "promo", "jam_operasional"
// ============================================
export const storeData = pgTable('store_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull(),
  content: text('content').notNull(), // JSON string of the data
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// Tabel: knowledge_base
// Menyimpan dokumen referensi yang diunggah admin
// ============================================
export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 20 }).notNull(),
  r2Key: varchar('r2_key', { length: 1000 }),
  contentText: text('content_text').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// Tabel: conversations
// Menyimpan sesi percakapan per pelanggan
// ============================================
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  customerWaNumber: varchar('customer_wa_number', { length: 50 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).default(''),
  takeover: boolean('takeover').default(false).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// Tabel: messages
// Menyimpan setiap pesan dalam sebuah percakapan
// ============================================
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'admin'
  content: text('content').notNull(),
  mediaR2Key: varchar('media_r2_key', { length: 1000 }),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
})

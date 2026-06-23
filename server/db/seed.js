import 'dotenv/config'
import { requireDb } from './index.js'
import { businesses, storeData, knowledgeBase, conversations, messages } from './schema.js'

const defaultSystemInstruction = `Kamu adalah CS AI dari AiAppBuilder Store. Jawablah pelanggan dengan ramah, santai, sopan, dan gunakan bahasa Indonesia informal yang bersahabat (misalnya menggunakan panggilan 'Kak' dan emoji sesekali). Berikan informasi yang ringkas dan padat. Jika ditanya soal menu, harga, jam operasional, atau promo, pastikan merujuk pada Data Toko yang disediakan. Jangan mengarang informasi di luar data toko.`

async function seed() {
  console.log('🌱 Seeding database...\n')

  const db = requireDb()

  // 1. Buat bisnis
  const [business] = await db.insert(businesses).values({
    name: 'AiAppBuilder Store',
    waNumber: '+6281234567890',
    systemInstruction: defaultSystemInstruction,
    isActive: true,
  }).returning()

  console.log(`✅ Bisnis: ${business.name} (ID: ${business.id})`)

  // 2. Data toko — Menu
  const menuItems = [
    { name: 'Nasi Goreng Premium', price: 25000, category: 'Makanan' },
    { name: 'Ayam Geprek Sambal Korek', price: 18000, category: 'Makanan' },
    { name: 'Es Teh Manis Jumbo', price: 6000, category: 'Minuman' },
    { name: 'Kopi Susu Gula Aren', price: 15000, category: 'Minuman' },
  ]

  for (const item of menuItems) {
    await db.insert(storeData).values({
      businessId: business.id,
      category: 'menu',
      content: JSON.stringify(item),
    })
  }
  console.log(`✅ ${menuItems.length} menu items ditambahkan`)

  // 3. Data toko — Promo
  const promos = [
    { code: 'PROMOHEMAT', desc: 'Diskon 10% minimal pembelian Rp 50.000' },
    { code: 'GRATISONGKIR', desc: 'Gratis ongkir radius 3km dengan minimal order Rp 40.000' },
  ]

  for (const promo of promos) {
    await db.insert(storeData).values({
      businessId: business.id,
      category: 'promo',
      content: JSON.stringify(promo),
    })
  }
  console.log(`✅ ${promos.length} promos ditambahkan`)

  // 4. Data toko — Jam Operasional
  await db.insert(storeData).values({
    businessId: business.id,
    category: 'jam_operasional',
    content: JSON.stringify({
      weekday: '09:00 - 21:00 WIB',
      weekend: '10:00 - 22:00 WIB',
    }),
  })
  console.log('✅ Jam operasional ditambahkan')

  // 5. Knowledge Base sample
  await db.insert(knowledgeBase).values({
    businessId: business.id,
    fileName: 'FAQ_Toko_2026.txt',
    fileType: 'txt',
    contentText: `FAQ AiAppBuilder Store:

Q: Apakah melayani pengiriman luar kota?
A: Saat ini kami hanya melayani pengiriman dalam radius 10km menggunakan kurir instan.

Q: Bagaimana jika pesanan tidak sesuai?
A: Silakan kirimkan foto struk pemesanan dan produk ke WhatsApp ini. Kami akan mengembalikan dana 100% atau mengirim ulang produk secara gratis.

Q: Apakah menerima pesanan katering?
A: Ya, kami menerima pesanan katering minimal 30 box. Pemesanan harus dilakukan minimal H-2 melalui kontak admin utama.`,
  })
  console.log('✅ Knowledge base sample ditambahkan')

  // 6. Contoh percakapan
  const [conv] = await db.insert(conversations).values({
    businessId: business.id,
    customerWaNumber: '+6281299887766',
    customerName: 'Budi Santoso',
  }).returning()

  await db.insert(messages).values([
    {
      conversationId: conv.id,
      role: 'user',
      content: 'Apakah menu Nasi Goreng Premium ready Kak? Dan apakah ada diskon hari ini?',
    },
    {
      conversationId: conv.id,
      role: 'assistant',
      content: 'Halo Kak Budi! Nasi Goreng Premium kami selalu ready ya. Hari ini ada promo menarik lho! Kakak bisa pakai kode promo *PROMOHEMAT* untuk diskon 10% minimal pembelian Rp 50.000. Mau dipesankan sekarang?',
    },
  ])
  console.log('✅ Contoh percakapan ditambahkan')

  console.log('\n🎉 Seeding selesai!')
  console.log(`\n📋 DEFAULT_BUSINESS_ID untuk .env:\n   ${business.id}\n`)

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err.message)
  process.exit(1)
})

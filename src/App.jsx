import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import InboxView from './views/InboxView'
import KnowledgeBaseView from './views/KnowledgeBaseView'
import StoreDataView from './views/StoreDataView'
import SettingsView from './views/SettingsView'
import StatsView from './views/StatsView'

// Seed Data
const defaultSystemInstruction = `Kamu adalah CS AI dari AiAppBuilder Store. Jawablah pelanggan dengan ramah, santai, sopan, dan gunakan bahasa Indonesia informal yang bersahabat (misalnya menggunakan panggilan 'Kak' dan emoji sesekali). Berikan informasi yang ringkas dan padat. Jika ditanya soal menu, harga, jam operasional, atau promo, pastikan merujuk pada Data Toko yang disediakan. Jangan mengarang informasi di luar data toko.`

const defaultStoreData = {
  menu: [
    { id: '1', name: 'Nasi Goreng Premium', price: 25000, category: 'Makanan' },
    { id: '2', name: 'Ayam Geprek Sambal Korek', price: 18000, category: 'Makanan' },
    { id: '3', name: 'Es Teh Manis Jumbo', price: 6000, category: 'Minuman' },
    { id: '4', name: 'Kopi Susu Gula Aren', price: 15000, category: 'Minuman' }
  ],
  promos: [
    { id: '1', code: 'PROMOHEMAT', desc: 'Diskon 10% minimal pembelian Rp 50.000' },
    { id: '2', code: 'GRATISONGKIR', desc: 'Gratis ongkir radius 3km dengan minimal order Rp 40.000' }
  ],
  hours: {
    weekday: '09:00 - 21:00 WIB',
    weekend: '10:00 - 22:00 WIB'
  }
}

const defaultKnowledgeBase = [
  {
    id: '1',
    file_name: 'FAQ_Toko_2026.txt',
    file_type: 'txt',
    file_size: '4.2 KB',
    status: 'ready',
    content_text: `FAQ AiAppBuilder Store:\n\nQ: Apakah melayani pengiriman luar kota?\nA: Saat ini kami hanya melayani pengiriman dalam radius 10km menggunakan kurir instan.\n\nQ: Bagaimana jika pesanan tidak sesuai?\nA: Silakan kirimkan foto struk pemesanan dan produk ke WhatsApp ini. Kami akan mengembalikan dana 100% atau mengirim ulang produk secara gratis.\n\nQ: Apakah menerima pesanan katering?\nA: Ya, kami menerima pesanan katering minimal 30 box. Pemesanan harus dilakukan minimal H-2 melalui kontak admin utama.`,
    created_at: '2026-06-20T08:00:00Z'
  },
  {
    id: '2',
    file_name: 'SOP_Kebijakan_Layanan.pdf',
    file_type: 'pdf',
    file_size: '1.2 MB',
    status: 'ready',
    content_text: `SOP Layanan Pelanggan AiAppBuilder Store:\n\n1. Selalu mengutamakan kesopanan dan responsivitas.\n2. Waktu maksimal merespons keluhan adalah 5 menit.\n3. Jika ada indikasi kemarahan/kecewa dari pelanggan, admin CS wajib melakukan Takeover manual segera untuk menangani secara personal.\n4. Promo kupon tidak dapat digabungkan dengan promo katering.`,
    created_at: '2026-06-18T10:15:00Z'
  }
]

const defaultConversations = [
  {
    id: 'c1',
    customer_name: 'Budi Santoso',
    customer_wa_number: '+62 812-9988-7766',
    takeover: false,
    unread: true,
    last_message_at: '2026-06-23T08:35:00+07:00',
    messages: [
      { id: 'm1', role: 'user', content: 'Apakah menu Nasi Goreng Premium ready Kak? Dan apakah ada diskon hari ini?', sent_at: '2026-06-23T08:30:00+07:00' },
      { id: 'm2', role: 'assistant', content: 'Halo Kak Budi! Nasi Goreng Premium kami selalu ready ya. Hari ini ada promo menarik lho! Kakak bisa pakai kode promo *PROMOHEMAT* untuk diskon 10% minimal pembelian Rp 50.000. Mau dipesankan sekarang?', sent_at: '2026-06-23T08:31:00+07:00' },
      { id: 'm3', role: 'user', content: 'Wah menarik! Mau dong pesan 2 porsi Nasi Goreng Premium sama 2 Es Teh Manis Jumbo. Totalnya berapa ya, terus kena promo ga?', sent_at: '2026-06-23T08:35:00+07:00' }
    ]
  },
  {
    id: 'c2',
    customer_name: 'Sarah Amelia',
    customer_wa_number: '+62 899-4455-6677',
    takeover: true,
    unread: true,
    last_message_at: '2026-06-23T08:20:00+07:00',
    messages: [
      { id: 'm4', role: 'user', content: 'Halo Kak, mau nanya pengiriman barang saya.', sent_at: '2026-06-23T08:10:00+07:00' },
      { id: 'm5', role: 'assistant', content: 'Halo Kak Sarah! Boleh diinfokan nomor ordernya biar kami cek ya?', sent_at: '2026-06-23T08:12:00+07:00' },
      { id: 'm6', role: 'user', content: 'Kak, pesanan saya dari jam 1 siang kok belum sampai ya? Ini nomor order #7712.', sent_at: '2026-06-23T08:20:00+07:00' }
    ]
  },
  {
    id: 'c3',
    customer_name: 'Anita Wijaya',
    customer_wa_number: '+62 821-3322-1100',
    takeover: false,
    unread: false,
    last_message_at: '2026-06-23T07:45:00+07:00',
    messages: [
      { id: 'm7', role: 'user', content: 'Menu Kopi Gula Aren harganya berapa ya?', sent_at: '2026-06-23T07:40:00+07:00' },
      { id: 'm8', role: 'assistant', content: 'Halo Kak Anita! Untuk Kopi Susu Gula Aren harganya Rp 15.000 ya Kak.', sent_at: '2026-06-23T07:41:00+07:00' },
      { id: 'm9', role: 'user', content: 'Terima kasih infonya Kak, sangat membantu!', sent_at: '2026-06-23T07:44:00+07:00' },
      { id: 'm10', role: 'assistant', content: 'Sama-sama Kak Anita! Selamat menikmati harinya, kalau ada hal lain yang ingin ditanyakan jangan ragu hubungi kami lagi ya. 😊', sent_at: '2026-06-23T07:45:00+07:00' }
    ]
  },
  {
    id: 'c4',
    customer_name: 'Daffa Pratama',
    customer_wa_number: '+62 857-1111-2222',
    takeover: false,
    unread: true,
    last_message_at: '2026-06-23T08:38:00+07:00',
    messages: [
      { id: 'm11', role: 'user', content: 'Halo, saya sudah transfer ya.', sent_at: '2026-06-23T08:35:00+07:00' },
      { 
        id: 'm12', 
        role: 'user', 
        content: 'Ini bukti transfer saya ya kak, tolong di-proses orderannya.', 
        media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
        sent_at: '2026-06-23T08:38:00+07:00' 
      }
    ]
  }
]

export default function App() {
  // Navigation & Gateway Toggles
  const [activeTab, setActiveTab] = useState('inbox')
  const [botActive, setBotActive] = useState(() => {
    const saved = localStorage.getItem('openwa_bot_active')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [gatewayStatus, setGatewayStatus] = useState('online')

  // Configurations State (loaded from localStorage or Seeded)
  const [systemInstruction, setSystemInstruction] = useState(() => {
    const saved = localStorage.getItem('openwa_system_instruction')
    return saved !== null ? saved : defaultSystemInstruction
  })
  
  const [storeData, setStoreData] = useState(() => {
    const saved = localStorage.getItem('openwa_store_data')
    return saved !== null ? JSON.parse(saved) : defaultStoreData
  })

  const [knowledgeBase, setKnowledgeBase] = useState(() => {
    const saved = localStorage.getItem('openwa_knowledge_base')
    return saved !== null ? JSON.parse(saved) : defaultKnowledgeBase
  })

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('openwa_conversations')
    return saved !== null ? JSON.parse(saved) : defaultConversations
  })

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('openwa_bot_active', JSON.stringify(botActive))
  }, [botActive])

  useEffect(() => {
    localStorage.setItem('openwa_system_instruction', systemInstruction)
  }, [systemInstruction])

  useEffect(() => {
    localStorage.setItem('openwa_store_data', JSON.stringify(storeData))
  }, [storeData])

  useEffect(() => {
    localStorage.setItem('openwa_knowledge_base', JSON.stringify(knowledgeBase))
  }, [knowledgeBase])

  useEffect(() => {
    localStorage.setItem('openwa_conversations', JSON.stringify(conversations))
  }, [conversations])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-dark select-none text-brand-text">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        botActive={botActive} 
        setBotActive={setBotActive}
        gatewayStatus={gatewayStatus}
        setGatewayStatus={setGatewayStatus}
      />

      {/* Main Views Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glow Effect Element behind the content */}
        <div className="absolute inset-0 bg-glow-gradient pointer-events-none z-0" />
        
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {activeTab === 'inbox' && (
            <InboxView 
              conversations={conversations} 
              setConversations={setConversations} 
              storeData={storeData}
              systemInstruction={systemInstruction}
              botActive={botActive}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBaseView 
              knowledgeBase={knowledgeBase} 
              setKnowledgeBase={setKnowledgeBase} 
            />
          )}

          {activeTab === 'store' && (
            <StoreDataView 
              storeData={storeData} 
              setStoreData={setStoreData} 
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              systemInstruction={systemInstruction} 
              setSystemInstruction={setSystemInstruction}
              storeData={storeData}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView />
          )}
        </div>
      </main>
    </div>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import InboxView from './views/InboxView'
import KnowledgeBaseView from './views/KnowledgeBaseView'
import StoreDataView from './views/StoreDataView'
import SettingsView from './views/SettingsView'
import StatsView from './views/StatsView'
import { apiFetch } from './utils/api'

// Helper formatter untuk storeData
const formatStoreData = (backendRows) => {
  const menu = []
  const promos = []
  let hours = { weekday: '09:00 - 21:00 WIB', weekend: '10:00 - 22:00 WIB' }

  backendRows.forEach(row => {
    if (row.category === 'menu') {
      menu.push({
        id: row.id,
        name: row.content.name,
        price: row.content.price,
        category: row.content.category
      })
    } else if (row.category === 'promo') {
      promos.push({
        id: row.id,
        code: row.content.code,
        desc: row.content.desc
      })
    } else if (row.category === 'jam_operasional') {
      hours = {
        id: row.id,
        weekday: row.content.weekday,
        weekend: row.content.weekend
      }
    }
  })

  return { menu, promos, hours }
}

// Helper mapper untuk Knowledge Base
const mapKbDoc = (doc) => ({
  id: doc.id,
  file_name: doc.fileName,
  file_type: doc.fileType,
  file_size: doc.contentText ? `${(doc.contentText.length / 1024).toFixed(1)} KB` : '0 KB',
  status: 'ready',
  content_text: doc.contentText || '',
  created_at: doc.createdAt
})

// Helper mapper untuk Percakapan (Inbox)
const mapConversation = (c) => ({
  id: c.id,
  customer_name: c.customerName || 'No Name',
  customer_wa_number: c.customerWaNumber,
  takeover: c.takeover,
  unread: c.unreadCount > 0,
  last_message_at: c.lastMessageAt,
  messages: c.lastMessage ? [{
    id: c.lastMessage.id,
    role: c.lastMessage.role,
    content: c.lastMessage.content,
    sent_at: c.lastMessage.sentAt
  }] : []
})

export default function App() {
  // Navigation & Gateway Toggles
  const [activeTab, setActiveTab] = useState('inbox')
  const [botActive, setBotActive] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState('offline')
  const [isLoading, setIsLoading] = useState(true)

  // Configurations State (loaded dynamically from database)
  const [systemInstruction, setSystemInstruction] = useState('')
  const [storeData, setStoreData] = useState({ menu: [], promos: [], hours: { weekday: '', weekend: '' } })
  const [knowledgeBase, setKnowledgeBase] = useState([])
  const [conversations, setConversations] = useState([])

  // Fetch Business & Settings
  const fetchBusinessSettings = useCallback(async () => {
    try {
      const business = await apiFetch('/api/business')
      setSystemInstruction(business.systemInstruction || '')
      setBotActive(business.isActive)
    } catch (err) {
      console.error('Failed to fetch business settings:', err.message)
    }
  }, [])

  // Fetch Store Data
  const fetchStoreData = useCallback(async () => {
    try {
      const sData = await apiFetch('/api/store-data')
      setStoreData(formatStoreData(sData))
    } catch (err) {
      console.error('Failed to fetch store data:', err.message)
    }
  }, [])

  // Fetch Knowledge Base
  const fetchKnowledgeBase = useCallback(async () => {
    try {
      const docs = await apiFetch('/api/knowledge-base')
      setKnowledgeBase(docs.map(mapKbDoc))
    } catch (err) {
      console.error('Failed to fetch knowledge base:', err.message)
    }
  }, [])

  // Fetch Conversations (Inbox List)
  const fetchConversationsList = useCallback(async () => {
    try {
      const convs = await apiFetch('/api/conversations')
      setConversations(convs.map(mapConversation))
    } catch (err) {
      console.error('Failed to fetch conversations:', err.message)
    }
  }, [])

  // Fetch Gateway Status from Bridge
  const fetchGatewayStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/business/gateway-status')
      setGatewayStatus(res.status || 'offline')
    } catch (err) {
      setGatewayStatus('offline')
    }
  }, [])

  // Inisialisasi awal aplikasi
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchBusinessSettings(),
        fetchStoreData(),
        fetchKnowledgeBase(),
        fetchConversationsList(),
        fetchGatewayStatus()
      ])
      setIsLoading(false)
    }
    loadAllData()
  }, [fetchBusinessSettings, fetchStoreData, fetchKnowledgeBase, fetchConversationsList, fetchGatewayStatus])

  // Polling berkala (tiap 6 detik) untuk memantau chat baru & status koneksi WhatsApp
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversationsList()
      fetchGatewayStatus()
    }, 6000)

    return () => clearInterval(interval)
  }, [fetchConversationsList, fetchGatewayStatus])

  // Handler Refresh Gateway Manual dari Sidebar
  const handleGatewayRefresh = useCallback(async (state) => {
    if (state === 'refreshing') {
      setGatewayStatus('connecting')
      await fetchGatewayStatus()
    }
  }, [fetchGatewayStatus])

  // Handler toggle bot global
  const handleToggleBot = async () => {
    try {
      const response = await apiFetch('/api/business/toggle-bot', { method: 'PUT' })
      setBotActive(response.isActive)
    } catch (err) {
      console.error('Failed to toggle bot:', err)
    }
  }

  // Handler simpan system prompt dari SettingsView
  const handleSaveSystemInstruction = async (newPrompt) => {
    try {
      const response = await apiFetch('/api/business', {
        method: 'PUT',
        body: JSON.stringify({ systemInstruction: newPrompt })
      })
      setSystemInstruction(response.systemInstruction)
      return true
    } catch (err) {
      console.error('Failed to save system prompt:', err)
      return false
    }
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-dark flex-col gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-whatsapp-teal to-ai-violet flex items-center justify-center shadow-lg animate-bounce">
          <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-brand-muted animate-pulse">Menghubungkan ke Neon PostgreSQL...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-dark select-none text-brand-text">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        botActive={botActive} 
        setBotActive={handleToggleBot}
        gatewayStatus={gatewayStatus}
        setGatewayStatus={handleGatewayRefresh}
      />

      {/* Main Views Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
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
              onRefresh={fetchKnowledgeBase}
            />
          )}

          {activeTab === 'store' && (
            <StoreDataView 
              storeData={storeData} 
              setStoreData={setStoreData}
              onRefresh={fetchStoreData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              systemInstruction={systemInstruction} 
              setSystemInstruction={handleSaveSystemInstruction}
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

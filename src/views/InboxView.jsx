import React, { useState, useEffect, useRef } from 'react'
import { Search, Send, User, Bot, ShieldAlert, Zap, Paperclip, Eye, Ban, CheckCheck, RefreshCw } from 'lucide-react'

export default function InboxView({ conversations, setConversations, storeData, systemInstruction, botActive }) {
  const [activeChatId, setActiveChatId] = useState(conversations[0]?.id || '')
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const messagesEndRef = useRef(null)

  const activeChat = conversations.find(c => c.id === activeChatId)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, isTyping])

  // Get matching mock AI response based on message & settings
  const generateMockAIResponse = (userMsg) => {
    const text = userMsg.toLowerCase()
    const instruction = systemInstruction.toLowerCase()
    
    // Default prefix styling based on instruction tone
    let greeting = "Halo Kak!"
    if (instruction.includes("sopan")) greeting = "Selamat datang di toko kami! Ada yang bisa kami bantu?"
    if (instruction.includes("friend") || instruction.includes("santai")) greeting = "Halo Kak! Ada yang bisa dibantu?"

    // Check promos
    if (text.includes("promo") || text.includes("diskon") || text.includes("potongan")) {
      const activePromos = storeData.promos.map(p => `*${p.code}* (${p.desc})`).join(' atau ')
      return `${greeting} Saat ini kami sedang ada promo aktif nih. Kakak bisa gunakan kode promo ${activePromos}. Silakan dipakai ya Kak! 😊`
    }

    // Check menu
    if (text.includes("menu") || text.includes("makanan") || text.includes("minuman") || text.includes("harga") || text.includes("makan")) {
      const menuList = storeData.menu.map(m => `- *${m.name}*: Rp ${m.price.toLocaleString('id-ID')}`).join('\n')
      return `${greeting} Berikut adalah daftar menu dan harga terupdate kami:\n\n${menuList}\n\nAda yang ingin dipesan sekarang?`
    }

    // Check operating hours
    if (text.includes("jam") || text.includes("buka") || text.includes("operasional") || text.includes("tutup")) {
      return `${greeting} Untuk jam operasional toko kami:\n\n📅 *Senin - Jumat*: ${storeData.hours.weekday}\n📅 *Sabtu - Minggu*: ${storeData.hours.weekend}\n\nKami siap melayani Kakak pada jam tersebut ya!`
    }

    // General FAQ or greeting
    return `${greeting} Terima kasih sudah menghubungi kami. Pesan Kakak sudah kami catat. Ada detail info menu, promo, atau jam operasional yang ingin ditanyakan?`
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !activeChat) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      sent_at: new Date().toISOString()
    }

    const updatedMessages = [...activeChat.messages, userMessage]
    
    // Update local conversations state
    const newConversations = conversations.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: updatedMessages,
          last_message_at: new Date().toISOString()
        }
      }
      return c
    })
    setConversations(newConversations)
    setInputValue('')

    // Trigger AI automatic response if bot is globally active AND takeover is false for this chat
    if (botActive && !activeChat.takeover) {
      setIsTyping(true)
      
      // Simulate WhatsApp "typing..." delay
      setTimeout(() => {
        setIsTyping(false)
        const botReplyText = generateMockAIResponse(userMessage.content)
        const botMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botReplyText,
          sent_at: new Date().toISOString()
        }

        const newConversationsWithBot = conversations.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              messages: [...updatedMessages, botMessage],
              last_message_at: new Date().toISOString()
            }
          }
          return c
        })
        setConversations(newConversationsWithBot)
      }, 2000)
    }
  }

  const toggleTakeover = (chatId) => {
    const newConversations = conversations.map(c => {
      if (c.id === chatId) {
        return { ...c, takeover: !c.takeover }
      }
      return c
    })
    setConversations(newConversations)
  }

  // Filter conversations based on search
  const filteredChats = conversations.filter(c => 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.customer_wa_number.includes(searchQuery)
  )

  return (
    <div className="flex-1 flex overflow-hidden h-screen bg-brand-dark">
      {/* 1. Sidebar - Conversational Inbox List */}
      <div className="w-80 border-r border-brand-border/60 flex flex-col bg-brand-dark/20 h-full shrink-0">
        <div className="p-4 border-b border-brand-border/40">
          <h2 className="text-lg font-bold text-white font-sans mb-3">Percakapan</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari chat atau nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs glass-input font-sans"
            />
          </div>
        </div>

        {/* Chat List Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1]
            const isSelected = chat.id === activeChatId
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-brand-border/80 to-brand-border/30 border border-brand-border/80' 
                    : 'hover:bg-brand-border/20 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center relative shrink-0">
                  <User className="w-5 h-5 text-brand-muted" />
                  {chat.unread && (
                    <span className="w-2.5 h-2.5 bg-whatsapp-green rounded-full absolute -top-0.5 -right-0.5 border-2 border-brand-dark" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-xs font-semibold text-white truncate">{chat.customer_name}</h3>
                    <span className="text-[9px] text-brand-muted shrink-0">
                      {new Date(chat.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-muted truncate mb-1">
                    {lastMsg?.role === 'assistant' ? '🤖 ' : ''}
                    {lastMsg?.content || 'Tidak ada pesan'}
                  </p>
                  
                  {/* Indicators */}
                  <div className="flex gap-1.5 items-center mt-1">
                    {chat.takeover ? (
                      <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20 flex items-center gap-0.5">
                        <ShieldAlert className="w-2 h-2" /> Takeover
                      </span>
                    ) : (
                      <span className="text-[8px] bg-whatsapp-green/10 text-whatsapp-green px-1.5 py-0.5 rounded font-bold border border-whatsapp-green/20 flex items-center gap-0.5">
                        <Zap className="w-2 h-2" /> Bot Active
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div className="flex-1 flex flex-col bg-whatsapp-chatBg h-full border-r border-brand-border/60 relative wa-bg-pattern">
        {activeChat ? (
          <>
            {/* Chat Window Header */}
            <div className="h-16 border-b border-brand-border/40 px-6 flex items-center justify-between glass-panel shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-border/80 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-muted" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">{activeChat.customer_name}</h3>
                  <p className="text-[9px] text-brand-muted">{activeChat.customer_wa_number}</p>
                </div>
              </div>

              {/* Header Handover Toggle */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-white">
                    {activeChat.takeover ? 'Manual Takeover' : 'Automated Bot'}
                  </p>
                  <p className="text-[8px] text-brand-muted">
                    {activeChat.takeover ? 'Bot di-nonaktifkan' : 'Gemini Auto-Reply'}
                  </p>
                </div>
                <button
                  onClick={() => toggleTakeover(activeChat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 ${
                    activeChat.takeover 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-brand-border/60 hover:bg-brand-border text-brand-muted hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {activeChat.takeover ? 'Matikan Takeover' : 'Ambil Alih (Takeover)'}
                </button>
              </div>
            </div>

            {/* Warning Message if Bot is Passive but Takeover is False */}
            {!botActive && !activeChat.takeover && (
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-[10px] z-10">
                <Ban className="w-3.5 h-3.5 shrink-0" />
                <span><strong>Perhatian:</strong> Bot Global dalam keadaan nonaktif. Silakan aktifkan di sidebar atau lakukan takeover manual jika ingin membalas.</span>
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.messages.map((msg) => {
                const isUser = msg.role === 'user'
                const isAI = msg.role === 'assistant'
                const isManual = msg.role === 'admin'
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl p-3.5 relative shadow-md font-sans text-xs leading-relaxed ${
                      isUser
                        ? 'bg-brand-card text-brand-text border border-brand-border/40 rounded-tl-none'
                        : isAI
                        ? 'bg-gradient-to-tr from-ai-indigo/10 to-ai-violet/10 text-white border border-ai-indigo/30 rounded-tr-none'
                        : 'bg-gradient-to-tr from-whatsapp-teal/20 to-whatsapp-green/10 text-white border border-whatsapp-teal/40 rounded-tr-none'
                    }`}>
                      {/* Badge / Avatar Label */}
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] opacity-75 font-semibold">
                        {isUser && <span className="text-brand-muted">Pelanggan</span>}
                        {isAI && (
                          <span className="text-ai-indigo flex items-center gap-0.5">
                            <Bot className="w-2.5 h-2.5" /> CS AI (Gemini 3.1)
                          </span>
                        )}
                        {isManual && (
                          <span className="text-whatsapp-green flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" /> Admin (Manual)
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      <p className="whitespace-pre-line text-brand-text">{msg.content}</p>

                      {/* Display attachment if available */}
                      {msg.media_url && (
                        <div className="mt-2.5 rounded-lg overflow-hidden border border-brand-border/60 bg-brand-dark/50 p-1.5 relative group">
                          <img src={msg.media_url} alt="attachment" className="max-h-48 object-cover rounded w-full" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button className="p-1.5 bg-brand-card rounded-lg hover:text-whatsapp-green">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Time and Status */}
                      <div className="flex justify-end items-center gap-1 mt-1 opacity-60 text-[8px] text-right">
                        <span>
                          {new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!isUser && <CheckCheck className="w-3 h-3 text-whatsapp-green" />}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing Simulator Bubble */}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="max-w-[70%] rounded-2xl p-3.5 bg-gradient-to-tr from-ai-indigo/5 to-ai-violet/5 text-white border border-ai-indigo/20 rounded-tr-none flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-ai-indigo animate-bounce" />
                    <span className="text-[10px] text-brand-muted">CS AI sedang mengetik</span>
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-100" />
                      <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-200" />
                      <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 glass-panel border-t border-brand-border/40 shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <button type="button" className="p-2.5 rounded-xl bg-brand-border/40 hover:bg-brand-border/70 text-brand-muted hover:text-white transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    activeChat.takeover 
                      ? "Ketik balasan manual ke pelanggan..." 
                      : "Bot AI aktif. Silakan mengetik untuk takeover/mengirim pesan manual..."
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs glass-input font-sans focus:border-whatsapp-green"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center text-[9px] text-brand-muted">
                <span>WhatsApp Gateway: Connected</span>
                <span>Press Enter to send</span>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <Bot className="w-16 h-16 text-brand-border mb-3" />
            <h3 className="font-bold text-white text-sm">Tidak ada percakapan aktif</h3>
            <p className="text-xs text-brand-muted max-w-xs mt-1">Pilih salah satu nomor di daftar kiri untuk memantau aktivitas atau mengambil alih chat.</p>
          </div>
        )}
      </div>

      {/* 3. Right Panel - Customer metadata & Quick FAQ info */}
      {activeChat && (
        <div className="w-64 border-l border-brand-border/60 bg-brand-dark/45 h-full flex flex-col shrink-0">
          <div className="p-4 border-b border-brand-border/40">
            <h3 className="text-xs font-bold text-white mb-3">Detail Pelanggan</h3>
            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="text-[10px] text-brand-muted block">Nama</span>
                <span className="font-semibold text-white">{activeChat.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-muted block">Nomor WhatsApp</span>
                <span className="font-semibold text-brand-muted select-text">{activeChat.customer_wa_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-brand-muted block">Terakhir Chat</span>
                <span className="font-semibold text-white">
                  {new Date(activeChat.last_message_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} pukul {new Date(activeChat.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-brand-border/40 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-white mb-2.5">Konteks AI Terpasang</h3>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-brand-card border border-brand-border/40">
                <span className="text-[9px] font-bold text-ai-indigo uppercase block mb-1">System Prompt</span>
                <p className="text-[10px] text-brand-muted line-clamp-3 leading-relaxed">
                  {systemInstruction}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-brand-card border border-brand-border/40">
                <span className="text-[9px] font-bold text-whatsapp-green uppercase block mb-1">Data Toko Aktif</span>
                <div className="text-[10px] text-brand-muted space-y-1">
                  <p>✔ {storeData.menu.length} Menu Makanan/Minuman</p>
                  <p>✔ {storeData.promos.length} Promo Kupon</p>
                  <p>✔ Jam Kerja Terpasang</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Receipt Highlight if in Chat */}
          {activeChat.customer_name === 'Daffa Pratama' && (
            <div className="p-4 border-t border-brand-border/40 bg-brand-border/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-extrabold text-amber-400">🚨 Review Dokumen</h4>
                <span className="text-[8px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded">R2 Uploaded</span>
              </div>
              <div className="p-2 rounded bg-brand-dark/50 border border-brand-border/60 text-[10px] flex items-center justify-between">
                <span className="truncate pr-2">transfer_receipt.jpg</span>
                <button className="text-whatsapp-green font-semibold shrink-0 hover:underline">Verify</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

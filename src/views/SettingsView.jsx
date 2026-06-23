import React, { useState, useRef, useEffect } from 'react'
import { Save, Bot, MessageSquare, Sliders, RefreshCw, Send, Sparkles, Smile, MessageCircle } from 'lucide-react'

export default function SettingsView({ systemInstruction, setSystemInstruction, storeData }) {
  const [instructionInput, setInstructionInput] = useState(systemInstruction)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Playground state
  const [sandboxMessages, setSandboxMessages] = useState([
    { id: '1', role: 'assistant', content: 'Halo! Ini adalah Playground. Ketik apa saja untuk menguji gaya bicara AI dengan System Instruction di sebelah kiri.' }
  ])
  const [playgroundInput, setPlaygroundInput] = useState('')
  const [playgroundTyping, setPlaygroundTyping] = useState(false)

  const sandboxEndRef = useRef(null)

  useEffect(() => {
    sandboxEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sandboxMessages, playgroundTyping])

  const presets = [
    {
      name: 'CS Ramah & Santai (Default)',
      desc: 'Menggunakan panggilan "Kak", santai, bersahabat, dan menggunakan emoji.',
      content: 'Kamu adalah CS AI dari AiAppBuilder Store. Jawablah pelanggan dengan ramah, santai, sopan, dan gunakan bahasa Indonesia informal yang bersahabat (misalnya menggunakan panggilan \'Kak\' dan emoji sesekali). Berikan informasi yang ringkas dan padat. Jika ditanya soal menu, harga, jam operasional, atau promo, pastikan merujuk pada Data Toko yang disediakan. Jangan mengarang informasi di luar data toko.'
    },
    {
      name: 'Sales & Promo Agresif',
      desc: 'Proaktif menawarkan promo dan diskon untuk mempercepat deal/pembelian.',
      content: 'Kamu adalah Sales Marketing AI yang sangat bersemangat. Selalu panggil dengan \'Kakak\'. Fokus utama kamu adalah mendorong pelanggan melakukan transaksi. Di akhir setiap balasan, berikan anjuran untuk menggunakan kupon promo aktif (cek data promo) dan tanya apakah bisa diproses pemesanannya sekarang secara langsung.'
    },
    {
      name: 'Profesional & Formal',
      desc: 'Menggunakan tata bahasa baku, panggilan "Bapak/Ibu", formal dan jelas.',
      content: 'Kamu adalah Customer Service Profesional dari AiAppBuilder Store. Gunakan bahasa Indonesia yang formal, sopan, baku (sesuai PUEBI), serta sapa pelanggan dengan panggilan \'Bapak\' atau \'Ibu\'. Hindari singkatan gaul atau emoji yang berlebihan. Jawab pertanyaan secara langsung, akurat, dan informatif sesuai data toko resmi.'
    }
  ]

  const handleApplyPreset = (presetContent) => {
    setInstructionInput(presetContent)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSystemInstruction(instructionInput)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  // Generate simulated AI reply for the playground
  const generatePlaygroundResponse = (userInput, activeInstruction) => {
    const text = userInput.toLowerCase()
    const inst = activeInstruction.toLowerCase()
    
    let greet = "Halo!"
    if (inst.includes("bapak") || inst.includes("ibu") || inst.includes("formal")) {
      greet = "Selamat siang Bapak/Ibu. Terima kasih telah menghubungi kami. Ada yang bisa kami bantu?"
    } else if (inst.includes("kakak") || inst.includes("sales")) {
      greet = "Halo Kakak! Senang bertemu dengan Anda. Yuk, langsung diorder menu favoritnya!"
    } else {
      greet = "Halo Kak! Ada yang bisa kami bantu hari ini? 😊"
    }

    let response = `${greet} Kami siap melayani Anda.`

    // Check menus
    if (text.includes("menu") || text.includes("makan") || text.includes("harga") || text.includes("katalog")) {
      const menuText = storeData.menu.map(m => `- *${m.name}* (Rp ${m.price.toLocaleString('id-ID')})`).join('\n')
      response = `${greet} Berikut daftar menu terbaik kami:\n\n${menuText}`
    }
    // Check promos
    else if (text.includes("promo") || text.includes("diskon") || text.includes("kupon")) {
      const promoText = storeData.promos.map(p => `*${p.code}* - ${p.desc}`).join('\n')
      response = `${greet} Kami punya promo menarik khusus untuk Anda:\n\n${promoText}`
    }
    // Check hours
    else if (text.includes("jam") || text.includes("buka") || text.includes("operasional")) {
      response = `${greet} Kami buka pada jam berikut:\n\n- Weekday: ${storeData.hours.weekday}\n- Weekend: ${storeData.hours.weekend}`
    }

    // Adapt to Sales Tone
    if (inst.includes("sales") || inst.includes("agresif")) {
      const firstPromo = storeData.promos[0]?.code || 'PROMO'
      response += `\n\nKebetulan hari ini kupon *${firstPromo}* lagi aktif banget nih Kak! Mau langsung saya buatkan pesanannya sekarang biar ga kehabisan? 🔥`
    }

    return response
  }

  const handleSendPlayground = (e) => {
    e.preventDefault()
    if (!playgroundInput.trim()) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: playgroundInput
    }

    setSandboxMessages(prev => [...prev, userMsg])
    setPlaygroundInput('')
    setPlaygroundTyping(true)

    // Simulate Playground AI Latency (using temporary textarea inputs!)
    setTimeout(() => {
      setPlaygroundTyping(false)
      const botReply = generatePlaygroundResponse(userMsg.content, instructionInput)
      setSandboxMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botReply
      }])
    }, 1200)
  }

  return (
    <div className="flex-1 overflow-hidden h-screen bg-brand-dark flex flex-col">
      {/* View Header */}
      <div className="p-8 border-b border-brand-border/40 shrink-0">
        <h2 className="text-xl font-extrabold text-white font-sans flex items-center gap-2">
          <Sliders className="w-5 h-5 text-ai-indigo" /> Bot Configuration
        </h2>
        <p className="text-xs text-brand-muted mt-1">Konfigurasi kepribadian, instruksi dasar, dan gaya bicara kecerdasan buatan Gemini AI untuk bot customer service Anda.</p>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Editor & Presets */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-brand-border/40 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-ai-violet" /> System Instruction Prompt
            </h3>
            
            <textarea
              value={instructionInput}
              onChange={(e) => setInstructionInput(e.target.value)}
              rows="8"
              className="w-full px-4 py-3 rounded-xl text-xs glass-input font-sans leading-relaxed resize-none"
              placeholder="Tulis instruksi sistem untuk bot di sini..."
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-ai-indigo text-white hover:bg-ai-indigo/80 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow shadow-ai-indigo/25"
              >
                <Save className="w-4 h-4" /> Simpan Konfigurasi
              </button>
              {savedSuccess && (
                <span className="text-[10px] font-semibold text-whatsapp-green animate-pulse">✓ Konfigurasi bot berhasil disimpan ke Neon DB!</span>
              )}
            </div>
          </form>

          {/* Quick Presets Panel */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" /> Pilih Preset Kepribadian
            </h3>

            <div className="space-y-3">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset.content)}
                  className="w-full text-left p-3.5 rounded-xl border border-brand-border/40 hover:border-ai-indigo/50 bg-brand-dark/20 hover:bg-ai-indigo/5 transition-all duration-200"
                >
                  <span className="text-xs font-bold text-white block">{preset.name}</span>
                  <span className="text-[10px] text-brand-muted mt-1 block leading-relaxed">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Testing Sandbox Playground */}
        <div className="w-1/2 bg-brand-dark/10 flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-brand-border/40 flex items-center justify-between bg-brand-dark/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai-indigo animate-spin" />
              <span className="text-xs font-bold text-white">AI Testing Sandbox Playground</span>
            </div>
            <button 
              onClick={() => setSandboxMessages([{ id: '1', role: 'assistant', content: 'Playground di-reset. Uji coba lagi dengan instruksi baru Anda.' }])}
              className="p-1.5 rounded-lg hover:bg-brand-border text-brand-muted hover:text-white transition-colors"
              title="Reset Chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 wa-bg-pattern">
            {sandboxMessages.map((msg) => {
              const isBot = msg.role === 'assistant'
              return (
                <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed ${
                    isBot 
                      ? 'bg-brand-card text-brand-text border border-brand-border/50 rounded-tl-none' 
                      : 'bg-ai-indigo/25 text-white border border-ai-indigo/40 rounded-tr-none'
                  }`}>
                    <div className="flex items-center gap-1 mb-1 text-[8px] font-bold text-brand-muted uppercase">
                      {isBot ? '🤖 Gemini Sandbox' : '👤 Tester Admin'}
                    </div>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              )
            })}

            {playgroundTyping && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl p-3.5 bg-brand-card/40 border border-brand-border/20 rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-200" />
                    <span className="w-1 h-1 bg-brand-muted rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={sandboxEndRef} />
          </div>

          {/* Input Panel */}
          <form onSubmit={handleSendPlayground} className="p-4 border-t border-brand-border/40 bg-brand-dark/40">
            <div className="flex gap-2">
              <input
                type="text"
                value={playgroundInput}
                onChange={(e) => setPlaygroundInput(e.target.value)}
                placeholder="Tulis pesan uji coba (e.g. 'Ada diskon hari ini?', 'Minta daftar menu')..."
                className="flex-1 px-4 py-2.5 rounded-xl text-xs glass-input font-sans focus:border-ai-indigo"
              />
              <button
                type="submit"
                disabled={!playgroundInput.trim()}
                className="p-2.5 rounded-xl bg-ai-indigo text-white hover:bg-ai-indigo/80 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-brand-muted mt-2 text-center">Testing Sandbox menggunakan state lokal. Tidak mengirim pesan WhatsApp asli.</p>
          </form>
        </div>
      </div>
    </div>
  )
}

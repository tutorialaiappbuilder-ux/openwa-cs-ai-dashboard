import React from 'react'
import { MessageSquare, Database, Store, Sliders, BarChart3, Bot, Power, RefreshCw } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, botActive, setBotActive, gatewayStatus, setGatewayStatus }) {
  const menuItems = [
    { id: 'inbox', label: 'Inbox Chat', icon: MessageSquare, desc: 'Riwayat & Takeover' },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database, desc: 'FAQ & SOP Dokumen' },
    { id: 'store', label: 'Store Data', icon: Store, desc: 'Menu, Jam & Promo' },
    { id: 'settings', label: 'Bot Configuration', icon: Sliders, desc: 'System Instruction' },
    { id: 'stats', label: 'Analytics', icon: BarChart3, desc: 'Statistik & Latency' },
  ]

  return (
    <aside className="w-64 glass-panel border-r border-brand-border h-screen flex flex-col justify-between shrink-0">
      {/* Brand Section */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-whatsapp-teal to-ai-violet flex items-center justify-center shadow-lg shadow-whatsapp-teal/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide text-white font-sans flex items-center gap-1.5">
              OpenWA <span className="text-xs bg-whatsapp-teal/20 text-whatsapp-green px-1.5 py-0.5 rounded border border-whatsapp-teal/30">CS AI</span>
            </h1>
            <p className="text-[10px] text-brand-muted">WhatsApp Business Layer</p>
          </div>
        </div>

        {/* Gateway Status Badge */}
        <div className="mt-6 p-3 rounded-xl bg-brand-dark/50 border border-brand-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full status-pulse-dot ${
              gatewayStatus === 'connected' || gatewayStatus === 'online'
                ? 'bg-whatsapp-green shadow-[0_0_8px_#25D366]' 
                : gatewayStatus === 'waiting_for_scan'
                ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
            }`} />
            <div className="text-[11px]">
              <p className="font-medium text-white capitalize">
                Gateway {
                  gatewayStatus === 'connected' || gatewayStatus === 'online'
                    ? 'Connected'
                    : gatewayStatus === 'waiting_for_scan'
                    ? 'Scan QR'
                    : 'Offline'
                }
              </p>
              <p className="text-[9px] text-brand-muted">Render Service</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (typeof setGatewayStatus === 'function') {
                setGatewayStatus('refreshing')
              }
            }}
            disabled={gatewayStatus === 'refreshing' || gatewayStatus === 'connecting'}
            className="p-1.5 rounded-lg hover:bg-brand-border/40 text-brand-muted hover:text-white transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gatewayStatus === 'refreshing' || gatewayStatus === 'connecting' ? 'animate-spin text-whatsapp-green' : ''}`} />
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="px-3 flex-1 py-4 flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-border to-brand-border/20 text-white font-medium shadow-inner border-l-2 border-whatsapp-teal' 
                  : 'text-brand-muted hover:text-white hover:bg-brand-border/10'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'text-whatsapp-green' : 'text-brand-muted group-hover:text-white'}`} />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[10px] opacity-75">{item.desc}</p>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom Bot Status Controller */}
      <div className="p-4 border-t border-brand-border/40 bg-brand-dark/30">
        <div className={`p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300 ${
          botActive 
            ? 'bg-whatsapp-teal/10 border border-whatsapp-teal/30 shadow-[0_0_15px_rgba(37,211,102,0.05)]' 
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className={`w-4 h-4 ${botActive ? 'text-whatsapp-green' : 'text-red-400'}`} />
              <span className="text-xs font-semibold text-white">Gemini 3.1 AI Bot</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              botActive ? 'bg-whatsapp-green/20 text-whatsapp-green' : 'bg-red-500/20 text-red-400'
            }`}>
              {botActive ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          
          <button
            onClick={() => setBotActive(!botActive)}
            className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow ${
              botActive 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/10' 
                : 'bg-whatsapp-green hover:bg-whatsapp-green/90 text-brand-dark font-bold shadow-whatsapp-teal/20'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {botActive ? 'Deactivate Auto-Reply' : 'Activate Auto-Reply'}
          </button>
        </div>
      </div>
    </aside>
  )
}

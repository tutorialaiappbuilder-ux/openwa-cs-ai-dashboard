import React from 'react'
import { BarChart3, Clock, AlertCircle, TrendingUp, CheckCircle, Database, Server, Cpu, Globe } from 'lucide-react'

export default function StatsView() {
  const stats = [
    { label: 'Rata-rata Latensi AI', value: '2.4s', desc: 'Target: < 5s', icon: Clock, color: 'text-whatsapp-green', bg: 'bg-whatsapp-green/10' },
    { label: 'Uptime OpenWA Bridge', value: '99.95%', desc: 'Railway persistent node', icon: Server, color: 'text-ai-indigo', bg: 'bg-ai-indigo/10' },
    { label: 'Tingkat Keberhasilan Balasan', value: '99.8%', desc: '0.2% Human takeover', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Pesan Terproses', value: '1,420', desc: 'Bulan ini berjalan', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  const latencyBreakdown = [
    { step: '1. Webhook OpenWA (Railway)', time: '0.2s', percent: 8 },
    { step: '2. Neon DB Context Fetching', time: '0.4s', percent: 16 },
    { step: '3. Gemini 3.1 Flash Generation', time: '1.5s', percent: 62 },
    { step: '4. OpenWA WA Deliver', time: '0.3s', percent: 14 }
  ]

  const weeklyTraffic = [
    { day: 'Sen', count: 120, height: 'h-24' },
    { day: 'Sel', count: 180, height: 'h-36' },
    { day: 'Rab', count: 210, height: 'h-40' },
    { day: 'Kam', count: 150, height: 'h-32' },
    { day: 'Jum', count: 280, height: 'h-52' },
    { day: 'Sab', count: 320, height: 'h-60' },
    { day: 'Min', count: 240, height: 'h-48' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-brand-dark">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold text-white font-sans flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-whatsapp-green" /> Analytics & Gateway System Stats
        </h2>
        <p className="text-xs text-brand-muted mt-1">Pantau performa layanan bot AI, latensi pemrosesan webhook, serta efisiensi respons percakapan secara real-time.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-brand-muted uppercase font-bold">{stat.label}</p>
                <p className="text-xl font-black text-white mt-1">{stat.value}</p>
                <p className="text-[9px] text-brand-muted mt-0.5">{stat.desc}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout: Charts & System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Traffic Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-whatsapp-green" /> Volume Percakapan Mingguan
          </h3>
          
          <div className="flex items-end justify-between gap-2 h-64 pt-4 border-b border-brand-border/40 pb-2">
            {weeklyTraffic.map((t, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity font-bold">{t.count}</span>
                <div className={`w-full bg-gradient-to-t from-whatsapp-teal to-whatsapp-green rounded-t-lg transition-all duration-500 hover:brightness-110 ${t.height}`} />
                <span className="text-[10px] text-brand-muted font-semibold mt-1">{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Node Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Latency breakdown */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ai-violet" /> Breakdown Latensi (Avg 2.4s)
            </h3>
            <div className="space-y-4">
              {latencyBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-semibold text-white">{item.step}</span>
                    <span className="font-bold text-brand-muted">{item.time}</span>
                  </div>
                  <div className="w-full bg-brand-border/30 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-ai-indigo to-ai-violet h-full rounded-full" 
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Node metadata info */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Spesifikasi Node Integrasi
            </h3>

            <div className="space-y-3 text-[10px]">
              <div className="flex justify-between border-b border-brand-border/30 pb-2">
                <span className="text-brand-muted flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Webhook API</span>
                <span className="text-white font-mono truncate max-w-[150px]" title="https://openwa-gateway.vercel.app/api/webhook">https://openwa-gateway.vercel.app/api/webhook</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/30 pb-2">
                <span className="text-brand-muted flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Model Engine</span>
                <span className="text-white font-semibold">Google Gemini 3.1 Flash</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-brand-muted flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Core Database</span>
                <span className="text-white font-semibold">Neon PostgreSQL (Serverless)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

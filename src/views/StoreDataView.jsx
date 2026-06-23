import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Clock, Calendar, Percent, Store, Save, X, DollarSign } from 'lucide-react'

export default function StoreDataView({ storeData, setStoreData }) {
  const [activeTab, setActiveTab] = useState('menu') // menu | hours | promos

  // Menu Modal form state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [menuForm, setMenuForm] = useState({ name: '', price: '', category: 'Makanan' })

  // Promo Modal form state
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [promoForm, setPromoForm] = useState({ code: '', desc: '' })

  // Operational Hours state
  const [hoursForm, setHoursForm] = useState({
    weekday: storeData.hours.weekday,
    weekend: storeData.hours.weekend
  })
  const [hoursSaved, setHoursSaved] = useState(false)

  // MENU ACTIONS
  const handleOpenMenuModal = (item = null) => {
    if (item) {
      setEditingMenuItem(item)
      setMenuForm({ name: item.name, price: item.price, category: item.category })
    } else {
      setEditingMenuItem(null)
      setMenuForm({ name: '', price: '', category: 'Makanan' })
    }
    setIsMenuModalOpen(true)
  }

  const handleSaveMenu = (e) => {
    e.preventDefault()
    if (!menuForm.name || !menuForm.price) return

    const priceNum = parseFloat(menuForm.price)
    if (isNaN(priceNum)) return

    if (editingMenuItem) {
      // Edit
      const updatedMenu = storeData.menu.map(m => 
        m.id === editingMenuItem.id ? { ...m, name: menuForm.name, price: priceNum, category: menuForm.category } : m
      )
      setStoreData({ ...storeData, menu: updatedMenu })
    } else {
      // Add new
      const newItem = {
        id: Date.now().toString(),
        name: menuForm.name,
        price: priceNum,
        category: menuForm.category
      }
      setStoreData({ ...storeData, menu: [...storeData.menu, newItem] })
    }
    setIsMenuModalOpen(false)
  }

  const handleDeleteMenu = (id) => {
    if (confirm("Hapus menu ini?")) {
      const updatedMenu = storeData.menu.filter(m => m.id !== id)
      setStoreData({ ...storeData, menu: updatedMenu })
    }
  }

  // PROMO ACTIONS
  const handleOpenPromoModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo)
      setPromoForm({ code: promo.code, desc: promo.desc })
    } else {
      setEditingPromo(null)
      setPromoForm({ code: '', desc: '' })
    }
    setIsPromoModalOpen(true)
  }

  const handleSavePromo = (e) => {
    e.preventDefault()
    if (!promoForm.code || !promoForm.desc) return

    const cleanCode = promoForm.code.toUpperCase().replace(/\s+/g, '')

    if (editingPromo) {
      const updatedPromos = storeData.promos.map(p => 
        p.id === editingPromo.id ? { ...p, code: cleanCode, desc: promoForm.desc } : p
      )
      setStoreData({ ...storeData, promos: updatedPromos })
    } else {
      const newPromo = {
        id: Date.now().toString(),
        code: cleanCode,
        desc: promoForm.desc
      }
      setStoreData({ ...storeData, promos: [...storeData.promos, newPromo] })
    }
    setIsPromoModalOpen(false)
  }

  const handleDeletePromo = (id) => {
    if (confirm("Hapus promo ini?")) {
      const updatedPromos = storeData.promos.filter(p => p.id !== id)
      setStoreData({ ...storeData, promos: updatedPromos })
    }
  }

  // HOURS ACTIONS
  const handleSaveHours = (e) => {
    e.preventDefault()
    setStoreData({
      ...storeData,
      hours: {
        weekday: hoursForm.weekday,
        weekend: hoursForm.weekend
      }
    })
    setHoursSaved(true)
    setTimeout(() => setHoursSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-brand-dark">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold text-white font-sans flex items-center gap-2">
          <Store className="w-5 h-5 text-whatsapp-green" /> Data Operasional Toko
        </h2>
        <p className="text-xs text-brand-muted mt-1">Kelola menu, promosi, dan jam buka. Data ini otomatis dimuat sebagai konteks oleh AI Gemini untuk merespons chat pelanggan.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border/40 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 text-xs font-semibold px-2 transition-all relative ${
            activeTab === 'menu' ? 'text-whatsapp-green' : 'text-brand-muted hover:text-white'
          }`}
        >
          Menu & Katalog Produk
          {activeTab === 'menu' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whatsapp-green" />}
        </button>
        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-3 text-xs font-semibold px-2 transition-all relative ${
            activeTab === 'promos' ? 'text-whatsapp-green' : 'text-brand-muted hover:text-white'
          }`}
        >
          Promo & Diskon Aktif
          {activeTab === 'promos' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whatsapp-green" />}
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`pb-3 text-xs font-semibold px-2 transition-all relative ${
            activeTab === 'hours' ? 'text-whatsapp-green' : 'text-brand-muted hover:text-white'
          }`}
        >
          Jam Operasional Toko
          {activeTab === 'hours' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-whatsapp-green" />}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Menu Terdaftar ({storeData.menu.length})</h3>
            <button
              onClick={() => handleOpenMenuModal()}
              className="px-4 py-2 bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow shadow-whatsapp-teal/20"
            >
              <Plus className="w-4 h-4" /> Tambah Menu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeData.menu.map((item) => (
              <div key={item.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] bg-brand-border/60 text-brand-muted font-bold px-2 py-0.5 rounded-full border border-brand-border/40">
                      {item.category}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenMenuModal(item)}
                        className="p-1 rounded hover:bg-brand-border/60 text-brand-muted hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(item.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-brand-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1 truncate">{item.name}</h4>
                </div>
                <div className="text-sm font-extrabold text-whatsapp-green mt-3">
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'promos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Kupon & Promosi ({storeData.promos.length})</h3>
            <button
              onClick={() => handleOpenPromoModal()}
              className="px-4 py-2 bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow shadow-whatsapp-teal/20"
            >
              <Plus className="w-4 h-4" /> Tambah Promo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeData.promos.map((promo) => (
              <div key={promo.id} className="glass-card p-5 rounded-2xl flex items-center gap-4 justify-between border-l-4 border-l-ai-indigo">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ai-indigo/10 flex items-center justify-center border border-ai-indigo/20 shrink-0">
                    <Percent className="w-5 h-5 text-ai-indigo" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs tracking-wider">{promo.code}</h4>
                    <p className="text-[10px] text-brand-muted mt-0.5">{promo.desc}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenPromoModal(promo)}
                    className="p-1.5 rounded hover:bg-brand-border/60 text-brand-muted hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePromo(promo.id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-brand-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="max-w-xl">
          <form onSubmit={handleSaveHours} className="glass-card p-6 rounded-2xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-ai-violet" /> Edit Jam Buka
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Senin - Jumat (Weekday)</label>
                <input
                  type="text"
                  value={hoursForm.weekday}
                  onChange={(e) => setHoursForm({ ...hoursForm, weekday: e.target.value })}
                  placeholder="e.g. 09:00 - 21:00 WIB"
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Sabtu - Minggu (Weekend)</label>
                <input
                  type="text"
                  value={hoursForm.weekend}
                  onChange={(e) => setHoursForm({ ...hoursForm, weekend: e.target.value })}
                  placeholder="e.g. 10:00 - 22:00 WIB"
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-brand-border/40">
              <button
                type="submit"
                className="px-5 py-2.5 bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Simpan Jam Buka
              </button>
              {hoursSaved && (
                <span className="text-[10px] font-semibold text-whatsapp-green animate-pulse">✓ Jam operasional berhasil disimpan!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* MENU MODAL (ADD / EDIT) */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMenu} className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-brand-border/40 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs">{editingMenuItem ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button type="button" onClick={() => setIsMenuModalOpen(false)} className="p-1 hover:bg-brand-border text-brand-muted hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Nama Menu/Produk</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Kopi Latte"
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Harga (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-brand-muted font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs glass-input font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Kategori</label>
                <select
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Cemilan">Cemilan</option>
                  <option value="Paket">Paket Hemat</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-brand-border/40 bg-brand-dark/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="px-4 py-2 bg-brand-border/60 hover:bg-brand-border text-white text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 text-xs font-bold rounded-xl"
              >
                {editingMenuItem ? 'Update Menu' : 'Simpan Menu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROMO MODAL (ADD / EDIT) */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSavePromo} className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-brand-border/40 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs">{editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}</h3>
              <button type="button" onClick={() => setIsPromoModalOpen(false)} className="p-1 hover:bg-brand-border text-brand-muted hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Kode Voucher (Kupon)</label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })}
                  placeholder="e.g. DISKON10"
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase block mb-1.5">Deskripsi Promosi</label>
                <textarea
                  required
                  value={promoForm.desc}
                  onChange={(e) => setPromoForm({ ...promoForm, desc: e.target.value })}
                  placeholder="e.g. Diskon 10% minimal pembelian Rp 50.000"
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-xl text-xs glass-input font-sans resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-brand-border/40 bg-brand-dark/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-2 bg-brand-border/60 hover:bg-brand-border text-white text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-whatsapp-teal text-white hover:bg-whatsapp-teal/80 text-xs font-bold rounded-xl"
              >
                {editingPromo ? 'Update Promo' : 'Simpan Promo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

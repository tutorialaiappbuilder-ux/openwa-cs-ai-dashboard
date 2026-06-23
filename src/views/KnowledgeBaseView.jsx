import React, { useState } from 'react'
import { FileText, UploadCloud, Eye, Trash2, CheckCircle2, Clock, AlertTriangle, X, Database } from 'lucide-react'

export default function KnowledgeBaseView({ knowledgeBase, setKnowledgeBase }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Handle drop / manual file select
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileMock(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileMock(e.target.files[0])
    }
  }

  // Mocking file upload + extraction to Cloudflare R2 & Neon
  const uploadFileMock = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      alert("Format berkas tidak didukung! Hanya PDF, DOCX, dan TXT.")
      return
    }

    const newId = Date.now().toString()
    const newFile = {
      id: newId,
      file_name: file.name,
      file_type: ext,
      file_size: `${(file.size / 1024).toFixed(1)} KB`,
      status: 'uploading', // uploading -> processing -> ready
      content_text: `[HASIL EKSTRAKSI TEKS DARI DOKUMEN: ${file.name}]\n\nDokumen ini berisi informasi referensi penting untuk bisnis Anda yang diunggah pada ${new Date().toLocaleDateString('id-ID')}.\n\nAI Gemini akan memanfaatkan baris teks ini sebagai acuan dalam membalas chat secara otomatis di WhatsApp.`,
      created_at: new Date().toISOString()
    }

    setKnowledgeBase(prev => [newFile, ...prev])

    // Ingestion simulation stages
    setTimeout(() => {
      setKnowledgeBase(current => current.map(f => f.id === newId ? { ...f, status: 'processing' } : f))
    }, 1500)

    setTimeout(() => {
      setKnowledgeBase(current => current.map(f => f.id === newId ? { ...f, status: 'ready' } : f))
    }, 3500)
  }

  const deleteFile = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokumen referensi ini?")) {
      setKnowledgeBase(prev => prev.filter(f => f.id !== id))
    }
  }

  const openPreview = (file) => {
    setPreviewTitle(file.file_name)
    setPreviewContent(file.content_text)
    setSelectedFile(file)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-brand-dark">
      {/* View Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-white font-sans flex items-center gap-2">
            <Database className="w-5 h-5 text-ai-violet" /> Management Knowledge Base
          </h2>
          <p className="text-xs text-brand-muted mt-1">Unggah dokumen SOP, FAQ, atau Brosur untuk memberikan konteks pengetahuan tambahan kepada bot CS AI.</p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 bg-brand-card rounded-xl border border-brand-border/40 text-center">
            <p className="text-[10px] text-brand-muted">Total Dokumen</p>
            <p className="text-sm font-bold text-white">{knowledgeBase.length}</p>
          </div>
          <div className="px-4 py-2 bg-brand-card rounded-xl border border-brand-border/40 text-center">
            <p className="text-[10px] text-brand-muted">Penyimpanan R2</p>
            <p className="text-sm font-bold text-ai-indigo">
              {(knowledgeBase.reduce((acc, f) => acc + parseFloat(f.file_size || 0), 0)).toFixed(1)} KB
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Area and File Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Upload Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Unggah Berkas Baru</h3>
            
            {/* Drag & Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-ai-indigo bg-ai-indigo/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'border-brand-border hover:border-brand-border/80 hover:bg-brand-border/10'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple={false}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-brand-muted mb-3 animate-pulse" />
              <p className="text-xs font-semibold text-white">Seret & taruh berkas di sini</p>
              <p className="text-[10px] text-brand-muted mt-1.5 mb-4">Mendukung PDF, DOCX, dan TXT hingga 10MB</p>
              
              <label 
                htmlFor="file-upload-input"
                className="px-4 py-2 bg-brand-border/60 hover:bg-brand-border text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Pilih Berkas
              </label>
            </div>
            
            {/* Guidelines Card */}
            <div className="mt-4 p-3 bg-brand-dark/30 border border-brand-border/60 rounded-xl">
              <span className="text-[9px] font-extrabold text-ai-violet block mb-1">PRO TIP</span>
              <p className="text-[10px] text-brand-muted leading-relaxed">
                Tulis FAQ dalam format tanya-jawab yang teratur dalam berkas teks (.txt) atau PDF untuk hasil pemahaman AI yang maksimal.
              </p>
            </div>
          </div>
        </div>

        {/* Right / Database List Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-brand-border/40">
              <h3 className="text-sm font-bold text-white">Daftar Dokumen Pengetahuan</h3>
            </div>

            {knowledgeBase.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-brand-border mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Belum ada dokumen pengetahun terunggah.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border/40 bg-brand-dark/20 text-brand-muted font-semibold">
                      <th className="p-4">Nama Berkas</th>
                      <th className="p-4">Tipe</th>
                      <th className="p-4">Ukuran</th>
                      <th className="p-4">Tanggal Unggah</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {knowledgeBase.map((file) => (
                      <tr key={file.id} className="border-b border-brand-border/30 hover:bg-brand-border/10 transition-colors">
                        <td className="p-4 font-semibold text-white truncate max-w-[180px]" title={file.file_name}>
                          {file.file_name}
                        </td>
                        <td className="p-4 uppercase text-brand-muted text-[10px]">{file.file_type}</td>
                        <td className="p-4 text-brand-muted">{file.file_size}</td>
                        <td className="p-4 text-brand-muted">
                          {new Date(file.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                          {file.status === 'ready' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-whatsapp-green">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          )}
                          {file.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ai-indigo">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ekstraksi...
                            </span>
                          )}
                          {file.status === 'uploading' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                              <Clock className="w-3.5 h-3.5 animate-pulse" /> Uploading...
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openPreview(file)}
                              disabled={file.status !== 'ready'}
                              className="p-1.5 rounded bg-brand-border/60 hover:bg-brand-border text-brand-muted hover:text-white disabled:opacity-40 transition-colors"
                              title="Lihat Ekstraksi Teks"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extracted Text Preview Modal (Glassmorphic Overlay) */}
      {selectedFile && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-brand-border/40 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{previewTitle}</h3>
                <p className="text-[10px] text-brand-muted mt-0.5">Hasil ekstraksi teks mentah yang akan masuk ke konteks Gemini</p>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg hover:bg-brand-border text-brand-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-[11px] bg-brand-dark/40 text-brand-muted leading-relaxed whitespace-pre-wrap flex-1 select-text">
              {previewContent}
            </div>

            <div className="p-4 border-t border-brand-border/40 bg-brand-dark/20 text-right">
              <button 
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-brand-border text-white text-xs font-semibold rounded-xl hover:bg-brand-border/80 transition-colors"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, addIngredient, updateIngredient, deleteIngredient } from '../db/database'
import { UNITS, fmtCurrency, fmtDateShort } from '../utils/calculations'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const EMPTY_FORM = { name: '', unit: 'g', pricePerUnit: '' }

export default function Ingredients() {
  const toast = useToast()
  const ingredients = useLiveQuery(() => db.ingredients.orderBy('name').toArray(), [])
  const currency = useLiveQuery(() => db.settings.get('currency').then(r => r?.value || 'TRY'), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [search, setSearch] = useState('')

  const fmt = (n) => fmtCurrency(n, currency)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(ing) {
    setEditing(ing)
    setForm({ name: ing.name, unit: ing.unit, pricePerUnit: String(ing.pricePerUnit) })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Malzeme adı gereklidir')
    if (!form.pricePerUnit || isNaN(Number(form.pricePerUnit))) return toast.error('Geçerli bir fiyat girin')

    try {
      if (editing) {
        await updateIngredient(editing.id, form)
        toast.success('Malzeme güncellendi')
      } else {
        await addIngredient(form)
        toast.success('Malzeme eklendi')
      }
      setModalOpen(false)
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  async function handleDelete() {
    try {
      await deleteIngredient(deleteTarget.id)
      toast.success('Malzeme silindi')
      setDeleteTarget(null)
    } catch {
      toast.error('Silinemedi')
    }
  }

  const filtered = (ingredients || []).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="section-title">Malzemeler</h2>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon /> Ekle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Malzeme ara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* List */}
      {!ingredients ? (
        <LoadingList />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} onAdd={openAdd} />
      ) : (
        <div className="space-y-2">
          {filtered.map(ing => (
            <div key={ing.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IngIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{ing.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-400">{ing.unit}</span>
                    <span className="text-xs text-stone-300">·</span>
                    <span className="text-sm font-semibold text-primary">{fmt(ing.pricePerUnit)}</span>
                    <span className="text-xs text-stone-400">/ {ing.unit}</span>
                  </div>
                  {ing.priceHistory?.length > 1 && (
                    <button
                      onClick={() => setHistoryTarget(ing)}
                      className="text-xs text-stone-400 hover:text-primary mt-1 flex items-center gap-1"
                    >
                      <HistoryIcon className="w-3 h-3" />
                      {ing.priceHistory.length} fiyat değişikliği
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(ing)} className="btn-icon text-stone-400 hover:text-stone-700 hover:bg-stone-100">
                    <EditIcon />
                  </button>
                  <button onClick={() => setDeleteTarget(ing)} className="btn-icon text-stone-400 hover:text-red-500 hover:bg-red-50">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Malzeme Düzenle' : 'Malzeme Ekle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ad</label>
            <input
              type="text"
              className="input"
              placeholder="örn. Un"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Birim</label>
            <select
              className="select"
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            >
              {UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{form.unit || 'birim'} başına fiyat</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                {currency === 'TRY' ? '₺' : currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input pl-8"
                placeholder="0,00"
                value={form.pricePerUnit}
                onChange={e => setForm(f => ({ ...f, pricePerUnit: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">İptal</button>
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'Kaydet' : 'Malzeme Ekle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Price History Modal */}
      <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`${historyTarget?.name} – Fiyat Geçmişi`} size="sm">
        {historyTarget && (
          <div className="space-y-2">
            {[...(historyTarget.priceHistory || [])].reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-500">{fmtDateShort(entry.date)}</span>
                <span className={`text-sm font-semibold ${i === 0 ? 'text-primary' : 'text-stone-700'}`}>
                  {fmt(entry.price)}{i === 0 && <span className="text-xs text-stone-400 font-normal ml-1">(güncel)</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Malzeme silinsin mi?"
        message={`"${deleteTarget?.name}" kaldırılacak. Bu malzemeyi kullanan tariflerde eksik uyarısı gösterilir.`}
        confirmLabel="Sil"
      />
    </div>
  )
}

function EmptyState({ search, onAdd }) {
  return (
    <div className="empty-state">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
        <IngIcon size="lg" />
      </div>
      {search ? (
        <p className="text-stone-500">"<strong>{search}</strong>" ile eşleşen malzeme bulunamadı</p>
      ) : (
        <>
          <p className="font-medium text-stone-700">Henüz malzeme yok</p>
          <p className="text-sm text-stone-400 mt-1 mb-4">İlk malzemenizi ekleyin</p>
          <button onClick={onAdd} className="btn-primary">Malzeme ekle</button>
        </>
      )}
    </div>
  )
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-4 h-16 animate-pulse bg-stone-100" />
      ))}
    </div>
  )
}

function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
}
function EditIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
}
function IngIcon({ size = 'sm' }) {
  const cls = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return (
    <svg className={`${cls} text-primary`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )
}
function HistoryIcon({ className = 'w-4 h-4' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}

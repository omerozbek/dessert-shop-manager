import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, addOrder, updateOrderStatus, deleteOrder } from '../db/database'
import { calcRecipeCost, calcSuggestedPrice, calcProfitStats, fmtCurrency, fmtDate, fmtDateShort } from '../utils/calculations'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

export default function Orders() {
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)

  const allOrders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray(), [])
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const profitMargin = useLiveQuery(() => db.settings.get('profitMargin').then(r => r?.value ?? 30), [])
  const currency = useLiveQuery(() => db.settings.get('currency').then(r => r?.value || 'TRY'), [])

  const ingredientMap = Object.fromEntries((ingredients || []).map(i => [i.id, i]))
  const fmt = (n) => fmtCurrency(n, currency)

  const pending = (allOrders || []).filter(o => o.status === 'pending')
  const history = (allOrders || []).filter(o => o.status === 'sold' || o.status === 'cancelled')
  const historyStats = calcProfitStats((allOrders || []).filter(o => o.status === 'sold'))

  async function handleStatusChange() {
    if (!actionTarget) return
    try {
      await updateOrderStatus(actionTarget.order.id, actionTarget.action)
      toast.success(actionTarget.action === 'sold' ? 'Sipariş satıldı olarak işaretlendi!' : 'Sipariş iptal edildi')
      setActionTarget(null)
    } catch {
      toast.error('Sipariş güncellenemedi')
    }
  }

  async function handleDelete() {
    try {
      await deleteOrder(deleteTarget.id)
      toast.success('Sipariş silindi')
      setDeleteTarget(null)
    } catch {
      toast.error('Silinemedi')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-4 pt-5 pb-0">
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            Aktif
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-white">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'history' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
            }`}
          >
            Geçmiş
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-3">
        {tab === 'pending' ? (
          <>
            <button onClick={() => setModalOpen(true)} className="btn-primary w-full">
              <PlusIcon /> Yeni Sipariş
            </button>

            {pending.length === 0 ? (
              <div className="empty-state">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                  <OrderIcon size="lg" />
                </div>
                <p className="font-medium text-stone-700">Aktif sipariş yok</p>
                <p className="text-sm text-stone-400 mt-1">Yeni sipariş oluşturmak için yukarıdaki butona tıklayın</p>
              </div>
            ) : (
              pending.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  fmt={fmt}
                  onView={() => setDetailOrder(order)}
                  onSell={() => setActionTarget({ order, action: 'sold' })}
                  onCancel={() => setActionTarget({ order, action: 'cancelled' })}
                  onDelete={() => setDeleteTarget(order)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {history.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="card p-3">
                  <p className="text-xs text-stone-400">Toplam Gelir</p>
                  <p className="text-lg font-bold text-stone-900">{fmt(historyStats.revenue)}</p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-stone-400">Net Kâr</p>
                  <p className="text-lg font-bold text-green-600">{fmt(historyStats.profit)}</p>
                </div>
              </div>
            )}

            {history.length === 0 ? (
              <div className="empty-state">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                  <HistoryIcon size="lg" />
                </div>
                <p className="font-medium text-stone-700">Henüz sipariş geçmişi yok</p>
                <p className="text-sm text-stone-400 mt-1">Tamamlanan siparişler burada görünür</p>
              </div>
            ) : (
              history.map(order => (
                <HistoryCard
                  key={order.id}
                  order={order}
                  fmt={fmt}
                  onView={() => setDetailOrder(order)}
                  onDelete={() => setDeleteTarget(order)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recipes={recipes || []}
        ingredientMap={ingredientMap}
        profitMargin={profitMargin ?? 30}
        fmt={fmt}
        currency={currency}
        onSuccess={() => { setModalOpen(false); setTab('pending') }}
        toast={toast}
      />

      {/* Order Detail Modal */}
      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Sipariş #${detailOrder?.id}`}>
        {detailOrder && <OrderDetail order={detailOrder} fmt={fmt} />}
      </Modal>

      {/* Status change confirm */}
      <ConfirmDialog
        open={!!actionTarget}
        onConfirm={handleStatusChange}
        onCancel={() => setActionTarget(null)}
        title={actionTarget?.action === 'sold' ? 'Satıldı olarak işaretle?' : 'Sipariş iptal edilsin mi?'}
        message={
          actionTarget?.action === 'sold'
            ? 'Sipariş geçmişe taşınacak. Fiyatlar kilitlidir ve değiştirilemez.'
            : 'Sipariş iptal edilecek. Geçmişte görüntülemeye devam edebilirsiniz.'
        }
        confirmLabel={actionTarget?.action === 'sold' ? 'Satıldı İşaretle' : 'İptal Et'}
        danger={actionTarget?.action === 'cancelled'}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Sipariş silinsin mi?"
        message="Bu sipariş kalıcı olarak silinecek ve geri alınamaz."
        confirmLabel="Sil"
      />
    </div>
  )
}

// ─── Order Card (pending) ─────────────────────────────────────────────────────

function OrderCard({ order, fmt, onView, onSell, onCancel, onDelete }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-pending">Beklemede</span>
            <span className="text-xs text-stone-400">#{order.id}</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-stone-900">{fmt(order.totalPrice)}</p>
          <p className="text-xs text-stone-400">Maliyet: {fmt(order.totalCost)}</p>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-stone-600">{item.recipeName} × {item.quantity}</span>
            <span className="text-stone-500">{fmt(item.pricePerUnit * item.quantity)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-stone-400 italic mb-3">"{order.notes}"</p>
      )}

      <div className="flex gap-2">
        <button onClick={onSell} className="btn-primary flex-1 text-sm py-2">
          <CheckIcon /> Satıldı
        </button>
        <button onClick={onView} className="btn-ghost text-sm py-2 px-3">
          <EyeIcon />
        </button>
        <button onClick={onCancel} className="btn-ghost text-sm py-2 px-3 text-stone-400">
          <XIcon />
        </button>
        <button onClick={onDelete} className="btn-ghost text-sm py-2 px-3 text-stone-300 hover:text-red-500">
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

// ─── History Card ─────────────────────────────────────────────────────────────

function HistoryCard({ order, fmt, onView, onDelete }) {
  const isSold = order.status === 'sold'
  const profit = order.totalPrice - order.totalCost

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isSold ? <span className="badge-sold">Satıldı</span> : <span className="badge-cancelled">İptal Edildi</span>}
            <span className="text-xs text-stone-400">#{order.id}</span>
          </div>
          <p className="text-xs text-stone-400">{fmtDateShort(order.soldAt || order.updatedAt)}</p>
          <p className="text-sm text-stone-600 mt-1.5 truncate">
            {order.items?.map(i => `${i.recipeName} ×${i.quantity}`).join(', ')}
          </p>
        </div>
        {isSold && (
          <div className="text-right shrink-0">
            <p className="font-bold text-stone-900">{fmt(order.totalPrice)}</p>
            <p className="text-xs text-green-600 font-medium">+{fmt(profit)}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onView} className="btn-ghost text-sm py-1.5 flex-1 text-stone-500">
          Detayları gör
        </button>
        <button onClick={onDelete} className="btn-icon text-stone-300 hover:text-red-500">
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Order Detail ─────────────────────────────────────────────────────────────

function OrderDetail({ order, fmt }) {
  const profit = order.totalPrice - order.totalCost
  const margin = order.totalPrice > 0 ? (profit / order.totalPrice) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {order.status === 'pending' && <span className="badge-pending">Beklemede</span>}
        {order.status === 'sold' && <span className="badge-sold">Satıldı</span>}
        {order.status === 'cancelled' && <span className="badge-cancelled">İptal Edildi</span>}
        <span className="text-sm text-stone-400">{fmtDate(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-stone-50 rounded-xl p-3">
          <p className="text-xs text-stone-400">Toplam Fiyat</p>
          <p className="font-bold text-stone-900">{fmt(order.totalPrice)}</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3">
          <p className="text-xs text-stone-400">Toplam Maliyet</p>
          <p className="font-bold text-stone-700">{fmt(order.totalCost)}</p>
        </div>
        {order.status === 'sold' && (
          <>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-stone-400">Kâr</p>
              <p className="font-bold text-green-600">{fmt(profit)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-stone-400">Kâr Marjı</p>
              <p className="font-bold text-green-600">%{margin.toFixed(1)}</p>
            </div>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ürünler</p>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-stone-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-700">{item.recipeName}</p>
                <p className="text-xs text-stone-400">Adet: {item.quantity} · Maliyet: {fmt(item.costPerUnit)} / adet</p>
              </div>
              <p className="text-sm font-semibold text-stone-900">{fmt(item.pricePerUnit * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Notlar</p>
          <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{order.notes}</p>
        </div>
      )}

      <p className="text-xs text-stone-300">
        ⚠ Fiyatlar sipariş oluşturulduğu anda kilitlenir ve değiştirilemez.
      </p>
    </div>
  )
}

// ─── New Order Modal ──────────────────────────────────────────────────────────

function NewOrderModal({ open, onClose, recipes, ingredientMap, profitMargin, fmt, currency, onSuccess, toast }) {
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  const handleClose = () => {
    setItems([])
    setNotes('')
    onClose()
  }

  function addItem() {
    if (recipes.length === 0) return toast.error('Önce tarif ekleyin')
    const r = recipes[0]
    const costPerUnit = calcRecipeCost(r.ingredients || [], ingredientMap)
    const pricePerUnit = calcSuggestedPrice(costPerUnit, profitMargin)
    setItems(prev => [...prev, {
      recipeId: r.id,
      quantity: 1,
      costPerUnit,
      pricePerUnit,
    }])
  }

  function updateItem(idx, patch) {
    setItems(prev => {
      const updated = [...prev]
      const current = updated[idx]

      // If recipe changed, recalculate cost and reset suggested price
      if (patch.recipeId !== undefined && patch.recipeId !== current.recipeId) {
        const r = recipeMap[patch.recipeId]
        const costPerUnit = r ? calcRecipeCost(r.ingredients || [], ingredientMap) : 0
        const pricePerUnit = calcSuggestedPrice(costPerUnit, profitMargin)
        updated[idx] = { ...current, recipeId: Number(patch.recipeId), costPerUnit, pricePerUnit }
      } else {
        updated[idx] = { ...current, ...patch }
      }
      return updated
    })
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const totalPrice = items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0)
  const totalCost = items.reduce((s, i) => s + i.costPerUnit * i.quantity, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) return toast.error('En az bir ürün ekleyin')
    setSubmitting(true)
    try {
      const orderItems = items.map(item => {
        const r = recipeMap[item.recipeId]
        return {
          recipeId: item.recipeId,
          recipeName: r?.name || 'Bilinmiyor',
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,  // kilitli anlık değer
          costPerUnit: item.costPerUnit,    // kilitli anlık değer
        }
      })
      await addOrder({ items: orderItems, notes })
      toast.success('Sipariş oluşturuldu!')
      setItems([])
      setNotes('')
      onSuccess()
    } catch {
      toast.error('Sipariş oluşturulamadı')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const currSymbol = currency === 'TRY' ? '₺' : currency

  return (
    <Modal open={open} onClose={handleClose} title="Yeni Sipariş" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Ürünler</label>
            <button type="button" onClick={addItem} className="text-xs text-primary font-medium flex items-center gap-1">
              <PlusIcon /> Ürün ekle
            </button>
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-stone-400 py-4 text-center border border-dashed border-stone-200 rounded-xl">
              Henüz ürün eklenmedi — "Ürün ekle" butonuna tıklayın
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => {
                const r = recipeMap[item.recipeId]
                return (
                  <div key={idx} className="bg-stone-50 rounded-xl p-3 space-y-2">
                    {/* Recipe selector + qty */}
                    <div className="flex items-center gap-2">
                      <select
                        className="select flex-1 min-w-0 bg-white"
                        value={item.recipeId}
                        onChange={e => updateItem(idx, { recipeId: Number(e.target.value) })}
                      >
                        {recipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-stone-400">Adet:</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="input w-16 bg-white"
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="btn-icon text-stone-300 hover:text-red-500 shrink-0">
                        <TrashIcon />
                      </button>
                    </div>

                    {/* Selling price (editable) */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-stone-500 mb-1 block">
                          Satış fiyatı (adet başına)
                          <span className="text-stone-400 ml-1">— Maliyet: {fmt(item.costPerUnit)}</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{currSymbol}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input pl-7 bg-white text-sm"
                            value={item.pricePerUnit === 0 ? '' : item.pricePerUnit.toFixed(2)}
                            onChange={e => updateItem(idx, { pricePerUnit: Number(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0 pt-5">
                        <p className="text-sm font-semibold text-stone-900">{fmt(item.pricePerUnit * item.quantity)}</p>
                        <p className="text-xs text-green-600">+{fmt((item.pricePerUnit - item.costPerUnit) * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Price summary */}
        {items.length > 0 && (
          <div className="bg-stone-50 rounded-xl p-3.5 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Toplam maliyet</span>
              <span className="font-medium">{fmt(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Toplam satış fiyatı</span>
              <span className="font-bold text-stone-900">{fmt(totalPrice)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-1.5 mt-1.5">
              <span className="text-stone-500">Beklenen kâr</span>
              <span className="font-semibold text-green-600">{fmt(totalPrice - totalCost)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-stone-400 flex items-start gap-1.5">
          <span className="text-amber-500 shrink-0">⚠</span>
          Fiyatlar şu an kilitlenecek. Malzeme fiyatları değişse bile bu sipariş etkilenmez.
        </p>

        {/* Notes */}
        <div>
          <label className="label">Notlar <span className="text-stone-400 font-normal">(isteğe bağlı)</span></label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Müşteri adı, özel istek…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">İptal</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Oluşturuluyor…' : 'Sipariş Oluştur'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg> }
function CheckIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> }
function XIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> }
function EyeIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> }
function TrashIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> }
function OrderIcon({ size = 'sm' }) {
  const cls = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return <svg className={`${cls} text-stone-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
}
function HistoryIcon({ size = 'sm' }) {
  const cls = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return <svg className={`${cls} text-stone-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
}

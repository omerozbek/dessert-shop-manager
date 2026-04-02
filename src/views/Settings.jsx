import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, setSetting, updateIngredient } from '../db/database'
import { CURRENCIES, fmtDate } from '../utils/calculations'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { fetchIngredientPrice, STORE_OPTIONS } from '../utils/priceService'

export default function Settings() {
  const toast = useToast()
  const [clearConfirm, setClearConfirm] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)

  const settingsRows = useLiveQuery(() => db.settings.toArray(), [])

  const settingsMap = Object.fromEntries((settingsRows || []).map(s => [s.key, s.value]))
  const profitMargin = settingsMap.profitMargin ?? 30
  const autoFetch = settingsMap.autoFetchPrices ?? false
  const currency = settingsMap.currency ?? 'TRY'
  const lastFetch = settingsMap.lastPriceFetch ?? null

  const [marginInput, setMarginInput] = useState(String(profitMargin))

  useEffect(() => {
    setMarginInput(String(profitMargin))
  }, [profitMargin])

  async function saveMargin() {
    const v = Number(marginInput)
    if (isNaN(v) || v < 0) return toast.error('Geçerli bir değer girin')
    await setSetting('profitMargin', v)
    toast.success('Kâr oranı kaydedildi')
  }

  async function toggleAutoFetch(val) {
    await setSetting('autoFetchPrices', val)
    toast.success(val ? 'Otomatik fiyat güncelleme açıldı' : 'Otomatik fiyat güncelleme kapatıldı')
  }

  async function changeCurrency(val) {
    await setSetting('currency', val)
    toast.success('Para birimi güncellendi')
  }

  async function clearAllData() {
    await db.ingredients.clear()
    await db.recipes.clear()
    await db.orders.clear()
    toast.success('Tüm veriler silindi')
    setClearConfirm(false)
  }

  const stats = useLiveQuery(async () => {
    const ingredients = await db.ingredients.count()
    const recipes = await db.recipes.count()
    const orders = await db.orders.count()
    return { ingredients, recipes, orders }
  }, [])

  return (
    <div className="px-4 py-5 space-y-6">
      <h2 className="section-title">Ayarlar</h2>

      {/* Profit Margin & Currency */}
      <Section title="Fiyatlandırma" icon={<PriceIcon />}>
        <div className="space-y-4">
          <div>
            <label className="label">Kâr Oranı</label>
            <p className="text-xs text-stone-400 mb-2">
              Tariflerin önerilen satış fiyatını belirler. Sipariş oluştururken değiştirebilirsiniz.
              <br />Formül: <em>Fiyat = Maliyet × (1 + oran%)</em>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="input pr-8"
                  value={marginInput}
                  onChange={e => setMarginInput(e.target.value)}
                  onBlur={saveMargin}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">%</span>
              </div>
              <button onClick={saveMargin} className="btn-primary shrink-0">Kaydet</button>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              className="w-full mt-3 accent-primary"
              value={Number(marginInput) || 0}
              onChange={e => { setMarginInput(e.target.value); setSetting('profitMargin', Number(e.target.value)) }}
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>%0</span><span>%150</span><span>%300</span>
            </div>
          </div>

          <div>
            <label className="label">Para Birimi</label>
            <select className="select" value={currency} onChange={e => changeCurrency(e.target.value)}>
              {CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Price Fetching */}
      <Section title="Malzeme Fiyatları" icon={<FetchIcon />}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">Otomatik fiyat güncelleme</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Açıkken ve internet varken, uygulama açılışında malzeme fiyatları otomatik güncellenir.
              </p>
            </div>
            <Toggle checked={autoFetch} onChange={toggleAutoFetch} />
          </div>

          {lastFetch && (
            <p className="text-xs text-stone-400">
              Son güncelleme: {fmtDate(lastFetch)}
            </p>
          )}

          <div className="border-t border-stone-100 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-1">Fiyatları Toplu Güncelle</p>
            <p className="text-xs text-stone-400 mb-3">
              Tüm malzemelerin fiyatını tek ekrandan güncelleyin.
            </p>
            <button onClick={() => setPriceModalOpen(true)} className="btn-secondary w-full">
              <RefreshIcon /> Fiyatları Güncelle
            </button>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
            <span className="shrink-0">⚠</span>
            <span>
              Mevcut siparişler asla etkilenmez — fiyatlar sipariş oluşturulduğu anda kilitlenir.
            </span>
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section title="Veriler" icon={<DataIcon />}>
        <div className="space-y-3">
          {stats && (
            <div className="bg-stone-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="font-semibold text-stone-900">{stats.ingredients}</p>
                <p className="text-xs text-stone-400">Malzeme</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">{stats.recipes}</p>
                <p className="text-xs text-stone-400">Tarif</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">{stats.orders}</p>
                <p className="text-xs text-stone-400">Sipariş</p>
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400">
            Tüm veriler cihazınızda IndexedDB üzerinde yerel olarak saklanır. Hiçbir şey sunucuya gönderilmez.
          </p>

          <button
            onClick={() => setClearConfirm(true)}
            className="btn-danger w-full"
          >
            <TrashIcon /> Tüm Verileri Sil
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="Hakkında" icon={<InfoIcon />}>
        <div className="space-y-2 text-sm text-stone-500">
          <div className="flex justify-between">
            <span>Uygulama</span>
            <span className="font-medium text-stone-700">Dulci</span>
          </div>
          <div className="flex justify-between">
            <span>Sürüm</span>
            <span className="font-medium text-stone-700">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Depolama</span>
            <span className="font-medium text-stone-700">IndexedDB (yerel)</span>
          </div>
          <div className="flex justify-between">
            <span>Çevrimdışı</span>
            <span className="font-medium text-green-600">✓ Tam destek</span>
          </div>
          <p className="text-xs text-stone-400 pt-2">
            Dulci tamamen çevrimdışı çalışır. En iyi deneyim için ana ekranınıza ekleyin.
          </p>
        </div>
      </Section>

      <div className="h-2" />

      <ConfirmDialog
        open={clearConfirm}
        onConfirm={clearAllData}
        onCancel={() => setClearConfirm(false)}
        title="Tüm veriler silinsin mi?"
        message="Bu işlem tüm malzemeleri, tarifleri ve siparişleri kalıcı olarak siler. Geri alınamaz."
        confirmLabel="Tümünü Sil"
      />

      <BulkPriceModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        toast={toast}
        currency={currency}
      />
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-primary' : 'bg-stone-200'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ─── Bulk Price Update Modal ──────────────────────────────────────────────────

// Status per ingredient: null | 'loading' | { price, productName, unit } | 'error' | 'notfound'
function BulkPriceModal({ open, onClose, toast, currency }) {
  const ingredients = useLiveQuery(() => db.ingredients.orderBy('name').toArray(), [])
  const [prices, setPrices] = useState({})       // { [id]: string }
  const [statuses, setStatuses] = useState({})    // { [id]: status }
  const [selectedStore, setSelectedStore] = useState('migros')
  const [fetchingAll, setFetchingAll] = useState(false)
  const [saving, setSaving] = useState(false)

  // Reset prices when ingredients load or modal opens
  useEffect(() => {
    if (ingredients && open) {
      setPrices(Object.fromEntries(ingredients.map(i => [i.id, String(i.pricePerUnit)])))
      setStatuses({})
    }
  }, [ingredients, open])

  function setStatus(id, status) {
    setStatuses(s => ({ ...s, [id]: status }))
  }

  async function fetchOne(ing) {
    setStatus(ing.id, 'loading')
    try {
      const result = await fetchIngredientPrice(ing.name, selectedStore)
      if (!result) {
        setStatus(ing.id, 'notfound')
      } else {
        setStatus(ing.id, result)
        setPrices(p => ({ ...p, [ing.id]: String(result.price.toFixed(2)) }))
      }
    } catch (err) {
      setStatus(ing.id, 'error')
    }
  }

  async function fetchAll() {
    if (!ingredients?.length) return
    setFetchingAll(true)
    // Sequential to avoid hammering the proxy
    for (const ing of ingredients) {
      await fetchOne(ing)
    }
    setFetchingAll(false)
    toast.info('Fiyat çekme tamamlandı')
  }

  async function handleSave() {
    if (!ingredients) return
    setSaving(true)
    let updated = 0
    try {
      for (const ing of ingredients) {
        const newPrice = Number(prices[ing.id])
        if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== ing.pricePerUnit) {
          await updateIngredient(ing.id, { name: ing.name, unit: ing.unit, pricePerUnit: newPrice })
          updated++
        }
      }
      await setSetting('lastPriceFetch', new Date().toISOString())
      toast.success(updated > 0 ? `${updated} malzeme fiyatı güncellendi` : 'Değişiklik yok')
      onClose()
    } catch {
      toast.error('Kaydetme sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const currSymbol = currency === 'TRY' ? '₺' : currency

  return (
    <Modal open={open} onClose={onClose} title="Fiyatları Güncelle" size="default">
      {!ingredients ? (
        <div className="py-8 text-center text-stone-400 text-sm">Yükleniyor…</div>
      ) : ingredients.length === 0 ? (
        <div className="py-8 text-center text-stone-400 text-sm">Henüz malzeme eklenmedi.</div>
      ) : (
        <div className="space-y-5">

          {/* Store selector + fetch all */}
          <div className="bg-stone-50 rounded-xl p-3.5 space-y-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2">Fiyat kaynağı</p>
              <div className="flex gap-2">
                {STORE_OPTIONS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStore(s.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                      selectedStore === s.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={fetchAll}
              disabled={fetchingAll}
              className="btn-secondary w-full"
            >
              {fetchingAll
                ? <><SpinIcon /> Fiyatlar çekiliyor…</>
                : <><RefreshIcon /> Tümünü İnternetten Çek</>
              }
            </button>
            <p className="text-xs text-stone-400">
              İnternet üzerinden fiyatlar çekilecek ve aşağıya doldurulacak. Kaydetmeden önce kontrol edebilirsiniz.
            </p>
          </div>

          {/* Per-ingredient rows */}
          <div className="space-y-2">
            {ingredients.map(ing => {
              const status = statuses[ing.id]
              return (
                <div key={ing.id} className="flex items-center gap-2">
                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-stone-800 truncate">{ing.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    {status && typeof status === 'object' && (
                      <p className="text-xs text-stone-400 truncate mt-0.5">→ {status.productName}</p>
                    )}
                    <p className="text-xs text-stone-400">/ {ing.unit}</p>
                  </div>

                  {/* Price input */}
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">{currSymbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input pl-7 text-sm ${status === 'loading' ? 'opacity-50' : ''}`}
                      value={prices[ing.id] ?? ''}
                      disabled={status === 'loading'}
                      onChange={e => setPrices(p => ({ ...p, [ing.id]: e.target.value }))}
                    />
                  </div>

                  {/* Single fetch button */}
                  <button
                    type="button"
                    onClick={() => fetchOne(ing)}
                    disabled={status === 'loading' || fetchingAll}
                    className="btn-icon text-stone-400 hover:text-primary hover:bg-primary/10 shrink-0"
                    title={`${ing.name} için fiyat çek`}
                  >
                    {status === 'loading' ? <SpinIcon /> : <RefreshIcon />}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button onClick={handleSave} disabled={saving || fetchingAll} className="btn-primary flex-1">
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function StatusBadge({ status }) {
  if (!status) return null
  if (status === 'loading') return <span className="text-xs text-stone-400">çekiliyor…</span>
  if (status === 'error')   return <span className="text-xs text-red-500">hata</span>
  if (status === 'notfound') return <span className="text-xs text-amber-500">bulunamadı</span>
  return <span className="text-xs text-green-600">✓ bulundu</span>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PriceIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function FetchIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> }
function DataIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg> }
function InfoIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function RefreshIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> }
function SpinIcon() { return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> }
function TrashIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> }

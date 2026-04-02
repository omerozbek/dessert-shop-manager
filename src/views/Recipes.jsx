import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, addRecipe, updateRecipe, deleteRecipe } from '../db/database'
import { calcRecipeCost, calcSuggestedPrice, fmtCurrency, UNITS } from '../utils/calculations'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const EMPTY_FORM = { name: '', ingredients: [], notes: '' }

export default function Recipes() {
  const toast = useToast()
  const recipes = useLiveQuery(() => db.recipes.orderBy('name').toArray(), [])
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const profitMargin = useLiveQuery(() => db.settings.get('profitMargin').then(r => r?.value ?? 30), [])
  const currency = useLiveQuery(() => db.settings.get('currency').then(r => r?.value || 'TRY'), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [search, setSearch] = useState('')

  const ingredientMap = Object.fromEntries((ingredients || []).map(i => [i.id, i]))
  const fmt = (n) => fmtCurrency(n, currency)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(recipe) {
    setEditing(recipe)
    setForm({
      name: recipe.name,
      ingredients: recipe.ingredients || [],
      notes: recipe.notes || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Tarif adı gereklidir')
    if (form.ingredients.length === 0) return toast.error('En az bir malzeme ekleyin')

    try {
      if (editing) {
        await updateRecipe(editing.id, form)
        toast.success('Tarif güncellendi')
      } else {
        await addRecipe(form)
        toast.success('Tarif oluşturuldu')
      }
      setModalOpen(false)
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  async function handleDelete() {
    try {
      await deleteRecipe(deleteTarget.id)
      toast.success('Tarif silindi')
      setDeleteTarget(null)
    } catch {
      toast.error('Silinemedi')
    }
  }

  function addIngredientLine() {
    if (!ingredients?.length) return toast.error('Önce malzeme ekleyin')
    const firstId = ingredients[0].id
    setForm(f => ({
      ...f,
      ingredients: [...f.ingredients, { ingredientId: firstId, quantity: 1 }],
    }))
  }

  function updateIngredientLine(idx, patch) {
    setForm(f => {
      const updated = [...f.ingredients]
      updated[idx] = { ...updated[idx], ...patch }
      return { ...f, ingredients: updated }
    })
  }

  function removeIngredientLine(idx) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))
  }

  const filtered = (recipes || []).filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const formCost = calcRecipeCost(form.ingredients, ingredientMap)
  const formSuggested = calcSuggestedPrice(formCost, profitMargin ?? 30)

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Tarifler</h2>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon /> Ekle
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Tarif ara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {!recipes ? (
        <LoadingList />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} onAdd={openAdd} />
      ) : (
        <div className="space-y-2">
          {filtered.map(recipe => {
            const cost = calcRecipeCost(recipe.ingredients, ingredientMap)
            const suggested = calcSuggestedPrice(cost, profitMargin ?? 30)
            const missingIngredients = (recipe.ingredients || []).filter(i => !ingredientMap[i.ingredientId])

            return (
              <div key={recipe.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <CakeIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{recipe.name}</p>
                    {missingIngredients.length > 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">⚠ {missingIngredients.length} malzeme eksik</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-stone-500">Maliyet: <span className="font-medium text-stone-700">{fmt(cost)}</span></span>
                      <span className="text-xs text-stone-300">·</span>
                      <span className="text-xs text-stone-500">Önerilen: <span className="font-semibold text-primary">{fmt(suggested)}</span></span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      {recipe.ingredients?.length ?? 0} malzeme
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setDetailTarget(recipe)} className="btn-icon text-stone-400 hover:text-stone-700 hover:bg-stone-100">
                      <EyeIcon />
                    </button>
                    <button onClick={() => openEdit(recipe)} className="btn-icon text-stone-400 hover:text-stone-700 hover:bg-stone-100">
                      <EditIcon />
                    </button>
                    <button onClick={() => setDeleteTarget(recipe)} className="btn-icon text-stone-400 hover:text-red-500 hover:bg-red-50">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Tarifi Düzenle' : 'Yeni Tarif'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Tarif Adı</label>
            <input
              type="text"
              className="input"
              placeholder="örn. Çikolatalı Lav Kek"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Malzemeler</label>
              <button type="button" onClick={addIngredientLine} className="text-xs text-primary font-medium flex items-center gap-1">
                <PlusIcon /> Ekle
              </button>
            </div>
            {form.ingredients.length === 0 ? (
              <p className="text-sm text-stone-400 py-3 text-center border border-dashed border-stone-200 rounded-xl">
                Henüz malzeme eklenmedi
              </p>
            ) : (
              <div className="space-y-2">
                {form.ingredients.map((line, idx) => {
                  const ing = ingredientMap[line.ingredientId]
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="select flex-1 min-w-0"
                        value={line.ingredientId}
                        onChange={e => updateIngredientLine(idx, { ingredientId: Number(e.target.value) })}
                      >
                        {(ingredients || []).map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        className="input w-20 shrink-0"
                        placeholder="Miktar"
                        value={line.quantity}
                        onChange={e => updateIngredientLine(idx, { quantity: Number(e.target.value) })}
                      />
                      <span className="text-xs text-stone-400 w-8 shrink-0">{ing?.unit || ''}</span>
                      <button type="button" onClick={() => removeIngredientLine(idx)} className="btn-icon text-stone-300 hover:text-red-500 shrink-0">
                        <TrashIcon />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cost preview */}
          {form.ingredients.length > 0 && (
            <div className="bg-stone-50 rounded-xl p-3.5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Hesaplanan maliyet</span>
                <span className="font-semibold">{fmt(formCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Önerilen satış fiyatı (%{profitMargin} kâr)</span>
                <span className="font-semibold text-primary">{fmt(formSuggested)}</span>
              </div>
              <p className="text-xs text-stone-400 pt-1">
                Satış fiyatını sipariş oluştururken belirleyebilirsiniz.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notlar <span className="text-stone-400 font-normal">(isteğe bağlı)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Yapılış, ipuçları, porsiyon bilgisi…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">İptal</button>
            <button type="submit" className="btn-primary flex-1">{editing ? 'Kaydet' : 'Tarif Oluştur'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title={detailTarget?.name || ''}>
        {detailTarget && (() => {
          const cost = calcRecipeCost(detailTarget.ingredients, ingredientMap)
          const suggested = calcSuggestedPrice(cost, profitMargin ?? 30)
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-stone-500">Maliyet</p>
                  <p className="font-bold text-stone-900 mt-0.5">{fmt(cost)}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-stone-500">Önerilen Fiyat</p>
                  <p className="font-bold text-primary mt-0.5">{fmt(suggested)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Malzemeler</p>
                <div className="space-y-1.5">
                  {detailTarget.ingredients?.map((line, i) => {
                    const ing = ingredientMap[line.ingredientId]
                    if (!ing) return (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-stone-100">
                        <span className="text-amber-600">⚠ Malzeme bulunamadı</span>
                      </div>
                    )
                    return (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-stone-100 last:border-0">
                        <span className="text-stone-700">{ing.name} × {line.quantity} {ing.unit}</span>
                        <span className="text-stone-500">{fmt(ing.pricePerUnit * line.quantity)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              {detailTarget.notes && (
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Notlar</p>
                  <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{detailTarget.notes}</p>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Tarif silinsin mi?"
        message={`"${deleteTarget?.name}" kalıcı olarak silinecek. Mevcut siparişler etkilenmez.`}
        confirmLabel="Sil"
      />
    </div>
  )
}

function EmptyState({ search, onAdd }) {
  return (
    <div className="empty-state">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
        <CakeIcon size="lg" />
      </div>
      {search ? (
        <p className="text-stone-500">"<strong>{search}</strong>" ile eşleşen tarif bulunamadı</p>
      ) : (
        <>
          <p className="font-medium text-stone-700">Henüz tarif yok</p>
          <p className="text-sm text-stone-400 mt-1 mb-4">İlk tatlı tarifinizi oluşturun</p>
          <button onClick={onAdd} className="btn-primary">Tarif oluştur</button>
        </>
      )}
    </div>
  )
}

function LoadingList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => <div key={i} className="card p-4 h-20 animate-pulse bg-stone-100" />)}
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
function CakeIcon({ size = 'sm' }) {
  const cls = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return (
    <svg className={`${cls} text-amber-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4zM9 9V7a3 3 0 016 0v2" />
    </svg>
  )
}
function EyeIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
}

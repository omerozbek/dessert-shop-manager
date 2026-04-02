export default function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = 'Sil', danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm fade-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-stone-900 mb-2">{title}</h3>
        <p className="text-sm text-stone-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">İptal</button>
          <button
            onClick={onConfirm}
            className={`flex-1 btn ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calcProfitStats, fmtCurrency, fmtDateShort } from '../utils/calculations'

export default function Dashboard({ setCurrentView }) {
  const soldOrders = useLiveQuery(() => db.orders.where('status').equals('sold').toArray(), [])
  const pendingOrders = useLiveQuery(() => db.orders.where('status').equals('pending').toArray(), [])
  const recipeCount = useLiveQuery(() => db.recipes.count(), [])
  const ingredientCount = useLiveQuery(() => db.ingredients.count(), [])
  const currency = useLiveQuery(() => db.settings.get('currency').then(r => r?.value || 'TRY'), [])

  const stats = calcProfitStats(soldOrders || [])

  // Recent 5 sold orders
  const recentOrders = [...(soldOrders || [])].sort((a, b) =>
    new Date(b.soldAt || b.updatedAt) - new Date(a.soldAt || a.updatedAt)
  ).slice(0, 5)

  const fmt = (n) => fmtCurrency(n, currency)

  return (
    <div className="px-4 py-5 space-y-6">

      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Hoş geldiniz 👋</h2>
        <p className="text-sm text-stone-500 mt-0.5">İşte mağazanıza genel bakış</p>
      </div>

      {/* All-time stats */}
      <section>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Genel Durum</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Toplam Gelir" value={fmt(stats.revenue)} />
          <StatCard label="Toplam Maliyet" value={fmt(stats.cost)} />
          <StatCard label="Net Kâr" value={fmt(stats.profit)} color="text-green-600" />
          <StatCard
            label="Kâr Marjı"
            value={`%${stats.margin.toFixed(1)}`}
            color={stats.margin >= 20 ? 'text-green-600' : 'text-amber-600'}
          />
        </div>
      </section>

      {/* Quick stats row */}
      <section>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Özet</p>
        <div className="grid grid-cols-3 gap-3">
          <QuickStat
            label="Bekleyen"
            value={pendingOrders?.length ?? '…'}
            icon={<PendingIcon />}
            color="bg-amber-50 text-amber-600"
            onClick={() => setCurrentView('orders')}
          />
          <QuickStat
            label="Tarifler"
            value={recipeCount ?? '…'}
            icon={<RecipeIcon />}
            color="bg-primary/10 text-primary"
            onClick={() => setCurrentView('recipes')}
          />
          <QuickStat
            label="Malzemeler"
            value={ingredientCount ?? '…'}
            icon={<IngIcon />}
            color="bg-stone-100 text-stone-600"
            onClick={() => setCurrentView('ingredients')}
          />
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Son Satışlar</p>
          <button
            onClick={() => setCurrentView('orders')}
            className="text-xs text-primary font-medium"
          >
            Tümünü gör →
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-stone-400">Henüz satış yok. Bir siparişi "Satıldı" olarak işaretlediğinizde burada görünür.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {order.items?.map(i => i.recipeName).join(', ') || 'Sipariş #' + order.id}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {fmtDateShort(order.soldAt || order.updatedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">{fmt(order.totalPrice)}</p>
                    <p className="text-xs text-green-600 font-medium">
                      +{fmt(order.totalPrice - order.totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="h-2" />
    </div>
  )
}

function StatCard({ label, value, color = 'text-stone-900' }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{value ?? '…'}</span>
    </div>
  )
}

function QuickStat({ label, value, icon, color, onClick }) {
  return (
    <button onClick={onClick} className="card p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-xl font-bold text-stone-900">{value}</span>
      <span className="text-xs text-stone-500">{label}</span>
    </button>
  )
}

function PendingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function RecipeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function IngIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )
}

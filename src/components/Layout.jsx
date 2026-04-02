const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Panel',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'recipes',
    label: 'Tarifler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'ingredients',
    label: 'Malzemeler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Siparişler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Layout({ currentView, setCurrentView, pendingCount, children }) {
  const currentNav = NAV_ITEMS.find(n => n.id === currentView) || NAV_ITEMS[0]

  return (
    <div className="flex flex-col min-h-dvh bg-stone-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.5 2 7 5 7 7c0 1.4.6 2.6 1.5 3.5L8 12H7a1 1 0 000 2h1v2H7a1 1 0 000 2h1v2a1 1 0 002 0v-2h4v2a1 1 0 002 0v-2h1a1 1 0 000-2h-1v-2h1a1 1 0 000-2h-1l-.5-1.5C16.4 9.6 17 8.4 17 7c0-2-1.5-5-5-5zm0 2c2.2 0 3 1.8 3 3s-1 2.5-3 2.5S9 8.2 9 7s.8-3 3-3z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-stone-900 leading-none">Dulci</h1>
          <p className="text-xs text-stone-400 mt-0.5">{currentNav.label}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto safe-bottom">
        <div className="fade-in">{children}</div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-100 pb-safe">
        <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV_ITEMS.map(item => {
            const active = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2 relative transition-colors duration-150
                  ${active ? 'text-primary' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <div className="relative">
                  {item.icon}
                  {item.id === 'orders' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 inset-x-4 h-0.5 bg-primary rounded-b-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

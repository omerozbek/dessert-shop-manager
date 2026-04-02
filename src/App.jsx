import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/database'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Dashboard from './views/Dashboard'
import Recipes from './views/Recipes'
import Ingredients from './views/Ingredients'
import Orders from './views/Orders'
import Settings from './views/Settings'

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  const pendingCount = useLiveQuery(
    () => db.orders.where('status').equals('pending').count(),
    []
  )

  function renderView() {
    switch (currentView) {
      case 'dashboard':   return <Dashboard setCurrentView={setCurrentView} />
      case 'recipes':     return <Recipes />
      case 'ingredients': return <Ingredients />
      case 'orders':      return <Orders />
      case 'settings':    return <Settings />
      default:            return <Dashboard setCurrentView={setCurrentView} />
    }
  }

  return (
    <ToastProvider>
      <Layout
        currentView={currentView}
        setCurrentView={setCurrentView}
        pendingCount={pendingCount || 0}
      >
        {renderView()}
      </Layout>
    </ToastProvider>
  )
}

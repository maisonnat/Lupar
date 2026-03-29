import { useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Inventory from './components/inventory/Inventory'
import Reports from './components/reports/Reports'
import Settings from './components/settings/Settings'

type Page = 'dashboard' | 'inventory' | 'reports' | 'settings'

const pages: Record<Page, React.FC> = {
  dashboard: Dashboard,
  inventory: Inventory,
  reports: Reports,
  settings: Settings,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const PageComponent = pages[currentPage]

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      <PageComponent />
    </Layout>
  )
}

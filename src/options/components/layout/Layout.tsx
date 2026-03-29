import Header from './Header'
import Sidebar from './Sidebar'

type Page = 'dashboard' | 'inventory' | 'reports' | 'settings'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

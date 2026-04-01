import Header from './Header'
import Sidebar from './Sidebar'
import AuditBanner from './AuditBanner'
import { useStorage } from '@options/hooks/useStorage'
import { detectTimezone } from '@shared/utils/date-utils'

type Page = 'dashboard' | 'inventory' | 'reports' | 'settings'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: React.ReactNode
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { settings } = useStorage()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AuditBanner
        auditModeConfig={settings?.auditModeConfig ?? { auditMode: false, auditModeActivatedAt: null, auditModeActivatedBy: null }}
        timezone={settings?.timezone ?? detectTimezone()}
      />
      <div className="flex">
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

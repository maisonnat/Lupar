import { useEffect, useState } from 'react'

export default function Header() {
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    chrome.storage.local.get('app_settings', (result) => {
      if (result.app_settings && typeof result.app_settings === 'object') {
        const settings = result.app_settings as { companyName?: string }
        if (settings.companyName) {
          setCompanyName(settings.companyName)
        }
      }
    })
  }, [])

  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
      <div className="flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" fill="none"/>
          <path d="M12 8L8 10.5V15.5L12 18L16 15.5V10.5L12 8Z" fill="#2563EB"/>
          <path d="M12 2V7M12 18V22M3 7L8 10.5M16 10.5L21 7M3 17L8 15.5M16 15.5L21 17" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-900">Lupar</span>
          <span className="text-xs text-gray-400">v1.0.0</span>
        </div>
      </div>
      {companyName && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M3 7v14M21 7v14M6 11h0M6 15h0M10 11h0M10 15h0M14 11h0M14 15h0M18 11h0M18 15h0" strokeLinecap="round"/>
            <path d="M3 7l9-4 9 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{companyName}</span>
        </div>
      )}
    </header>
  )
}

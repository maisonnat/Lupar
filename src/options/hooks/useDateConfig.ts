import { useState, useEffect } from 'react'
import type { DateFormat } from '@shared/types/storage'
import { STORAGE_KEYS } from '@shared/types/storage'
import type { AppSettings } from '@shared/types/storage'
import { detectTimezone } from '@shared/utils/date-utils'

export function useDateConfig(): { dateFormat: DateFormat; timezone: string } {
  const [config, setConfig] = useState<{
    dateFormat: DateFormat
    timezone: string
  }>(() => ({
    dateFormat: 'DD/MM/YYYY',
    timezone: detectTimezone(),
  }))

  useEffect(() => {
    const load = async () => {
      const result = await chrome.storage.local.get(STORAGE_KEYS.APP_SETTINGS)
      const settings = result[STORAGE_KEYS.APP_SETTINGS] as AppSettings | undefined
      setConfig({
        dateFormat: settings?.dateFormat ?? 'DD/MM/YYYY',
        timezone: settings?.timezone ?? detectTimezone(),
      })
    }
    load()

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      if (changes[STORAGE_KEYS.APP_SETTINGS]) {
        const settings = changes[STORAGE_KEYS.APP_SETTINGS]
          .newValue as AppSettings | undefined
        setConfig({
          dateFormat: settings?.dateFormat ?? 'DD/MM/YYYY',
          timezone: settings?.timezone ?? detectTimezone(),
        })
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return config
}

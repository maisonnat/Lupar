import { useState, useEffect, useCallback } from 'react'
import type { DiscoveryRecord } from '@shared/types/discovery'
import type { AppSettings, ActivityLogEntry } from '@shared/types/storage'
import { STORAGE_KEYS } from '@shared/types/storage'

export function useStorage() {
  const [discoveries, setDiscoveries] = useState<DiscoveryRecord[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])

  const loadAll = useCallback(async () => {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.AI_DISCOVERIES,
      STORAGE_KEYS.APP_SETTINGS,
      STORAGE_KEYS.ACTIVITY_LOG,
    ])
    setDiscoveries((result[STORAGE_KEYS.AI_DISCOVERIES] as DiscoveryRecord[]) ?? [])
    setSettings((result[STORAGE_KEYS.APP_SETTINGS] as AppSettings) ?? null)
    setActivityLog((result[STORAGE_KEYS.ACTIVITY_LOG] as ActivityLogEntry[]) ?? [])
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local') return

      if (changes[STORAGE_KEYS.AI_DISCOVERIES]) {
        setDiscoveries(changes[STORAGE_KEYS.AI_DISCOVERIES].newValue ?? [])
      }
      if (changes[STORAGE_KEYS.APP_SETTINGS]) {
        setSettings(changes[STORAGE_KEYS.APP_SETTINGS].newValue ?? null)
      }
      if (changes[STORAGE_KEYS.ACTIVITY_LOG]) {
        setActivityLog(changes[STORAGE_KEYS.ACTIVITY_LOG].newValue ?? [])
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return { discoveries, settings, activityLog, reload: loadAll }
}

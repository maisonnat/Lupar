import { useState, useEffect, useCallback } from 'react'
import type { ComplianceSnapshot } from '@shared/types/compliance'
import { STORAGE_KEYS } from '@shared/types/storage'

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([])

  const loadSnapshots = useCallback(async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.COMPLIANCE_SNAPSHOTS)
    setSnapshots((result[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS] as ComplianceSnapshot[]) ?? [])
  }, [])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      if (changes[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS]) {
        setSnapshots(changes[STORAGE_KEYS.COMPLIANCE_SNAPSHOTS].newValue ?? [])
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return { snapshots, reload: loadSnapshots }
}

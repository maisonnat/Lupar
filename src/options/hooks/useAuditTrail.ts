import { useMemo } from 'react'
import type { AuditEntry } from '@shared/types/discovery'

export function useAuditTrail(auditTrail: AuditEntry[]): {
  entries: AuditEntry[]
  totalEntries: number
  hasEntries: boolean
} {
  return useMemo(() => {
    const sorted = [...auditTrail].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    return {
      entries: sorted,
      totalEntries: auditTrail.length,
      hasEntries: auditTrail.length > 0,
    }
  }, [auditTrail])
}

import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDateLong,
  formatDateTimeLong,
  formatDateShort,
  detectTimezone,
} from '@shared/utils/date-utils'

describe('date-utils', () => {
  const iso = '2026-04-01T15:30:00.000Z'
  const tz = 'America/Argentina/Buenos_Aires'

  describe('detectTimezone', () => {
    it('should return a valid IANA timezone string', () => {
      const detected = detectTimezone()
      expect(typeof detected).toBe('string')
      expect(detected.length).toBeGreaterThan(0)
    })

    it('should return fallback when Intl is unavailable', () => {
      const originalIntl = globalThis.Intl
      Object.defineProperty(globalThis, 'Intl', {
        value: { DateTimeFormat: undefined },
        writable: true,
        configurable: true,
      })
      const detected = detectTimezone()
      expect(detected).toBe('America/Argentina/Buenos_Aires')
      globalThis.Intl = originalIntl
    })
  })

  describe('formatDate', () => {
    it('should format as DD/MM/YYYY', () => {
      expect(formatDate(iso, 'DD/MM/YYYY', tz)).toBe('01/04/2026')
    })

    it('should format as MM/DD/YYYY', () => {
      expect(formatDate(iso, 'MM/DD/YYYY', tz)).toBe('04/01/2026')
    })

    it('should format as YYYY-MM-DD', () => {
      expect(formatDate(iso, 'YYYY-MM-DD', tz)).toBe('2026-04-01')
    })

    it('should handle different timezone (UTC)', () => {
      expect(formatDate(iso, 'YYYY-MM-DD', 'UTC')).toBe('2026-04-01')
    })

    it('should handle date near midnight boundary', () => {
      const nearMidnight = '2026-01-01T04:59:00.000Z'
      expect(formatDate(nearMidnight, 'DD/MM/YYYY', 'America/New_York')).toBe('31/12/2025')
    })
  })

  describe('formatDateTime', () => {
    it('should include time in configured format', () => {
      const result = formatDateTime(iso, 'DD/MM/YYYY', tz)
      expect(result).toContain('01/04/2026')
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should include time in YYYY-MM-DD format', () => {
      const result = formatDateTime(iso, 'YYYY-MM-DD', tz)
      expect(result).toContain('2026-04-01')
    })
  })

  describe('formatDateLong', () => {
    it('should format with full month name in Spanish', () => {
      const result = formatDateLong(iso, tz)
      expect(result).toBe('1 de abril de 2026')
    })

    it('should format with UTC timezone', () => {
      const result = formatDateLong(iso, 'UTC')
      expect(result).toBe('1 de abril de 2026')
    })
  })

  describe('formatDateTimeLong', () => {
    it('should include time with full month name', () => {
      const result = formatDateTimeLong(iso, tz)
      expect(result).toContain('1 de abril de 2026')
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('formatDateShort', () => {
    it('should format with abbreviated month', () => {
      const result = formatDateShort(iso, tz)
      expect(result).toBe('01-abr')
    })

    it('should format with UTC timezone', () => {
      const result = formatDateShort(iso, 'UTC')
      expect(result).toBe('01-abr')
    })
  })
})

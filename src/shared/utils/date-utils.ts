import type { DateFormat } from '@shared/types/storage'

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIMEZONE
  }
}

export function formatDate(
  iso: string,
  dateFormat: DateFormat,
  timezone: string,
): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(d)

  const day = parts.find((p) => p.type === 'day')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  const year = parts.find((p) => p.type === 'year')!.value

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
  }
}

export function formatDateTime(
  iso: string,
  dateFormat: DateFormat,
  timezone: string,
): string {
  const datePart = formatDate(iso, dateFormat, timezone)
  const timePart = new Date(iso).toLocaleTimeString('es-AR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart}`
}

export function formatDateLong(iso: string, timezone: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTimeLong(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(iso: string, timezone: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: timezone,
    day: '2-digit',
    month: 'short',
  })
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function parse(value: string | null | undefined): Date | null {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * « À l'instant », « Il y a 8 min », « Il y a 2 h », « Hier », « Il y a 3 jours », then a full date.
 */
export function formatRelativeTime(value: string | null | undefined, now: Date = new Date()): string {
  const date = parse(value)

  if (!date) return '—'

  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))

  if (seconds < MINUTE) return "À l'instant"
  if (seconds < HOUR) return `Il y a ${Math.floor(seconds / MINUTE)} min`

  const calendarDays = Math.round((startOfDay(now) - startOfDay(date)) / (DAY * 1000))

  if (calendarDays === 0 || seconds < 6 * HOUR) return `Il y a ${Math.floor(seconds / HOUR)} h`
  if (calendarDays === 1) return 'Hier'
  if (calendarDays < 7) return `Il y a ${calendarDays} jours`

  return dateFormatter.format(date)
}

/** « Aujourd'hui à 14:32 », « Hier à 09:05 » or « 1 octobre 2026 à 14:32 ». */
export function formatDateTime(value: string | null | undefined, now: Date = new Date()): string {
  const date = parse(value)

  if (!date) return '—'

  const calendarDays = Math.round((startOfDay(now) - startOfDay(date)) / (DAY * 1000))
  const day = calendarDays === 0 ? "Aujourd'hui" : calendarDays === 1 ? 'Hier' : dateFormatter.format(date)

  return `${day} à ${timeFormatter.format(date)}`
}

/** Axis label of an activity chart group: « 14h » for an hour, « lun. 29 » for a day. */
export function formatActivityLabel(value: string, granularity: 'hour' | 'day', timeZone: string): string {
  const date = parse(value)

  if (!date) return ''

  if (granularity === 'hour') {
    const hour = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', hourCycle: 'h23', timeZone }).formatToParts(date).find((part) => part.type === 'hour')?.value

    return `${hour ?? ''}h`
  }

  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone }).format(date)
}

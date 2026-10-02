import type { MapLevel, MapSituation } from '@/lib/api/types'

/**
 * Everything that defines how the map looks, in one place.
 * The thresholds of the levels are NOT here: they come from the API
 * (config/outages.php on the backend) so both sides always agree.
 */

/** The map only covers Kinshasa: it cannot be dragged or zoomed out beyond it. */
export const KINSHASA = {
  center: [-4.365, 15.33] as [number, number],
  bounds: [[-4.8, 14.95], [-3.9, 16.0]] as [[number, number], [number, number]],
  zoom: 11,
  minZoom: 10,
  maxZoom: 17,
  /** Zoom used when a commune or a quartier is selected. */
  communeZoom: 13,
  quartierZoom: 15,
}

export const TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

/** Colours of the project: blue, yellow and red (orange in between). */
export const mapLevels: Record<MapLevel, { label: string; short: string; fill: string; stroke: string; text: string }> = {
  high: { label: 'Coupure fortement signalée', short: 'Fortement signalé', fill: '#ce1021', stroke: '#7f0a14', text: '#ffffff' },
  medium: { label: 'Coupure signalée par plusieurs habitants', short: 'Plusieurs signalements', fill: '#f97316', stroke: '#9a3412', text: '#ffffff' },
  low: { label: 'Quelques signalements, à confirmer', short: 'À confirmer', fill: '#f7d618', stroke: '#8a6d00', text: '#3d2f00' },
  none: { label: 'Aucune coupure signalée récemment', short: 'Aucun signalement', fill: '#007fff', stroke: '#005bb8', text: '#ffffff' },
}

export const mapLevelOrder: MapLevel[] = ['high', 'medium', 'low', 'none']

/** « 5 à 19 signalements », from the thresholds sent by the API. */
export function levelRange(level: MapLevel, levels: MapSituation['levels']): string {
  if (level === 'none') return 'aucun signalement de coupure'
  if (level === 'high') return `${levels.high} signalements ou plus`
  if (level === 'medium') return `${levels.medium} à ${levels.high - 1} signalements`

  return levels.medium - 1 > levels.low ? `${levels.low} à ${levels.medium - 1} signalements` : `${levels.low} signalement`
}

/** The more a place is reported, the larger its marker (in pixels). */
export function markerRadius(outageReportsCount: number, kind: 'commune' | 'quartier'): number {
  const base = kind === 'commune' ? 13 : 10

  return Math.round(base + Math.min(16, Math.sqrt(outageReportsCount) * 3))
}

/** A report is « recent » for the map filter when it is less than this old. */
export const RECENT_ACTIVITY_MINUTES = 60

import { apiFetch } from '@/lib/api/client'
import type { MapPeriod, MapSituation } from '@/lib/api/types'

/** GET /api/carte — one aggregated point per commune and per reported quartier. */
export async function getMapSituation(period: MapPeriod, signal?: AbortSignal): Promise<MapSituation> {
  const response = await apiFetch<{ data: Pick<MapSituation, 'communes' | 'quartiers'>; meta: Omit<MapSituation, 'communes' | 'quartiers'> }>('carte', { query: { period }, signal })

  return { ...response.data, ...response.meta }
}

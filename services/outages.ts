import { apiFetch } from '@/lib/api/client'
import type {
  ActivityPeriod,
  ApiData,
  ApiDataWithWindow,
  Commune,
  CommuneOutageSummary,
  CommuneSituation,
  OutageActivity,
  OutageActivityPoint,
  OutageStatistics,
  QuartierOutageSummary,
  QuartierSituation,
  RecentWindow,
} from '@/lib/api/types'

export type RankedQuartier = QuartierOutageSummary & { commune: Commune }

/** GET /api/statistiques */
export async function getStatistics(signal?: AbortSignal): Promise<OutageStatistics & RecentWindow> {
  const response = await apiFetch<ApiDataWithWindow<OutageStatistics>>('statistiques', { signal })

  return { ...response.data, recent_hours: response.meta.recent_hours }
}

/** GET /api/situation/communes */
export async function getCommunesSituation(sort: 'reports' | 'name' = 'reports', signal?: AbortSignal): Promise<CommuneOutageSummary[]> {
  return (await apiFetch<ApiData<CommuneOutageSummary[]>>('situation/communes', { query: { sort }, signal })).data
}

/** GET /api/situation/communes/{commune} */
export async function getCommuneSituation(communeSlug: string, signal?: AbortSignal): Promise<CommuneSituation> {
  return (await apiFetch<ApiData<CommuneSituation>>(`situation/communes/${encodeURIComponent(communeSlug)}`, { signal })).data
}

/** GET /api/situation/quartiers — quartiers with the most recent reports, across every commune. */
export async function getMostReportedQuartiers(limit = 6, signal?: AbortSignal): Promise<RankedQuartier[]> {
  const response = await apiFetch<ApiData<QuartierOutageSummary[]>>('situation/quartiers', { query: { limit }, signal })

  return response.data.flatMap((quartier) => (quartier.commune ? [{ ...quartier, commune: quartier.commune }] : []))
}

/**
 * GET /api/situation/quartiers/{quartier}?commune={commune}
 *
 * A quartier slug is only unique inside its commune (several communes have
 * a « Salongo »), so the commune slug is always sent along.
 */
export async function getQuartierSituation(communeSlug: string, quartierSlug: string, signal?: AbortSignal): Promise<QuartierSituation> {
  const response = await apiFetch<ApiData<QuartierSituation>>(`situation/quartiers/${encodeURIComponent(quartierSlug)}`, {
    query: { commune: communeSlug },
    signal,
  })

  return response.data
}

/** GET /api/situation/quartiers/{quartier}/activite?commune={commune}&period={period} */
export async function getQuartierActivity(communeSlug: string, quartierSlug: string, period: ActivityPeriod, signal?: AbortSignal): Promise<OutageActivity> {
  const response = await apiFetch<{ data: OutageActivityPoint[]; meta: Omit<OutageActivity, 'points'> }>(
    `situation/quartiers/${encodeURIComponent(quartierSlug)}/activite`,
    { query: { commune: communeSlug, period }, signal },
  )

  return { points: response.data, ...response.meta }
}

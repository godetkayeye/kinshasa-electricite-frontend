import { apiFetch } from '@/lib/api/client'
import type { ApiData, Commune, Quartier } from '@/lib/api/types'

let communesRequest: Promise<Commune[]> | null = null

/**
 * GET /api/communes
 *
 * The list is the same for every selector of a page: in the browser the
 * request is shared instead of being repeated. A failed request is not kept.
 */
export function getCommunes(): Promise<Commune[]> {
  if (typeof window === 'undefined') return apiFetch<ApiData<Commune[]>>('communes').then((response) => response.data)

  communesRequest ??= apiFetch<ApiData<Commune[]>>('communes')
    .then((response) => response.data)
    .catch((error: unknown) => {
      communesRequest = null
      throw error
    })

  return communesRequest
}

/** GET /api/communes/{commune}/quartiers */
export async function getQuartiers(communeSlug: string, signal?: AbortSignal): Promise<Quartier[]> {
  return (await apiFetch<ApiData<Quartier[]>>(`communes/${encodeURIComponent(communeSlug)}/quartiers`, { signal })).data
}

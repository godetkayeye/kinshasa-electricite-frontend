import type { LocationActivity } from '@/lib/admin/types'
import { adminFetch } from '@/services/admin/client'

/** GET /api/admin/communes */
export async function getAdminCommunes(signal?: AbortSignal): Promise<LocationActivity[]> {
  return (await adminFetch<{ data: LocationActivity[] }>('communes', { signal })).data
}

/** GET /api/admin/communes/{commune} */
export async function getAdminCommune(slug: string, signal?: AbortSignal): Promise<LocationActivity> {
  return (await adminFetch<{ data: LocationActivity }>(`communes/${encodeURIComponent(slug)}`, { signal })).data
}

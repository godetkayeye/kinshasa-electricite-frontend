import { apiFetch } from '@/lib/api/client'
import type { ApiData, CreateOutageReportPayload, OutageReport, OutageReportReceipt } from '@/lib/api/types'

/** POST /api/signalements — 201 created, 422 invalid data, 429 too many attempts. */
export async function createOutageReport(payload: CreateOutageReportPayload): Promise<OutageReportReceipt> {
  return (await apiFetch<ApiData<OutageReportReceipt>>('signalements', { method: 'POST', body: payload })).data
}

/** GET /api/signalements/recents */
export async function getRecentReports(options: { limit?: number; quartierId?: number } = {}, signal?: AbortSignal): Promise<OutageReport[]> {
  const response = await apiFetch<ApiData<OutageReport[]>>('signalements/recents', {
    query: { limit: options.limit, quartier_id: options.quartierId },
    signal,
  })

  return response.data
}

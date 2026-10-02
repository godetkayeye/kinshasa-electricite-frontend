import type { AdminReport, ModerationReason, Paginated, ReportFilters } from '@/lib/admin/types'
import { adminFetch } from '@/services/admin/client'

/** GET /api/admin/signalements — filtered and paginated by the API. */
export function getReports(filters: ReportFilters, signal?: AbortSignal): Promise<Paginated<AdminReport>> {
  return adminFetch<Paginated<AdminReport>>('signalements', { query: filters, signal })
}

/** GET /api/admin/signalements/{id} */
export async function getReport(id: number, signal?: AbortSignal): Promise<AdminReport> {
  return (await adminFetch<{ data: AdminReport }>(`signalements/${id}`, { signal })).data
}

/** POST /api/admin/signalements/{id}/invalidate */
export async function invalidateReport(id: number, reasonCode: ModerationReason, reasonNote: string): Promise<AdminReport> {
  return (await adminFetch<{ data: AdminReport }>(`signalements/${id}/invalidate`, { method: 'POST', body: { reason_code: reasonCode, reason_note: reasonNote.trim() || null } })).data
}

/** POST /api/admin/signalements/{id}/restore */
export async function restoreReport(id: number, reasonNote: string): Promise<AdminReport> {
  return (await adminFetch<{ data: AdminReport }>(`signalements/${id}/restore`, { method: 'POST', body: { reason_note: reasonNote.trim() || null } })).data
}

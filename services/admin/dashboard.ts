import type { DashboardData } from '@/lib/admin/types'
import { adminFetch } from '@/services/admin/client'

/** GET /api/admin/dashboard */
export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  return (await adminFetch<{ data: DashboardData }>('dashboard', { signal })).data
}

import type { ActivityData } from '@/lib/admin/types'
import { adminFetch } from '@/services/admin/client'

/** GET /api/admin/activite */
export async function getActivity(signal?: AbortSignal): Promise<ActivityData> {
  const response = await adminFetch<{ data: Omit<ActivityData, 'period_days' | 'timezone'>; meta: Pick<ActivityData, 'period_days' | 'timezone'> }>('activite', { signal })

  return { ...response.data, ...response.meta }
}

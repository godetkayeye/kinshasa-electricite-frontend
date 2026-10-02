import type { AffectedArea, Commune, OutageDuration, OutageReportType, Quartier } from '@/lib/api/types'

/** Types mirroring the JSON returned by the `/api/admin` routes of the Laravel API. */

export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'admin'
  last_login_at: string | null
}

export type ModerationStatus = 'active' | 'invalidated'
export type ModerationAction = 'invalidated' | 'restored'
export type ModerationReason = 'spam' | 'duplicate' | 'abusive' | 'inconsistent' | 'other'
export type SuspicionIndicator = 'burst' | 'rapid_alternation' | 'high_volume'

export type ModerationLog = {
  id: number
  action: ModerationAction
  reason_code: ModerationReason | null
  reason_note: string | null
  admin: { id: number; name: string } | null
  created_at: string
}

export type AdminReport = {
  id: number
  report_type: OutageReportType
  commune: Commune
  quartier: Quartier
  outage_duration: OutageDuration | null
  affected_area: AffectedArea
  /** Private: shown in the back-office only, never on the public site. */
  reporter_name: string | null
  /** Private, arbitrary user content: always rendered as plain text. */
  comment: string | null
  reported_at: string
  moderation: {
    status: ModerationStatus
    moderated_at: string | null
    moderated_by?: { id: number; name: string } | null
    reason_code: ModerationReason | null
    reason_note: string | null
  }
  suspicion?: {
    is_suspicious: boolean
    indicators: SuspicionIndicator[]
    burst_reports_count: number
    opposite_reports_count: number
    volume_reports_count: number
  }
  moderation_logs?: ModerationLog[]
}

export type Paginated<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null }
}

export type ReportFilters = {
  type?: OutageReportType
  commune_id?: number
  quartier_id?: number
  date_from?: string
  date_to?: string
  moderation_status?: ModerationStatus
  suspicious?: boolean
  search?: string
  per_page?: number
  page?: number
}

export type LocationActivity = {
  id: number
  name: string
  slug: string
  commune?: Commune
  quartiers_count?: number
  /** Publicly visible reports of the period. */
  reports_count: number
  outage_reports_count: number
  restoration_reports_count: number
  invalidated_reports_count: number
  last_reported_at: string | null
  quartiers?: LocationActivity[]
}

export type DashboardData = {
  statistics: {
    reports_today: number
    outage_reports_24h: number
    restoration_reports_24h: number
    active_quartiers_24h: number
    invalidated_reports: number
    invalidated_reports_24h: number
    suspicious_reports_24h: number
  }
  latest_reports: AdminReport[]
  most_active_quartiers: LocationActivity[]
}

export type TimelinePoint = {
  period_start: string
  outage_reports_count: number
  restoration_reports_count: number
  invalidated_reports_count: number
}

export type ActivityData = {
  by_hour: TimelinePoint[]
  by_day: TimelinePoint[]
  most_active_communes: LocationActivity[]
  most_active_quartiers: LocationActivity[]
  moderation: { invalidations: number; restorations: number; by_reason: Partial<Record<ModerationReason, number>> }
  period_days: number
  timezone: string
}

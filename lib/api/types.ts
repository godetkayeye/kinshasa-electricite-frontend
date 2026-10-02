/** Types mirroring the JSON returned by the Laravel API. */

export type OutageReportType = 'outage' | 'restored'
export type SituationStatus = 'no_recent_reports' | 'outage_reports' | 'mixed_reports' | 'restoration_reports'
export type OutageDuration = 'few_hours' | 'today' | 'one_two_days' | 'three_seven_days' | 'more_than_week' | 'several_weeks' | 'unknown'
export type AffectedArea = 'whole_neighborhood' | 'partial_neighborhood' | 'unknown'
export type ActivityLevel = 'none' | 'low' | 'medium' | 'high'
export type ActivityPeriod = '24h' | '7d'

export type Commune = {
  id: number
  name: string
  slug: string
}

export type Quartier = {
  id: number
  commune_id: number
  name: string
  slug: string
}

/** Public report: the API never exposes who submitted it. */
export type OutageReport = {
  id: number
  report_type: OutageReportType
  commune: Commune
  quartier: Quartier
  /** Only set for an outage report. */
  outage_duration: OutageDuration | null
  affected_area: AffectedArea
  reported_at: string
}

export type CreateOutageReportPayload = {
  report_type: OutageReportType
  commune_id: number
  quartier_id: number
  /** Required for an outage, not sent for a power-restored report. */
  outage_duration?: OutageDuration
  affected_area: AffectedArea
  reporter_name: string | null
  comment: string | null
}

export type OutageReportReceipt = {
  id: number
  report_type: OutageReportType
  reported_at: string
}

export type OutageStatistics = {
  total_communes: number
  affected_communes: number
  affected_quartiers: number
  /** Outage and power-restored reports of the recent window. */
  recent_reports: number
  recent_outage_reports: number
  recent_restoration_reports: number
  reports_last_24_hours: number
}

/** Recent activity of a quartier, as listed inside a commune or a ranking. */
export type QuartierOutageSummary = {
  id: number
  name: string
  slug: string
  /** Only present in rankings spanning several communes. */
  commune?: Commune
  recent_reports_count: number
  outage_reports_count: number
  restoration_reports_count: number
  last_reported_at: string | null
  last_report_type: OutageReportType | null
  situation_status: SituationStatus
  activity_level: ActivityLevel
}

export type CommuneOutageSummary = Commune & {
  /** Quartiers having recent outage reports. */
  affected_quartiers_count: number
  recent_reports_count: number
  outage_reports_count: number
  restoration_reports_count: number
  last_reported_at: string | null
}

export type CommuneSituation = CommuneOutageSummary & {
  quartiers: QuartierOutageSummary[]
}

export type QuartierSituation = {
  quartier: Quartier
  commune: Commune
  recent_reports_count: number
  outage_reports_count: number
  restoration_reports_count: number
  last_reported_at: string | null
  last_report_type: OutageReportType | null
  situation_status: SituationStatus
  most_reported_outage_duration: OutageDuration | null
  most_reported_affected_area: AffectedArea | null
  activity_level: ActivityLevel
}

export type OutageActivityPoint = {
  period_start: string
  reports_count: number
  outage_reports_count: number
  restoration_reports_count: number
}

export type OutageActivity = {
  points: OutageActivityPoint[]
  period: ActivityPeriod
  granularity: 'hour' | 'day'
  timezone: string
}

export type RecentWindow = {
  /** Number of hours during which a report is considered recent. */
  recent_hours: number
}

export type ApiData<T> = { data: T }
export type ApiDataWithWindow<T> = { data: T; meta: RecentWindow }

import type { ActivityLevel, AffectedArea, OutageDuration, OutageReportType, SituationStatus } from '@/lib/api/types'

/**
 * Single source for the French labels shown in the interface and the
 * technical values exchanged with the API.
 */

export type Option<T extends string> = { value: T; label: string }

export const outageDurationOptions: Option<OutageDuration>[] = [
  { value: 'few_hours', label: 'Quelques heures' },
  { value: 'today', label: "Depuis aujourd'hui" },
  { value: 'one_two_days', label: '1 à 2 jours' },
  { value: 'three_seven_days', label: '3 à 7 jours' },
  { value: 'more_than_week', label: "Plus d'une semaine" },
  { value: 'several_weeks', label: 'Plusieurs semaines' },
  { value: 'unknown', label: 'Je ne sais pas' },
]

export const affectedAreaOptions: Option<AffectedArea>[] = [
  { value: 'whole_neighborhood', label: 'Tout le quartier' },
  { value: 'partial_neighborhood', label: 'Une partie du quartier' },
  { value: 'unknown', label: 'Je ne sais pas' },
]

const activityLevelLabels: Record<ActivityLevel, string> = {
  none: 'Aucun signalement récent',
  low: 'Quelques signalements récents',
  medium: 'Plusieurs signalements récents',
  high: 'Forte activité de signalement',
}

function labelOf<T extends string>(options: Option<T>[], value: T | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? '—'
}

export const outageDurationLabel = (value: OutageDuration | null | undefined) => labelOf(outageDurationOptions, value)
export const affectedAreaLabel = (value: AffectedArea | null | undefined) => labelOf(affectedAreaOptions, value)
export const activityLevelLabel = (level: ActivityLevel) => activityLevelLabels[level] ?? activityLevelLabels.none

/** What each type of report is called once submitted (timeline, confirmation, sharing). */
export const reportTypeLabels: Record<OutageReportType, { event: string; confirmation: string; share: string }> = {
  outage: {
    event: 'Coupure signalée',
    confirmation: 'Signalement de coupure enregistré',
    share: "Une coupure d'électricité a été signalée dans ce quartier.",
  },
  restored: {
    event: 'Retour du courant signalé',
    confirmation: 'Retour du courant signalé',
    share: 'Un retour du courant a été signalé dans ce quartier.',
  },
}

export const reportTypeLabel = (type: OutageReportType) => (reportTypeLabels[type] ?? reportTypeLabels.outage).event

/**
 * Community status of a quartier. The wording only describes what
 * inhabitants reported: it never states that the power is available or back.
 */
export const situationStatusLabels: Record<SituationStatus, { label: string; description: string; share: string }> = {
  no_recent_reports: {
    label: 'Aucun signalement récent',
    description: "Aucun habitant n'a récemment partagé de signalement pour ce quartier. Cela ne signifie pas nécessairement que l'électricité y est disponible.",
    share: 'Consultez les signalements des habitants de ce quartier.',
  },
  outage_reports: {
    label: 'Coupures signalées récemment',
    description: "Des habitants ont récemment signalé une absence d'électricité dans ce quartier. Les signalements de retour du courant, s'il y en a, sont encore trop peu nombreux pour décrire une tendance.",
    share: reportTypeLabels.outage.share,
  },
  mixed_reports: {
    label: 'Situation partagée',
    description: "Certains habitants signalent encore une coupure tandis que d'autres indiquent un retour du courant.",
    share: 'Des coupures et des retours du courant ont été signalés dans ce quartier.',
  },
  restoration_reports: {
    label: 'Retours du courant signalés récemment',
    description: 'Des habitants ont récemment indiqué que le courant est revenu dans ce quartier.',
    share: reportTypeLabels.restored.share,
  },
}

/**
 * Label of a status. With a single report the wording stays singular, so
 * one report is never presented as a trend.
 */
export function situationStatusLabel(status: SituationStatus, counts?: { outage_reports_count: number; restoration_reports_count: number }): string {
  if (status === 'restoration_reports' && counts?.restoration_reports_count === 1) return 'Retour du courant signalé récemment'
  if (status === 'outage_reports' && counts?.outage_reports_count === 1) return 'Coupure signalée récemment'

  return (situationStatusLabels[status] ?? situationStatusLabels.no_recent_reports).label
}

export const COMMUNITY_NOTICE = 'Ces informations proviennent des signalements des habitants et ne constituent pas une confirmation officielle.'

export const REPORTER_NAME_MAX_LENGTH = 80
export const COMMENT_MAX_LENGTH = 300

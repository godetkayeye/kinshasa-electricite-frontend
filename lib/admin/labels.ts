import type { ModerationAction, ModerationReason, ModerationStatus, SuspicionIndicator } from '@/lib/admin/types'

export const moderationStatusLabels: Record<ModerationStatus, string> = {
  active: 'Actif',
  invalidated: 'Invalidé',
}

export const moderationActionLabels: Record<ModerationAction, string> = {
  invalidated: 'Signalement invalidé',
  restored: 'Signalement restauré',
}

export const moderationReasonOptions: { value: ModerationReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'duplicate', label: 'Doublon évident' },
  { value: 'abusive', label: 'Contenu abusif' },
  { value: 'inconsistent', label: 'Information manifestement incohérente' },
  { value: 'other', label: 'Autre' },
]

export const moderationReasonLabel = (reason: ModerationReason | null | undefined) => moderationReasonOptions.find((option) => option.value === reason)?.label ?? '—'

/** A flag is a hint for the administrator, never a verdict. */
export const suspicionIndicatorLabels: Record<SuspicionIndicator, { label: string; description: string }> = {
  burst: { label: 'Signalements rapprochés', description: 'Plusieurs signalements pour ce quartier en quelques minutes.' },
  rapid_alternation: { label: 'Alternance rapide', description: 'Coupures et retours du courant signalés à quelques minutes d’intervalle.' },
  high_volume: { label: 'Volume inhabituel', description: 'Nombre de signalements inhabituellement élevé pour ce quartier en une heure.' },
}

export const REASON_NOTE_MAX_LENGTH = 500

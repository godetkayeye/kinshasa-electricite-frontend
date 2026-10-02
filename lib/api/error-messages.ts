import type { ApiError } from '@/lib/api/client'

/**
 * Visitor-facing messages for a refused report (HTTP 429), keyed by the
 * `code` sent by the API. The API message itself is never displayed.
 */
const rateLimitMessages: Record<string, string> = {
  too_many_reports: 'Trop de signalements ont été envoyés récemment. Veuillez patienter quelques minutes avant de réessayer.',
  duplicate_report: "Plusieurs signalements identiques ont déjà été envoyés récemment pour ce quartier. Veuillez patienter avant d'en envoyer un autre.",
}

/** Message shown above the report form when its submission failed. */
export function reportSubmissionMessage(error: ApiError): string {
  if (error.kind === 'validation') return 'Certaines informations sont invalides. Corrigez les champs indiqués puis renvoyez votre signalement.'
  if (error.kind === 'rate_limit') return rateLimitMessages[error.code ?? ''] ?? rateLimitMessages.too_many_reports
  if (error.kind === 'network') return "Impossible d'envoyer votre signalement : le service est injoignable. Vérifiez votre connexion puis réessayez."

  return "Impossible d'envoyer votre signalement pour le moment."
}

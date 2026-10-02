'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { focusRing, Notice } from '@/components/admin/ui'
import { moderationReasonOptions, REASON_NOTE_MAX_LENGTH } from '@/lib/admin/labels'
import type { AdminReport, ModerationReason } from '@/lib/admin/types'
import { toApiError } from '@/lib/api/client'
import { invalidateReport, restoreReport } from '@/services/admin/reports'

type Props = {
  action: 'invalidate' | 'restore'
  report: AdminReport
  onClose: () => void
  onDone: (report: AdminReport) => void
}

/**
 * Confirmation of a moderation decision. It uses the native <dialog>: the
 * focus is trapped inside, Escape closes it and the page behind is inert.
 */
export function ModerationDialog({ action, report, onClose, onDone }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const submitting = useRef(false)
  const [reason, setReason] = useState<ModerationReason | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const invalidating = action === 'invalidate'
  const noteRequired = invalidating && reason === 'other'
  const canSubmit = !loading && (!invalidating || (reason !== '' && (!noteRequired || note.trim() !== '')))

  // The dialog is opened when mounted and closed when unmounted. The parent is
  // only told about closings decided by the administrator (Cancel, Escape):
  // the native `close` event is not used, as it also fires on unmount.
  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) dialog.showModal()

    return () => dialog?.close()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    // The ref guards against a double click, even before the next render.
    if (!canSubmit || submitting.current) return

    submitting.current = true
    setLoading(true)
    setError(null)

    try {
      onDone(invalidating && reason ? await invalidateReport(report.id, reason, note) : await restoreReport(report.id, note))
    } catch (caught) {
      const failure = toApiError(caught)

      setError(failure.fieldError('reason_code') ?? failure.fieldError('reason_note') ?? failure.message)
      setLoading(false)
      submitting.current = false
    }
  }

  const fieldClass = 'w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: ignored while the decision is being saved.
        event.preventDefault()
        if (!loading) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-[#e2e8f0] bg-white p-0 text-[#0f172a] shadow-2xl backdrop:bg-[#0f172a]/50"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 p-6 sm:p-7">
        <div>
          <h2 id={titleId} className="text-xl font-bold">{invalidating ? 'Invalider le signalement' : 'Restaurer le signalement'} n° {report.id}</h2>
          <p className="mt-2 text-sm leading-6 text-[#475569]">
            {invalidating
              ? 'Le signalement ne sera plus pris en compte dans les statistiques, la situation des quartiers, les classements, les graphiques et les signalements récents du site public. Il reste conservé et visible ici.'
              : 'Le signalement sera de nouveau pris en compte dans toutes les données publiques. L’invalidation précédente reste dans l’historique.'}
          </p>
        </div>
        {invalidating && (
          <label className="flex flex-col gap-1.5 text-sm font-bold">Motif (obligatoire)
            <select value={reason} required onChange={(event) => setReason(event.target.value as ModerationReason | '')} className={`${fieldClass} h-11 font-normal`}>
              <option value="">Sélectionner un motif</option>
              {moderationReasonOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-bold">{noteRequired ? 'Précision (obligatoire)' : 'Précision (facultative)'}
          <textarea value={note} rows={3} maxLength={REASON_NOTE_MAX_LENGTH} required={noteRequired} onChange={(event) => setNote(event.target.value)} className={`${fieldClass} resize-none py-2 font-normal`} />
          <span className="text-right text-xs font-normal text-[#64748b]">{note.length} / {REASON_NOTE_MAX_LENGTH}</span>
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={loading} className={`inline-flex h-11 items-center justify-center rounded-xl border border-[#cbd5e1] px-4 font-bold hover:border-[#007fff] hover:text-[#007fff] disabled:opacity-50 ${focusRing}`}>Annuler</button>
          <button type="submit" disabled={!canSubmit} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${invalidating ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : 'bg-[#007fff] hover:bg-[#006fe0]'}`}>
            {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {invalidating ? (loading ? 'Invalidation…' : 'Invalider le signalement') : (loading ? 'Restauration…' : 'Restaurer le signalement')}
          </button>
        </div>
      </form>
    </dialog>
  )
}

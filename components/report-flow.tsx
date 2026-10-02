'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, RotateCcw, Share2, Zap } from 'lucide-react'
import { LocationPicker } from '@/components/location-picker'
import { isReportType, reportTypeNames, ReportTypeCards } from '@/components/report-type-cards'
import { SiteFooter } from '@/components/site-footer'
import { ApiError, toApiError } from '@/lib/api/client'
import { reportSubmissionMessage } from '@/lib/api/error-messages'
import type { AffectedArea, Commune, OutageDuration, OutageReportReceipt, OutageReportType, Quartier } from '@/lib/api/types'
import { formatDateTime } from '@/lib/format-date'
import { affectedAreaOptions, COMMENT_MAX_LENGTH, COMMUNITY_NOTICE, outageDurationOptions, reportTypeLabels, REPORTER_NAME_MAX_LENGTH } from '@/lib/outage-options'
import { findByName, useCommunes, useQuartiers } from '@/lib/use-locations'
import { createOutageReport } from '@/services/reports'

type FormData = {
  reportType: OutageReportType | ''
  /** Names picked in the lists of the API. */
  commune: string
  quartier: string
  outageDuration: OutageDuration | ''
  affectedArea: AffectedArea | ''
  reporterName: string
  comment: string
}
type FieldKey = keyof FormData
type FieldErrors = Partial<Record<FieldKey, string>>
type RequestState = 'idle' | 'loading' | 'success' | 'error'
type SubmittedReport = { receipt: OutageReportReceipt; type: OutageReportType; commune: Commune; quartier: Quartier }

const emptyForm: FormData = { reportType: '', commune: '', quartier: '', outageDuration: '', affectedArea: '', reporterName: '', comment: '' }

// Three short screens, then the confirmation: what, where, and the situation.
const STEP_TYPE = 1
const STEP_LOCATION = 2
const STEP_SITUATION = 3

/** Laravel validation field → form field, and the step showing that field. */
const apiFields: Record<string, { field: FieldKey; step: number }> = {
  report_type: { field: 'reportType', step: STEP_TYPE },
  commune_id: { field: 'commune', step: STEP_LOCATION },
  quartier_id: { field: 'quartier', step: STEP_LOCATION },
  outage_duration: { field: 'outageDuration', step: STEP_SITUATION },
  affected_area: { field: 'affectedArea', step: STEP_SITUATION },
  comment: { field: 'comment', step: STEP_SITUATION },
  reporter_name: { field: 'reporterName', step: STEP_SITUATION },
}

const stepLabels = (type: OutageReportType | '') => ['Type', 'Lieu', type === 'restored' ? 'Zone rétablie' : 'Situation']

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30'
const primaryButton = `inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#007fff] px-5 text-base font-bold text-white hover:bg-[#006fe0] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`
const secondaryButton = `inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-5 text-base font-bold text-[#0f172a] hover:border-[#007fff] hover:text-[#0067d8] disabled:opacity-50 ${focusRing}`
const choiceClass = (selected: boolean) => `flex min-h-12 items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-base font-semibold transition ${focusRing} ${selected ? 'border-[#007fff] bg-[#eff6ff] text-[#0067d8] ring-2 ring-[#007fff]/10' : 'border-[#cbd5e1] bg-white text-[#334155] hover:border-[#007fff]'}`
const inputClass = 'w-full scroll-mb-28 rounded-xl border border-[#cbd5e1] bg-white px-4 text-base text-[#0f172a] outline-none transition placeholder:text-[#64748b] focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15'

function FlagLine() { return <div aria-hidden="true" className="h-1 w-full bg-[linear-gradient(90deg,#007fff_0_48%,#f7d618_48%_52%,#ce1021_52%)]" /> }

function Header() {
  return (
    <header className="border-b border-[#e2e8f0] bg-white">
      <FlagLine />
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-5">
        <Link href="/" className={`flex min-h-11 items-center gap-3 rounded-xl ${focusRing}`}>
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-[#007fff] text-white sm:size-10"><Zap fill="currentColor" /></span>
          <strong className="text-sm tracking-tight text-[#0f172a]">Kinshasa Électricité</strong>
        </Link>
        <Link href="/" className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#475569] hover:text-[#0067d8] ${focusRing}`}>Quitter</Link>
      </div>
    </header>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="flex items-center gap-1 text-sm font-semibold text-[#b91c1c]"><AlertCircle aria-hidden="true" className="size-4 shrink-0" />{message}</p> : null
}

function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="mb-6">
      <p className="mb-2 flex items-center justify-between text-sm font-bold"><span className="text-[#0067d8]">Étape {current} sur {labels.length}</span><span className="text-[#475569]">{labels[current - 1]}</span></p>
      <div role="progressbar" aria-label="Progression du signalement" aria-valuemin={1} aria-valuemax={labels.length} aria-valuenow={current} className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
        <div className="h-full rounded-full bg-[#007fff] transition-all" style={{ width: `${(current / labels.length) * 100}%` }} />
      </div>
    </div>
  )
}

/** A group of large buttons of which one is chosen. */
function Choices<T extends string>({ legend, options, value, onChange, error, columns }: { legend: string; options: { value: T; label: string }[]; value: T | ''; onChange: (value: T) => void; error?: string; columns: string }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-base font-bold text-[#0f172a]">{legend}</legend>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => (
          <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={choiceClass(value === option.value)}>
            {option.label}
            {value === option.value && <Check aria-hidden="true" className="size-5 shrink-0" />}
          </button>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  )
}

export function ReportFlow() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const communeParam = searchParams.get('commune') ?? ''
  const quartierParam = searchParams.get('quartier') ?? ''
  const initialType: OutageReportType | '' = isReportType(typeParam) ? typeParam : ''

  // A link such as /signaler?type=restored already answers the first question.
  const [step, setStep] = useState(initialType ? STEP_LOCATION : STEP_TYPE)
  const [form, setForm] = useState<FormData>({ ...emptyForm, reportType: initialType })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  const [submitted, setSubmitted] = useState<SubmittedReport | null>(null)
  const [shared, setShared] = useState(false)
  const [picker, setPicker] = useState<'commune' | 'quartier' | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const communes = useCommunes()
  const commune = findByName(communes.data, form.commune)
  const quartiers = useQuartiers(commune?.slug)
  const quartier = findByName(quartiers.data, form.quartier)
  const isRestored = form.reportType === 'restored'
  const labels = stepLabels(form.reportType)

  // Preselect the commune then the quartier named in the URL (?commune=lemba&quartier=salongo),
  // once each list has been loaded. Unknown values are ignored and the visitor simply selects
  // the location normally. The state is adjusted while rendering, not in an effect.
  const [prefilled, setPrefilled] = useState({ commune: communeParam === '', quartier: quartierParam === '' })

  if (!prefilled.commune && communes.data) {
    const match = communes.data.find((item) => item.slug === communeParam)

    setPrefilled({ commune: true, quartier: prefilled.quartier || !match })
    if (match && !form.commune) setForm({ ...form, commune: match.name })
  }

  if (!prefilled.quartier && quartiers.data && commune?.slug === communeParam) {
    const match = quartiers.data.find((item) => item.slug === quartierParam)

    setPrefilled({ ...prefilled, quartier: true })
    if (match && !form.quartier) {
      setForm({ ...form, quartier: match.name })
      // Coming from a quartier page with the type already chosen: straight to the last screen.
      if (form.reportType && step === STEP_LOCATION) setStep(STEP_SITUATION)
    }
  }

  const setValue = <K extends FieldKey>(key: K, value: FormData[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setSubmitError(null)
  }

  const chooseType = (type: OutageReportType) => {
    setValue('reportType', type)
    setStep(STEP_LOCATION)
  }

  const chooseCommune = (name: string) => {
    setPrefilled({ commune: true, quartier: true })
    // The quartiers belong to a commune: changing it resets the quartier,
    // and the list of quartiers opens right away.
    setForm((previous) => ({ ...previous, commune: name, quartier: previous.commune === name ? previous.quartier : '' }))
    setErrors((previous) => ({ ...previous, commune: undefined, quartier: undefined }))
    setSubmitError(null)
    setPicker('quartier')
  }

  const chooseQuartier = (name: string) => {
    setPrefilled({ ...prefilled, quartier: true })
    setValue('quartier', name)
    setPicker(null)
    setStep(STEP_SITUATION)
  }

  const showErrors = (next: FieldErrors) => {
    setErrors(next)
    if (next.comment || next.reporterName) setDetailsOpen(true)
    // The first message is brought into view, next to its field.
    requestAnimationFrame(() => document.querySelector('main [role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  const validate = (targetStep: number) => {
    const next: FieldErrors = {}

    if (targetStep === STEP_TYPE && !form.reportType) next.reportType = 'Choisissez ce que vous souhaitez signaler.'
    if (targetStep === STEP_LOCATION) {
      if (!commune) next.commune = 'Choisissez votre commune.'
      if (!quartier) next.quartier = 'Choisissez votre quartier.'
    }
    if (targetStep === STEP_SITUATION) {
      if (!isRestored && !form.outageDuration) next.outageDuration = 'Choisissez une durée.'
      if (!form.affectedArea) next.affectedArea = isRestored ? 'Choisissez la zone où le courant est revenu.' : 'Choisissez la zone concernée.'
      if (form.comment.length > COMMENT_MAX_LENGTH) next.comment = `Le commentaire ne doit pas dépasser ${COMMENT_MAX_LENGTH} caractères.`
      if (form.reporterName.length > REPORTER_NAME_MAX_LENGTH) next.reporterName = `Le nom ne doit pas dépasser ${REPORTER_NAME_MAX_LENGTH} caractères.`
    }

    if (Object.keys(next).length) showErrors(next)
    else setErrors({})

    return Object.keys(next).length === 0
  }

  const goBack = () => { setErrors({}); setSubmitError(null); setStep((current) => Math.max(STEP_TYPE, current - 1)) }

  const send = async () => {
    if (requestState === 'loading' || !validate(STEP_SITUATION)) return
    if (!form.reportType || !commune || !quartier || !form.affectedArea) { setStep(STEP_LOCATION); validate(STEP_LOCATION); return }

    const type = form.reportType

    setRequestState('loading')
    setSubmitError(null)

    try {
      const receipt = await createOutageReport({
        report_type: type,
        commune_id: commune.id,
        quartier_id: quartier.id,
        // A duration only describes an outage: it is not sent for a power-restored report.
        ...(type === 'outage' && form.outageDuration ? { outage_duration: form.outageDuration } : {}),
        affected_area: form.affectedArea,
        reporter_name: form.reporterName.trim() || null,
        comment: form.comment.trim() || null,
      })

      setSubmitted({ receipt, type, commune, quartier })
      setRequestState('success')
      window.scrollTo({ top: 0 })
    } catch (caught) {
      const error = toApiError(caught)

      // The form is kept as typed, whatever the failure.
      setRequestState('error')
      setSubmitError(error)

      if (error.kind === 'validation') {
        const fieldErrors: FieldErrors = {}
        let firstStep = STEP_SITUATION

        for (const [apiField, messages] of Object.entries(error.errors)) {
          const target = apiFields[apiField]

          if (target && messages[0]) {
            fieldErrors[target.field] = messages[0]
            firstStep = Math.min(firstStep, target.step)
          }
        }

        setStep(firstStep)
        showErrors(fieldErrors)
      } else {
        requestAnimationFrame(() => document.querySelector('main [role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
      }
    }
  }

  const startOver = () => { setForm(emptyForm); setSubmitted(null); setRequestState('idle'); setSubmitError(null); setErrors({}); setShared(false); setDetailsOpen(false); setStep(STEP_TYPE); window.scrollTo({ top: 0 }) }

  if (submitted && requestState === 'success') {
    const situationPath = `/situation/${submitted.commune.slug}/${submitted.quartier.slug}`
    const typeLabels = reportTypeLabels[submitted.type]
    const share = async () => {
      const text = `${submitted.quartier.name}, ${submitted.commune.name} (Kinshasa) — ${typeLabels.share} ${COMMUNITY_NOTICE}`
      const url = `${window.location.origin}${situationPath}`

      try {
        if (navigator.share) await navigator.share({ title: typeLabels.event, text, url })
        else {
          await navigator.clipboard?.writeText(`${text} ${url}`)
          setShared(true)
        }
      } catch {
        // The visitor closed the share sheet: nothing to report.
      }
    }

    return (
      <>
        <Header />
        <main id="contenu" className="mx-auto max-w-2xl px-4 py-8 sm:px-5 sm:py-14">
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 text-center sm:p-10">
            <div aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e8f7ef] text-[#15803d]"><CheckCircle2 /></div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl" role="status">{typeLabels.confirmation}</h1>
            <p className="mx-auto mt-2 max-w-md leading-7 text-[#475569]">Merci. Votre signalement contribue à mettre à jour la situation électrique de votre quartier.</p>
            <dl className="mt-6 divide-y divide-[#e2e8f0] rounded-xl border border-[#e2e8f0] text-left">
              <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-sm text-[#475569]">Quartier</dt><dd className="text-right font-bold">{submitted.quartier.name}, {submitted.commune.name}</dd></div>
              <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-sm text-[#475569]">Signalé</dt><dd className="text-right font-bold">{formatDateTime(submitted.receipt.reported_at)}</dd></div>
              <div className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-sm text-[#475569]">Numéro</dt><dd className="text-right font-bold">{submitted.receipt.id}</dd></div>
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={situationPath} className={primaryButton}>Voir la situation du quartier <ArrowRight aria-hidden="true" /></Link>
              <button type="button" onClick={startOver} className={secondaryButton}><RotateCcw aria-hidden="true" /> Faire un autre signalement</button>
              <button type="button" onClick={share} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl text-base font-bold text-[#0067d8] hover:underline ${focusRing}`}>{shared ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}{shared ? 'Lien copié' : 'Partager'}</button>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    )
  }

  const sending = requestState === 'loading'

  return (
    <>
      <Header />
      <main id="contenu" className="bg-[#f8fafc]">
        <div className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">Faire un signalement</h1>
          {step === STEP_TYPE && <p className="mt-2 text-[#475569]">Aucun compte nécessaire. Cela prend moins d&apos;une minute.</p>}

          <section className="mt-5 rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-8">
            <Stepper current={step} labels={labels} />

            {submitError && requestState === 'error' && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm font-semibold leading-6 text-[#b91c1c]">
                <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />
                <p>{reportSubmissionMessage(submitError)}</p>
              </div>
            )}

            {step === STEP_TYPE && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">Que souhaitez-vous signaler ?</h2>
                <ReportTypeCards value={form.reportType} onChange={chooseType} />
                <FieldError message={errors.reportType} />
                {form.reportType && <button type="button" onClick={() => setStep(STEP_LOCATION)} className={primaryButton}>Continuer <ArrowRight aria-hidden="true" /></button>}
              </div>
            )}

            {step === STEP_LOCATION && (
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">{isRestored ? 'Où le courant est-il revenu ?' : 'Où se situe la coupure ?'}</h2>
                <LocationPicker
                  label="Commune"
                  value={commune?.name ?? ''}
                  placeholder={communes.loading ? 'Chargement des communes…' : 'Choisir une commune'}
                  options={communes.data}
                  loading={communes.loading}
                  loadError={communes.error ? 'Impossible de charger les communes.' : undefined}
                  onRetry={communes.reload}
                  error={errors.commune}
                  open={picker === 'commune'}
                  onOpenChange={(open) => setPicker(open ? 'commune' : null)}
                  onSelect={(option) => chooseCommune(option.name)}
                />
                <LocationPicker
                  label="Quartier"
                  value={quartier?.name ?? ''}
                  placeholder={!commune ? "Choisissez d'abord une commune" : quartiers.loading ? 'Chargement des quartiers…' : 'Choisir un quartier'}
                  options={quartiers.data}
                  loading={quartiers.loading}
                  loadError={quartiers.error ? 'Impossible de charger les quartiers.' : undefined}
                  onRetry={quartiers.reload}
                  disabled={!commune}
                  error={errors.quartier}
                  open={picker === 'quartier'}
                  onOpenChange={(open) => setPicker(open ? 'quartier' : null)}
                  onSelect={(option) => chooseQuartier(option.name)}
                />
                {communes.error && <p role="alert" className="text-sm font-semibold text-[#b91c1c]">Impossible de charger les communes. <button type="button" onClick={communes.reload} className="min-h-11 underline">Réessayer</button></p>}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={goBack} className={secondaryButton}><ArrowLeft aria-hidden="true" /> Retour</button>
                  <button type="button" onClick={() => { if (validate(STEP_LOCATION)) setStep(STEP_SITUATION) }} className={primaryButton}>Continuer <ArrowRight aria-hidden="true" /></button>
                </div>
              </div>
            )}

            {step === STEP_SITUATION && (
              <form onSubmit={(event) => { event.preventDefault(); void send() }} noValidate className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f1f5f9] px-4 py-3">
                  <p className="min-w-0 text-sm leading-6 text-[#334155]"><strong className="block text-base text-[#0f172a]">{form.reportType ? reportTypeNames[form.reportType] : ''}</strong>{quartier?.name}, {commune?.name}</p>
                  <button type="button" onClick={() => setStep(STEP_LOCATION)} className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold text-[#0067d8] underline ${focusRing}`}>Modifier<span className="sr-only"> le lieu</span></button>
                </div>

                {!isRestored && <Choices legend="Depuis combien de temps ?" options={outageDurationOptions} value={form.outageDuration} onChange={(value) => setValue('outageDuration', value)} error={errors.outageDuration} columns="grid-cols-2" />}
                <Choices legend={isRestored ? 'Le courant est revenu dans quelle zone ?' : 'Quelle zone est touchée ?'} options={affectedAreaOptions} value={form.affectedArea} onChange={(value) => setValue('affectedArea', value)} error={errors.affectedArea} columns="grid-cols-1 sm:grid-cols-3" />

                <details open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} className="rounded-xl border border-[#e2e8f0]">
                  <summary className={`flex min-h-12 cursor-pointer items-center rounded-xl px-4 text-base font-bold text-[#0067d8] ${focusRing}`}>Ajouter un commentaire ou un nom (facultatif)</summary>
                  <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="comment" className="text-sm font-bold text-[#0f172a]">Commentaire</label>
                      <textarea id="comment" value={form.comment} maxLength={COMMENT_MAX_LENGTH} rows={3} onChange={(event) => setValue('comment', event.target.value)} aria-invalid={Boolean(errors.comment)} placeholder={isRestored ? 'Ex. revenu sur notre avenue vers 21 h' : 'Ex. certaines avenues ont du courant'} className={`${inputClass} resize-none py-3`} />
                      <p className="flex items-center justify-between text-xs text-[#475569]"><span>Non affiché sur le site.</span><span>{form.comment.length} / {COMMENT_MAX_LENGTH}</span></p>
                      <FieldError message={errors.comment} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reporter-name" className="text-sm font-bold text-[#0f172a]">Nom ou pseudonyme</label>
                      <input id="reporter-name" value={form.reporterName} maxLength={REPORTER_NAME_MAX_LENGTH} autoComplete="off" enterKeyHint="done" onChange={(event) => setValue('reporterName', event.target.value)} aria-invalid={Boolean(errors.reporterName)} className={`${inputClass} h-12`} />
                      <p className="text-xs text-[#475569]">Non affiché sur le site. Vous pouvez rester anonyme.</p>
                      <FieldError message={errors.reporterName} />
                    </div>
                  </div>
                </details>

                {/* On a phone the send button stays in reach at the bottom of the screen. */}
                <div className="sticky bottom-0 -mx-4 -mb-4 flex gap-3 rounded-b-2xl border-t border-[#e2e8f0] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:m-0 sm:justify-between sm:border-0 sm:p-0">
                  <button type="button" onClick={goBack} disabled={sending} className={`${secondaryButton} px-4`}><ArrowLeft aria-hidden="true" /><span className="sr-only sm:not-sr-only">Retour</span></button>
                  <button type="submit" disabled={sending} className={`${primaryButton} flex-1 sm:flex-none`}>{sending ? <><Loader2 aria-hidden="true" className="animate-spin" /> Envoi en cours…</> : <><Check aria-hidden="true" /> Envoyer le signalement</>}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
      {step !== STEP_SITUATION && <SiteFooter />}
    </>
  )
}

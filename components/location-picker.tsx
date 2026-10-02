'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react'
import { normalizeName } from '@/lib/use-locations'

type Option = { id: number; name: string }

type Props = {
  label: string
  /** Name of the selected option, or an empty string. */
  value: string
  placeholder: string
  options: Option[] | undefined
  loading?: boolean
  loadError?: string
  onRetry?: () => void
  disabled?: boolean
  error?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (option: Option) => void
}

/** Lists longer than this get a search field. */
const SEARCH_FROM = 9

/**
 * Picker made for touch screens: a large button opens a full-screen list
 * (a centred panel on wide screens) with big rows and an optional search.
 * The search field is never focused automatically, so the on-screen keyboard
 * only opens when the visitor wants to type.
 */
export function LocationPicker({ label, value, placeholder, options, loading, loadError, onRetry, disabled, error, open, onOpenChange, onSelect }: Props) {
  const buttonId = useId()
  const errorId = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={buttonId} className="text-sm font-bold text-[#0f172a]">{label}</label>
      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-describedby={error ? errorId : undefined}
        onClick={() => onOpenChange(true)}
        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-base transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#64748b] ${error ? 'border-[#b91c1c]' : 'border-[#cbd5e1] hover:border-[#007fff]'}`}
      >
        <span className={value ? 'font-semibold text-[#0f172a]' : 'text-[#64748b]'}>{value || placeholder}</span>
        <ChevronDown aria-hidden="true" className="shrink-0 text-[#64748b]" />
      </button>
      {error && <p id={errorId} role="alert" className="flex items-center gap-1 text-sm font-semibold text-[#b91c1c]"><AlertCircle aria-hidden="true" className="size-4 shrink-0" />{error}</p>}
      {open && <PickerDialog title={label} value={value} options={options} loading={loading} loadError={loadError} onRetry={onRetry} onClose={() => onOpenChange(false)} onSelect={onSelect} />}
    </div>
  )
}

function PickerDialog({ title, value, options, loading, loadError, onRetry, onClose, onSelect }: Pick<Props, 'value' | 'options' | 'loading' | 'loadError' | 'onRetry' | 'onSelect'> & { title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [query, setQuery] = useState('')
  const filtered = (options ?? []).filter((option) => normalizeName(option.name).includes(normalizeName(query)))

  // Opened when mounted, closed when unmounted. Closings decided by the
  // visitor (button, Escape, backdrop) go through `onClose`.
  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) dialog.showModal()

    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-full max-w-none flex-col bg-white p-0 text-[#0f172a] backdrop:bg-[#0f172a]/50 sm:inset-auto sm:m-auto sm:h-auto sm:max-h-[min(80dvh,640px)] sm:w-full sm:max-w-md sm:rounded-2xl sm:shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-xl hover:bg-[#f1f5f9] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#007fff]/30"><X aria-hidden="true" /><span className="sr-only">Fermer</span></button>
      </div>
      {(options?.length ?? 0) >= SEARCH_FROM && (
        <div className="border-b border-[#e2e8f0] px-4 py-3">
          <label className="relative block">
            <span className="sr-only">Rechercher dans la liste</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#64748b]" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" autoComplete="off" autoCorrect="off" enterKeyHint="search" className="h-12 w-full rounded-xl border border-[#cbd5e1] bg-white pl-10 pr-3 text-base outline-none focus:border-[#007fff] focus:ring-4 focus:ring-[#007fff]/15" />
          </label>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        {loading && !options && <p role="status" className="px-4 py-6 text-[#475569]">Chargement…</p>}
        {loadError && (
          <p role="alert" className="px-4 py-6 font-semibold text-[#b91c1c]">
            {loadError} {onRetry && <button type="button" onClick={onRetry} className="ml-1 min-h-11 underline">Réessayer</button>}
          </p>
        )}
        {options && filtered.length === 0 && <p className="px-4 py-6 text-[#475569]">{options.length === 0 ? 'Aucun élément disponible.' : 'Aucun résultat pour cette recherche.'}</p>}
        <ul>
          {filtered.map((option) => {
            const selected = option.name === value

            return (
              <li key={option.id} className="border-b border-[#f1f5f9]">
                <button type="button" aria-pressed={selected} onClick={() => onSelect(option)} className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left text-base focus:outline-none focus-visible:bg-[#eff6ff] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#007fff]/30 ${selected ? 'bg-[#eff6ff] font-bold text-[#0067d8]' : 'hover:bg-[#f8fafc]'}`}>
                  {option.name}
                  {selected && <Check aria-hidden="true" className="shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </dialog>
  )
}

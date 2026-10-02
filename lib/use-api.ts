'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type ApiError, toApiError } from '@/lib/api/client'

export type ApiState<T> = {
  data: T | undefined
  error: ApiError | null
  loading: boolean
  reload: () => void
}

/** Outcome of the last request that finished, and which request it was. */
type Settled<T> = { key: string | null; attempt: number; data: T | undefined; error: ApiError | null }

/**
 * Load data from the API and expose its loading / error / success state.
 *
 * `key` identifies the request: the data is fetched again whenever it
 * changes, and nothing is fetched while it is `null`. `initialData` is data
 * the server already loaded for that key, so the page does not ask twice.
 */
export function useApi<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>, options: { initialData?: T } = {}): ApiState<T> {
  const { initialData } = options
  const [settled, setSettled] = useState<Settled<T>>({ key: initialData !== undefined ? key : null, attempt: 0, data: initialData, error: null })
  const [attempt, setAttempt] = useState(0)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  // The state is derived: a request is in progress whenever the last settled
  // outcome does not belong to the current key and attempt.
  const isSettled = key !== null && settled.key === key && settled.attempt === attempt

  useEffect(() => {
    if (key === null || isSettled) return

    const controller = new AbortController()

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data, error: null })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data: undefined, error: toApiError(error) })
      },
    )

    return () => controller.abort()
  }, [key, attempt, isSettled])

  const reload = useCallback(() => setAttempt((current) => current + 1), [])

  if (key === null) return { data: undefined, error: null, loading: false, reload }

  return {
    // While reloading the same key, the previous data stays on screen.
    data: settled.key === key ? settled.data : undefined,
    error: isSettled ? settled.error : null,
    loading: !isSettled,
    reload,
  }
}

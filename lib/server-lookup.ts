import { cache } from 'react'
import { ApiError } from '@/lib/api/client'
import type { CommuneSituation, QuartierSituation } from '@/lib/api/types'
import { getCommuneSituation, getQuartierSituation } from '@/services/outages'

/**
 * Server-side lookups used for page titles and 404 pages.
 *
 * - `not-found`: the API confirmed the commune / quartier does not exist.
 * - `unavailable`: the API could not be reached. The page still renders and
 *   its client sections show their own error state with a retry button.
 */
export type Lookup<T> = { status: 'found'; data: T } | { status: 'not-found' } | { status: 'unavailable' }

async function lookup<T>(load: () => Promise<T>): Promise<Lookup<T>> {
  try {
    return { status: 'found', data: await load() }
  } catch (error) {
    return error instanceof ApiError && error.status === 404 ? { status: 'not-found' } : { status: 'unavailable' }
  }
}

export const lookupCommune = cache((communeSlug: string): Promise<Lookup<CommuneSituation>> => lookup(() => getCommuneSituation(communeSlug)))

export const lookupQuartier = cache((communeSlug: string, quartierSlug: string): Promise<Lookup<QuartierSituation>> => lookup(() => getQuartierSituation(communeSlug, quartierSlug)))

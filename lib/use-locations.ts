'use client'

import { useApi, type ApiState } from '@/lib/use-api'
import type { Commune, Quartier } from '@/lib/api/types'
import { getCommunes, getQuartiers } from '@/services/locations'

/** The communes of Kinshasa, loaded from the API. */
export function useCommunes(): ApiState<Commune[]> {
  return useApi('communes', () => getCommunes())
}

/** The quartiers of a commune. Nothing is loaded until a commune is selected. */
export function useQuartiers(communeSlug: string | null | undefined): ApiState<Quartier[]> {
  return useApi(communeSlug ? `quartiers:${communeSlug}` : null, (signal) => getQuartiers(communeSlug ?? '', signal))
}

/** Accent- and case-insensitive key used to match what a visitor typed with a name. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function findByName<T extends { name: string }>(items: T[] | undefined, name: string): T | undefined {
  const key = normalizeName(name)

  return key ? items?.find((item) => normalizeName(item.name) === key) : undefined
}

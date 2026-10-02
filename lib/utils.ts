import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** « 1 signalement récent », « 3 signalements récents » (0 is singular in French). */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('fr-FR')} ${count > 1 ? plural : singular}`
}

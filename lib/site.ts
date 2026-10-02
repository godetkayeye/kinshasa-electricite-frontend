import type { Metadata } from 'next'

/** Shared wording and settings describing the site itself. */

export const SITE_NAME = 'Kinshasa Électricité'

export const SITE_DESCRIPTION = "Signalez et consultez les coupures d'électricité et les retours du courant partagés par les habitants de Kinshasa. Informations communautaires, sans confirmation officielle."

export const INDEPENDENCE_NOTICE = "Cette plateforme est une initiative indépendante et n'est ni un service officiel de la SNEL, ni de la Ville de Kinshasa, ni du Gouvernement de la RDC."

/** Public URL of the site, used for absolute links in shared previews. Optional in development. */
export function siteUrl(): URL | undefined {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  try {
    return url ? new URL(url) : undefined
  } catch {
    return undefined
  }
}

/**
 * Metadata of a page: the same title and description are used for the
 * browser tab, search engines and shared previews.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path?: string }): Metadata {
  return {
    title,
    description,
    alternates: path ? { canonical: path } : undefined,
    openGraph: { type: 'website', locale: 'fr_CD', siteName: SITE_NAME, title, description, url: path },
    twitter: { card: 'summary_large_image', title, description },
  }
}

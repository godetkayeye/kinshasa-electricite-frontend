import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from '@/lib/site'
import './globals.css'

// The favicon, the Apple icon and the share image are the static files
// app/icon.svg, app/apple-icon.png and app/opengraph-image.png: Next.js adds
// the matching tags itself, so no icon file is referenced by hand.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE_NAME} — Signalement citoyen`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'fr_CD',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Signalement citoyen`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Signalement citoyen`,
    description: SITE_DESCRIPTION,
  },
}

// The interface only has a light theme.
export const viewport: Viewport = {
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Lets the bottom navigation and the send button respect the safe area of notched phones.
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-[#0067d8] focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#007fff]/30">
          Aller au contenu
        </a>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'

// The back-office is private: it must never be indexed.
export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s | Administration — Kinshasa Électricité' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}

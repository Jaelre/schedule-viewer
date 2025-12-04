import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Turni PS Policlinico',
  description: 'Visualizzazione turni mensili',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: '/icons/apple-touch-icon.png?v=2',
  },
  manifest: '/icons/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { iconAssetPath } from '@/lib/icon-assets'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

const themeScript = `
(() => {
  const storageKey = 'schedule-viewer-theme';
  let storedTheme = null;

  try {
    storedTheme = localStorage.getItem(storageKey);
  } catch (error) {
    console.error('Unable to read the saved theme preference; using the system preference.', error);
  }

  const isDark = storedTheme === 'dark' ||
    (storedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
})();
`

export const metadata: Metadata = {
  title: 'Turni PS Policlinico',
  description: 'Visualizzazione turni mensili',
  icons: {
    icon: [
      { url: iconAssetPath('/icons/favicon-16x16.png'), sizes: '16x16', type: 'image/png' },
      { url: iconAssetPath('/icons/favicon-32x32.png'), sizes: '32x32', type: 'image/png' },
      { url: iconAssetPath('/icons/favicon.ico'), sizes: 'any' },
    ],
    apple: iconAssetPath('/icons/apple-touch-icon.png'),
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#121722' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

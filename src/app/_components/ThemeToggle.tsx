'use client'

import { useEffect, useState } from 'react'
import { useTelemetry } from '@/app/providers'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'schedule-viewer-theme'
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

function getActiveTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const { track } = useTelemetry()

  useEffect(() => {
    setTheme(getActiveTheme())

    const mediaQuery = window.matchMedia(DARK_MODE_QUERY)
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      let storedTheme: string | null = null

      try {
        storedTheme = window.localStorage.getItem(STORAGE_KEY)
      } catch (error) {
        console.error('Unable to read the saved theme preference; following the system preference.', error)
      }

      if (storedTheme === 'light' || storedTheme === 'dark') return

      const nextTheme = event.matches ? 'dark' : 'light'
      applyTheme(nextTheme)
      setTheme(nextTheme)
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = getActiveTheme() === 'dark' ? 'light' : 'dark'

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch (error) {
      console.error('Unable to save the theme preference; the choice will last for this page only.', error)
    }

    applyTheme(nextTheme)
    setTheme(nextTheme)
    track({ feature: 'theme_toggle', action: 'change_theme', value: nextTheme })
  }

  const isDark = theme === 'dark'
  const label = isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {theme === null ? (
        <span className="h-4 w-4" aria-hidden="true" />
      ) : isDark ? (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M20.7 14.2A8.5 8.5 0 0 1 9.8 3.3 8.5 8.5 0 1 0 20.7 14.2Z" />
        </svg>
      )}
    </button>
  )
}

'use client'

import { useTelemetry } from '@/app/providers'
import type { ViewMode } from './ScheduleGrid/types'

interface ViewToggleProps {
  viewMode: ViewMode
  onToggle: (mode: ViewMode) => void
  variant?: 'full' | 'compact' | 'responsive'
  className?: string
}

export function ViewToggle({ viewMode, onToggle, variant = 'full', className = '' }: ViewToggleProps) {
  const { track } = useTelemetry()

  const handleToggle = (newMode: ViewMode) => {
    if (newMode === viewMode) return
    onToggle(newMode)
    track({ feature: 'view_toggle', action: 'change_view_mode', value: newMode })
  }

  const renderLabel = (full: string, compact: string) => {
    if (variant === 'full') return full
    if (variant === 'compact') return compact
    // responsive
    return (
      <>
        <span className="lg:hidden">{compact}</span>
        <span className="hidden lg:inline">{full}</span>
      </>
    )
  }

  return (
    <div className={`flex border border-border rounded overflow-hidden bg-background ${className}`}>
      <button
        onClick={() => handleToggle('people')}
        className={`px-3 py-1 text-xs transition-colors whitespace-nowrap ${
          viewMode === 'people'
            ? 'bg-secondary text-secondary-foreground font-medium'
            : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={viewMode === 'people'}
      >
        {renderLabel('Vista medici', 'Medici')}
      </button>
      <div className="w-px bg-border" />
      <button
        onClick={() => handleToggle('shifts')}
        className={`px-3 py-1 text-xs transition-colors whitespace-nowrap ${
          viewMode === 'shifts'
            ? 'bg-secondary text-secondary-foreground font-medium'
            : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={viewMode === 'shifts'}
      >
        {renderLabel('Vista turni', 'Turni')}
      </button>
    </div>
  )
}

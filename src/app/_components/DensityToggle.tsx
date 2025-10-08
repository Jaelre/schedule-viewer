'use client'

import { useState } from 'react'

export type Density = 'extra-compact' | 'compact' | 'comfortable'

interface DensityToggleProps {
  onDensityChange: (density: Density) => void
  onLegendClick?: () => void
}

const densityOptions: Array<{ value: Density; label: string; ariaLabel: string }> = [
  { value: 'extra-compact', label: 'Ultra compatta', ariaLabel: 'Visualizzazione ultra compatta' },
  { value: 'compact', label: 'Compatta', ariaLabel: 'Visualizzazione compatta' },
  { value: 'comfortable', label: 'Confortevole', ariaLabel: 'Visualizzazione confortevole' },
]

export function DensityToggle({ onDensityChange, onLegendClick }: DensityToggleProps) {
  const [density, setDensity] = useState<Density>('compact')

  const handleToggle = (newDensity: Density) => {
    if (newDensity === density) return

    setDensity(newDensity)
    onDensityChange(newDensity)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Densità:</span>
        <div className="flex border border-border rounded overflow-hidden">
          {densityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={`px-2 py-1 text-xs transition-colors whitespace-nowrap ${
                density === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
              aria-label={option.ariaLabel}
              aria-pressed={density === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {onLegendClick && (
        <button
          onClick={onLegendClick}
          className="px-2 py-1 text-xs border border-border rounded bg-background hover:bg-accent transition-colors whitespace-nowrap"
          aria-label="Mostra legenda"
        >
          Legenda
        </button>
      )}
    </div>
  )
}

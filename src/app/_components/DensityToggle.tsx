'use client'

import { useState } from 'react'

export type Density = 'compact' | 'comfortable'

interface DensityToggleProps {
  onDensityChange: (density: Density) => void
  onLegendClick?: () => void
}

export function DensityToggle({ onDensityChange, onLegendClick }: DensityToggleProps) {
  const [density, setDensity] = useState<Density>('comfortable')

  const handleToggle = (newDensity: Density) => {
    setDensity(newDensity)
    onDensityChange(newDensity)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Densità:</span>
        <div className="flex border border-border rounded overflow-hidden">
          <button
            onClick={() => handleToggle('compact')}
            className={`px-2 py-1 text-xs transition-colors whitespace-nowrap ${
              density === 'compact'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
            aria-label="Visualizzazione compatta"
            aria-pressed={density === 'compact'}
          >
            Compatta
          </button>
          <button
            onClick={() => handleToggle('comfortable')}
            className={`px-2 py-1 text-xs transition-colors whitespace-nowrap ${
              density === 'comfortable'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
            aria-label="Visualizzazione confortevole"
            aria-pressed={density === 'comfortable'}
          >
            Confortevole
          </button>
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

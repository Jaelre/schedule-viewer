'use client'

import { useState } from 'react'

export type Density = 'compact' | 'comfortable'

interface DensityToggleProps {
  onDensityChange: (density: Density) => void
}

export function DensityToggle({ onDensityChange }: DensityToggleProps) {
  const [density, setDensity] = useState<Density>('comfortable')

  const handleToggle = (newDensity: Density) => {
    setDensity(newDensity)
    onDensityChange(newDensity)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Densità:</span>
      <div className="flex border border-border rounded-md overflow-hidden">
        <button
          onClick={() => handleToggle('compact')}
          className={`px-3 py-1.5 text-sm transition-colors ${
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
          className={`px-3 py-1.5 text-sm transition-colors ${
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
  )
}

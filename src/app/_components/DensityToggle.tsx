'use client'

import { useState } from 'react'
import { trackClientEvent } from '@/lib/telemetry'
import type { Density } from './ScheduleGrid/types'
import { useTelemetry } from '@/app/providers'

export type { Density }

export interface DensityToggleProps {

  onDensityChange: (density: Density) => void

  variant?: 'full' | 'compact' | 'responsive'

  className?: string

}



const densityOptions: Array<{ value: Density; label: string; compactLabel: string; ariaLabel: string }> = [

  { 

    value: 'extra-compact', 

    label: 'Ultra compatta', 

    compactLabel: 'U',

    ariaLabel: 'Visualizzazione ultra compatta' 

  },

  { 

    value: 'compact', 

    label: 'Compatta', 

    compactLabel: 'C',

    ariaLabel: 'Visualizzazione compatta' 

  },

  { 

    value: 'comfortable', 

    label: 'Confortevole', 

    compactLabel: 'C+',

    ariaLabel: 'Visualizzazione confortevole' 

  },

]



export function DensityToggle({ onDensityChange, variant = 'full', className = '' }: DensityToggleProps) {

  const [density, setDensity] = useState<Density>('compact')

  const { track } = useTelemetry()



  const handleToggle = (newDensity: Density) => {

    if (newDensity === density) return



    setDensity(newDensity)

    onDensityChange(newDensity)

    track({ feature: 'density_toggle', action: 'change_density', value: newDensity })

  }



  return (

    <div className={`flex items-center gap-2 ${className}`}>

      {(variant === 'full' || variant === 'responsive') && (

        <span className={`text-xs text-muted-foreground whitespace-nowrap ${variant === 'responsive' ? 'hidden lg:inline' : ''}`}>

          Densità:

        </span>

      )}

      <div className="flex border border-border rounded overflow-hidden bg-background">

        {densityOptions.map((option) => (

          <button

            key={option.value}

            onClick={() => handleToggle(option.value)}

            className={`px-2 py-1 text-xs transition-colors whitespace-nowrap ${

              density === option.value

                ? 'bg-primary text-primary-foreground font-medium'

                : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'

            } ${variant === 'compact' ? 'min-w-[24px] text-center' : ''} ${variant === 'responsive' ? 'lg:min-w-0 min-w-[24px] text-center lg:text-left' : ''}`}

            aria-label={option.ariaLabel}

            aria-pressed={density === option.value}

            title={option.label}

          >

            {variant === 'compact' && option.compactLabel}

            {variant === 'full' && option.label}

            {variant === 'responsive' && (

              <>

                <span className="lg:hidden">{option.compactLabel}</span>

                <span className="hidden lg:inline">{option.label}</span>

              </>

            )}

          </button>

        ))}

      </div>

    </div>

  )

}

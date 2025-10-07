'use client'

import { useMemo } from 'react'
import { getShiftColor } from '@/lib/colors'
import type { ShiftCodeMap } from '@/lib/types'

interface LegendCardProps {
  codes: string[]
  codeMap?: ShiftCodeMap
}

export function LegendCard({ codes, codeMap }: LegendCardProps) {
  const legend = useMemo(() => {
    return codes.map((code) => {
      const colors = getShiftColor(code)
      const label = codeMap?.[code]?.label || code

      return {
        code,
        label,
        colors,
      }
    })
  }, [codes, codeMap])

  if (legend.length === 0) {
    return null
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Legenda Turni</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {legend.map(({ code, label, colors }) => (
          <div
            key={code}
            className="flex items-center gap-2 p-2 rounded-md border border-border"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium flex-shrink-0"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
              }}
            >
              {code}
            </div>
            <span className="text-sm text-foreground truncate" title={label}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

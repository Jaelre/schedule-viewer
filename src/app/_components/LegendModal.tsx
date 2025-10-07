'use client'

import { useMemo, useEffect } from 'react'
import { getShiftColor } from '@/lib/colors'
import type { ShiftCodeMap } from '@/lib/types'

interface LegendModalProps {
  codes: string[]
  codeMap?: ShiftCodeMap
  isOpen: boolean
  onClose: () => void
}

export function LegendModal({ codes, codeMap, isOpen, onClose }: LegendModalProps) {
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Legenda Turni</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent transition-colors"
            aria-label="Chiudi legenda"
          >
            Chiudi
          </button>
        </div>

        {legend.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nessun turno disponibile</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {legend.map(({ code, label, colors }) => (
              <div
                key={code}
                className="flex items-center gap-2 p-2 rounded border border-border"
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-sm font-medium flex-shrink-0"
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
        )}
      </div>
    </div>
  )
}

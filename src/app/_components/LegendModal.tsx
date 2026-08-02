'use client'

import { useMemo, useEffect, useRef } from 'react'
import { resolveShiftLabel } from '@/lib/shift-labels'
import { useTelemetry } from '@/app/providers'
import { useRuntimeConfig } from '@/lib/config/runtime-config'

interface LegendModalProps {
  codes: string[]
  shiftNames?: Record<string, string>
  isOpen: boolean
  onClose: () => void
}

export function LegendModal({ codes, shiftNames, isOpen, onClose }: LegendModalProps) {
  const { track } = useTelemetry()
  const { config, getShiftColor } = useRuntimeConfig()
  const legend = useMemo(() => {
    return codes.map((code) => {
      const colors = getShiftColor(code)
      const label = resolveShiftLabel(code, shiftNames, config.shiftDisplay)

      return {
        code,
        label,
        colors,
      }
    })
  }, [codes, shiftNames, config.shiftDisplay, getShiftColor])

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

  const wasOpen = useRef(isOpen)

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      track({ feature: 'legend_modal', action: 'open', value: codes.length })
    } else if (!isOpen && wasOpen.current) {
      track({ feature: 'legend_modal', action: 'close', value: codes.length })
    }
    wasOpen.current = isOpen
  }, [codes.length, isOpen, track])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Legenda Turni</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Chiudi legenda"
          >
            Chiudi
          </button>
        </div>

        {legend.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nessun turno disponibile</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legend.map(({ code, label, colors }) => (
              <div
                key={code}
                className="flex items-center gap-3 p-3 rounded border border-border bg-muted/50"
              >
                <div
                  className="w-12 h-12 rounded flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                  }}
                >
                  {code}
                </div>
                <span className="text-sm text-foreground flex-1" title={label}>
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

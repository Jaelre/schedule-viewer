'use client'

import { useMemo, useEffect } from 'react'
import { getShiftColor } from '@/lib/colors'
import { resolveShiftLabel } from '@/lib/shift-labels'
import type { ShiftCodeMap } from '@/lib/types'

interface LegendModalProps {
  codes: string[]
  shiftNames?: Record<string, string>
  codeMap?: ShiftCodeMap
  isOpen: boolean
  onClose: () => void
}

export function LegendModal({ codes, shiftNames, codeMap, isOpen, onClose }: LegendModalProps) {
  const legend = useMemo(() => {
    return codes.map((code) => {
      const colors = getShiftColor(code)
      const label = resolveShiftLabel(code, shiftNames, codeMap)

      return {
        code,
        label,
        colors,
      }
    })
  }, [codes, shiftNames, codeMap])

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
        className="bg-white border border-gray-300 rounded-lg p-6 shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Legenda Turni</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-700"
            aria-label="Chiudi legenda"
          >
            Chiudi
          </button>
        </div>

        {legend.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Nessun turno disponibile</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legend.map(({ code, label, colors }) => (
              <div
                key={code}
                className="flex items-center gap-3 p-3 rounded border border-gray-200 bg-gray-50"
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
                <span className="text-sm text-gray-900 flex-1" title={label}>
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

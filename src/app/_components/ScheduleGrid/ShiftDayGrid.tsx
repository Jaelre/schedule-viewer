'use client'

import { useMemo } from 'react'
import { isWeekend, isItalianHoliday } from '@/lib/date'
import { resolveShiftLabel } from '@/lib/shift-labels'
import type { MonthShifts, ShiftCodeMap } from '@/lib/types'
import type { Density, DensitySettings, PersonWithDisplay } from './types'
import { getNameAbbreviation } from './utils'
import { useRuntimeConfig } from '@/lib/config/runtime-config'

type ShiftGridData = Pick<MonthShifts, 'ym' | 'rows' | 'shiftNames'>

interface ShiftDayGridProps {
  data: ShiftGridData
  density: Density
  peopleWithNames: PersonWithDisplay[]
  daysInMonth: number
  densitySettings: DensitySettings
  codes: string[]
  codeMap?: ShiftCodeMap
}

type ShiftAssignments = Record<string, Record<number, PersonWithDisplay[]>>

function buildShiftAssignments(
  rows: (string[] | null)[][],
  peopleWithNames: PersonWithDisplay[]
): ShiftAssignments {
  const assignments: ShiftAssignments = {}

  for (const person of peopleWithNames) {
    const personRow = rows[person.originalIndex]
    if (!personRow) continue

    personRow.forEach((cell, index) => {
      if (!cell || cell.length === 0) return
      const day = index + 1

      cell.forEach((code) => {
        if (!assignments[code]) {
          assignments[code] = {}
        }

        if (!assignments[code][day]) {
          assignments[code][day] = []
        }

        assignments[code][day].push(person)
      })
    })
  }

  for (const code of Object.keys(assignments)) {
    const dayMap = assignments[code]
    for (const day of Object.keys(dayMap)) {
      dayMap[Number(day)].sort((a, b) =>
        a.resolvedName.localeCompare(b.resolvedName, 'it')
      )
    }
  }

  return assignments
}

function getShiftOrder(
  codes: string[],
  rows: (string[] | null)[][]
): string[] {
  const seen = new Set<string>()
  const order: string[] = []

  for (const code of codes) {
    if (!seen.has(code)) {
      seen.add(code)
      order.push(code)
    }
  }

  for (const personRow of rows) {
    for (const cell of personRow) {
      if (!cell) continue
      for (const code of cell) {
        if (!seen.has(code)) {
          seen.add(code)
          order.push(code)
        }
      }
    }
  }

  return order
}

function getShiftSubtitle(code: string, label: string): string | null {
  if (!label) return null
  if (label === code) return null

  const trimmed = label.trim()
  if (trimmed.startsWith(code)) {
    const withoutCode = trimmed.slice(code.length).trim()
    return withoutCode.replace(/^[-:]/, '').trim() || null
  }

  return trimmed
}

export function ShiftDayGrid({
  data,
  density,
  peopleWithNames,
  daysInMonth,
  densitySettings,
  codes,
  codeMap,
}: ShiftDayGridProps) {
  const { ym, rows, shiftNames } = data
  const { cellPadding, textSize, placeholderText, rowHeight } = densitySettings
  const gridGap = density === 'extra-compact' ? 0 : 1
  const { getShiftColor } = useRuntimeConfig()

  const dayHeaders = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  )

  const shiftAssignments = useMemo(
    () => buildShiftAssignments(rows, peopleWithNames),
    [rows, peopleWithNames]
  )

  const shiftOrder = useMemo(
    () => getShiftOrder(codes, rows),
    [codes, rows]
  )

  const minRowHeight = useMemo(() => `${rowHeight}px`, [rowHeight])

  return (
    <div
      className="h-full overflow-auto"
      style={{
        display: 'grid',
        gridTemplateColumns: `minmax(10rem, 14rem) repeat(${daysInMonth}, minmax(5.5rem, 1fr))`,
        gap: `${gridGap}px`,
        gridAutoRows: 'auto',
      }}
    >
      <div
        className={`sticky top-0 left-0 z-30 ${density === 'extra-compact' ? 'p-1.5' : cellPadding} flex items-center font-semibold border-b border-r border-gray-300`}
        style={{
          minHeight: minRowHeight,
          backgroundColor: '#e5e7eb', // Ensure background is always visible (gray-200)
        }}
      >
        Turno
      </div>
      {dayHeaders.map((day) => {
        const isWeekendDay = isWeekend(ym, day)
        const isHoliday = isItalianHoliday(ym, day)
        const bgClass = isHoliday
          ? 'bg-red-50 text-red-900'
          : isWeekendDay
            ? 'bg-blue-50 text-blue-900'
            : 'bg-gray-200'

        return (
          <div
            key={`shift-header-${day}`}
            className={`sticky top-0 z-20 ${cellPadding} flex items-center justify-center font-semibold border-b border-gray-300 ${bgClass}`}
            style={{
              minHeight: minRowHeight,
            }}
          >
            {day}
          </div>
        )
      })}

      {shiftOrder.map((code) => {
        const label = resolveShiftLabel(code, shiftNames, codeMap)
        const subtitle = getShiftSubtitle(code, label)
        const shiftColor = getShiftColor(code)

        return (
          <div
            key={`shift-row-${code}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `minmax(10rem, 14rem) repeat(${daysInMonth}, minmax(5.5rem, 1fr))`,
              gap: `${gridGap}px`,
              gridColumn: '1 / -1',
            }}
          >
            <div
              className={`sticky left-0 z-10 ${density === 'extra-compact' ? 'p-1.5' : cellPadding} border-r border-b border-gray-300 flex flex-col justify-center`}
              style={{
                minHeight: minRowHeight,
                backgroundColor: shiftColor.background,
                color: shiftColor.text,
              }}
            >
              <span className={`font-semibold ${textSize}`}>{code}</span>
              {subtitle && (
                <span className={`opacity-75 ${placeholderText}`}>
                  {subtitle}
                </span>
              )}
              {!subtitle && label !== code && (
                <span className={`opacity-75 ${placeholderText}`}>
                  {label}
                </span>
              )}
            </div>

            {dayHeaders.map((day) => {
              const doctors = shiftAssignments[code]?.[day] ?? []
              const isWeekendDay = isWeekend(ym, day)
              const isHoliday = isItalianHoliday(ym, day)

              return (
                <div
                  key={`shift-${code}-${day}`}
                  className={`${cellPadding} border-b border-gray-300 flex flex-col items-start justify-start gap-1`}
                  style={{
                    minHeight: minRowHeight,
                    backgroundColor: shiftColor.background,
                    color: shiftColor.text,
                  }}
                >
                  {doctors.length > 0 ? (
                    doctors.map((doctor, idx) => {
                      const abbreviatedName = getNameAbbreviation(
                        doctor.resolvedName
                      )

                      return (
                        <div
                          key={`${code}-${day}-${doctor.id}-${idx}`}
                          className="flex items-center gap-2 min-w-0 w-full"
                          title={`${doctor.resolvedName}${doctor.pseudonym ? ` (${doctor.pseudonym})` : ''}`}
                        >
                          <span className={`font-medium truncate ${textSize}`}>
                            {abbreviatedName || doctor.resolvedName}
                          </span>
                          {doctor.pseudonym && (
                            <span
                              className={`opacity-75 truncate ${placeholderText}`}
                            >
                              {doctor.pseudonym}
                            </span>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <span className={`opacity-50 ${placeholderText}`}>
                      -
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

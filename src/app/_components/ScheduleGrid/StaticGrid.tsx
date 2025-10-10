'use client'

import { useMemo } from 'react'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { ShiftCell } from './ShiftCell'
import { getNameAbbreviation } from './utils'
import { compactNameColumnWidth } from './types'
import type { GridCommonProps, DensitySettings } from './types'

interface StaticGridProps extends GridCommonProps {
  densitySettings: DensitySettings
}

export function StaticGrid({
  data,
  density,
  peopleWithNames,
  daysInMonth,
  nameColumnWidth,
  isHorizontalScrollActive,
  densitySettings,
}: StaticGridProps) {
  const { ym, rows } = data
  const isExtraCompact = density === 'extra-compact'
  const gridGap = isExtraCompact ? 0 : 1

  const { cellPadding, cellHeight, textSize } = densitySettings

  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  const currentNameColumnWidth = isHorizontalScrollActive
    ? `${compactNameColumnWidth}px`
    : nameColumnWidth

  return (
    <div
      className="schedule-grid-static"
      style={{
        display: 'grid',
        gridTemplateColumns: `${currentNameColumnWidth} repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
        gap: `${gridGap}px`,
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Header Row */}
      <div
        className={`sticky top-0 left-0 z-30 ${cellPadding} ${cellHeight} flex items-center font-semibold border-b ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
        style={{
          backgroundColor: isExtraCompact ? 'transparent' : '#e5e7eb',
        }}
      >
        Nome
      </div>

      {dayHeaders.map((day) => {
        const isWeekendDay = isWeekend(ym, day)
        const isHoliday = isItalianHoliday(ym, day)

        return (
          <div
            key={`header-${day}`}
            className={`sticky top-0 z-20 ${cellPadding} ${cellHeight} flex items-center justify-center font-semibold ${textSize} ${
              isHoliday ? 'bg-red-50 text-red-900' : isWeekendDay ? 'bg-blue-50 text-blue-900' : 'bg-gray-200'
            } border-b ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
          >
            {day}
          </div>
        )
      })}

      {/* Data Rows */}
      {peopleWithNames.map((person) => {
        const personRow = rows[person.originalIndex]

        return (
          <>
            {/* Name Cell - Sticky Left */}
            <div
              key={`name-${person.id}`}
              className={`sticky left-0 z-10 ${cellPadding} ${cellHeight} flex items-center gap-2 font-medium bg-white ${isExtraCompact ? '' : 'border-r border-gray-300'} overflow-hidden border-b border-gray-300`}
              title={person.displayName}
            >
              <span
                className={`min-w-0 ${
                  isHorizontalScrollActive ? 'flex-none font-semibold' : 'flex-1 truncate'
                }`}
              >
                {isHorizontalScrollActive
                  ? getNameAbbreviation(person.resolvedName)
                  : person.resolvedName}
              </span>
              {!isHorizontalScrollActive && person.pseudonym && (
                <span
                  className={`ml-auto flex-none whitespace-nowrap ${isExtraCompact ? '' : 'pl-2'} text-right text-muted-foreground opacity-70`}
                >
                  {person.pseudonym}
                </span>
              )}
            </div>

            {/* Shift Cells */}
            {dayHeaders.map((day) => {
              const codes = personRow[day - 1]

              return (
                <ShiftCell
                  key={`${person.id}-${day}`}
                  ym={ym}
                  day={day}
                  codes={codes}
                  personId={person.id}
                  densitySettings={densitySettings}
                  isExtraCompact={isExtraCompact}
                />
              )
            })}
          </>
        )
      })}
    </div>
  )
}

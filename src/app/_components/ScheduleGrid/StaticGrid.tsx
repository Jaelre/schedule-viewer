'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { ShiftCell } from './ShiftCell'
import { compactNameColumnWidth } from './types'
import type { GridCommonProps, DensitySettings } from './types'
import { NameCellContent } from './NameCellContent'

interface StaticGridProps extends GridCommonProps {
  densitySettings: DensitySettings
}

export function StaticGrid({
  data,
  density,
  peopleWithNames,
  daysInMonth,
  nameColumnWidth,
  densitySettings,
}: StaticGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { ym, rows } = data
  const isExtraCompact = density === 'extra-compact'
  const gridGap = isExtraCompact ? 0 : 1
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false)

  const { cellPadding, cellHeight, textSize } = densitySettings

  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  // Track horizontal scroll internally
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const handleScroll = () => {
      const { scrollLeft } = grid
      const shouldCompact = scrollLeft > 0
      setIsHorizontalScrollActive(prev =>
        prev === shouldCompact ? prev : shouldCompact
      )
    }

    grid.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      grid.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const currentNameColumnWidth = isHorizontalScrollActive
    ? `${compactNameColumnWidth}px`
    : nameColumnWidth

  return (
    <div
      ref={gridRef}
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
        className={`sticky top-0 left-0 z-30 ${isExtraCompact ? 'p-1.5' : cellPadding} ${cellHeight} flex items-center font-semibold border-b ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
        style={{
          backgroundColor: '#e5e7eb',
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
          <React.Fragment key={`row-${person.id}`}>
            {/* Name Cell - Sticky Left */}
            <div
              className={`sticky left-0 z-10 ${cellPadding} ${cellHeight} flex items-center gap-2 font-medium bg-white ${isExtraCompact ? '' : 'border-r border-gray-300'} overflow-hidden border-b border-gray-300`}
              title={person.displayName}
            >
              <NameCellContent
                person={person}
                isHorizontalScrollActive={isHorizontalScrollActive}
                isExtraCompact={isExtraCompact}
              />
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
          </React.Fragment>
        )
      })}
    </div>
  )
}

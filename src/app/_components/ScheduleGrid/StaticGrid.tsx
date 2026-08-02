'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { ShiftCell } from './ShiftCell'
import { compactNameColumnWidth } from './types'
import type { GridCommonProps, DensitySettings } from './types'
import { NameCellContent } from './NameCellContent'
import type { PersonWithDisplay } from './types'

interface StaticGridProps extends GridCommonProps {
  densitySettings: DensitySettings
  onPhotoClick: (person: PersonWithDisplay) => void
}

export function StaticGrid({
  data,
  density,
  peopleWithNames,
  daysInMonth,
  nameColumnWidth,
  densitySettings,
  onPhotoClick,
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
        className={`sticky top-0 left-0 z-30 bg-gray-200 dark:bg-slate-800 ${isExtraCompact ? 'p-1.5' : cellPadding} ${cellHeight} flex items-center font-semibold border-b ${isExtraCompact ? '' : 'border-r border-border'}`}
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
              isHoliday ? 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200' : isWeekendDay ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200' : 'bg-gray-200 dark:bg-slate-800'
            } border-b ${isExtraCompact ? '' : 'border-r border-border'}`}
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
              className={`sticky left-0 z-10 ${cellPadding} ${cellHeight} flex items-center gap-2 font-medium bg-card ${isExtraCompact ? '' : 'border-r border-border'} overflow-hidden border-b border-border`}
              title={person.displayName}
            >
              <NameCellContent
                person={person}
                isHorizontalScrollActive={isHorizontalScrollActive}
                isExtraCompact={isExtraCompact}
                onPhotoClick={onPhotoClick}
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

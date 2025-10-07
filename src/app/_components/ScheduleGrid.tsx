'use client'

import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { getShiftColor } from '@/lib/colors'
import type { MonthShifts } from '@/lib/types'
import type { Density } from './DensityToggle'

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
}

export function ScheduleGrid({ data, density }: ScheduleGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { ym, people, rows } = data

  const daysInMonth = getDaysInMonth(ym)

  // Virtualize rows when there are many people (>40)
  const rowVirtualizer = useVirtualizer({
    count: people.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === 'compact' ? 32 : 48),
    overscan: 5,
  })

  // Memoize day headers
  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  // Cell size based on density
  const cellPadding = density === 'compact' ? 'px-2 py-1' : 'px-3 py-2'
  const cellHeight = density === 'compact' ? 'h-9' : 'h-14'
  const textSize = density === 'compact' ? 'text-[11px]' : 'text-sm'

  return (
    <div
      ref={parentRef}
      className="schedule-grid-container border border-border rounded-lg overflow-auto max-h-[600px] shadow-sm"
      style={{ '--days-count': daysInMonth } as React.CSSProperties}
    >
      <div
        className="schedule-grid"
        style={{
          height: `${rowVirtualizer.getTotalSize() + 48}px`,
          gridTemplateColumns: `minmax(240px, auto) repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
        }}
      >
        {/* Header Row */}
        <div
          className={`grid-header grid-first-col ${cellPadding} ${cellHeight} flex items-center font-semibold border-b border-r border-border bg-white/95 backdrop-blur`}
        >
          Nome
        </div>
        {dayHeaders.map((day) => (
          <div
            key={`header-${day}`}
            className={`grid-header ${cellPadding} ${cellHeight} flex items-center justify-center font-semibold ${textSize} border-b border-border border-r last:border-r-0 ${
              isItalianHoliday(ym, day)
                ? 'bg-holiday text-holiday-foreground'
                : isWeekend(ym, day)
                ? 'bg-weekend text-foreground'
                : 'bg-surface'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Virtualized Rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const person = people[virtualRow.index]
          const personRow = rows[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start + 48}px)`,
                display: 'contents',
              }}
            >
              {/* Person Name Cell */}
              <div
                className={`grid-first-col ${cellPadding} ${cellHeight} flex items-center font-semibold border-b border-r border-border bg-white/95 backdrop-blur truncate text-[13px] uppercase tracking-wide text-muted-foreground`}
                title={person.name}
              >
                {person.name}
              </div>

              {/* Shift Cells */}
              {dayHeaders.map((day) => {
                const code = personRow[day - 1]
                const isWeekendDay = isWeekend(ym, day)
                const isHoliday = isItalianHoliday(ym, day)

                return (
                  <div
                    key={`${person.id}-${day}`}
                    className={`grid-cell ${cellPadding} ${cellHeight} flex items-center justify-center ${textSize} font-semibold border-b border-r border-border last:border-r-0 ${
                      isHoliday
                        ? 'bg-holiday'
                        : isWeekendDay
                        ? 'bg-weekend'
                        : 'bg-surface'
                    }`}
                  >
                    {code && (
                      <div
                        className="px-2 py-0.5 rounded-md shadow-sm ring-1 ring-black/5"
                        style={{
                          backgroundColor: getShiftColor(code).background,
                          color: getShiftColor(code).text,
                        }}
                        title={code}
                      >
                        {code}
                      </div>
                    )}
                    {!code && <span className="text-muted-foreground">-</span>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

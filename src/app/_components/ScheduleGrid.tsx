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
  const cellPadding = density === 'compact' ? 'p-1' : 'p-2'
  const cellHeight = density === 'compact' ? 'h-8' : 'h-12'
  const textSize = density === 'compact' ? 'text-xs' : 'text-sm'

  return (
    <div
      ref={parentRef}
      className="schedule-grid-container border border-border rounded-lg overflow-auto max-h-[600px]"
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
        <div className={`grid-header grid-first-col ${cellPadding} ${cellHeight} flex items-center font-semibold bg-card border-b border-border`}>
          Nome
        </div>
        {dayHeaders.map((day) => (
          <div
            key={`header-${day}`}
            className={`grid-header ${cellPadding} ${cellHeight} flex items-center justify-center font-semibold ${textSize} ${
              isWeekend(ym, day) ? 'bg-muted' : 'bg-card'
            } ${isItalianHoliday(ym, day) ? 'bg-accent' : ''} border-b border-border`}
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
                className={`grid-first-col ${cellPadding} ${cellHeight} flex items-center font-medium bg-card border-b border-border truncate`}
                title={person.name}
              >
                {person.name}
              </div>

              {/* Shift Cells */}
              {dayHeaders.map((day) => {
                const codes = personRow[day - 1]
                const isWeekendDay = isWeekend(ym, day)
                const isHoliday = isItalianHoliday(ym, day)

                let bgClass = 'bg-card'
                if (isWeekendDay) bgClass = 'bg-muted'
                if (isHoliday) bgClass = 'bg-accent'

                return (
                  <div
                    key={`${person.id}-${day}`}
                    className={`grid-cell ${bgClass} ${cellPadding} flex items-center justify-center ${textSize} font-medium border-b border-border`}
                  >
                    {codes && codes.length > 0 ? (
                      <div className="flex flex-col gap-0.5 w-full">
                        {codes.map((code, idx) => (
                          <div
                            key={`${person.id}-${day}-${idx}`}
                            className="px-1.5 py-0.5 rounded text-center text-xs font-medium"
                            style={{
                              backgroundColor: getShiftColor(code).background,
                              color: getShiftColor(code).text,
                            }}
                            title={code}
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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

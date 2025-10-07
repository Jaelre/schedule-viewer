'use client'

import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { getShiftColor } from '@/lib/colors'
import { getDoctorName } from '@/lib/doctor-names'
import type { MonthShifts, ShiftCodeMap } from '@/lib/types'
import type { Density } from './DensityToggle'

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
  codes: string[]
  codeMap?: ShiftCodeMap
}

export function ScheduleGrid({ data, density }: ScheduleGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { ym, people, rows } = data

  // Map people to their display names using the doctor names dictionary
  const peopleWithNames = useMemo(() => {
    return people.map(person => ({
      ...person,
      displayName: getDoctorName(person.id, person.name)
    }))
  }, [people])

  const daysInMonth = getDaysInMonth(ym)

  // Virtualize rows when there are many people (>40)
  const rowVirtualizer = useVirtualizer({
    count: peopleWithNames.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === 'compact' ? 48 : 64),
    overscan: 5,
  })

  // Memoize day headers
  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  // Cell size based on density
  const cellPadding = density === 'compact' ? 'p-1' : 'p-2'
  const cellHeight = density === 'compact' ? 'h-12' : 'h-16'
  const textSize = density === 'compact' ? 'text-xs' : 'text-sm'

  return (
    <div
      ref={parentRef}
      className="schedule-grid-container border-t border-border overflow-auto"
      style={{
        '--days-count': daysInMonth,
        height: 'calc(100vh - 60px)'
      } as React.CSSProperties}
    >
      <div className="schedule-grid-wrapper" style={{ position: 'relative' }}>
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: `minmax(200px, auto) repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
          }}
        >
          {/* Header Row */}
          <div className={`grid-header grid-first-col ${cellPadding} ${cellHeight} flex items-center font-semibold bg-white border-b border-r border-gray-300`}>
            Nome
          </div>
          {dayHeaders.map((day) => {
            const isWeekendDay = isWeekend(ym, day)
            const isHoliday = isItalianHoliday(ym, day)

            return (
              <div
                key={`header-${day}`}
                className={`grid-header ${cellPadding} ${cellHeight} flex items-center justify-center font-semibold ${textSize} ${
                  isHoliday ? 'bg-red-50 text-red-900' : isWeekendDay ? 'bg-blue-50 text-blue-900' : 'bg-white'
                } border-b border-r border-gray-300`}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Virtualized Rows */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const person = peopleWithNames[virtualRow.index]
            const personRow = rows[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                className="schedule-grid"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `minmax(200px, auto) repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
                }}
              >
                {/* Person Name Cell */}
                <div
                  className={`grid-first-col ${cellPadding} ${cellHeight} flex items-center font-medium bg-white border-b border-r border-gray-300 truncate`}
                  title={person.displayName}
                >
                  {person.displayName}
                </div>

                {/* Shift Cells */}
                {dayHeaders.map((day) => {
                  const codes = personRow[day - 1]
                  const isWeekendDay = isWeekend(ym, day)
                  const isHoliday = isItalianHoliday(ym, day)

                  let bgClass = 'bg-white'
                  if (isWeekendDay) bgClass = 'bg-blue-50'
                  if (isHoliday) bgClass = 'bg-red-50'

                  return (
                    <div
                      key={`${person.id}-${day}`}
                      className={`grid-cell ${bgClass} ${cellPadding} flex items-center justify-center ${textSize} font-medium border-b border-r border-gray-300`}
                    >
                      {codes && codes.length > 0 ? (
                        <div className="flex flex-col gap-1 w-full items-center">
                          {codes.map((code, idx) => (
                            <div
                              key={`${person.id}-${day}-${idx}`}
                              className="px-2 py-1 rounded text-xs font-semibold w-fit min-w-[2rem] text-center"
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
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { ShiftCell } from './ShiftCell'
import { getNameAbbreviation } from './utils'
import { compactNameColumnWidth } from './types'
import type { GridCommonProps, DensitySettings } from './types'

interface VirtualizedGridProps extends GridCommonProps {
  densitySettings: DensitySettings
}

export function VirtualizedGrid({
  data,
  density,
  peopleWithNames,
  daysInMonth,
  nameColumnWidth,
  densitySettings,
}: VirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { ym, rows } = data
  const isExtraCompact = density === 'extra-compact'
  const gridGap = isExtraCompact ? 0 : 1
  const [scrollTop, setScrollTop] = useState(0)
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false)

  const { cellPadding, cellHeight, textSize, rowHeight } = densitySettings

  // Track both vertical and horizontal scroll internally
  useEffect(() => {
    const container = parentRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
      const shouldCompact = container.scrollLeft > 0
      setIsHorizontalScrollActive(prev =>
        prev === shouldCompact ? prev : shouldCompact
      )
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: peopleWithNames.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  })

  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  const currentNameColumnWidth = isHorizontalScrollActive
    ? `${compactNameColumnWidth}px`
    : nameColumnWidth

  return (
    <div
      className="schedule-grid-outer-wrapper border-t border-border"
      style={{
        height: 'calc(100vh - 60px)',
        position: 'relative',
      }}
    >
      {/* Fixed Name Column Overlay */}
      <div
        className="name-column-fixed"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: currentNameColumnWidth,
          zIndex: 20,
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Name Header */}
        <div
          className={`sticky top-0 ${cellPadding} ${cellHeight} flex items-center font-semibold bg-white border-b ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
          style={{
            zIndex: 30,
            backgroundColor: isExtraCompact ? 'transparent' : '#e5e7eb',
          }}
        >
          Nome
        </div>

        {/* Virtualized Name Cells */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const person = peopleWithNames[virtualRow.index]

            return (
              <div
                key={`name-${virtualRow.key}`}
                className={`${cellPadding} ${cellHeight} flex w-full items-center gap-2 font-medium bg-white ${isExtraCompact ? '' : 'border-r border-gray-300'} overflow-hidden border-b border-gray-300`}
                style={{
                  position: 'absolute',
                  top: 0,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
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
            )
          })}
        </div>
      </div>

      {/* Scroll Container */}
      <div
        ref={parentRef}
        className="schedule-grid-container"
        style={{
          height: '100%',
          overflow: 'auto',
        }}
      >
        {/* Days Content */}
        <div
          className="days-content-wrapper"
          style={{
            paddingLeft: currentNameColumnWidth,
            zIndex: 1,
          }}
        >
          {/* Header Row - Days Only */}
          <div
            className="schedule-grid sticky top-0 bg-gray-200"
            style={{
              zIndex: 10,
              gridTemplateColumns: `repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
              gap: `${gridGap}px`,
              ...(isExtraCompact ? { background: 'transparent' } : {}),
            }}
          >
            {dayHeaders.map((day) => {
              const isWeekendDay = isWeekend(ym, day)
              const isHoliday = isItalianHoliday(ym, day)

              return (
                <div
                  key={`header-${day}`}
                  className={`${cellPadding} ${cellHeight} flex items-center justify-center font-semibold ${textSize} ${
                    isHoliday ? 'bg-red-50 text-red-900' : isWeekendDay ? 'bg-blue-50 text-blue-900' : 'bg-white'
                  } border-b ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Virtualized Rows - Days Only */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const person = peopleWithNames[virtualRow.index]
              const personRow = rows[person.originalIndex]

              return (
                <div
                  key={virtualRow.key}
                  className="schedule-grid border-b border-gray-300"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: `repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
                    gap: `${gridGap}px`,
                    ...(isExtraCompact ? { background: 'transparent' } : {}),
                  }}
                >
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

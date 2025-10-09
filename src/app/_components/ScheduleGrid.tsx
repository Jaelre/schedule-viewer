'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getDaysInMonth, isWeekend, isItalianHoliday } from '@/lib/date'
import { getShiftColor } from '@/lib/colors'
import { getDoctorDisplayName } from '@/lib/doctor-names'
import type { MonthShifts, ShiftCodeMap } from '@/lib/types'
import type { Density } from './DensityToggle'

const densityConfig: Record<
  Density,
  {
    rowHeight: number
    cellPadding: string
    cellHeight: string
    textSize: string
    placeholderText: string
    chipClass: string
    chipGap: string
  }
> = {
  comfortable: {
    rowHeight: 64,
    cellPadding: 'p-2',
    cellHeight: 'h-16',
    textSize: 'text-sm',
    placeholderText: 'text-xs',
    chipClass: 'px-2 py-0.5 text-xs',
    chipGap: 'gap-1',
  },
  compact: {
    rowHeight: 48,
    cellPadding: 'p-1',
    cellHeight: 'h-12',
    textSize: 'text-xs',
    placeholderText: 'text-xs',
    chipClass: 'px-2 py-0.5 text-xs',
    chipGap: 'gap-1',
  },
  'extra-compact': {
    rowHeight: 40,
    cellPadding: 'p-0',
    cellHeight: 'h-10',
    textSize: 'text-[0.7rem]',
    placeholderText: 'text-[0.65rem]',
    chipClass: 'px-1 py-[1px] text-[0.7rem] leading-tight',
    chipGap: 'gap-0',
  },
}

const densityHorizontalPadding: Record<Density, number> = {
  comfortable: 16, // Tailwind p-2 -> 8px per side
  compact: 8, // Tailwind p-1 -> 4px per side
  'extra-compact': 0, // Minimal horizontal padding in ultra compact view
}

const defaultNameColumnWidths: Record<Density, number> = {
  comfortable: 240,
  compact: 210,
  'extra-compact': 190,
}

const pseudonymPadding = 8 // Tailwind pl-2
const widthBuffer = 4
const compactNameColumnWidth = 72

function getNameAbbreviation(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return ''
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const firstWord = parts[0]
  const lastWord = parts[parts.length - 1]

  const firstInitial = firstWord.charAt(0).toUpperCase()
  const lastInitial = lastWord.charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`
}

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
  codes: string[]
  codeMap?: ShiftCodeMap
}

export function ScheduleGrid({ data, density }: ScheduleGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { ym, people, rows } = data
  const isExtraCompact = density === 'extra-compact'
  const pseudonymSpacing = isExtraCompact ? 0 : pseudonymPadding
  const gridGap = isExtraCompact ? 0 : 1
  const [nameColumnWidth, setNameColumnWidth] = useState<string>(
    `${defaultNameColumnWidths[density]}px`
  )
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false)
  const scrollOffsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Map people to their display names, filter out Unknown_, and sort by surname
  const peopleWithNames = useMemo(() => {
    return people
      .map((person, index) => {
        const displayInfo = getDoctorDisplayName(person.id, person.name)

        return {
          ...person,
          displayName: displayInfo.display,
          resolvedName: displayInfo.name || displayInfo.display,
          pseudonym: displayInfo.pseudonym,
          originalIndex: index
        }
      })
      .filter(person => !person.displayName.startsWith('zzz_')) // Filter out Unknown_
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'it')) // Sort by surname
  }, [people])

  useEffect(() => {
    const container = parentRef.current

    if (!container) {
      return
    }

    const handleScroll = () => {
      const { scrollLeft } = container
      const shouldCompact = scrollLeft > 0
      setIsHorizontalScrollActive(prev =>
        prev === shouldCompact ? prev : shouldCompact
      )

      scrollOffsetRef.current = scrollLeft

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        container.style.setProperty(
          '--name-column-offset',
          `${scrollOffsetRef.current}px`
        )
        rafRef.current = null
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const daysInMonth = getDaysInMonth(ym)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (peopleWithNames.length === 0) {
      setNameColumnWidth(`${defaultNameColumnWidths[density]}px`)
      return
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      setNameColumnWidth(`${defaultNameColumnWidths[density]}px`)
      return
    }

    const probe = document.createElement('span')
    probe.className = 'font-medium'
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    probe.style.whiteSpace = 'nowrap'
    probe.textContent = 'M'
    document.body.appendChild(probe)

    const computedStyle = window.getComputedStyle(probe)
    const fontWeight = computedStyle.fontWeight || '500'
    const fontSize = computedStyle.fontSize || '16px'
    const fontFamily = computedStyle.fontFamily || 'sans-serif'
    document.body.removeChild(probe)

    context.font = `${fontWeight} ${fontSize} ${fontFamily}`

    let maxContentWidth = 0
    for (const person of peopleWithNames) {
      const baseWidth = context.measureText(person.resolvedName).width
      const pseudonymWidth = person.pseudonym
        ? context.measureText(person.pseudonym).width + pseudonymSpacing
        : 0
      const total = baseWidth + pseudonymWidth
      if (total > maxContentWidth) {
        maxContentWidth = total
      }
    }

    const horizontalPadding = densityHorizontalPadding[density]
    const fallbackWidth = defaultNameColumnWidths[density]
    const computedWidth =
      maxContentWidth > 0
        ? Math.ceil(maxContentWidth + horizontalPadding + widthBuffer)
        : fallbackWidth

    setNameColumnWidth(`${computedWidth}px`)
  }, [density, peopleWithNames, pseudonymSpacing])

  // Virtualize rows when there are many people (>40)
  const densitySettings = densityConfig[density]

  const rowVirtualizer = useVirtualizer({
    count: peopleWithNames.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => densitySettings.rowHeight,
    overscan: 5,
  })

  // Memoize day headers
  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  // Cell size based on density
  const { cellPadding, cellHeight, textSize, placeholderText, chipClass, chipGap } = densitySettings

  return (
    <div
      ref={parentRef}
      className="schedule-grid-container border-t border-border overflow-auto"
      style={{
        '--days-count': daysInMonth,
        height: 'calc(100vh - 60px)'
      } as React.CSSProperties}
    >
      <div className="schedule-grid-wrapper">
        {/* Header Row - Sticky */}
        <div
          className="schedule-grid sticky top-0 z-30 bg-gray-200"
          style={{
            gridTemplateColumns: `${
              isHorizontalScrollActive
                ? `${compactNameColumnWidth}px`
                : nameColumnWidth
            } repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
            gap: `${gridGap}px`,
            ...(isExtraCompact ? { background: 'transparent' } : {}),
          }}
        >
          <div
            className={`${cellPadding} ${cellHeight} flex items-center font-semibold bg-white border-b ${isExtraCompact ? '' : 'border-r border-gray-300'} z-40 name-column-cell`}
          >
            Nome
          </div>
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
                  gridTemplateColumns: `${
                    isHorizontalScrollActive
                      ? `${compactNameColumnWidth}px`
                      : nameColumnWidth
                  } repeat(${daysInMonth}, minmax(2.25rem, 1fr))`,
                  gap: `${gridGap}px`,
                  ...(isExtraCompact ? { background: 'transparent' } : {}),
                }}
              >
                {/* Person Name Cell */}
                <div
                  className={`${cellPadding} ${cellHeight} flex w-full items-center gap-2 font-medium bg-white ${isExtraCompact ? '' : 'border-r border-gray-300'} overflow-hidden name-column-cell`}
                  style={{
                    zIndex: 10
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
                      className={`grid-cell ${bgClass} ${cellPadding} flex items-center justify-center ${textSize} font-medium overflow-hidden ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
                    >
                      {codes && codes.length > 0 ? (
                        <div
                          className={`flex flex-col ${isExtraCompact ? 'items-stretch' : 'items-center'} justify-center min-w-0 ${chipGap}`}
                        >
                          {codes.map((code, idx) => (
                            <span
                              key={`${person.id}-${day}-${idx}`}
                              className={`${isExtraCompact ? 'w-full' : 'rounded'} font-semibold whitespace-nowrap ${chipClass}`}
                              style={{
                                backgroundColor: getShiftColor(code).background,
                                color: getShiftColor(code).text,
                              }}
                              title={code}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-muted-foreground ${placeholderText}`}>-</span>
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

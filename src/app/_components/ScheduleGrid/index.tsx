'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getDaysInMonth } from '@/lib/date'
import type { MonthShifts, ShiftCodeMap } from '@/lib/types'
import { StaticGrid } from './StaticGrid'
import { VirtualizedGrid } from './VirtualizedGrid'
import { preparePeopleWithNames, calculateNameColumnWidth } from './utils'
import { densityConfig, defaultNameColumnWidths, ROW_VIRTUALIZATION_THRESHOLD } from './types'
import type { Density } from './types'

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
  codes: string[]
  codeMap?: ShiftCodeMap
}

export function ScheduleGrid({ data, density }: ScheduleGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { ym, people } = data
  const isExtraCompact = density === 'extra-compact'

  const [nameColumnWidth, setNameColumnWidth] = useState<string>(
    `${defaultNameColumnWidths[density]}px`
  )
  const [isHorizontalScrollActive, setIsHorizontalScrollActive] = useState(false)

  // Prepare people data
  const peopleWithNames = useMemo(() => preparePeopleWithNames(people), [people])

  // Decide rendering strategy
  const shouldVirtualize = peopleWithNames.length > ROW_VIRTUALIZATION_THRESHOLD

  // Track horizontal scroll for name column compaction
  useEffect(() => {
    const container = parentRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollLeft } = container
      const shouldCompact = scrollLeft > 0
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

  const daysInMonth = getDaysInMonth(ym)

  // Calculate name column width
  useLayoutEffect(() => {
    const width = calculateNameColumnWidth(peopleWithNames, density, isExtraCompact)
    setNameColumnWidth(width)
  }, [density, peopleWithNames, isExtraCompact])

  const densitySettings = densityConfig[density]

  const commonProps = {
    data,
    density,
    peopleWithNames,
    daysInMonth,
    nameColumnWidth,
    isHorizontalScrollActive,
    densitySettings,
  }

  // Render appropriate grid component
  if (shouldVirtualize) {
    return <VirtualizedGrid {...commonProps} />
  }

  return (
    <div
      ref={parentRef}
      className="border-t border-border"
      style={{
        height: 'calc(100vh - 60px)',
        overflow: 'auto',
      }}
    >
      <StaticGrid {...commonProps} />
    </div>
  )
}

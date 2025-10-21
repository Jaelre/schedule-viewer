'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import { getDaysInMonth } from '@/lib/date'
import type { MonthShifts, ShiftCodeMap } from '@/lib/types'
import { StaticGrid } from './StaticGrid'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ShiftDayGrid } from './ShiftDayGrid'
import { preparePeopleWithNames, calculateNameColumnWidth } from './utils'
import { densityConfig, defaultNameColumnWidths, ROW_VIRTUALIZATION_THRESHOLD } from './types'
import type { Density, ViewMode } from './types'
import { useRuntimeConfig } from '@/lib/config/runtime-config'

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
  codes: string[]
  codeMap?: ShiftCodeMap
  viewMode: ViewMode
}

export function ScheduleGrid({ data, density, codes, codeMap, viewMode }: ScheduleGridProps) {
  const { ym, people } = data
  const isExtraCompact = density === 'extra-compact'

  const [nameColumnWidth, setNameColumnWidth] = useState<string>(
    `${defaultNameColumnWidths[density]}px`
  )

  const { getDoctorDisplayName } = useRuntimeConfig()

  // Prepare people data
  const peopleWithNames = useMemo(
    () => preparePeopleWithNames(people, getDoctorDisplayName),
    [people, getDoctorDisplayName]
  )

  // Decide rendering strategy
  const shouldVirtualize =
    viewMode === 'people' && peopleWithNames.length > ROW_VIRTUALIZATION_THRESHOLD

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
    densitySettings,
  }

  if (viewMode === 'shifts') {
    return (
      <div
        className="border-t border-border"
        style={{
          height: 'calc(100vh - 60px)',
        }}
      >
        <ShiftDayGrid
          data={data}
          density={density}
          peopleWithNames={peopleWithNames}
          daysInMonth={daysInMonth}
          densitySettings={densitySettings}
          codes={codes}
          codeMap={codeMap}
        />
      </div>
    )
  }

  // Render appropriate grid component
  if (shouldVirtualize) {
    return <VirtualizedGrid {...commonProps} />
  }

  return (
    <div
      className="border-t border-border"
      style={{
        height: 'calc(100vh - 60px)',
      }}
    >
      <StaticGrid {...commonProps} />
    </div>
  )
}

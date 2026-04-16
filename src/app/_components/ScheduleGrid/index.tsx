'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import { getDaysInMonth } from '@/lib/date'
import type { MonthShifts } from '@/lib/types'
import { StaticGrid } from './StaticGrid'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ShiftDayGrid } from './ShiftDayGrid'
import { preparePeopleWithNames, calculateNameColumnWidth } from './utils'
import { densityConfig, defaultNameColumnWidths, ROW_VIRTUALIZATION_THRESHOLD } from './types'
import type { Density, ViewMode, PersonWithDisplay } from './types'
import { useRuntimeConfig } from '@/lib/config/runtime-config'
import { PhotoModal } from './PhotoModal'

interface ScheduleGridProps {
  data: MonthShifts
  density: Density
  codes: string[]
  viewMode: ViewMode
}

export function ScheduleGrid({ data, density, codes, viewMode }: ScheduleGridProps) {
  const { ym, people } = data
  const isExtraCompact = density === 'extra-compact'

  const [nameColumnWidth, setNameColumnWidth] = useState<string>(
    `${defaultNameColumnWidths[density]}px`
  )
  const [selectedPhoto, setSelectedPhoto] = useState<{
    src: string
    name: string
  } | null>(null)

  const { getDoctorDisplayName, doctorPhotos } = useRuntimeConfig()

  // Prepare people data
  const peopleWithNames = useMemo(
    () => preparePeopleWithNames(people, getDoctorDisplayName, doctorPhotos.photos),
    [people, getDoctorDisplayName, doctorPhotos.photos]
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

  const handlePhotoClick = (person: PersonWithDisplay) => {
    if (!person.photoUrl) {
      return
    }

    setSelectedPhoto({
      src: person.photoUrl,
      name: person.resolvedName,
    })
  }

  const commonProps = {
    data,
    density,
    peopleWithNames,
    daysInMonth,
    nameColumnWidth,
    densitySettings,
    onPhotoClick: handlePhotoClick,
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
        />
      </div>
    )
  }

  // Render appropriate grid component
  if (shouldVirtualize) {
    return (
      <>
        <VirtualizedGrid {...commonProps} />
        {selectedPhoto && (
          <PhotoModal
            src={selectedPhoto.src}
            name={selectedPhoto.name}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div
        className="border-t border-border"
        style={{
          height: 'calc(100vh - 60px)',
        }}
      >
        <StaticGrid {...commonProps} />
      </div>
      {selectedPhoto && (
        <PhotoModal
          src={selectedPhoto.src}
          name={selectedPhoto.name}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  )
}

'use client'

import { useRuntimeConfig } from '@/lib/config/runtime-config'
import { isWeekend, isItalianHoliday, isWeekday } from '@/lib/date'
import { getShiftDisplayCode } from '@/lib/shift-format'
import type { DensitySettings } from './types'

interface ShiftCellProps {
  ym: string
  day: number
  codes: string[] | null
  personId: string
  densitySettings: DensitySettings
  isExtraCompact: boolean
}

export function ShiftCell({ ym, day, codes, personId, densitySettings, isExtraCompact }: ShiftCellProps) {
  const { cellPadding, cellHeight, textSize, placeholderText, chipClass, chipGap } = densitySettings
  const { getShiftColor, config } = useRuntimeConfig()

  const isWeekendDay = isWeekend(ym, day)
  const isHoliday = isItalianHoliday(ym, day)

  let bgClass = 'bg-white'
  if (isWeekendDay) bgClass = 'bg-blue-50'
  if (isHoliday) bgClass = 'bg-red-50'

  return (
    <div
      className={`grid-cell ${bgClass} ${cellPadding} ${cellHeight} flex items-center justify-center ${textSize} font-medium overflow-hidden ${isExtraCompact ? '' : 'border-r border-gray-300'}`}
    >
      {codes && codes.length > 0 ? (
        <div
          className={`flex flex-col ${isExtraCompact ? 'items-stretch' : 'items-center'} justify-center min-w-0 ${chipGap}`}
        >
          {codes.map((code, idx) => {
            const displayCode = getShiftDisplayCode(code)
            const colors = getShiftColor(displayCode)
            const underlineConfig = config.shiftStyling.conditionalUnderline
            // Check if conditional underline should be applied
            const shouldUnderline =
              underlineConfig !== undefined &&
              code === underlineConfig.shiftCode &&
              isWeekday(ym, day, underlineConfig.weekdays)

            return (
              <span
                key={`${personId}-${day}-${idx}`}
                className={`${isExtraCompact ? 'w-full px-1.5 py-1' : 'rounded'} font-semibold whitespace-nowrap ${isExtraCompact ? 'text-[0.7rem] leading-tight' : chipClass} ${shouldUnderline ? 'overline' : ''}`}
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                }}
                title={code}
              >
                {displayCode}
              </span>
            )
          })}
        </div>
      ) : (
        <span className={`text-muted-foreground ${placeholderText}`}>-</span>
      )}
    </div>
  )
}

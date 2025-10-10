import { isWeekend, isItalianHoliday, isWeekday } from '@/lib/date'
import { getShiftColor } from '@/lib/colors'
import type { DensitySettings } from './types'

// Load shift styling config with fallback
let shiftStylingConfig: { conditionalUnderline?: { shiftCode: string; weekdays: number[] } } = {}
try {
  shiftStylingConfig = require('@/config/shift-styling.config.json')
} catch {
  // Config file doesn't exist, use empty config (no conditional styling)
  shiftStylingConfig = {}
}

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
            // Check if conditional underline should be applied
            const shouldUnderline =
              shiftStylingConfig.conditionalUnderline &&
              code === shiftStylingConfig.conditionalUnderline.shiftCode &&
              isWeekday(ym, day, shiftStylingConfig.conditionalUnderline.weekdays)

            return (
              <span
                key={`${personId}-${day}-${idx}`}
                className={`${isExtraCompact ? 'w-full px-1.5 py-1' : 'rounded'} font-semibold whitespace-nowrap ${isExtraCompact ? 'text-[0.7rem] leading-tight' : chipClass} ${shouldUnderline ? 'underline' : ''}`}
                style={{
                  backgroundColor: getShiftColor(code).background,
                  color: getShiftColor(code).text,
                }}
                title={code}
              >
                {code}
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

import shiftStylingConfig from '@/config/shift-styling.config.json'
import { isWeekend, isItalianHoliday, isWeekday } from '@/lib/date'
import { getShiftColor } from '@/lib/colors'
import { getShiftDisplayCode } from '@/lib/shift-format'
import type { DensitySettings } from './types'

type ShiftStylingConfig = {
  conditionalUnderline?: {
    shiftCode: string
    weekdays: number[]
  }
}

const resolvedShiftStylingConfig: ShiftStylingConfig = shiftStylingConfig as ShiftStylingConfig

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
            const displayCode = getShiftDisplayCode(code)
            // Check if conditional underline should be applied
            const shouldUnderline =
              resolvedShiftStylingConfig.conditionalUnderline &&
              code === resolvedShiftStylingConfig.conditionalUnderline.shiftCode &&
              isWeekday(ym, day, resolvedShiftStylingConfig.conditionalUnderline.weekdays)

            return (
              <span
                key={`${personId}-${day}-${idx}`}
                className={`${isExtraCompact ? 'w-full px-1.5 py-1' : 'rounded'} font-semibold whitespace-nowrap ${isExtraCompact ? 'text-[0.7rem] leading-tight' : chipClass} ${shouldUnderline ? 'overline' : ''}`}
                style={{
                  backgroundColor: getShiftColor(code).background,
                  color: getShiftColor(code).text,
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

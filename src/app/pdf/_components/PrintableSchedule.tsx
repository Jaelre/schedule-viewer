'use client'

import { forwardRef, useMemo } from 'react'
import { getDaysInMonth, isItalianHoliday, isWeekend } from '@/lib/date'
import { getDoctorDisplayName } from '@/lib/doctor-names'
import { resolveShiftLabel } from '@/lib/shift-labels'
import type { MonthShifts } from '@/lib/types'

interface PrintableScheduleProps {
  month: MonthShifts
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, 1)

  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function formatTimestamp(): string {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
}

function formatShiftCell(codes: string[] | null | undefined): string {
  if (!codes || codes.length === 0) {
    return '-'
  }

  return codes.join(', ')
}

export const PrintableSchedule = forwardRef<HTMLDivElement, PrintableScheduleProps>(
  ({ month }, ref) => {
    const daysInMonth = getDaysInMonth(month.ym)
    const dayNumbers = useMemo(() => Array.from({ length: daysInMonth }, (_, index) => index + 1), [daysInMonth])
    const dayColumnWidth = useMemo(() => {
      if (daysInMonth === 0) {
        return 'auto'
      }

      const remainingWidth = 82
      const widthPerDay = remainingWidth / daysInMonth
      return `${widthPerDay}%`
    }, [daysInMonth])

    const timestamp = formatTimestamp()
    const monthLabel = useMemo(() => formatMonthLabel(month.ym), [month.ym])

    return (
      <div ref={ref} className="pdf-print-area">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-foreground">Turni {monthLabel}</h2>
          <p className="text-sm text-muted-foreground">Esportato il {timestamp}</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm print:shadow-none">
          <table className="w-full table-fixed border-collapse text-xs pdf-print-table">
            <colgroup>
              <col style={{ width: '18%' }} />
              {dayNumbers.map(day => (
                <col key={`col-${day}`} style={{ width: dayColumnWidth }} />
              ))}
            </colgroup>
            <thead className="bg-muted">
              <tr>
                <th className="border border-border px-2 py-1 text-left font-semibold text-foreground">Medico</th>
                {dayNumbers.map(day => {
                  const isWeekendDay = isWeekend(month.ym, day)
                  const isHoliday = isItalianHoliday(month.ym, day)
                  const cellClass = isHoliday
                    ? 'bg-red-50 text-red-900'
                    : isWeekendDay
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-foreground'

                  return (
                    <th
                      key={`head-${day}`}
                      className={`border border-border px-1 py-1 font-semibold ${cellClass}`}
                      scope="col"
                    >
                      {day}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {month.people.map((person, personIndex) => {
                const display = getDoctorDisplayName(person.id, person.name)
                const personRow = month.rows[personIndex] || []

                return (
                  <tr key={person.id} className="page-break-avoid">
                    <th
                      scope="row"
                      className="border border-border px-2 py-1 text-left font-medium text-foreground"
                    >
                      {display.display}
                    </th>
                    {dayNumbers.map(day => (
                      <td key={`${person.id}-${day}`} className="border border-border px-1 py-1 align-top">
                        <span className="block whitespace-pre-line text-[11px] leading-tight text-foreground">
                          {formatShiftCell(personRow?.[day - 1])}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {month.codes && month.codes.length > 0 && (
          <div className="mt-6 text-xs text-foreground">
            <h3 className="mb-2 font-semibold">Legenda codici</h3>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {month.codes.map(code => {
                const friendly = resolveShiftLabel(code, month.shiftNames)
                return (
                  <li key={code} className="flex gap-2">
                    <span className="font-semibold">{code}</span>
                    {friendly && <span className="text-muted-foreground">{friendly}</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  },
)

PrintableSchedule.displayName = 'PrintableSchedule'

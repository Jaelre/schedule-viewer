import { NextRequest, NextResponse } from 'next/server'
import type { MonthShifts } from '@/lib/types'

/**
 * Mock API endpoint for local development
 * In production, this is replaced by the Cloudflare Rust Worker
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ym = searchParams.get('ym')

  if (!ym) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing required parameter: ym' } },
      { status: 400 }
    )
  }

  // Validate ym format
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json(
      { error: { code: 'INVALID_YM', message: 'Invalid ym format. Expected YYYY-MM' } },
      { status: 400 }
    )
  }

  // Generate mock data
  const [year, month] = ym.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  // Mock people
  const people = [
    { id: '1', name: 'Mario Rossi' },
    { id: '2', name: 'Luigi Bianchi' },
    { id: '3', name: 'Anna Verdi' },
    { id: '4', name: 'Giulia Ferrari' },
    { id: '5', name: 'Marco Romano' },
    { id: '6', name: 'Elena Colombo' },
    { id: '7', name: 'Paolo Ricci' },
    { id: '8', name: 'Sara Marino' },
  ]

  // Mock shift codes
  const shiftCodes = ['D', 'N', 'O', 'SM', 'F', 'M', 'R']

  // Generate random shifts for each person (now supporting multiple shifts per day)
  const rows = people.map((_, personIdx) => {
    return Array.from({ length: daysInMonth }, (_, dayIdx) => {
      // Random pattern: some days off, some with shifts
      const random = Math.random()
      if (random < 0.1) return null // 10% no shift

      // Different patterns for different people
      const day = dayIdx + 1

      // 20% chance of multiple shifts for demonstration
      const hasMultipleShifts = random > 0.8

      if (personIdx % 3 === 0) {
        // Person 0, 3, 6: Day shifts mostly
        const mainShift = day % 7 === 0 ? 'O' : 'D'
        return hasMultipleShifts && mainShift !== 'O' ? [mainShift, 'SM'] : [mainShift]
      } else if (personIdx % 3 === 1) {
        // Person 1, 4, 7: Night shifts mostly
        const mainShift = day % 7 === 0 ? 'O' : 'N'
        return [mainShift]
      } else {
        // Person 2, 5, 8: Mixed shifts
        const mainShift = day % 2 === 0 ? 'D' : 'N'
        return hasMultipleShifts ? [mainShift, 'R'] : [mainShift]
      }
    })
  })

  // Extract unique codes from rows
  const uniqueCodes = new Set<string>()
  rows.forEach(row => {
    row.forEach(codes => {
      if (codes) codes.forEach(code => uniqueCodes.add(code))
    })
  })

  const mockData: MonthShifts = {
    ym,
    people,
    rows,
    codes: Array.from(uniqueCodes).sort(),
  }

  return NextResponse.json(mockData, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

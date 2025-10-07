// lib/types.ts - Frontend internal types

export type Person = {
  id: string
  name: string
}

export type DayCell = {
  day: number
  code: string | null // null = no assignment
}

export type MonthShifts = {
  ym: string // "YYYY-MM"
  people: Person[]
  // For performance: normalized matrix form
  // rows[i][d] gives the codes for person i at day d (1-indexed day mapped to 0-based index)
  // Each cell can have multiple shifts (e.g., morning + afternoon)
  rows: (string[] | null)[][]
  // Optional metadata (codes seen this month)
  codes?: string[]
  // Mapping of shift codes to full shift names (e.g., "RATM" -> "RATM 8:00AM - 2:00PM")
  shiftNames?: Record<string, string>
}

export type ShiftCodeMap = {
  [code: string]: {
    label: string
  }
}

// Error response from Worker
export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<T> = T | { error: ApiError }

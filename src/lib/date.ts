// lib/date.ts - Date utilities with Europe/Rome timezone
// Rome timezone: UTC+1 (standard) / UTC+2 (DST)
// Monday is first day of week

/**
 * Get the current month in YYYY-MM format using Europe/Rome timezone
 */
export function getCurrentYM(): string {
  const now = new Date()
  // Format in Rome timezone
  const formatter = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
  })

  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value

  return `${year}-${month}`
}

/**
 * Get the number of days in a given month
 */
export function getDaysInMonth(ym: string): number {
  const [year, month] = ym.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

/**
 * Get the first and last day of the month in YYYY-MM-DD format
 */
export function getMonthBounds(ym: string): { start: string; end: string } {
  const [year, month] = ym.split('-').map(Number)
  const daysInMonth = getDaysInMonth(ym)

  return {
    start: `${ym}-01`,
    end: `${ym}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * Day is 1-indexed (1 = first day of month)
 */
export function isWeekend(ym: string, day: number): boolean {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
}

/**
 * Check if a date matches specific weekdays
 * Day is 1-indexed (1 = first day of month)
 * Weekdays: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 */
export function isWeekday(ym: string, day: number, weekdays: number[]): boolean {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  return weekdays.includes(dayOfWeek)
}

/**
 * Italian public holidays (fixed dates + Easter-based)
 * Returns true if the given day is a holiday
 */
export function isItalianHoliday(ym: string, day: number): boolean {
  const [year, month] = ym.split('-').map(Number)

  // Fixed holidays
  const fixedHolidays = [
    { month: 1, day: 1 },   // Capodanno (New Year)
    { month: 1, day: 6 },   // Epifania
    { month: 4, day: 25 },  // Liberazione
    { month: 5, day: 1 },   // Festa del Lavoro
    { month: 6, day: 2 },   // Festa della Repubblica
    { month: 8, day: 15 },  // Ferragosto (Assumption)
    { month: 11, day: 1 },  // Ognissanti (All Saints)
    { month: 12, day: 8 },  // Immacolata Concezione
    { month: 12, day: 25 }, // Natale (Christmas)
    { month: 12, day: 26 }, // Santo Stefano
  ]

  for (const holiday of fixedHolidays) {
    if (holiday.month === month && holiday.day === day) {
      return true
    }
  }

  // Easter-based holidays (Pasqua and Lunedì dell'Angelo)
  const easter = calculateEaster(year)
  const easterMonth = easter.getMonth() + 1
  const easterDay = easter.getDate()

  // Easter Sunday
  if (month === easterMonth && day === easterDay) {
    return true
  }

  // Easter Monday (Lunedì dell'Angelo)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easterMonday.getDate() + 1)
  const mondayMonth = easterMonday.getMonth() + 1
  const mondayDay = easterMonday.getDate()

  if (month === mondayMonth && day === mondayDay) {
    return true
  }

  return false
}

/**
 * Calculate Easter Sunday using Computus algorithm (Gregorian calendar)
 */
function calculateEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

/**
 * Get the previous month in YYYY-MM format
 */
export function getPreviousYM(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}

/**
 * Get the next month in YYYY-MM format
 */
export function getNextYM(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

/**
 * Format a month for display (e.g., "Gennaio 2025")
 */
export function formatMonthDisplay(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  const formatter = new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
  })

  // Capitalize first letter
  const formatted = formatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Format a month for compact display (e.g., "Gen 26")
 */
export function formatMonthShort(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  const formatter = new Intl.DateTimeFormat('it-IT', {
    year: '2-digit',
    month: 'short',
  })

  // Capitalize first letter
  const formatted = formatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Validate YYYY-MM format
 */
export function isValidYM(ym: string): boolean {
  const pattern = /^\d{4}-\d{2}$/
  if (!pattern.test(ym)) {
    return false
  }

  const [year, month] = ym.split('-').map(Number)
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12
}

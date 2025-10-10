import type { MonthShifts } from '@/lib/types'

export type Density = 'comfortable' | 'compact' | 'extra-compact'

export const ROW_VIRTUALIZATION_THRESHOLD = 55

export interface DensitySettings {
  rowHeight: number
  cellPadding: string
  cellHeight: string
  textSize: string
  placeholderText: string
  chipClass: string
  chipGap: string
}

export const densityConfig: Record<Density, DensitySettings> = {
  comfortable: {
    rowHeight: 64,
    cellPadding: 'p-2',
    cellHeight: 'h-16',
    textSize: 'text-sm',
    placeholderText: 'text-xs',
    chipClass: 'px-2 py-0.5 text-xs',
    chipGap: 'gap-1',
  },
  compact: {
    rowHeight: 48,
    cellPadding: 'p-1',
    cellHeight: 'h-12',
    textSize: 'text-xs',
    placeholderText: 'text-xs',
    chipClass: 'px-2 py-0.5 text-xs',
    chipGap: 'gap-1',
  },
  'extra-compact': {
    rowHeight: 40,
    cellPadding: 'p-0',
    cellHeight: 'h-10',
    textSize: 'text-[0.7rem]',
    placeholderText: 'text-[0.65rem]',
    chipClass: 'px-1 py-[1px] text-[0.7rem] leading-tight',
    chipGap: 'gap-0',
  },
}

export const densityHorizontalPadding: Record<Density, number> = {
  comfortable: 16,
  compact: 8,
  'extra-compact': 0,
}

export const defaultNameColumnWidths: Record<Density, number> = {
  comfortable: 240,
  compact: 210,
  'extra-compact': 190,
}

export const pseudonymPadding = 8
export const widthBuffer = 4
export const compactNameColumnWidth = 72

export interface PersonWithDisplay {
  id: string
  name: string
  displayName: string
  resolvedName: string
  pseudonym: string | null
  originalIndex: number
}

export interface GridCommonProps {
  data: MonthShifts
  density: Density
  peopleWithNames: PersonWithDisplay[]
  daysInMonth: number
  nameColumnWidth: string
}

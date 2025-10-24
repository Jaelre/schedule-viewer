import type { DoctorNamesDict, DoctorDisplayName } from '@/lib/doctor-names'
import type { ShiftColorsData } from '@/lib/colors'

export interface ShiftStylingConfig {
  conditionalUnderline?: {
    shiftCode: string
    weekdays: number[]
  }
}

export interface RuntimeConfig {
  doctorNames: DoctorNamesDict
  shiftColors: ShiftColorsData
  fullNameOverrides: string[]
  shiftStyling: ShiftStylingConfig
}

export interface RuntimeConfigContextValue {
  config: RuntimeConfig
  isLoading: boolean
  error: string | null
  fullNameOverrideSet: Set<string>
  getShiftColor: (code: string) => { background: string; text: string }
  getDoctorDisplayName: (
    id: string | number,
    apiName?: string
  ) => DoctorDisplayName
}

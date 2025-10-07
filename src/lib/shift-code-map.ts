import type { ShiftCodeMap } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseShiftCodeDict(raw: string | undefined): ShiftCodeMap {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)

    if (!isRecord(parsed)) {
      console.warn('NEXT_PUBLIC_SHIFT_CODE_DICT must be a JSON object')
      return {}
    }

    const entries = Object.entries(parsed)
    const validEntries = entries.reduce<ShiftCodeMap>((acc, [code, value]) => {
      if (isRecord(value) && typeof value.label === 'string') {
        acc[code] = { label: value.label }
      } else {
        console.warn(
          `Ignoring invalid shift code entry for "${code}" in NEXT_PUBLIC_SHIFT_CODE_DICT`
        )
      }
      return acc
    }, {})

    return validEntries
  } catch (error) {
    console.warn('Failed to parse NEXT_PUBLIC_SHIFT_CODE_DICT:', error)
    return {}
  }
}

export const shiftCodeMap: ShiftCodeMap = parseShiftCodeDict(
  process.env.NEXT_PUBLIC_SHIFT_CODE_DICT
)

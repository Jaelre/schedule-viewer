import { getConfiguredLabel, normalizeDisplayToken } from './shift-display-config'
import type { ShiftCodeMap } from './types'

export function resolveShiftLabel(
  code: string,
  shiftNames?: Record<string, string>,
  codeMap?: ShiftCodeMap
): string {
  const directOverride = getConfiguredLabel(code)
  if (directOverride) {
    return directOverride
  }

  const label = shiftNames?.[code] || codeMap?.[code]?.label || code
  const normalized = normalizeDisplayToken(label)

  const overrideFromNormalized = getConfiguredLabel(normalized)
  if (overrideFromNormalized) {
    return overrideFromNormalized
  }

  const overrideFromRaw = getConfiguredLabel(label)
  if (overrideFromRaw) {
    return overrideFromRaw
  }

  return label || normalized || code
}

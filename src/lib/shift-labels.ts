import {
  getConfiguredLabel as getConfiguredLabelDynamic,
  normalizeDisplayToken as normalizeDisplayTokenDynamic,
} from './config-client'
import type { ShiftDisplayConfig } from './config/types'
import type { ShiftCodeMap } from './types'

export function resolveShiftLabel(
  code: string,
  shiftNames?: Record<string, string>,
  codeMap?: ShiftCodeMap,
  config?: ShiftDisplayConfig
): string {
  const getConfiguredLabel = (key: string) => getConfiguredLabelDynamic(key, config)
  const normalizeDisplayToken = (token: string) => normalizeDisplayTokenDynamic(token, config)

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

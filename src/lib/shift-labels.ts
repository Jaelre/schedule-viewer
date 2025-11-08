import {
  getConfiguredLabel as getConfiguredLabelStatic,
  normalizeDisplayToken as normalizeDisplayTokenStatic
} from './shift-display-config'
import {
  getConfiguredLabel as getConfiguredLabelDynamic,
  normalizeDisplayToken as normalizeDisplayTokenDynamic,
  type ShiftDisplayConfig
} from './config-client'
import type { ShiftCodeMap } from './types'

export function resolveShiftLabel(
  code: string,
  shiftNames?: Record<string, string>,
  codeMap?: ShiftCodeMap,
  config?: ShiftDisplayConfig
): string {
  // Use dynamic config if provided, otherwise fall back to static
  const getConfiguredLabel = config
    ? (key: string) => getConfiguredLabelDynamic(key, config)
    : getConfiguredLabelStatic
  const normalizeDisplayToken = config
    ? (token: string) => normalizeDisplayTokenDynamic(token, config)
    : normalizeDisplayTokenStatic

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

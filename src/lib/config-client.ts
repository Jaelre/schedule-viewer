import type { ShiftDisplayConfig, ShiftStylingConfig } from './config/types'

/**
 * Normalize display token using config aliases
 */
export function normalizeDisplayToken(input: string, config: ShiftDisplayConfig | undefined): string {
  const trimmed = input.trim()
  if (!trimmed || !config?.aliases) {
    return trimmed
  }

  // Check direct alias match (case-insensitive)
  const alias = config.aliases[trimmed.toLowerCase()]
  if (alias) {
    return alias
  }

  // Check first chunk alias match
  const firstChunk = trimmed.split(' ')[0]?.trim()
  if (firstChunk) {
    const chunkAlias = config.aliases[firstChunk.toLowerCase()]
    if (chunkAlias) {
      return chunkAlias
    }
  }

  return trimmed
}

/**
 * Get configured label override for a shift code
 */
export function getConfiguredLabel(
  key: string | undefined | null,
  config: ShiftDisplayConfig | undefined
): string | undefined {
  if (!key || !config?.labels) {
    return undefined
  }

  const trimmed = key.trim()
  if (!trimmed) {
    return undefined
  }

  return (
    config.labels[trimmed] ||
    config.labels[trimmed.toUpperCase()] ||
    config.labels[trimmed.toLowerCase()]
  )
}

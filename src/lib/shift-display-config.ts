import shiftDisplayConfigData from '@/config/shift-display.config.json'

interface RawShiftDisplayConfig {
  aliases?: Record<string, string>
  labels?: Record<string, string>
}

const rawConfig = (shiftDisplayConfigData ?? {}) as RawShiftDisplayConfig

const aliasMap = new Map<string, string>()
if (rawConfig.aliases) {
  for (const [rawKey, value] of Object.entries(rawConfig.aliases)) {
    const key = rawKey.trim().toLowerCase()
    if (!key) continue
    const trimmedValue = value.trim()
    if (!trimmedValue) continue
    aliasMap.set(key, trimmedValue)
  }
}

const labelOverrides = new Map<string, string>()
if (rawConfig.labels) {
  for (const [rawKey, value] of Object.entries(rawConfig.labels)) {
    const key = rawKey.trim()
    if (!key) continue
    const trimmedValue = value.trim()
    if (!trimmedValue) continue
    labelOverrides.set(key, trimmedValue)
    labelOverrides.set(key.toUpperCase(), trimmedValue)
    labelOverrides.set(key.toLowerCase(), trimmedValue)
  }
}

export function normalizeDisplayToken(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }

  const alias = aliasMap.get(trimmed.toLowerCase())
  if (alias) {
    return alias
  }

  const firstChunk = trimmed.split(' ')[0]?.trim()
  if (firstChunk) {
    const chunkAlias = aliasMap.get(firstChunk.toLowerCase())
    if (chunkAlias) {
      return chunkAlias
    }
  }

  return trimmed
}

export function getConfiguredLabel(key: string | undefined | null): string | undefined {
  if (!key) {
    return undefined
  }

  const trimmed = key.trim()
  if (!trimmed) {
    return undefined
  }

  return (
    labelOverrides.get(trimmed) ||
    labelOverrides.get(trimmed.toUpperCase()) ||
    labelOverrides.get(trimmed.toLowerCase())
  )
}

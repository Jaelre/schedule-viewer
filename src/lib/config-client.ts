import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/api'

export interface ShiftDisplayConfig {
  aliases?: Record<string, string>
  labels?: Record<string, string>
}

export interface ConditionalUnderline {
  shiftCode: string
  weekdays: number[]
}

export interface ShiftStylingConfig {
  conditionalUnderline?: ConditionalUnderline
}

/**
 * Fetch shift display config from R2 via Worker API
 */
async function fetchShiftDisplayConfig(): Promise<ShiftDisplayConfig> {
  const response = await fetch(`${API_BASE_URL}/config/shift-display`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch shift display config: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch shift styling config from R2 via Worker API
 */
async function fetchShiftStylingConfig(): Promise<ShiftStylingConfig> {
  const response = await fetch(`${API_BASE_URL}/config/shift-styling`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch shift styling config: ${response.statusText}`)
  }

  return response.json()
}

/**
 * React Query hook to fetch shift display config
 * Cached for 5 minutes (matching Worker cache TTL)
 */
export function useShiftDisplayConfig() {
  return useQuery<ShiftDisplayConfig>({
    queryKey: ['config', 'shift-display'],
    queryFn: fetchShiftDisplayConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * React Query hook to fetch shift styling config
 * Cached for 5 minutes (matching Worker cache TTL)
 */
export function useShiftStylingConfig() {
  return useQuery<ShiftStylingConfig>({
    queryKey: ['config', 'shift-styling'],
    queryFn: fetchShiftStylingConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

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

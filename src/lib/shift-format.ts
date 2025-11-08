// lib/shift-format.ts - helpers for presenting shift codes consistently

import { normalizeDisplayToken as normalizeFromStaticConfig } from './shift-display-config'
import { normalizeDisplayToken as normalizeFromDynamicConfig, type ShiftDisplayConfig } from './config-client'

/**
 * Return the compact shift code used throughout the UI.
 *
 * The upstream API may return aliases such as
 * "RATM 8:00 - 14:00" or "FT (Festivo) 08:30-18:30".
 * Grid components trim these values to the leading identifier
 * ("RATM", "FT" in the examples above). The PDF export should
 * mirror the same behaviour so that both views stay aligned.
 *
 * @param code - The shift code to format
 * @param config - Optional dynamic config from R2. If not provided, falls back to static config.
 */
export function getShiftDisplayCode(code: string, config?: ShiftDisplayConfig): string {
  if (!code) {
    return ''
  }

  const trimmed = code.trim()
  if (!trimmed) {
    return ''
  }

  // Normalise whitespace and replace long dashes with regular ones
  const normalised = trimmed.replace(/\s+/g, ' ').replace(/[–—]/g, '-')

  // Remove any trailing parenthetical information ("FT (Festivo)" → "FT")
  const withoutParen = normalised.split('(')[0]?.trim() ?? ''
  if (!withoutParen) {
    return ''
  }

  // Split on spaces to keep only the leading identifier chunk
  const leadingChunk = withoutParen.split(' ')[0]?.trim() ?? ''
  const token = leadingChunk || withoutParen

  // Use dynamic config if provided, otherwise fall back to static
  if (config) {
    return normalizeFromDynamicConfig(token, config)
  }
  return normalizeFromStaticConfig(token)
}

// lib/shift-format.ts - helpers for presenting shift codes consistently

import { normalizeDisplayToken as normalizeFromDynamicConfig } from './config-client'
import type { ShiftDisplayConfig } from './config/types'

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
 * @param config - Runtime config loaded from the Worker/R2 endpoint.
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

  return normalizeFromDynamicConfig(token, config)
}

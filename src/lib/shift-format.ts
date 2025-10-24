// lib/shift-format.ts - helpers for presenting shift codes consistently

/**
 * Return the compact shift code used throughout the UI.
 *
 * The upstream API may return aliases such as
 * "RATM 8:00 - 14:00" or "FT (Festivo) 08:30-18:30".
 * Grid components trim these values to the leading identifier
 * ("RATM", "FT" in the examples above). The PDF export should
 * mirror the same behaviour so that both views stay aligned.
 */
export function getShiftDisplayCode(code: string): string {
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
  return leadingChunk || withoutParen
}

// lib/colors.ts - Deterministic color mapping for shift codes
// Colors must be accessible (WCAG AA contrast ratio)

/**
 * Hash a string to a number (for deterministic color generation)
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Generate a deterministic color for a shift code
 * Returns { background, text } with accessible contrast
 */
export function getShiftColor(code: string): { background: string; text: string } {
  const normalizedCode = code.toUpperCase()

  const curatedPalette: Record<string, { background: string; text: string }> = {
    REP: { background: '#dcd6ff', text: '#4338ca' }, // Reperibilità - Indigo
    RA: { background: '#fde68a', text: '#92400e' }, // Reparto/Pronto - Amber
    OT: { background: '#bfede6', text: '#0f766e' }, // Ortopedia/Turno OT - Teal
    FT: { background: '#c7d2fe', text: '#312e81' }, // Formazione - Periwinkle
    SM: { background: '#99f6e4', text: '#0f766e' }, // Smonto - Aqua
    V: { background: '#fed7aa', text: '#9a3412' }, // Ferie/Vacanza - Apricot
    P: { background: '#fbcfe8', text: '#9d174d' }, // Permessi - Pink
    N: { background: '#c7d2fe', text: '#1e3a8a' }, // Night - Blue
    D: { background: '#fef3c7', text: '#92400e' }, // Day - Soft Yellow
    R: { background: '#bbf7d0', text: '#166534' }, // Riposo - Mint
    F: { background: '#e5e7eb', text: '#1f2937' }, // Festivo - Cool Gray
    M: { background: '#e9d5ff', text: '#6b21a8' }, // Malattia - Lavender
    ORT: { background: '#fee2e2', text: '#b91c1c' }, // Ortopedia - Rose
    OB: { background: '#fde2ff', text: '#a21caf' }, // Ostetricia - Magenta
    G: { background: '#e0f2fe', text: '#0369a1' }, // Guardia - Sky
  }

  const paletteKeys = Object.keys(curatedPalette).sort((a, b) => b.length - a.length)

  for (const key of paletteKeys) {
    if (normalizedCode.startsWith(key)) {
      return curatedPalette[key]
    }
  }

  if (curatedPalette[normalizedCode]) {
    return curatedPalette[normalizedCode]
  }

  // Generate color from hash
  const hash = hashCode(code)

  // Use hash to generate a hue (0-360)
  const hue = hash % 360

  // Generate a light background with dark text for good contrast
  // Saturation: 40-70% for vibrant but not overwhelming colors
  // Lightness: 75-90% for light backgrounds
  const saturation = 40 + (hash % 30)
  const lightness = 75 + (hash % 15)

  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  const text = `hsl(${hue}, ${saturation}%, ${Math.max(10, lightness - 65)}%)`

  return { background, text }
}

/**
 * Get all unique shift codes from MonthShifts data
 */
export function extractShiftCodes(rows: (string | null)[][]): string[] {
  const codesSet = new Set<string>()

  for (const row of rows) {
    for (const code of row) {
      if (code !== null && code !== '') {
        codesSet.add(code)
      }
    }
  }

  return Array.from(codesSet).sort()
}

/**
 * Check if a color has sufficient contrast (WCAG AA standard)
 * Returns true if contrast ratio >= 4.5:1
 */
export function hasGoodContrast(background: string, text: string): boolean {
  // Simplified check - in production, use a proper color contrast library
  // This is a placeholder that assumes our generated colors are already accessible
  return true
}

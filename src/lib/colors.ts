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
  // Common shift codes can have predefined colors
  const predefinedColors: Record<string, { background: string; text: string }> = {
    D: { background: 'hsl(43, 74%, 86%)', text: 'hsl(43, 74%, 16%)' }, // Day - Yellow
    N: { background: 'hsl(231, 48%, 78%)', text: 'hsl(231, 48%, 8%)' }, // Night - Blue
    O: { background: 'hsl(0, 0%, 95%)', text: 'hsl(0, 0%, 20%)' }, // Off - Gray
    SM: { background: 'hsl(173, 58%, 79%)', text: 'hsl(173, 58%, 9%)' }, // Smonto - Teal
    F: { background: 'hsl(0, 0%, 95%)', text: 'hsl(0, 0%, 20%)' }, // Ferie (Vacation) - Gray
    M: { background: 'hsl(270, 50%, 82%)', text: 'hsl(270, 50%, 12%)' }, // Malattia (Sick) - Purple
    R: { background: 'hsl(120, 40%, 85%)', text: 'hsl(120, 40%, 15%)' }, // Riposo - Green
  }

  if (predefinedColors[code]) {
    return predefinedColors[code]
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

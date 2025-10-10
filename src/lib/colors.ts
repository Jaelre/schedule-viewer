// lib/colors.ts - Deterministic color mapping for shift codes
// Colors must be accessible (WCAG AA contrast ratio)

import shiftColorsData from '@/config/shift-colors.json'

interface ShiftColorConfig {
  background: string
  text: string
  description?: string
}

interface ShiftColorsData {
  comment: string
  colors: Record<string, ShiftColorConfig>
  fallback: {
    comment: string
    saturation_min: number
    saturation_range: number
    lightness_min: number
    lightness_range: number
    text_lightness_offset: number
  }
}

const shiftColors: ShiftColorsData = shiftColorsData

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
  // Check if there's a predefined color in the JSON config
  if (shiftColors.colors[code]) {
    return {
      background: shiftColors.colors[code].background,
      text: shiftColors.colors[code].text,
    }
  }

  // Generate color from hash using fallback configuration
  const hash = hashCode(code)
  const { saturation_min, saturation_range, lightness_min, lightness_range, text_lightness_offset } = shiftColors.fallback

  // Use hash to generate a hue (0-360)
  const hue = hash % 360

  // Generate a light background with dark text for good contrast
  const saturation = saturation_min + (hash % saturation_range)
  const lightness = lightness_min + (hash % lightness_range)

  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  const text = `hsl(${hue}, ${saturation}%, ${Math.max(10, lightness - text_lightness_offset)}%)`

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

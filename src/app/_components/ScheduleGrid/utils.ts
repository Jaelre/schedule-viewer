import { getDoctorDisplayName } from '@/lib/doctor-names'
import type { Person } from '@/lib/types'
import type { PersonWithDisplay, Density } from './types'
import { densityHorizontalPadding, defaultNameColumnWidths, pseudonymPadding, widthBuffer } from './types'

export function getNameAbbreviation(name: string): string {
  const trimmed = name.trim()

  if (!trimmed) {
    return ''
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const firstWord = parts[0]
  const lastWord = parts[parts.length - 1]

  const firstInitial = firstWord.charAt(0).toUpperCase()
  const lastInitial = lastWord.charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`
}

export function preparePeopleWithNames(people: Person[]): PersonWithDisplay[] {
  return people
    .map((person, index) => {
      const displayInfo = getDoctorDisplayName(person.id, person.name)

      return {
        ...person,
        displayName: displayInfo.display,
        resolvedName: displayInfo.name || displayInfo.display,
        pseudonym: displayInfo.pseudonym ?? null,
        originalIndex: index
      }
    })
    .filter(person => !person.displayName.startsWith('zzz_'))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'it'))
}

export function calculateNameColumnWidth(
  peopleWithNames: PersonWithDisplay[],
  density: Density,
  isExtraCompact: boolean
): string {
  if (typeof window === 'undefined' || peopleWithNames.length === 0) {
    return `${defaultNameColumnWidths[density]}px`
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return `${defaultNameColumnWidths[density]}px`
  }

  const probe = document.createElement('span')
  probe.className = 'font-medium'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.whiteSpace = 'nowrap'
  probe.textContent = 'M'
  document.body.appendChild(probe)

  const computedStyle = window.getComputedStyle(probe)
  const fontWeight = computedStyle.fontWeight || '500'
  const fontSize = computedStyle.fontSize || '16px'
  const fontFamily = computedStyle.fontFamily || 'sans-serif'
  document.body.removeChild(probe)

  context.font = `${fontWeight} ${fontSize} ${fontFamily}`

  const pseudonymSpacing = isExtraCompact ? 0 : pseudonymPadding
  let maxContentWidth = 0

  for (const person of peopleWithNames) {
    const baseWidth = context.measureText(person.resolvedName).width
    const pseudonymWidth = person.pseudonym
      ? context.measureText(person.pseudonym).width + pseudonymSpacing
      : 0
    const total = baseWidth + pseudonymWidth
    if (total > maxContentWidth) {
      maxContentWidth = total
    }
  }

  const horizontalPadding = densityHorizontalPadding[density]
  const fallbackWidth = defaultNameColumnWidths[density]
  const computedWidth =
    maxContentWidth > 0
      ? Math.ceil(maxContentWidth + horizontalPadding + widthBuffer)
      : fallbackWidth

  return `${computedWidth}px`
}

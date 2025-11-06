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
    return parts[0].slice(0, 6)
  }

  // Join all surname parts (excluding the last part which is the given name)
  const surnameWithoutSpaces = parts.slice(0, -1).join('')
  const givenName = parts[parts.length - 1]

  const surnameChunk = surnameWithoutSpaces.slice(0, 3)
  const givenNameChunk = givenName.slice(0, 1)

  return `${surnameChunk}${givenNameChunk}`
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

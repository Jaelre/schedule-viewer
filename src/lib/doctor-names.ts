import doctorNamesData from '@/config/doctor-names.json'

export interface DoctorNamesDict {
  comment: string
  names: Record<string, string>
}

export interface DoctorDisplayName {
  name: string
  pseudonym?: string
  display: string
}

const doctorNames: DoctorNamesDict = doctorNamesData

function extractPseudonym(apiName?: string): string | undefined {
  if (!apiName) {
    return undefined
  }

  const trimmed = apiName.trim()
  if (!trimmed) {
    return undefined
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 0) {
    return undefined
  }

  const candidate = parts[parts.length - 1]
  if (!/^\d+$/.test(candidate)) {
    return undefined
  }

  return candidate
}

function stripExistingPseudonym(name: string, pseudonym: string) {
  const patterns = [
    new RegExp(`\\s+${pseudonym}$`),
    new RegExp(`\\s*\\(${pseudonym}\\)$`),
  ]

  for (const pattern of patterns) {
    if (pattern.test(name)) {
      return {
        base: name.replace(pattern, '').trim(),
        removed: true,
      }
    }
  }

  return {
    base: name.trim(),
    removed: false,
  }
}

function appendPseudonym(name: string, apiName?: string): string {
  const trimmedName = name.trim()
  const pseudonym = extractPseudonym(apiName)

  if (!trimmedName) {
    return pseudonym ?? ''
  }

  if (!pseudonym) {
    return trimmedName
  }

  if (
    trimmedName === pseudonym ||
    trimmedName.endsWith(` ${pseudonym}`) ||
    trimmedName.endsWith(`(${pseudonym})`)
  ) {
    return trimmedName
  }

  return `${trimmedName} ${pseudonym}`
}

function resolveBaseName(id: string, apiName?: string): string {
  if (doctorNames.names[id]) {
    return doctorNames.names[id]
  }

  if (apiName && doctorNames.names[apiName]) {
    return doctorNames.names[apiName]
  }

  const trimmedApiName = apiName?.trim() ?? ''
  if (trimmedApiName) {
    if (doctorNames.names[trimmedApiName]) {
      return doctorNames.names[trimmedApiName]
    }

    const searchTerm = trimmedApiName.toLowerCase()

    for (const [key, fullName] of Object.entries(doctorNames.names)) {
      if (key.toLowerCase() === searchTerm) {
        return fullName
      }
    }

    const searchParts = searchTerm.split(/\s+/)
    const searchLastName = searchParts[searchParts.length - 1]

    for (const fullName of Object.values(doctorNames.names)) {
      const fullNameLower = fullName.toLowerCase()
      const nameParts = fullNameLower.split(/\s+/)
      const lastName = nameParts[nameParts.length - 1]

      if (lastName === searchLastName || fullNameLower.includes(searchLastName)) {
        return fullName
      }
    }

    return trimmedApiName
  }

  return id
}

/**
 * Get structured display data for a doctor (name + optional pseudonym)
 * @param id - The doctor's ID (as string or number)
 * @param apiName - Optional name from the API to use for matching
 * @returns The doctor's formatted name parts
 */
export function getDoctorDisplayName(id: string | number, apiName?: string): DoctorDisplayName {
  const idStr = String(id)
  const rawBaseName = resolveBaseName(idStr, apiName)
  const baseName = rawBaseName.trim()
  const display = appendPseudonym(rawBaseName, apiName)
  const pseudonym = extractPseudonym(apiName)

  if (!pseudonym) {
    return {
      name: baseName || display,
      display,
    }
  }

  if (!baseName || baseName === pseudonym) {
    return {
      name: display,
      display,
    }
  }

  const { base: strippedName } = stripExistingPseudonym(baseName, pseudonym)

  if (!strippedName) {
    return {
      name: pseudonym,
      display,
    }
  }

  const shouldShowPseudonym = strippedName !== pseudonym && strippedName.length > 0

  return {
    name: strippedName,
    pseudonym: shouldShowPseudonym ? pseudonym : undefined,
    display,
  }
}

/**
 * Get the real name for a doctor by searching through the names dictionary
 * @param id - The doctor's ID (as string or number)
 * @param apiName - Optional name from the API to use for matching
 * @returns The doctor's real name, or the original ID/name if not found
 */
export function getDoctorName(id: string | number, apiName?: string): string {
  return getDoctorDisplayName(id, apiName).display
}

/**
 * Get the entire doctor names dictionary
 */
export function getAllDoctorNames(): Record<string, string> {
  return doctorNames.names
}

/**
 * Check if a doctor ID exists in the dictionary
 */
export function hasDoctorName(id: string | number): boolean {
  const idStr = String(id)
  return idStr in doctorNames.names
}

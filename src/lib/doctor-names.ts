import doctorNamesData from './doctor-names.json'

export interface DoctorNamesDict {
  comment: string
  names: Record<string, string>
}

const doctorNames: DoctorNamesDict = doctorNamesData

/**
 * Get the real name for a doctor by searching through the names dictionary
 * @param id - The doctor's ID (as string or number)
 * @param apiName - Optional name from the API to use for matching
 * @returns The doctor's real name, or the original ID/name if not found
 */
export function getDoctorName(id: string | number, apiName?: string): string {
  const idStr = String(id)

  // First try direct ID or name lookup
  if (doctorNames.names[idStr]) {
    return doctorNames.names[idStr]
  }

  if (apiName && doctorNames.names[apiName]) {
    return doctorNames.names[apiName]
  }

  // If API name provided, search for substring match (case insensitive)
  if (apiName) {
    const searchTerm = apiName.toLowerCase().trim()

    // First, check if the API name is used as a key in the dictionary
    for (const [key, fullName] of Object.entries(doctorNames.names)) {
      if (key.toLowerCase() === searchTerm) {
        return fullName
      }
    }

    // Then try to find if searchTerm contains any part of a real name (last name match)
    const searchParts = searchTerm.split(/\s+/)
    const searchLastName = searchParts[searchParts.length - 1]

    for (const fullName of Object.values(doctorNames.names)) {
      const fullNameLower = fullName.toLowerCase()
      const nameParts = fullNameLower.split(/\s+/)
      const lastName = nameParts[nameParts.length - 1]

      // Match by last name
      if (lastName === searchLastName || fullNameLower.includes(searchLastName)) {
        return fullName
      }
    }
  }

  // Fallback to API name or ID
  return apiName || idStr
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

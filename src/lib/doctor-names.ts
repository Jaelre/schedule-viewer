import doctorNamesData from './doctor-names.json'

export interface DoctorNamesDict {
  comment: string
  names: Record<string, string>
}

const doctorNames: DoctorNamesDict = doctorNamesData

/**
 * Get the real name for a doctor by their ID or partial name match
 * @param id - The doctor's ID (as string or number)
 * @param apiName - Optional name from the API to use for matching
 * @returns The doctor's real name, or the original ID/name if not found
 */
export function getDoctorName(id: string | number, apiName?: string): string {
  const idStr = String(id)

  // First try direct ID lookup
  if (doctorNames.names[idStr]) {
    return doctorNames.names[idStr]
  }

  // If API name provided, try to match by last name (case insensitive)
  if (apiName) {
    const apiNameLower = apiName.toLowerCase().trim()
    const apiParts = apiNameLower.split(/\s+/)
    const apiLastName = apiParts[apiParts.length - 1]

    // Search through all names for a match
    for (const fullName of Object.values(doctorNames.names)) {
      const fullNameLower = fullName.toLowerCase()
      const nameParts = fullNameLower.split(/\s+/)
      const lastName = nameParts[nameParts.length - 1]

      // Match by last name
      if (lastName === apiLastName) {
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

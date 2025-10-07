import doctorNamesData from './doctor-names.json'

export interface DoctorNamesDict {
  comment: string
  names: Record<string, string>
}

const doctorNames: DoctorNamesDict = doctorNamesData

/**
 * Get the real name for a doctor by their ID
 * @param id - The doctor's ID (as string or number)
 * @returns The doctor's real name, or the original ID if not found
 */
export function getDoctorName(id: string | number): string {
  const idStr = String(id)
  return doctorNames.names[idStr] || idStr
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

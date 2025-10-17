'use client'

import fullNameOverridesConfig from '@/config/full-name-overrides.json'

import { getNameAbbreviation } from './utils'
import { useAdaptiveCompactName } from './useAdaptiveCompactName'
import type { PersonWithDisplay } from './types'

interface NameCellContentProps {
  person: PersonWithDisplay
  isHorizontalScrollActive: boolean
  isExtraCompact: boolean
}

const FULL_NAME_OVERRIDES = new Set(
  (Array.isArray(fullNameOverridesConfig)
    ? fullNameOverridesConfig
    : []
  )
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .map((name) => name.trim().toLowerCase())
)

export function NameCellContent({
  person,
  isHorizontalScrollActive,
  isExtraCompact,
}: NameCellContentProps) {
  const normalizedName = person.resolvedName.trim().toLowerCase()
  const shouldForceFullName = FULL_NAME_OVERRIDES.has(normalizedName)
  const showFullNameInCompact = isHorizontalScrollActive && shouldForceFullName

  const { ref: nameRef, style } = useAdaptiveCompactName(
    showFullNameInCompact,
    person.resolvedName
  )

  const nameToDisplay = isHorizontalScrollActive
    ? shouldForceFullName
      ? person.resolvedName
      : getNameAbbreviation(person.resolvedName)
    : person.resolvedName

  return (
    <>
      <span
        ref={nameRef}
        style={showFullNameInCompact ? style : undefined}
        className={`min-w-0 ${
          isHorizontalScrollActive ? 'flex-none font-semibold' : 'flex-1 truncate'
        }`}
      >
        {nameToDisplay}
      </span>
      {!isHorizontalScrollActive && person.pseudonym && (
        <span
          className={`ml-auto flex-none whitespace-nowrap ${
            isExtraCompact ? '' : 'pl-2'
          } text-right text-muted-foreground opacity-70`}
        >
          {person.pseudonym}
        </span>
      )}
    </>
  )
}


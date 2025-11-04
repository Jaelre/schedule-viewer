'use client'

import { useRuntimeConfig } from '@/lib/config/runtime-config'

import { getNameAbbreviation } from './utils'
import { useAdaptiveCompactName } from './useAdaptiveCompactName'
import type { PersonWithDisplay } from './types'

interface NameCellContentProps {
  person: PersonWithDisplay
  isHorizontalScrollActive: boolean
  isExtraCompact: boolean
}

export function NameCellContent({
  person,
  isHorizontalScrollActive,
  isExtraCompact,
}: NameCellContentProps) {
  const { fullNameOverrideSet } = useRuntimeConfig()
  const normalizedName = person.resolvedName.trim().toLowerCase()
  const shouldForceFullName = fullNameOverrideSet.has(normalizedName)
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


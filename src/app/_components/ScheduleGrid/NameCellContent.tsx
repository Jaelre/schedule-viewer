'use client'

import { getNameAbbreviation } from './utils'
import { useAdaptiveCompactName } from './useAdaptiveCompactName'
import type { PersonWithDisplay } from './types'

interface NameCellContentProps {
  person: PersonWithDisplay
  isHorizontalScrollActive: boolean
  isExtraCompact: boolean
}

const BONZI_FULL_NAME = #name

export function NameCellContent({
  person,
  isHorizontalScrollActive,
  isExtraCompact,
}: NameCellContentProps) {
  const normalizedName = person.resolvedName.trim().toLowerCase()
  const isBonzi = normalizedName === BONZI_FULL_NAME
  const showFullNameInCompact = isHorizontalScrollActive && isBonzi

  const { ref: nameRef, style } = useAdaptiveCompactName(
    showFullNameInCompact,
    person.resolvedName
  )

  const nameToDisplay = isHorizontalScrollActive
    ? isBonzi
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


'use client'

import { useState } from 'react'
import { useRuntimeConfig } from '@/lib/config/runtime-config'

import { getNameAbbreviation } from './utils'
import { useAdaptiveCompactName } from './useAdaptiveCompactName'
import { PhotoModal } from './PhotoModal'
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
  const [showPhoto, setShowPhoto] = useState(false)
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
      {!isHorizontalScrollActive && person.photoUrl && (
        <button
          type="button"
          onClick={() => setShowPhoto(true)}
          className="mr-1.5 flex-none shrink-0 focus:outline-none"
          aria-label={`Foto di ${person.resolvedName}`}
        >
          <img
            src={person.photoUrl}
            alt={person.resolvedName}
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
        </button>
      )}
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
      {showPhoto && person.photoUrl && (
        <PhotoModal
          src={person.photoUrl}
          name={person.resolvedName}
          onClose={() => setShowPhoto(false)}
        />
      )}
    </>
  )
}


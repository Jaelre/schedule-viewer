'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getDoctorDisplayName } from '@/lib/doctor-names'
import { getShiftColorFromConfig, DEFAULT_SHIFT_COLORS } from '@/lib/colors'
import type { DoctorNamesDict } from '@/lib/doctor-names'
import type { ShiftColorsData } from '@/lib/colors'
import type {
  RuntimeConfig,
  RuntimeConfigContextValue,
  ShiftStylingConfig,
} from './types'

const DEFAULT_DOCTOR_NAMES: DoctorNamesDict = {
  comment: 'Runtime fallback when no doctor-names.json is provided.',
  names: {},
}

const DEFAULT_SHIFT_STYLING: ShiftStylingConfig = {}

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  doctorNames: DEFAULT_DOCTOR_NAMES,
  shiftColors: DEFAULT_SHIFT_COLORS,
  fullNameOverrides: [],
  shiftStyling: DEFAULT_SHIFT_STYLING,
}

const RuntimeConfigContext = createContext<RuntimeConfigContextValue | undefined>(undefined)

async function fetchJson<T>(path: string): Promise<T> {
  const base = (process.env.NEXT_PUBLIC_CONFIG_BASE_URL || '/config').replace(/\/$/, '')
  const url = `${base}/${path}`
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

function sanitizeDoctorNames(raw: unknown): DoctorNamesDict {
  if (
    raw &&
    typeof raw === 'object' &&
    'names' in raw &&
    raw.names &&
    typeof raw.names === 'object'
  ) {
    const cast = raw as DoctorNamesDict
    return {
      comment: typeof cast.comment === 'string' ? cast.comment : '',
      names: Object.fromEntries(
        Object.entries(cast.names).filter(([, value]) => typeof value === 'string')
      ),
    }
  }

  return DEFAULT_DOCTOR_NAMES
}

function sanitizeShiftColors(raw: unknown): ShiftColorsData {
  if (
    raw &&
    typeof raw === 'object' &&
    'colors' in raw &&
    raw.colors &&
    typeof raw.colors === 'object' &&
    'fallback' in raw &&
    raw.fallback &&
    typeof raw.fallback === 'object'
  ) {
    const cast = raw as ShiftColorsData
    const sanitizedColors = Object.fromEntries(
      Object.entries(cast.colors).filter(([, value]) =>
        value && typeof value === 'object' && typeof value.background === 'string' && typeof value.text === 'string'
      )
    )

    const fallback = cast.fallback
    if (
      typeof fallback.saturation_min === 'number' &&
      typeof fallback.saturation_range === 'number' &&
      typeof fallback.lightness_min === 'number' &&
      typeof fallback.lightness_range === 'number' &&
      typeof fallback.text_lightness_offset === 'number'
    ) {
      return {
        comment: typeof cast.comment === 'string' ? cast.comment : '',
        colors: sanitizedColors,
        fallback: fallback,
      }
    }
  }

  return DEFAULT_SHIFT_COLORS
}

function sanitizeFullNameOverrides(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return Array.from(
    new Set(
      raw
        .filter((value): value is string => typeof value === 'string')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    )
  )
}

function sanitizeShiftStyling(raw: unknown): ShiftStylingConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SHIFT_STYLING
  }

  const candidate = raw as ShiftStylingConfig
  const config: ShiftStylingConfig = {}

  if (
    candidate.conditionalUnderline &&
    typeof candidate.conditionalUnderline === 'object' &&
    typeof candidate.conditionalUnderline.shiftCode === 'string' &&
    Array.isArray(candidate.conditionalUnderline.weekdays)
  ) {
    config.conditionalUnderline = {
      shiftCode: candidate.conditionalUnderline.shiftCode,
      weekdays: candidate.conditionalUnderline.weekdays
        .map((weekday) => Number(weekday))
        .filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6),
    }
  }

  return config
}

export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig>(DEFAULT_RUNTIME_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      setIsLoading(true)
      const nextErrors: string[] = []

      const results = await Promise.allSettled([
        fetchJson<DoctorNamesDict>('doctor-names.json'),
        fetchJson<ShiftColorsData>('shift-colors.json'),
        fetchJson<string[]>('full-name-overrides.json'),
        fetchJson<ShiftStylingConfig>('shift-styling.config.json'),
      ])

      if (cancelled) {
        return
      }

      const [doctorNamesResult, shiftColorsResult, fullNameOverridesResult, shiftStylingResult] = results

      if (doctorNamesResult.status === 'rejected') {
        nextErrors.push('Impossibile caricare doctor-names.json. Uso dei nomi di fallback.')
      }

      if (shiftColorsResult.status === 'rejected') {
        nextErrors.push('Impossibile caricare shift-colors.json. Uso dei colori di fallback.')
      }

      if (fullNameOverridesResult.status === 'rejected') {
        nextErrors.push('Impossibile caricare full-name-overrides.json.')
      }

      if (shiftStylingResult.status === 'rejected') {
        nextErrors.push('Impossibile caricare shift-styling.config.json.')
      }

      setConfig({
        doctorNames:
          doctorNamesResult.status === 'fulfilled'
            ? sanitizeDoctorNames(doctorNamesResult.value)
            : DEFAULT_DOCTOR_NAMES,
        shiftColors:
          shiftColorsResult.status === 'fulfilled'
            ? sanitizeShiftColors(shiftColorsResult.value)
            : DEFAULT_SHIFT_COLORS,
        fullNameOverrides:
          fullNameOverridesResult.status === 'fulfilled'
            ? sanitizeFullNameOverrides(fullNameOverridesResult.value)
            : [],
        shiftStyling:
          shiftStylingResult.status === 'fulfilled'
            ? sanitizeShiftStyling(shiftStylingResult.value)
            : DEFAULT_SHIFT_STYLING,
      })

      setErrorMessages(nextErrors)
      setIsLoading(false)
    }

    loadConfig().catch((error) => {
      if (cancelled) {
        return
      }
      console.error('Failed to load runtime config', error)
      setConfig(DEFAULT_RUNTIME_CONFIG)
      setErrorMessages(['Errore sconosciuto durante il caricamento della configurazione.'])
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const error = useMemo(() => {
    if (errorMessages.length === 0) {
      return null
    }

    return errorMessages.join(' ')
  }, [errorMessages])

  const fullNameOverrideSet = useMemo(() => {
    return new Set(
      config.fullNameOverrides
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0)
    )
  }, [config.fullNameOverrides])

  const getShiftColor = useCallback(
    (code: string) => getShiftColorFromConfig(config.shiftColors, code),
    [config.shiftColors]
  )

  const getDoctorDisplayNameFromConfig = useCallback(
    (id: string | number, apiName?: string) =>
      getDoctorDisplayName(config.doctorNames, id, apiName),
    [config.doctorNames]
  )

  const value = useMemo<RuntimeConfigContextValue>(
    () => ({
      config,
      isLoading,
      error,
      fullNameOverrideSet,
      getShiftColor,
      getDoctorDisplayName: getDoctorDisplayNameFromConfig,
    }),
    [config, error, fullNameOverrideSet, getShiftColor, getDoctorDisplayNameFromConfig, isLoading]
  )

  return (
    <RuntimeConfigContext.Provider value={value}>
      {children}
    </RuntimeConfigContext.Provider>
  )
}

export function useRuntimeConfig(): RuntimeConfigContextValue {
  const context = useContext(RuntimeConfigContext)

  if (!context) {
    throw new Error('useRuntimeConfig must be used within a RuntimeConfigProvider')
  }

  return context
}

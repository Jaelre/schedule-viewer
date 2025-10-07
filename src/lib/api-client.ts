// lib/api-client.ts - Frontend API client with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { MonthShifts, ApiResponse, ApiError } from './types'

/**
 * Base API URL - in development, this proxies through Next.js
 * In production (static export), this calls the Cloudflare Worker directly
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * Fetch month shifts data from the Worker
 */
async function getMonthShifts({ ym }: { ym: string }): Promise<MonthShifts> {
  const response = await fetch(`${API_BASE_URL}/shifts?ym=${ym}`)

  if (!response.ok) {
    const errorData: ApiResponse<never> = await response.json()
    if ('error' in errorData) {
      throw new Error(errorData.error.message)
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data: ApiResponse<MonthShifts> = await response.json()

  if ('error' in data) {
    throw new Error(data.error.message)
  }

  return data
}

/**
 * React Query hook for fetching month shifts
 * - Caches data with stale time of 5 minutes
 * - Background refetch every 10 minutes
 * - Refetch on window focus
 */
export function useMonthShifts(ym: string): UseQueryResult<MonthShifts, Error> {
  return useQuery({
    queryKey: ['shifts', ym],
    queryFn: () => getMonthShifts({ ym }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes background refetch
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  })
}

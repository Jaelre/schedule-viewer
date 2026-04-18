// lib/api-client.ts - Frontend API client with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { MonthShifts, ApiResponse, ApiError } from './types'
import { resolveApiUrl, withViewerCredentials } from './api-base'

/**
 * Fetch month shifts data from the Worker
 */
async function getMonthShifts({ ym }: { ym: string }): Promise<MonthShifts> {
  const response = await fetch(
    resolveApiUrl(`/shifts?ym=${ym}`),
    withViewerCredentials()
  )

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

/**
 * Submit user feedback
 */
interface FeedbackPayload {
  feedback_text: string
  signature?: string
  metadata?: Record<string, unknown>
}

interface FeedbackResponse {
  success: boolean
  error?: string
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const response = await fetch(
    resolveApiUrl('/feedback'),
    withViewerCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  )

  if (!response.ok) {
    const errorData: FeedbackResponse = await response.json().catch(() => ({
      success: false,
      error: 'Network error',
    }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data: FeedbackResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to submit feedback')
  }
}

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
  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('schedule_viewer_token') : null

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/shifts?ym=${ym}`, { headers })

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('schedule_viewer_token') : null

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

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

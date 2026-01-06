'use client'

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { submitFeedback } from '@/lib/api-client'
import { useTelemetry } from '@/app/providers'
import { useSearchParams } from 'next/navigation'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackText, setFeedbackText] = useState('')
  const [signature, setSignature] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { track } = useTelemetry()
  const searchParams = useSearchParams()
  const currentYM = searchParams.get('ym') || ''

  const charCount = feedbackText.length
  const isOverLimit = charCount > 1000

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setFeedbackText('')
        setSignature('')
        setError(null)
        setSuccess(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isSubmitting, onClose])

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const trimmedText = feedbackText.trim()

      if (!trimmedText) {
        setError('Il feedback non può essere vuoto.')
        track({ feature: 'feedback_modal', action: 'submit_validation_error', value: 'empty' })
        return
      }

      if (trimmedText.length > 1000) {
        setError('Il feedback non può superare 1000 caratteri.')
        track({
          feature: 'feedback_modal',
          action: 'submit_validation_error',
          value: 'too_long',
        })
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const metadata = {
          ym: currentYM,
          url: window.location.href,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          referrer: document.referrer || undefined,
        }

        await submitFeedback({
          feedback_text: trimmedText,
          signature: signature.trim() || undefined,
          metadata,
        })

        setSuccess(true)
        track({ feature: 'feedback_modal', action: 'submit_success', value: currentYM })

        setTimeout(() => onClose(), 2000)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Si è verificato un errore.'
        setError(errorMessage)
        track({ feature: 'feedback_modal', action: 'submit_error', value: errorMessage })
      } finally {
        setIsSubmitting(false)
      }
    },
    [feedbackText, signature, currentYM, onClose, track]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="bg-white border border-gray-300 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Grazie!</h2>
            <p className="text-sm text-gray-600">Il tuo feedback è stato inviato con successo.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Invia Feedback</h2>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50"
              >
                Chiudi
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="feedback-text" className="text-sm font-medium text-gray-700">
                  Il tuo feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={isSubmitting}
                  rows={6}
                  maxLength={1000}
                  className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                    isOverLimit ? 'border-red-500' : 'border-input bg-background'
                  }`}
                  placeholder="Condividi la tua esperienza, suggerimenti, o segnala problemi..."
                  autoFocus
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {charCount} / 1000 caratteri
                  </span>
                  {isOverLimit && (
                    <span className="text-red-600">Limite superato di {charCount - 1000}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signature" className="text-sm font-medium text-gray-700">
                  Nome o iniziali <span className="text-gray-400">(opzionale)</span>
                </label>
                <input
                  id="signature"
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  placeholder="Es: Mario R. o solo Mario"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isOverLimit || !feedbackText.trim()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Invio in corso...' : 'Invia Feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

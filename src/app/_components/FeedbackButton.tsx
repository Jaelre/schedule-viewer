'use client'

import { useState, useCallback } from 'react'
import { FeedbackModal } from './FeedbackModal'
import { useTelemetry } from '@/app/providers'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { track } = useTelemetry()

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    track({ feature: 'feedback_button', action: 'open_modal' })
  }, [track])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    track({ feature: 'feedback_button', action: 'close_modal' })
  }, [track])

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
        aria-label="Invia feedback"
      >
        Feedback
      </button>

      <FeedbackModal isOpen={isOpen} onClose={handleClose} />
    </>
  )
}

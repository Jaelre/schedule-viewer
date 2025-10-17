'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

interface AdaptiveCompactNameResult {
  ref: RefObject<HTMLSpanElement | null>
  style: CSSProperties | undefined
}

const MIN_FONT_SIZE_PX = 10

export function useAdaptiveCompactName(enabled: boolean, text: string): AdaptiveCompactNameResult {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setFontSize(prev => (prev === null ? prev : null))
      return
    }

    const spanElement = spanRef.current
    if (!spanElement) {
      return
    }

    const container = spanElement.parentElement as HTMLElement | null
    if (!container) {
      return
    }

    let animationFrame = 0
    let cleanup: (() => void) | undefined

    const updateFontSize = () => {
      const targetSpan = spanRef.current
      const targetContainer = targetSpan?.parentElement as HTMLElement | null

      if (!targetSpan || !targetContainer) {
        return
      }

      const containerStyles = window.getComputedStyle(targetContainer)
      const paddingLeft = Number.parseFloat(containerStyles.paddingLeft || '0') || 0
      const paddingRight = Number.parseFloat(containerStyles.paddingRight || '0') || 0
      const horizontalPadding = paddingLeft + paddingRight
      const availableWidth = targetContainer.clientWidth - horizontalPadding
      if (availableWidth <= 0) {
        return
      }

      const previousInlineSize = targetSpan.style.fontSize
      targetSpan.style.fontSize = ''
      const computed = window.getComputedStyle(targetSpan)
      const fontFamily = computed.fontFamily || 'sans-serif'
      const fontWeight = computed.fontWeight || '600'
      const baseFontPx = parseFloat(computed.fontSize || '16')
      targetSpan.style.fontSize = previousInlineSize

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      context.font = `${fontWeight} ${baseFontPx}px ${fontFamily}`
      const textWidth = context.measureText(text).width

      if (textWidth <= availableWidth) {
        setFontSize(prev => (prev === null ? prev : null))
        return
      }

      const scale = availableWidth / textWidth
      const fittedFontPx = Math.max(
        MIN_FONT_SIZE_PX,
        Math.floor(baseFontPx * scale * 100) / 100
      )
      const nextSize = `${fittedFontPx}px`

      setFontSize(prev => (prev === nextSize ? prev : nextSize))
    }

    animationFrame = window.requestAnimationFrame(updateFontSize)

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(animationFrame)
        animationFrame = window.requestAnimationFrame(updateFontSize)
      })
      resizeObserver.observe(container)
      cleanup = () => resizeObserver.disconnect()
    } else {
      const handleResize = () => {
        cancelAnimationFrame(animationFrame)
        animationFrame = window.requestAnimationFrame(updateFontSize)
      }

      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      cleanup = () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }

    return () => {
      cancelAnimationFrame(animationFrame)
      cleanup?.()
    }
  }, [enabled, text])

  return {
    ref: spanRef,
    style: fontSize ? { fontSize } : undefined,
  }
}


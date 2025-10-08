"use client"

import { useRef, useEffect, type ReactNode } from "react"

interface SwipeGesturesProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  className?: string
}

export function SwipeGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = "",
}: SwipeGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      startTime.current = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const endTime = Date.now()

      const deltaX = endX - startX.current
      const deltaY = endY - startY.current
      const deltaTime = endTime - startTime.current

      // Only consider swipes that are fast enough (within 300ms)
      if (deltaTime > 300) return

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine if it's a horizontal or vertical swipe
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          // Add haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(30)
          }
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          // Add haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(30)
          }
          onSwipeLeft()
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          // Add haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(30)
          }
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          // Add haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(30)
          }
          onSwipeUp()
        }
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

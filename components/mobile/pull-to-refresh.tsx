"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({ children, onRefresh, threshold = 80, className = "" }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setCanPull(true)
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!canPull || isRefreshing) return

    currentY.current = e.touches[0].clientY
    const distance = Math.max(0, currentY.current - startY.current)

    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (!canPull || isRefreshing) return

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      // Add haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate(50)
      }

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
    setCanPull(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [canPull, pullDistance, threshold, isRefreshing])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out z-10"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          opacity: pullDistance > 20 ? 1 : 0,
          height: "60px",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-md rounded-full border border-orange-500/30">
          <RefreshCw
            className={`w-5 h-5 text-orange-500 transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : shouldTrigger ? "rotate-180" : ""
            }`}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`,
            }}
          />
          <span className="text-sm text-orange-500 font-medium">
            {isRefreshing ? "Refreshing..." : shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance * 0.5}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

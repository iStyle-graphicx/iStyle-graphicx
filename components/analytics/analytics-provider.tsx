"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAnalytics } from "@/lib/analytics"
import { PerformanceMonitor } from "@/lib/performance"

interface AnalyticsContextType {
  analytics: ReturnType<typeof useAnalytics>
  performanceMonitor: PerformanceMonitor
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
  userId?: string
}

export function AnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
  const analytics = useAnalytics()
  const performanceMonitor = PerformanceMonitor.getInstance()

  useEffect(() => {
    if (userId) {
      analytics.setUserId(userId)
    }
  }, [userId, analytics])

  useEffect(() => {
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.track("page_hidden")
      } else {
        analytics.track("page_visible")
      }
    }

    // Track unload events
    const handleBeforeUnload = () => {
      analytics.track("session_end")
    }

    // Track errors
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), "global_error_handler")
    }

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(new Error(String(event.reason)), "unhandled_promise_rejection")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [analytics])

  const contextValue: AnalyticsContextType = {
    analytics,
    performanceMonitor,
  }

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error("useAnalyticsContext must be used within an AnalyticsProvider")
  }
  return context
}

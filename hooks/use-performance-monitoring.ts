"use client"

import { useEffect, useState } from "react"
import { PerformanceMonitor } from "@/lib/performance"
import { useAnalytics } from "@/lib/analytics"

export function usePerformanceMonitoring() {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const performanceMonitor = PerformanceMonitor.getInstance()
  const analytics = useAnalytics()

  useEffect(() => {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          analytics.track("web_vital_lcp", {
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? "good" : lastEntry.startTime < 4000 ? "needs-improvement" : "poor",
          })
        }
      })

      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          analytics.track("web_vital_fid", {
            value: entry.processingStart - entry.startTime,
            rating:
              entry.processingStart - entry.startTime < 100
                ? "good"
                : entry.processingStart - entry.startTime < 300
                  ? "needs-improvement"
                  : "poor",
          })
        })
      })

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        if (clsValue > 0) {
          analytics.track("web_vital_cls", {
            value: clsValue,
            rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
          })
        }
      })

      try {
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
        fidObserver.observe({ entryTypes: ["first-input"] })
        clsObserver.observe({ entryTypes: ["layout-shift"] })
      } catch (error) {
        console.warn("Performance monitoring not fully supported:", error)
      }

      return () => {
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [analytics])

  const measureComponentRender = (componentName: string) => {
    return {
      start: () => performanceMonitor.startTiming(`render_${componentName}`),
      end: () => {
        const duration = performanceMonitor.endTiming(`render_${componentName}`)
        analytics.track("component_render", {
          component: componentName,
          duration: duration,
          rating: duration < 16 ? "good" : duration < 50 ? "needs-improvement" : "poor",
        })
        return duration
      },
    }
  }

  const measureApiCall = async (apiName: string, apiCall: () => Promise<any>): Promise<any> => {
    const startTime = performance.now()

    try {
      const result = await apiCall()
      const duration = performance.now() - startTime

      analytics.track("api_call_success", {
        api: apiName,
        duration: duration,
        rating: duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor",
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      analytics.track("api_call_error", {
        api: apiName,
        duration: duration,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }

  return {
    measureComponentRender,
    measureApiCall,
    performanceData,
  }
}
